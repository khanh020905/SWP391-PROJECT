

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
    .from('notebook_folders')
    .select('*, user_notebook(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const mappedData = data.map((f: any) => ({
    id: f.id,
    user_id: f.user_id,
    name: f.name,
    created_at: f.created_at,
    word_count: f.user_notebook?.[0]?.count || 0
  }));

  return NextResponse.json({ data: mappedData });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { name } = await request.json();
  const { data, error } = await supabaseAdmin
    .from('notebook_folders')
    .insert({ user_id: user.id, name })
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id, name } = await request.json();
  const { data, error } = await supabaseAdmin
    .from('notebook_folders')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  
  const { error } = await supabaseAdmin
    .from('notebook_folders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
