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
      subject: "Xác nhận email để kích hoạt tài khoản QualiCode",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #3B5C37 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white; letter-spacing: -0.5px;">
                <span style="color: #B38F4D;">*</span> QualiCode
              </div>
              <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0;">AI-Powered IELTS Learning</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Xác nhận địa chỉ Email của bạn</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Bấm vào nút bên dưới để kích hoạt tài khoản và bắt đầu hành trình chinh phục IELTS cùng AI.
              </p>
              <a href="${actionLink}"
                style="display: inline-block; background: #3B5C37; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; margin-bottom: 24px;">
                Xác nhận Email →
              </a>
              <p style="color: #97a0c3; font-size: 12px; margin: 0;">
                Liên kết có hiệu lực trong <strong>24 giờ</strong>. Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.
              </p>
            </div>
            <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="color: #97a0c3; font-size: 11px; margin: 0;">
                © QualiCode • <a href="${siteUrl}" style="color: #3B5C37; text-decoration: none;">${siteUrl.replace(/https?:\/\//, "")}</a>
              </p>
            </div>
          </div>
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
