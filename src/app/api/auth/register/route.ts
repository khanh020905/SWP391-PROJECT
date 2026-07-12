import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSettings } from "@/lib/settingsDb";
import { sendVerificationEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, isResend } = await request.json();

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const settings = await getSettings();

    // 1. Check if registration is allowed
    if (!settings.system.allowRegistration) {
      return NextResponse.json(
        { error: "Chức năng đăng ký tài khoản hiện đang tạm khóa bởi quản trị viên." },
        { status: 403 }
      );
    }

    const defaultRole = settings.system.defaultUserRole || "STUDENT";
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    let actionLink: string | undefined;
    let autoConfirmed = false;

    // 2. If sendOnRegister is false, register directly as email_confirmed
    if (!settings.email.sendOnRegister && !isResend) {
      if (!password || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

      console.log(`[register] Creating auto-confirmed user: ${email} with role: ${defaultRole}`);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: defaultRole, isLocked: false }
      });

      if (error) {
        if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("exists")) {
          return NextResponse.json({ error: "email_exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      autoConfirmed = true;
    } else {
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
            data: { name, role: defaultRole, isLocked: false },
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
    }

    if (autoConfirmed) {
      return NextResponse.json({ success: true, autoConfirmed: true });
    }

    if (!actionLink) return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 500 });

    // 3. Send email using central emailService helper
    const mailResult = await sendVerificationEmail(email, name || "học viên", actionLink);
    if (!mailResult.success && !mailResult.skipped) {
      return NextResponse.json({ error: `Email send failed: ${mailResult.error}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

