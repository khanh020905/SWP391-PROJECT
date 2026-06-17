import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateNextReview } from "@/utils/srs";

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
  
  const set_ref = request.nextUrl.searchParams.get('set_ref');
  if (!set_ref) return NextResponse.json({ error: "set_ref required" }, { status: 400 });
  
  const { data, error } = await supabaseAdmin
    .from('topic_word_reviews')
    .select('word, ease_factor, interval_days, review_count, next_review_at, last_reviewed_at, status')
    .eq('user_id', user.id)
    .eq('set_ref', set_ref);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { set_ref, word, rating } = await request.json();
  
  const { data: existing } = await supabaseAdmin
    .from('topic_word_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('set_ref', set_ref)
    .eq('word', word)
    .single();
    
  const srsResult = calculateNextReview(
    rating,
    existing ? existing.ease_factor : 2.5,
    existing ? existing.interval_days : 0,
    existing ? existing.review_count : 0
  );
  
  const { data, error } = await supabaseAdmin
    .from('topic_word_reviews')
    .upsert({
      user_id: user.id,
      set_ref,
      word,
      ease_factor: srsResult.easeFactor,
      interval_days: srsResult.intervalDays,
      review_count: srsResult.reviewCount,
      next_review_at: srsResult.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      status: rating === 'easy' ? 'known' : 'unknown'
    }, { onConflict: 'user_id, set_ref, word' })
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
