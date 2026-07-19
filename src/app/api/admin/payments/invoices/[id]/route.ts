import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { getInvoices, saveInvoices, fulfillPaidInvoice } from "@/lib/paymentDb";
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

    let userUpgraded = false;
    let upgradeMessage = "";
    let invoice = invoices[index];

    if (status === "PAID") {
      invoice = await fulfillPaidInvoice(invoice, paymentMethod || "MANUAL_BANK", sepayTransactionId);
      userUpgraded = true;
      upgradeMessage = `Đã cập nhật trạng thái hóa đơn sang PAID và tự động chuyển vai trò học viên thành STUDENT trên Supabase Auth & DB.`;

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
