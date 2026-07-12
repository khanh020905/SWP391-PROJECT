import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { data: words, error: wordsError } = await supabaseAdmin
      .from("vocabulary")
      .select("*")
      .order("word", { ascending: true });

    if (wordsError) throw wordsError;

    const { data: flashcards, error: flashError } = await supabaseAdmin
      .from("vocab_flashcards")
      .select("*")
      .order("frequency", { ascending: false })
      .limit(20);

    if (flashError) throw flashError;

    return NextResponse.json({ words, flashcards });
  } catch (error: any) {
    console.error("Error in GET /api/vocabulary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
