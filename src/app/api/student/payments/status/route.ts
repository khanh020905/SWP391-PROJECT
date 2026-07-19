import { NextRequest, NextResponse } from "next/server";
import { getInvoices, saveInvoices, getSepayTransactions, saveSepayTransactions } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { sendPaymentSuccessEmail } from "@/lib/emailService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json({ message: "Thiếu mã hóa đơn." }, { status: 400 });
  }

  try {
    const invoices = await getInvoices();
    let invoice = invoices.find(i => i.id === invoiceId);

    // Fallback: Search Supabase Auth user_metadata if not found in local memory array (cross-lambda serverless compatibility)
    if (!invoice) {
      try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (!error && users) {
          const matchedUser = users.find(u => u.user_metadata?.pendingInvoice?.id === invoiceId);
          if (matchedUser?.user_metadata?.pendingInvoice) {
            invoice = matchedUser.user_metadata.pendingInvoice;
          }
        }
      } catch (err: any) {
        console.warn("⚠️ Error searching Supabase user_metadata for invoice:", err?.message);
      }
    }

    if (!invoice) {
      return NextResponse.json({ message: "Không tìm thấy hóa đơn." }, { status: 404 });
    }

    // Nếu hóa đơn đang chờ thanh toán (PENDING) và có cấu hình SEPAY_API_TOKEN / SEPAY_API_KEY
    // Hệ thống sẽ chủ động kéo giao dịch mới nhất từ Sepay về để đối soát (Hỗ trợ chạy test trực tiếp ở localhost)
    const sepayToken = (process.env.SEPAY_API_TOKEN || process.env.SEPAY_API_KEY || "LLSLCXM1QYHSI9AP8IKH10JGPBJGJCHQSWBFEZH2GPUFDXFQQTOINLWOARAT3BNV").replace(/['"]/g, "").trim();
    if (invoice.status === "PENDING" && sepayToken) {
      try {
        console.log(`📥 [API Status] Khởi chạy kéo giao dịch tự động từ Sepay API để kiểm tra hóa đơn ${invoiceId}...`);
        console.log(`[API Status] Debug Token: Length = ${sepayToken.length}, Start = ${sepayToken.substring(0, 8)}, End = ${sepayToken.substring(sepayToken.length - 8)}`);
        
        // 1. Gọi API v2 Production trước
        let response = await fetch("https://userapi.sepay.vn/v2/transactions?limit=20", {
          headers: {
            "Authorization": `Bearer ${sepayToken}`,
            "Content-Type": "application/json"
          },
          next: { revalidate: 0 } // Bỏ qua cache NextJS
        });

        // 2. Nếu API v2 Production thất bại (VD: Lỗi 401 do token thuộc Sandbox/Test Mode), thử gọi API v2 Sandbox
        if (!response.ok) {
          console.log(`⚠️ [API Status] API v2 Production trả về mã ${response.status}. Thử dùng API v2 Sandbox...`);
          response = await fetch("https://userapi-sandbox.sepay.vn/v2/transactions?limit=20", {
            headers: {
              "Authorization": `Bearer ${sepayToken}`,
              "Content-Type": "application/json"
            },
            next: { revalidate: 0 }
          });
        }

        // 3. Nếu vẫn thất bại, gọi API v1 fallback
        if (!response.ok) {
          console.log(`⚠️ [API Status] API v2 Sandbox trả về mã ${response.status}. Thử dùng API v1 fallback...`);
          response = await fetch("https://my.sepay.vn/userapi/transactions/list?limit=20", {
            headers: {
              "Authorization": `Bearer ${sepayToken}`,
              "Content-Type": "application/json"
            },
            next: { revalidate: 0 }
          });
        }

        if (response.ok) {
          const data = await response.json();
          // API v2 lưu ở data.data, API v1 lưu ở data.transactions
          const transactions = data.data || data.transactions || [];
          
          // Định dạng lại mã hóa đơn để đối khớp (VD: "INV-XYZ123" -> "INVYFCKNY", "YFCKNY")
          const targetInvoiceId = invoice.id.toUpperCase();
          const cleanInvoiceId = targetInvoiceId.replace("-", ""); // INVYFCKNY
          const codeOnly = targetInvoiceId.includes("-") ? targetInvoiceId.split("-")[1] : targetInvoiceId; // XYZ123

          // Tìm xem có giao dịch nào khớp với mã hóa đơn này không
          const matchedTx = transactions.find((tx: any) => {
            const content = (tx.transaction_content || "").toUpperCase();
            const amountIn = Number(tx.amount_in || 0);

            // Nội dung chuyển khoản chứa mã hóa đơn (hỗ trợ nhiều định dạng khác nhau) và số tiền chuyển >= số tiền hóa đơn
            const matchesContent = 
              content.includes(targetInvoiceId) || 
              content.includes(cleanInvoiceId) || 
              (codeOnly.length >= 4 && content.includes(codeOnly));
            const matchesAmount = amountIn >= invoice.amount;
            
            return matchesContent && matchesAmount;
          });

          if (matchedTx) {
            console.log(`🎯 [API Status] Khớp thành công giao dịch Sepay ID ${matchedTx.id} với hóa đơn ${invoice.id}!`);

            // 1. Cập nhật hóa đơn thành PAID
            const invoicesList = await getInvoices();
            const idx = invoicesList.findIndex(i => i.id === invoice.id);
            if (idx !== -1 && invoicesList[idx].status === "PENDING") {
              invoicesList[idx].status = "PAID";
              invoicesList[idx].paidAt = new Date().toISOString();
              invoicesList[idx].paymentMethod = "SEPAY";
              invoicesList[idx].sepayTransactionId = String(matchedTx.id);
              await saveInvoices(invoicesList);

              // Cập nhật trạng thái đối tượng cục bộ để phản hồi về client ngay lập tức
              invoice.status = "PAID";
              invoice.paidAt = invoicesList[idx].paidAt;

              // 2. Lưu giao dịch Sepay vào file sepayTransactions.json để hiển thị trên dashboard
              try {
                const transactionsList = await getSepayTransactions();
                const txExist = transactionsList.some(t => String(t.bankTransactionId) === String(matchedTx.id) || t.id === `sepay_${matchedTx.id}`);
                if (!txExist) {
                  const newTx = {
                    id: `sepay_${matchedTx.id}`,
                    amount: Number(matchedTx.amount_in || 0),
                    transactionDate: matchedTx.transaction_date || new Date().toISOString(),
                    transferContent: matchedTx.transaction_content || "",
                    senderAccount: matchedTx.account_number || "unknown",
                    senderBank: matchedTx.bank_brand_name || "Sepay Bank",
                    bankTransactionId: String(matchedTx.id),
                    status: "MATCHED" as const,
                    matchedInvoiceId: invoice.id
                  };
                  transactionsList.unshift(newTx);
                  await saveSepayTransactions(transactionsList);
                }
              } catch (txErr: any) {
                console.warn(`⚠️ [API Status] Lỗi ghi nhận giao dịch Sepay vào JSON: ${txErr.message}`);
              }

              // 3. Thực hiện tự động nâng cấp vai trò người dùng thành STUDENT trên Supabase Auth
              let upgradeMessage = "";
              try {
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw new Error(listError.message);

                const matchUser = users.find(u => u.email?.toLowerCase() === invoice.userEmail.toLowerCase());
                if (matchUser) {
                  const currentMetadata = matchUser.user_metadata || {};
                  if (currentMetadata.role === "ADMIN") {
                     console.log(`🛡️ [API Status] Giữ nguyên vai trò ADMIN cho người dùng ${invoice.userEmail} (Bỏ qua hạ cấp xuống STUDENT).`);
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
                     console.log(`🎓 [API Status] Nâng cấp tài khoản ${invoice.userEmail} thành STUDENT thành công.`);
                     upgradeMessage = `Đã tự động nâng cấp vai trò của '${invoice.userName}' thành STUDENT trên Supabase.`;
                  }

                  // Ghi nhận log activity log cho nâng cấp học viên tự động
                  await logActivity(
                    "UPGRADE",
                    invoice.userName,
                    invoice.userEmail,
                    `Tự động nâng cấp STUDENT qua đối khớp Sepay: Hóa đơn ${invoice.id}`,
                    request
                  );
                } else {
                  upgradeMessage = `Không tìm thấy tài khoản '${invoice.userEmail}' trên hệ thống Supabase Auth để nâng cấp vai trò.`;
                }
              } catch (authErr: any) {
                console.warn(`⚠️ [API Status] Lỗi tự động nâng cấp role: ${authErr.message}`);
                upgradeMessage = `Không thể nâng cấp role do lỗi: ${authErr.message}`;
              }

              // Ghi nhận log thanh toán tự động thành công
              await logActivity(
                "UPDATE",
                invoice.userName,
                invoice.userEmail,
                `Hóa đơn ${invoice.id} đã được tự động thanh toán qua cổng Sepay API (Giao dịch: sepay_${matchedTx.id})`,
                request
              );

              // Gửi email thông báo thanh toán thành công
              try {
                await sendPaymentSuccessEmail(invoice.userEmail, invoice.userName, invoice);
              } catch (mailErr: any) {
                console.warn("⚠️ Gặp lỗi khi gửi email thông báo thanh toán (Sepay Status check):", mailErr.message);
              }
            }
          } else {
            console.log(`🔍 [API Status] Không tìm thấy giao dịch chuyển khoản nào khớp cho hóa đơn ${invoiceId} (Kéo từ Sepay API).`);
          }
        } else {
          console.error(`❌ [API Status] Sepay API trả về lỗi: ${response.status} ${response.statusText}`);
          try {
            const errText = await response.text();
            console.error(`[API Status] Nội dung phản hồi lỗi: ${errText}`);
          } catch (_) {}
        }
      } catch (err: any) {
        console.error("❌ [API Status] Lỗi khi kết nối với cổng Sepay API:", err.message);
      }
    }

    return NextResponse.json({
      id: invoice.id,
      status: invoice.status,
      paidAt: invoice.paidAt
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Lỗi kiểm tra trạng thái hóa đơn.", error: error.message },
      { status: 500 }
    );
  }
}
