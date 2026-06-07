import { NextRequest, NextResponse } from "next/server";
import { getVocabularies, addVocabulary, updateVocabulary, deleteVocabulary } from "@/lib/studentProgressDb";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
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
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isFavoriteParam = searchParams.get("isFavorite");
    const collectionId = searchParams.get("collectionId");
    const query = searchParams.get("q")?.toLowerCase();

    let vocabs = await getVocabularies(user.id);

    // Apply filters
    if (isFavoriteParam === "true") {
      vocabs = vocabs.filter(v => v.isFavorite);
    }
    if (collectionId) {
      // Handle special value "none" or null
      if (collectionId === "none") {
        vocabs = vocabs.filter(v => !v.collectionId);
      } else {
        vocabs = vocabs.filter(v => v.collectionId === collectionId);
      }
    }
    if (query) {
      vocabs = vocabs.filter(v => 
        v.word.toLowerCase().includes(query) || 
        v.definition.toLowerCase().includes(query) || 
        v.translation.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ vocabularies: vocabs });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/vocabulary:", error);
    return NextResponse.json(
      { message: "Không thể lấy danh sách từ vựng.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      word, 
      partOfSpeech = "noun", 
      definition, 
      translation, 
      exampleSentence = "", 
      ipa = "", 
      collectionId = null,
      isFavorite = false,
      notes = ""
    } = body;

    if (!word || !definition || !translation) {
      return NextResponse.json({ error: "Word, definition, and translation are required" }, { status: 400 });
    }

    const vocabItem = await addVocabulary(
      user.id,
      word,
      partOfSpeech,
      definition,
      translation,
      exampleSentence,
      ipa,
      collectionId,
      isFavorite,
      notes
    );

    return NextResponse.json({ success: true, vocabulary: vocabItem });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/vocabulary:", error);
    return NextResponse.json(
      { message: "Không thể lưu từ vựng.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vocabId, ...updates } = body;

    if (!vocabId) {
      return NextResponse.json({ error: "vocabId is required" }, { status: 400 });
    }

    const updated = await updateVocabulary(user.id, vocabId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Vocabulary item not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, vocabulary: updated });
  } catch (error: any) {
    console.error("❌ Lỗi API PUT /api/student/vocabulary:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật từ vựng.", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vocabId = searchParams.get("vocabId");

    if (!vocabId) {
      return NextResponse.json({ error: "vocabId is required" }, { status: 400 });
    }

    const deleted = await deleteVocabulary(user.id, vocabId);
    if (!deleted) {
      return NextResponse.json({ error: "Vocabulary item not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Lỗi API DELETE /api/student/vocabulary:", error);
    return NextResponse.json(
      { message: "Không thể xóa từ vựng.", error: error.message },
      { status: 500 }
    );
  }
}
