import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email, name, userId } = await request.json();
    console.log("[send-welcome] called for:", email);
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Mark welcomeEmailSent so callback never sends a duplicate
    if (userId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { welcomeEmailSent: true },
      }).catch(() => {});
    }

    // Send welcome email through central service
    const mailResult = await sendWelcomeEmail(email, name || "học viên");
    if (!mailResult.success && !mailResult.skipped) {
      return NextResponse.json({ error: mailResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

