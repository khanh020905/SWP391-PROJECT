import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET || 'dev_cron_secret'}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Lấy tất cả user có reminder_enabled = true và không bị pause
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ignored_reminders')
      .eq('reminder_enabled', true)
      .eq('reminder_paused', false);

    if (profileErr || !profiles) {
      return NextResponse.json({ error: profileErr?.message || "No profiles found" }, { status: 500 });
    }

    let emailsSent = 0;

    for (const profile of profiles) {
      // 2. Đếm số từ đến hạn của user này
      const { data: dueWords } = await supabaseAdmin
        .from('user_notebook')
        .select('id')
        .eq('user_id', profile.id)
        .lte('next_review_at', new Date().toISOString());

      const count = dueWords?.length || 0;

      if (count > 0) {
        // Gửi email
        if (process.env.RESEND_API_KEY && profile.email) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@luyenielts.site",
            to: profile.email,
            subject: \`Bạn có \${count} từ vựng cần ôn tập hôm nay! 📚\`,
            html: \`
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Đã đến lúc ôn tập từ vựng!</h2>
                <p>Chào bạn, hiện tại bạn đang có <strong>\${count}</strong> từ vựng đến hạn ôn tập trong Sổ từ vựng.</p>
                <p>Việc ôn tập đúng thời điểm sẽ giúp bạn nhớ từ vựng lâu hơn rất nhiều theo phương pháp Lặp lại ngắt quãng (Spaced Repetition).</p>
                <a href="https://luyenielts.site/dashboard" style="display: inline-block; padding: 10px 20px; background: #5D6B2D; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 10px;">Ôn tập ngay</a>
              </div>
            \`
          });
          emailsSent++;
        }

        await supabaseAdmin.from('reminder_logs').insert({ user_id: profile.id });
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
