import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    console.log("[send-welcome] called for:", email);
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Chào mừng bạn đến với QualiCode! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #B38F4D 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">
                <span style="color: #3B5C37;">*</span> QualiCode
              </div>
              <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0;">AI-Powered IELTS Learning</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Chào mừng ${name || "bạn"} đến với QualiCode! 👋</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu hành trình chinh phục IELTS với AI ngay hôm nay!
              </p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login"
                style="display: inline-block; background: #3B5C37; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Đăng nhập ngay →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
