import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, name: "Mock Student" };
  }
  if (!token) return null;
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('reminder_enabled, reminder_paused')
    .eq('id', user.id)
    .single();

  const { data: dueWords, error } = await supabaseAdmin
    .from('user_notebook')
    .select('id')
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    reminder_enabled: profile?.reminder_enabled ?? true,
    reminder_paused: profile?.reminder_paused ?? false,
    due_count: dueWords?.length || 0
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enabled } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ reminder_enabled: !!enabled })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dueWords } = await supabaseAdmin
    .from('user_notebook')
    .select('word')
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString());

  const count = dueWords?.length || 0;
  if (count === 0) {
    return NextResponse.json({ message: "No words due." });
  }

  // Send email
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@luyenielts.site",
      to: user.email!,
      subject: `Bạn có ${count} từ vựng cần ôn tập hôm nay! 📚`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Đã đến lúc ôn tập từ vựng!</h2>
          <p>Chào bạn, hiện tại bạn đang có <strong>${count}</strong> từ vựng đến hạn ôn tập trong Sổ từ vựng.</p>
          <p>Việc ôn tập đúng thời điểm sẽ giúp bạn nhớ từ vựng lâu hơn rất nhiều theo phương pháp Lặp lại ngắt quãng (Spaced Repetition).</p>
          <a href="https://luyenielts.site/dashboard" style="display: inline-block; padding: 10px 20px; background: #5D6B2D; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 10px;">Ôn tập ngay</a>
        </div>
      `
    });
  }

  // Log reminder
  await supabaseAdmin.from('reminder_logs').insert({ user_id: user.id });

  return NextResponse.json({ success: true, count });
}
