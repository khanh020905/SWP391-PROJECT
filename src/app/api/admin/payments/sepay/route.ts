import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { getSepayTransactions, saveSepayTransactions, getInvoices, saveInvoices } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { sendPaymentSuccessEmail } from "@/lib/emailService";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  try {
    let transactions = await getSepayTransactions();

    // 1. Search filter
    if (search) {
      const s = search.toLowerCase();
      transactions = transactions.filter(
        t =>
          t.id.toLowerCase().includes(s) ||
          t.transferContent.toLowerCase().includes(s) ||
          t.senderAccount.toLowerCase().includes(s) ||
          t.senderBank.toLowerCase().includes(s) ||
          t.bankTransactionId.toLowerCase().includes(s)
      );
    }

    // 2. Status filter
    if (status && status !== "ALL") {
      transactions = transactions.filter(t => t.status === status);
    }

    // Sort by transaction date newest first
    transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/admin/payments/sepay:", error);
    return NextResponse.json(
      { message: "Không thể lấy danh sách giao dịch Sepay.", error: error.message },
      { status: 500 }
    );
  }
}
// POST: Giả lập / nhận webhook từ Sepay (Mô phỏng tự động đối khớp)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const sepayApiKey = process.env.SEPAY_API_KEY || "SePayKey123456";
  const hasSepayToken = authHeader && sepayApiKey && 
    (authHeader === `Bearer ${sepayApiKey}` || authHeader === `Apikey ${sepayApiKey}`);

  if (!hasSepayToken) {
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    let isAuthorized = false;

    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const role = user.user_metadata?.role;
          if (role === "ADMIN" || process.env.NODE_ENV === "development") {
            isAuthorized = true;
          }
        }
      } catch (err) {
        console.warn("Error verifying user session for simulation:", err);
      }
    }

    if (!isAuthorized) {
      const auth = await requireRole(request, ADMIN_ONLY);
      if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await request.json();
    
    // Support both real Sepay webhook payload keys and local simulation keys
    const amount = Number(body.transferAmount || body.amount);
    const transferContent = String(body.content || body.transferContent || "");
    const senderAccount = String(body.accountNumber || body.senderAccount || "");
    const senderBank = String(body.gateway || body.senderBank || "");
    const bankTransactionId = String(body.referenceCode || body.bankTransactionId || body.id || "");

    if (!amount || !transferContent) {
      return NextResponse.json(
        { message: "Thiếu thông tin số tiền chuyển khoản hoặc nội dung chuyển khoản." },
        { status: 400 }
      );
    }

    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const newTx = {
      id: txId,
      amount: amount,
      transactionDate: new Date().toISOString(),
      transferContent,
      senderAccount: senderAccount || "0123456789",
      senderBank: senderBank || "DemoBank",
      bankTransactionId: bankTransactionId || "BANK" + Math.floor(10000000 + Math.random() * 90000000),
      status: "PENDING" as "PENDING" | "MATCHED" | "UNMATCHED",
      matchedInvoiceId: null as string | null
    };

    console.log(`📥 [Sepay Webhook] Nhận giao dịch mới: ${newTx.id} - ${newTx.amount} VNĐ - Nội dung: "${newTx.transferContent}"`);

    // --- CƠ CHẾ ĐỐI KHỚP TỰ ĐỘNG (AUTO-MATCHING ENGINE) ---
    // Tìm mã hóa đơn dạng INV-XXXXXX hoặc INV XXXXXX (case-insensitive) trong nội dung chuyển khoản
    const invoiceRegex = /INV[- ]?([A-Z0-9]{6})/i;
    const match = transferContent.match(invoiceRegex);
    
    let matchedInvoice = null;
    let autoMatchSuccess = false;
    let upgradeMessage = "";

    if (match) {
      const invoiceCode = `INV-${match[1].toUpperCase()}`;
      console.log(`🔍 [Sepay Webhook] Tìm thấy mã hóa đơn nghi vấn: ${invoiceCode}`);

      const invoices = await getInvoices();
      let invoiceIndex = invoices.findIndex(i => i.id.toUpperCase() === invoiceCode.toUpperCase());
      let invoice = invoiceIndex !== -1 ? invoices[invoiceIndex] : null;

      if (!invoice) {
        try {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const foundUser = users?.find(u => u.user_metadata?.pendingInvoice?.id?.toUpperCase() === invoiceCode.toUpperCase());
          if (foundUser?.user_metadata?.pendingInvoice) {
            invoice = foundUser.user_metadata.pendingInvoice;
          }
        } catch (err: any) {
          console.warn("⚠️ Error searching Supabase user_metadata in Sepay webhook:", err?.message);
        }
      }

      if (invoice) {
        
        // Điều kiện khớp: Hóa đơn chưa thanh toán và Số tiền giao dịch >= Số tiền hóa đơn
        if (invoice.status === "PENDING" && newTx.amount >= invoice.amount) {
          console.log(`🎯 [Sepay Webhook] Đối khớp thành công hóa đơn ${invoice.id}!`);
          
          // Cập nhật hóa đơn sang PAID
          invoices[invoiceIndex].status = "PAID";
          invoices[invoiceIndex].paidAt = new Date().toISOString();
          invoices[invoiceIndex].paymentMethod = "SEPAY";
          invoices[invoiceIndex].sepayTransactionId = txId;
          await saveInvoices(invoices);

          // Cập nhật giao dịch thành MATCHED
          newTx.status = "MATCHED";
          newTx.matchedInvoiceId = invoice.id;
          matchedInvoice = invoices[invoiceIndex];
          autoMatchSuccess = true;

          // Thực hiện tự động nâng cấp vai trò người dùng trong Supabase Auth
          try {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (listError) throw new Error(listError.message);

            const matchUser = users.find(u => u.email?.toLowerCase() === invoice.userEmail.toLowerCase());
            if (matchUser) {
              const currentMetadata = matchUser.user_metadata || {};
              if (currentMetadata.role === "ADMIN") {
                console.log(`🛡️ [Sepay Webhook] Giữ nguyên vai trò ADMIN cho người dùng ${invoice.userEmail} (Bỏ qua hạ cấp xuống STUDENT).`);
                upgradeMessage = `Giữ nguyên vai trò ADMIN cho người dùng '${invoice.userName}'.`;
              } else {
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchUser.id, {
                  user_metadata: {
                    ...currentMetadata,
                    role: "STUDENT",
                    packageId: invoice.packageId,
                    packageName: invoice.packageName
                  }
                });

                if (updateError) throw new Error(updateError.message);
                upgradeMessage = `Đã tự động nâng cấp vai trò của '${invoice.userName}' thành STUDENT trên Supabase.`;
              }

              // Log activity log cho nâng cấp học viên tự động
              await logActivity(
                "UPGRADE",
                invoice.userName,
                invoice.userEmail,
                `Tự động nâng cấp STUDENT qua đối khớp Sepay: Hóa đơn ${invoice.id}`,
                request
              );
            } else {
              upgradeMessage = `Không tìm thấy tài khoản '${invoice.userEmail}' trên hệ thống Supabase Auth để tự động nâng cấp.`;
            }
          } catch (err: any) {
            console.warn(`⚠️ Lỗi tự động nâng cấp role: ${err.message}`);
            upgradeMessage = `Không thể nâng cấp role do lỗi: ${err.message}`;
          }

          // Ghi nhận log thanh toán tự động thành công
          await logActivity(
            "UPDATE",
            invoice.userName,
            invoice.userEmail,
            `Hóa đơn ${invoice.id} đã được tự động thanh toán qua cổng Sepay (Giao dịch: ${newTx.id})`,
            request
          );

          // Gửi email thông báo thanh toán thành công
          try {
            await sendPaymentSuccessEmail(invoice.userEmail, invoice.userName, invoice);
          } catch (mailErr: any) {
            console.warn("⚠️ Gặp lỗi khi gửi email thông báo thanh toán (Sepay POST):", mailErr.message);
          }
        } else if (invoice.status === "PAID") {
          console.log(`⚠️ [Sepay Webhook] Hóa đơn ${invoice.id} đã được thanh toán trước đó.`);
        } else {
          console.log(`⚠️ [Sepay Webhook] Hóa đơn ${invoice.id} không khớp số tiền (HĐ: ${invoice.amount} - GD: ${newTx.amount}).`);
        }
      } else {
        console.log(`⚠️ [Sepay Webhook] Không tìm thấy hóa đơn ${invoiceCode} trong hệ thống.`);
      }
    }

    if (!autoMatchSuccess) {
      // Nếu không khớp tự động được, đánh dấu giao dịch là UNMATCHED để admin đối soát bằng tay
      newTx.status = "UNMATCHED";
      console.log(`⚠️ [Sepay Webhook] Giao dịch không thể tự động đối khớp. Chuyển sang trạng thái chờ admin đối soát.`);
    }

    // Lưu giao dịch vào file JSON
    const transactions = await getSepayTransactions();
    transactions.unshift(newTx);
    await saveSepayTransactions(transactions);

    return NextResponse.json({
      message: autoMatchSuccess 
        ? "Giao dịch Sepay được xử lý và đối khớp tự động thành công!" 
        : "Giao dịch Sepay đã ghi nhận nhưng không thể tự động đối khớp, chuyển sang trạng thái chờ đối soát thủ công.",
      transaction: newTx,
      autoMatched: autoMatchSuccess,
      matchedInvoice: matchedInvoice,
      upgradeMessage
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/admin/payments/sepay:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi xử lý giao dịch Sepay.", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Đối soát thủ công (Manual binding)
// Admin duyệt tay bằng cách liên kết 1 giao dịch UNMATCHED với 1 hóa đơn PENDING
export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { transactionId, invoiceId } = body;

    if (!transactionId || !invoiceId) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp đầy đủ thông tin: Mã giao dịch Sepay và Mã hóa đơn." },
        { status: 400 }
      );
    }

    const transactions = await getSepayTransactions();
    const invoices = await getInvoices();

    const txIndex = transactions.findIndex(t => t.id === transactionId);
    const invIndex = invoices.findIndex(i => i.id === invoiceId);

    if (txIndex === -1) {
      return NextResponse.json({ message: "Không tìm thấy giao dịch Sepay." }, { status: 404 });
    }

    if (invIndex === -1) {
      return NextResponse.json({ message: "Không tìm thấy hóa đơn." }, { status: 404 });
    }

    const transaction = transactions[txIndex];
    const invoice = invoices[invIndex];

    if (invoice.status !== "PENDING") {
      return NextResponse.json({ message: "Hóa đơn này đã được thanh toán hoặc đã bị hủy." }, { status: 400 });
    }

    // 1. Cập nhật hóa đơn
    invoices[invIndex].status = "PAID";
    invoices[invIndex].paidAt = new Date().toISOString();
    invoices[invIndex].paymentMethod = "SEPAY";
    invoices[invIndex].sepayTransactionId = transactionId;

    // 2. Cập nhật giao dịch Sepay
    transactions[txIndex].status = "MATCHED";
    transactions[txIndex].matchedInvoiceId = invoiceId;

    await saveInvoices(invoices);
    await saveSepayTransactions(transactions);

    let userUpgraded = false;
    let upgradeMessage = "";

    // 3. Thực hiện nâng cấp học viên trong Supabase Auth
    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(listError.message);

      const matchUser = users.find(u => u.email?.toLowerCase() === invoice.userEmail.toLowerCase());
      if (matchUser) {
        const currentMetadata = matchUser.user_metadata || {};
        if (currentMetadata.role === "ADMIN") {
          console.log(`🛡️ [Sepay Webhook Manual] Giữ nguyên vai trò ADMIN cho người dùng ${invoice.userEmail} (Bỏ qua hạ cấp xuống STUDENT).`);
          upgradeMessage = `Giữ nguyên vai trò ADMIN cho người dùng '${invoice.userName}'.`;
        } else {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchUser.id, {
            user_metadata: {
              ...currentMetadata,
              role: "STUDENT",
              packageId: invoice.packageId,
              packageName: invoice.packageName
            }
          });

          if (updateError) throw new Error(updateError.message);

          userUpgraded = true;
          upgradeMessage = `Đã nâng cấp vai trò của '${invoice.userName}' thành STUDENT trên Supabase Auth.`;
        }

        // Ghi nhận log hoạt động nâng cấp
        await logActivity(
          "UPGRADE",
          invoice.userName,
          invoice.userEmail,
          `Nâng cấp học viên thành STUDENT qua duyệt đối soát giao dịch Sepay thủ công: Hóa đơn ${invoice.id}`,
          request
        );
      } else {
        upgradeMessage = `Không tìm thấy tài khoản '${invoice.userEmail}' trên hệ thống Supabase Auth để nâng cấp vai trò.`;
      }
    } catch (err: any) {
      console.warn(`⚠️ Lỗi nâng cấp role khi duyệt đối soát tay: ${err.message}`);
      upgradeMessage = `Không thể nâng cấp role: ${err.message}`;
    }

    // Ghi nhận log hoạt động duyệt thanh toán thủ công
    await logActivity(
      "UPDATE",
      invoice.userName,
      invoice.userEmail,
      `Duyệt đối soát giao dịch Sepay thủ công thành công: Hóa đơn ${invoice.id} được khớp với Giao dịch Sepay ${transactionId}`,
      request
    );

    // Gửi email thông báo thanh toán thành công
    try {
      await sendPaymentSuccessEmail(invoice.userEmail, invoice.userName, invoice);
    } catch (mailErr: any) {
      console.warn("⚠️ Gặp lỗi khi gửi email thông báo thanh toán (Sepay PATCH):", mailErr.message);
    }

    return NextResponse.json({
      message: "Duyệt đối soát giao dịch thủ công thành công!",
      transaction: transactions[txIndex],
      invoice: invoices[invIndex],
      userUpgraded,
      upgradeMessage
    });

  } catch (error: any) {
    console.error("❌ Lỗi API PATCH /api/admin/payments/sepay:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi duyệt đối soát giao dịch.", error: error.message },
      { status: 500 }
    );
  }
}
