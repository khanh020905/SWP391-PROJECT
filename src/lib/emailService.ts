import { Resend } from "resend";
import { getSettings } from "./settingsDb";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "noreply@luyenielts.site";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Sends a welcome/activation email (normally triggered in register API)
 */
export async function sendVerificationEmail(email: string, name: string, actionLink: string) {
  try {
    const settings = await getSettings();
    if (!settings.email.sendOnRegister) {
      console.log(`[EmailService] Gửi email xác nhận bị tắt bởi quản trị viên. Email: ${email}`);
      return { success: false, skipped: true };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Xác nhận email để kích hoạt tài khoản QualiIelts",
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f0f4fd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fd;padding:40px 16px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
                <tr><td style="background:linear-gradient(135deg,#0d153a 0%,#1a2f4e 50%,#2d4a2a 100%);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(179,143,77,0.15);border:1px solid rgba(179,143,77,0.3);border-radius:12px;padding:8px 20px;margin-bottom:20px;">
                    <span style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;">
                      <span style="color:#B38F4D;">✦</span> QualiIelts
                    </span>
                  </div>
                  <h1 style="margin:0;font-size:22px;font-weight:800;color:white;letter-spacing:-0.3px;">Xác nhận địa chỉ Email</h1>
                  <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Một bước nữa để bắt đầu hành trình IELTS của bạn</p>
                </td></tr>
                <tr><td style="background:white;padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0d153a;">Xin chào ${name || "bạn"} 👋</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#5e6792;line-height:1.7;">
                    Cảm ơn bạn đã đăng ký tài khoản <strong style="color:#0d153a;">QualiIelts</strong>. Bấm vào nút bên dưới để xác nhận email và kích hoạt tài khoản của bạn.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr><td align="center">
                      <a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#3B5C37,#4a7345);color:white;padding:15px 40px;border-radius:14px;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:-0.2px;box-shadow:0 8px 24px rgba(59,92,55,0.35);">
                        ✅ &nbsp;Xác nhận Email ngay
                      </a>
                    </td></tr>
                  </table>
                  <p style="margin:0;font-size:12px;color:#97a0c3;line-height:1.6;">
                    Hoặc sao chép liên kết sau vào trình duyệt:<br>
                    <span style="color:#3B5C37;word-break:break-all;font-size:11px;">${actionLink}</span>
                  </p>
                </td></tr>
                <tr><td style="background:#f8f9ff;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;border-top:1px solid #eceef6;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0d153a;">QualiIelts — AI-Powered IELTS Learning</p>
                  <p style="margin:0;font-size:11px;color:#97a0c3;">&copy; ${new Date().getFullYear()} QualiIelts</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Lỗi gửi email xác nhận:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a welcome email after successful email confirmation or direct confirmation
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const settings = await getSettings();
    if (!settings.email.sendOnRegister) {
      console.log(`[EmailService] Gửi email chào mừng bị tắt bởi quản trị viên. Email: ${email}`);
      return { success: false, skipped: true };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Chào mừng bạn đến với QualiIelts! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #B38F4D 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">
                QualiIelts
              </div>
              <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0;">AI-Powered IELTS Learning</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Chào mừng ${name || "bạn"} đến với QualiIelts! 👋</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu hành trình chinh phục IELTS với AI ngay hôm nay!
              </p>
              <a href="${SITE_URL}/login"
                style="display: inline-block; background: #3B5C37; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Đăng nhập ngay →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Lỗi gửi email chào mừng:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends payment success email notification
 */
export async function sendPaymentSuccessEmail(email: string, name: string, invoice: any) {
  try {
    const settings = await getSettings();
    if (!settings.email.sendOnPayment) {
      console.log(`[EmailService] Gửi email thanh toán bị tắt bởi quản trị viên. Email: ${email}`);
      return { success: false, skipped: true };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: `Thanh toán thành công hóa đơn ${invoice.id} - QualiIelts 💳`,
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08); border: 1px solid #e8eaf6;">
            <div style="background: linear-gradient(135deg, #3B5C37 0%, #1a2f4e 100%); padding: 32px; text-align: center;">
              <span style="font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.5px;">QualiIelts</span>
              <h2 style="color: white; font-size: 20px; margin: 12px 0 0; font-weight: 800;">Thanh toán thành công!</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #0d153a; font-size: 15px; font-weight: 700; margin: 0 0 12px;">Xin chào ${name || "học viên"} 👋</p>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Cảm ơn bạn đã mua gói dịch vụ của chúng tôi. Hóa đơn của bạn đã được thanh toán và hệ thống đã cập nhật quyền học viên STUDENT cho tài khoản của bạn.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; text-align: left;">
                <tr style="border-bottom: 1px solid #eceef6;">
                  <th style="padding: 10px 0; color: #97a0c3; font-weight: 600;">Mã hóa đơn</th>
                  <td style="padding: 10px 0; color: #0d153a; font-weight: 700; text-align: right;">${invoice.id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eceef6;">
                  <th style="padding: 10px 0; color: #97a0c3; font-weight: 600;">Gói dịch vụ</th>
                  <td style="padding: 10px 0; color: #0d153a; font-weight: 700; text-align: right;">${invoice.packageName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eceef6;">
                  <th style="padding: 10px 0; color: #97a0c3; font-weight: 600;">Số tiền</th>
                  <td style="padding: 10px 0; color: #3B5C37; font-weight: 900; text-align: right;">${invoice.amount.toLocaleString("vi-VN")} VNĐ</td>
                </tr>
                <tr style="border-bottom: 1px solid #eceef6;">
                  <th style="padding: 10px 0; color: #97a0c3; font-weight: 600;">Phương thức</th>
                  <td style="padding: 10px 0; color: #0d153a; font-weight: 700; text-align: right;">${invoice.paymentMethod || "MANUAL_BANK"}</td>
                </tr>
                <tr>
                  <th style="padding: 10px 0; color: #97a0c3; font-weight: 600;">Thời gian duyệt</th>
                  <td style="padding: 10px 0; color: #0d153a; font-weight: 700; text-align: right;">${new Date().toLocaleString("vi-VN")}</td>
                </tr>
              </table>

              <div style="text-align: center;">
                <a href="${SITE_URL}/roadmap"
                  style="display: inline-block; background: #3B5C37; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(59,92,55,0.2);">
                  Bắt đầu học ngay →
                </a>
              </div>
            </div>
            <div style="background: #f8f9ff; padding: 20px; text-align: center; border-top: 1px solid #eceef6;">
              <p style="margin: 0; font-size: 11px; color: #97a0c3;">Mọi thắc mắc vui lòng liên hệ ${settings.system.supportEmail || "support@qualicode.com"}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Lỗi gửi email thanh toán thành công:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends account locked email notification
 */
export async function sendAccountLockEmail(email: string, name: string, reason?: string) {
  try {
    const settings = await getSettings();
    if (!settings.email.sendOnLock) {
      console.log(`[EmailService] Gửi email khóa tài khoản bị tắt bởi quản trị viên. Email: ${email}`);
      return { success: false, skipped: true };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Thông báo: Tài khoản QualiIelts của bạn đã bị khóa 🔒",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(220,38,38,0.08); border: 1px solid #fee2e2;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">QualiIelts</div>
              <h2 style="color: white; font-size: 18px; margin: 8px 0 0;">Tài khoản đã bị tạm khóa</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #0d153a; font-size: 15px; font-weight: 700; margin: 0 0 12px;">Xin chào ${name || "bạn"} 👋</p>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                Chúng tôi xin tiếc báo rằng tài khoản QualiIelts liên kết với email này đã tạm thời bị khóa do vi phạm các chính sách điều khoản sử dụng hoặc theo yêu cầu quản trị viên.
              </p>
              
              ${reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <span style="font-size: 12px; font-weight: 700; color: #991b1b; display: block; margin-bottom: 4px;">Lý do khóa:</span>
                <p style="margin: 0; font-size: 13px; color: #dc2626; font-style: italic;">${reason}</p>
              </div>
              ` : ""}

              <p style="color: #5e6792; font-size: 13px; line-height: 1.6;">
                Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật qua email để chúng tôi kiểm tra và kích hoạt lại tài khoản cho bạn.
              </p>
            </div>
            <div style="background: #f8f9ff; padding: 20px; text-align: center; border-top: 1px solid #eceef6;">
              <p style="margin: 0; font-size: 11px; color: #97a0c3;">Email hỗ trợ: ${settings.system.supportEmail || "support@qualicode.com"}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Lỗi gửi email khóa tài khoản:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends account unlocked email notification
 */
export async function sendAccountUnlockEmail(email: string, name: string) {
  try {
    const settings = await getSettings();
    if (!settings.email.sendOnLock) {
      console.log(`[EmailService] Gửi email mở khóa tài khoản bị tắt bởi quản trị viên. Email: ${email}`);
      return { success: false, skipped: true };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Tài khoản QualiIelts của bạn đã được mở khóa! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(5,150,105,0.08); border: 1px solid #d1fae5;">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">QualiIelts</div>
              <h2 style="color: white; font-size: 18px; margin: 8px 0 0;">Tài khoản đã mở khóa thành công</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #0d153a; font-size: 15px; font-weight: 700; margin: 0 0 12px;">Xin chào ${name || "bạn"} 👋</p>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Tài khoản của bạn đã được mở khóa bởi quản trị viên hệ thống. Bạn có thể đăng nhập bình thường để tiếp tục hành trình ôn luyện IELTS của mình.
              </p>
              <div style="text-align: center;">
                <a href="${SITE_URL}/login"
                  style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5,150,105,0.2);">
                  Đăng nhập lại →
                </a>
              </div>
            </div>
            <div style="background: #f8f9ff; padding: 20px; text-align: center; border-top: 1px solid #eceef6;">
              <p style="margin: 0; font-size: 11px; color: #97a0c3;">Mọi thắc mắc vui lòng liên hệ ${settings.system.supportEmail || "support@qualicode.com"}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Lỗi gửi email mở khóa tài khoản:", err);
    return { success: false, error: err.message };
  }
}
