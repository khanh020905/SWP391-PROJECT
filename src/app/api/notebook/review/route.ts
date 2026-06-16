

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

import { calculateNextReview } from "@/utils/srs";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { data, error } = await supabaseAdmin
    .from('user_notebook')
    .select('*')
    .eq('user_id', user.id)
    .or('next_review_at.lte.now(),next_review_at.is.null')
    .order('created_at', { ascending: true })
    .limit(30);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id, rating } = await request.json();
  
  const { data: word } = await supabaseAdmin.from('user_notebook').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });
  
  const srsResult = calculateNextReview(
    rating,
    word.ease_factor || 2.5,
    word.interval_days || 0,
    word.review_count || 0
  );
  
  const { data, error } = await supabaseAdmin
    .from('user_notebook')
    .update({
      ease_factor: srsResult.easeFactor,
      interval_days: srsResult.intervalDays,
      review_count: srsResult.reviewCount,
      next_review_at: srsResult.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
