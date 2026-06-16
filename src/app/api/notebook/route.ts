

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

  const folderId = new URL(request.url).searchParams.get('folder_id');

  let query = supabaseAdmin
    .from('user_notebook')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (folderId) query = query.eq('folder_id', folderId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { word, definition, example, pos, folder_id, force, source, category } = body;
  if (!word) return NextResponse.json({ error: "word is required" }, { status: 400 });

  const lowerWord = String(word).toLowerCase().trim();

  if (force) {
    // Upsert path — overwrite existing
    const { data, error } = await supabaseAdmin
      .from('user_notebook')
      .upsert(
        { user_id: user.id, word: lowerWord, definition: definition || null, example: example || null, pos: pos || null, folder_id: folder_id || null, source: source || null, category: category || null },
        { onConflict: 'user_id,word' }
      )
      .select()
      .single();
    if (error) { console.error('[notebook POST upsert]', error); return NextResponse.json({ error: error.message, code: error.code }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  // Normal insert — let DB raise unique violation
  const { data, error } = await supabaseAdmin
    .from('user_notebook')
    .insert({ user_id: user.id, word: lowerWord, definition: definition || null, example: example || null, pos: pos || null, folder_id: folder_id || null, source: source || null, category: category || null })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation (word already exists)
    if (error.code === '23505') return NextResponse.json({ error: "Word already exists" }, { status: 409 });
    console.error('[notebook POST insert]', error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await request.json();
  const { id, definition, example, pos, folder_id, bump } = body;
  
  const { data, error } = await supabaseAdmin
    .from('user_notebook')
    .update({ definition, example, pos, folder_id })
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
    .from('user_notebook')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
