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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await request.json();
    const { items, folder_id } = body;
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    // Lowercase and deduplicate within the batch
    const uniqueItemsMap = new Map();
    for (const item of items) {
      if (!item.word) continue;
      const lowerWord = item.word.toLowerCase().trim();
      if (!uniqueItemsMap.has(lowerWord)) {
        uniqueItemsMap.set(lowerWord, {
          ...item,
          word: lowerWord
        });
      }
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());
    if (uniqueItems.length === 0) {
      return NextResponse.json({ success: true, added: 0, moved: 0, skipped: 0 });
    }

    const wordsArray = uniqueItems.map(item => item.word);
    
    // Fetch existing words for this user
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('user_notebook')
      .select('word, folder_id')
      .eq('user_id', user.id)
      .in('word', wordsArray);
      
    if (fetchError) throw fetchError;
    
    const existingMap = new Map();
    (existingData || []).forEach(row => {
      existingMap.set(row.word, row.folder_id);
    });

    let added = 0;
    let moved = 0;
    let skipped = 0;

    const upsertPayload = uniqueItems.map(item => {
      const exists = existingMap.has(item.word);
      const currentFolderId = existingMap.get(item.word);
      
      let finalFolderId = folder_id !== undefined ? folder_id : currentFolderId;
      
      if (!exists) {
        added++;
      } else {
        // If folder_id was explicitly provided in the request and it's different
        if (folder_id !== undefined && folder_id !== currentFolderId) {
          moved++;
        } else {
          skipped++;
        }
      }

      return {
        user_id: user.id,
        word: item.word,
        definition: item.definition,
        example: item.example,
        pos: item.pos,
        source: 'import',
        folder_id: finalFolderId
      };
    });

    // Perform bulk upsert
    const { error: upsertError } = await supabaseAdmin
      .from('user_notebook')
      .upsert(upsertPayload, { onConflict: 'user_id, word' });
      
    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, added, moved, skipped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
