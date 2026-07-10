import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lessonId = searchParams.get("lesson_id");

    if (lessonId) {
      // Fetch single lesson
      const { data: lesson, error } = await supabaseAdmin
        .from("grammar_lessons")
        .select("*")
        .eq("lesson_id", lessonId)
        .single();

      if (error) throw error;
      return NextResponse.json({ lesson });
    } else {
      // Fetch all lessons list
      const { data: lessons, error } = await supabaseAdmin
        .from("grammar_lessons")
        .select("id,lesson_id,title,band,order_index")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ lessons });
    }
  } catch (error: any) {
    console.error("Error in GET /api/grammar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const { lessonId, lessonTitle, score, totalQuestions, band } = await request.json();

    const { error: insertErr } = await supabaseAdmin.from("practice_history").insert({
      user_id: user.id,
      category: "grammar",
      test_id: lessonId,
      test_name: lessonTitle,
      score: score,
      total: totalQuestions,
      metadata: { band }
    });

    if (insertErr) {
      console.error("Error inserting grammar practice history:", insertErr);
      throw insertErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/grammar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
