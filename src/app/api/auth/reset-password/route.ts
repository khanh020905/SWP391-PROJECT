import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Generate Supabase recovery link (handles token storage)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      },
    });

    if (error) throw error;

    const otpCode = data?.properties?.email_otp;
    if (!otpCode) throw new Error("Không thể tạo mã OTP đặt lại mật khẩu.");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Đặt lại mật khẩu QualiCode 🔐",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #B38F4D 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">
                <span style="color: #3B5C37;">*</span> QualiCode
              </div>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Đặt lại mật khẩu 🔐</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.
              </p>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                Mã OTP khôi phục mật khẩu của bạn là:
              </p>
              <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #3B5C37; background: #f0f4fd; border-radius: 16px; padding: 20px 24px; text-align: center; margin: 0 0 20px; border: 2px dashed #3B5C37;">
                ${otpCode}
              </div>
              <p style="color: #5e6792; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
                Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng nhập mã này vào trang web để tiếp tục.
              </p>
              <p style="color: #97a0c3; font-size: 12px; margin: 24px 0 0;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
              </p>
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
