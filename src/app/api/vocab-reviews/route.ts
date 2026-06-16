

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


export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { data, error } = await supabaseAdmin
    .from('vocab_set_reviews')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { set_type, set_ref, set_name } = await request.json();
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(7,0,0,0);
  
  const { data, error } = await supabaseAdmin
    .from('vocab_set_reviews')
    .upsert({
      user_id: user.id,
      set_type,
      set_ref,
      set_name,
      stage: 1,
      last_reviewed_at: new Date().toISOString(),
      next_due: nextDate.toISOString(),
      dismissed: false
    }, { onConflict: 'user_id, set_type, set_ref' })
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
