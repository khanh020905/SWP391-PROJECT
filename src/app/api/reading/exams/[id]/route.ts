import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    console.log(">>> GET /api/reading/exams/[id] called with examId:", examId);

    // 1. Fetch exam metadata
    const { data: exam, error: examError } = await supabaseAdmin
      .from("exams")
      .select("id, title, cambridge_no, test_no, duration_minutes")
      .eq("id", examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // 2. Fetch sections
    const { data: sections, error: sectionsError } = await supabaseAdmin
      .from("exam_sections")
      .select("id, section_no, title, content")
      .eq("exam_id", examId)
      .order("section_no", { ascending: true });

    // 3. Fetch questions (omitting correct_answer for security / anti-cheat, selecting only existing columns)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("id, section, question_type, text, options, order_index")
      .eq("exam_id", examId)
      .order("order_index", { ascending: true });

    if (sectionsError || questionsError) {
      console.error("Error fetching components:", { sectionsError, questionsError });
      return NextResponse.json({ error: "Failed to fetch exam components" }, { status: 500 });
    }

    return NextResponse.json({
      meta: exam,
      sections: sections || [],
      questions: questions || []
    });

  } catch (err: any) {
    console.error("GET /api/reading/exams/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
