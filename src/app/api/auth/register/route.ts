import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, isResend } = await request.json();

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    let actionLink: string | undefined;

    if (isResend) {
      // Resend confirmation for existing unconfirmed user via magic link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      actionLink = data.properties?.action_link;
    } else {
      if (!password || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          data: { name, role: "STUDENT", isLocked: false },
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("exists")) {
          return NextResponse.json({ error: "email_exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      actionLink = data.properties?.action_link;
    }

    if (!actionLink) return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 500 });

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await resend.emails.send({
      from: fromEmail,
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

                <!-- Header -->
                <tr><td style="background:linear-gradient(135deg,#0d153a 0%,#1a2f4e 50%,#2d4a2a 100%);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(179,143,77,0.15);border:1px solid rgba(179,143,77,0.3);border-radius:12px;padding:8px 20px;margin-bottom:20px;">
                    <span style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;">
                      <span style="color:#B38F4D;">✦</span> QualiIelts
                    </span>
                  </div>
                  <div style="width:64px;height:64px;background:rgba(59,92,55,0.3);border:2px solid rgba(59,92,55,0.6);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:28px;line-height:64px;display:block;text-align:center;">✉️</span>
                  </div>
                  <h1 style="margin:0;font-size:22px;font-weight:800;color:white;letter-spacing:-0.3px;">Xác nhận địa chỉ Email</h1>
                  <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Một bước nữa để bắt đầu hành trình IELTS</p>
                </td></tr>

                <!-- Body -->
                <tr><td style="background:white;padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0d153a;">Xin chào ${name || "bạn"} 👋</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#5e6792;line-height:1.7;">
                    Cảm ơn bạn đã đăng ký tài khoản <strong style="color:#0d153a;">QualiIelts</strong>. Bấm vào nút bên dưới để xác nhận email và kích hoạt tài khoản của bạn.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr><td align="center">
                      <a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#3B5C37,#4a7345);color:white;padding:15px 40px;border-radius:14px;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:-0.2px;box-shadow:0 8px 24px rgba(59,92,55,0.35);">
                        ✅ &nbsp;Xác nhận Email ngay
                      </a>
                    </td></tr>
                  </table>

                  <!-- Info boxes -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border-radius:12px;border:1px solid #e8eaf6;margin-bottom:24px;">
                    <tr>
                      <td style="padding:14px 18px;border-bottom:1px solid #e8eaf6;">
                        <span style="font-size:13px;color:#5e6792;">⏱ &nbsp;Liên kết có hiệu lực trong <strong style="color:#0d153a;">24 giờ</strong></span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 18px;">
                        <span style="font-size:13px;color:#5e6792;">🔒 &nbsp;Nếu bạn không đăng ký, hãy <strong style="color:#0d153a;">bỏ qua</strong> email này</span>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;font-size:12px;color:#97a0c3;line-height:1.6;">
                    Hoặc sao chép liên kết sau vào trình duyệt:<br>
                    <span style="color:#3B5C37;word-break:break-all;font-size:11px;">${actionLink}</span>
                  </p>
                </td></tr>

                <!-- Footer -->
                <tr><td style="background:#f8f9ff;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;border-top:1px solid #eceef6;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0d153a;">QualiIelts — AI-Powered IELTS Learning</p>
                  <p style="margin:0;font-size:11px;color:#97a0c3;">
                    <a href="${siteUrl}" style="color:#3B5C37;text-decoration:none;">${siteUrl.replace(/https?:\/\//, "")}</a>
                    &nbsp;·&nbsp; © ${new Date().getFullYear()} QualiIelts
                  </p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
