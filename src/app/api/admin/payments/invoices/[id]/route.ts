import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { getInvoices, saveInvoices } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { sendPaymentSuccessEmail } from "@/lib/emailService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentMethod, sepayTransactionId } = body;

    if (!status) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp trạng thái mới." },
        { status: 400 }
      );
    }

    const invoices = await getInvoices();
    const index = invoices.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json(
        { message: "Không tìm thấy hóa đơn này." },
        { status: 404 }
      );
    }

    const oldStatus = invoices[index].status;
    invoices[index].status = status;

    if (status === "PAID") {
      invoices[index].paidAt = new Date().toISOString();
      invoices[index].paymentMethod = paymentMethod || "MANUAL_BANK";
      if (sepayTransactionId) {
        invoices[index].sepayTransactionId = sepayTransactionId;
      }
    } else {
      invoices[index].paidAt = null;
      invoices[index].paymentMethod = null;
      invoices[index].sepayTransactionId = null;
    }

    await saveInvoices(invoices);
    const invoice = invoices[index];

    let userUpgraded = false;
    let upgradeMessage = "";

    // If marked as PAID, try to upgrade the user's role in Supabase Auth from GUEST to STUDENT
    if (status === "PAID") {
      try {
        console.log(`⚡ [Supabase Auth] Đang tìm kiếm người dùng có email: ${invoice.userEmail} để nâng cấp...`);
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          throw new Error("Lỗi lấy danh sách user từ Supabase: " + listError.message);
        }

        const matchUser = users.find(u => u.email?.toLowerCase() === invoice.userEmail.toLowerCase());

        if (matchUser) {
          const currentMetadata = matchUser.user_metadata || {};
          const currentRole = currentMetadata.role || "GUEST";

          if (currentRole === "GUEST" || currentRole === "STUDENT") {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchUser.id, {
              user_metadata: {
                ...currentMetadata,
                role: "STUDENT",
                packageId: invoice.packageId,
                packageName: invoice.packageName
              }
            });

            if (updateError) {
              throw new Error("Lỗi cập nhật role trên Supabase: " + updateError.message);
            }

            userUpgraded = true;
            upgradeMessage = `Đã tự động nâng cấp vai trò của người dùng trên Supabase Auth từ ${currentRole} thành STUDENT.`;

            // Ghi nhận lịch sử hoạt động nâng cấp học viên
            await logActivity(
              "UPGRADE",
              invoice.userName,
              invoice.userEmail,
              `Nâng cấp học viên thành STUDENT qua thanh toán hóa đơn ${invoice.id} (${invoice.packageName})`,
              request
            );
          } else {
            upgradeMessage = `Người dùng đã có vai trò ${currentRole}, không cần nâng cấp vai trò học viên.`;
          }
        } else {
          upgradeMessage = `Không tìm thấy tài khoản học viên có email '${invoice.userEmail}' trên hệ thống Supabase Auth để nâng cấp vai trò. Tuy nhiên hóa đơn vẫn được duyệt thành công.`;
        }
      } catch (err: any) {
        console.warn("⚠️ Không thể cập nhật vai trò người dùng trên Supabase Auth:", err.message);
        upgradeMessage = `Lưu ý: Hóa đơn đã duyệt nhưng gặp lỗi khi nâng cấp quyền trên Supabase: ${err.message}`;
      }

      // Log invoice payment activity
      await logActivity(
        "UPDATE",
        invoice.userName,
        invoice.userEmail,
        `Duyệt thanh toán hóa đơn thành công: ${invoice.id} (${invoice.packageName}, Số tiền: ${invoice.amount.toLocaleString("vi-VN")} VNĐ, Phương thức: ${invoice.paymentMethod})`,
        request
      );

      // Gửi email thông báo thanh toán thành công
      if (oldStatus !== "PAID") {
        try {
          await sendPaymentSuccessEmail(invoice.userEmail, invoice.userName, invoice);
        } catch (mailErr: any) {
          console.warn("⚠️ Gặp lỗi khi gửi email xác nhận thanh toán:", mailErr.message);
        }
      }
    } else {
      // Log update status activity (e.g., Cancelled)
      await logActivity(
        "UPDATE",
        invoice.userName,
        invoice.userEmail,
        `Cập nhật trạng thái hóa đơn ${invoice.id}: ${oldStatus} -> ${status}`,
        request
      );
    }

    return NextResponse.json({
      message: `Đã cập nhật trạng thái hóa đơn thành '${status}' thành công!`,
      invoice,
      userUpgraded,
      upgradeMessage
    });
  } catch (error: any) {
    console.error("❌ Lỗi API PUT /api/admin/payments/invoices/[id]:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi cập nhật hóa đơn.", error: error.message },
      { status: 500 }
    );
  }
}
