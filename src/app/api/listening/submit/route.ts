import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      submissionId,
      examId,
      score,
      answers,
      startedAt,
      completedAt,
      // practice_history specific fields
      testId,
      testName,
      totalQuestions,
      rawScore,
      sectionResults
    } = body;

    if (!submissionId || !examId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save to user_submissions using supabaseAdmin
    const { error: subErr } = await supabaseAdmin
      .from("user_submissions")
      .insert({
        id: submissionId,
        user_id: user.id,
        exam_id: examId,
        score: score,
        answers: answers,
        started_at: startedAt,
        completed_at: completedAt,
      });

    if (subErr) {
      console.error("❌ Database insertion error for user_submissions:", subErr.message);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    // 2. Save to practice_history using supabaseAdmin
    const { error: histErr } = await supabaseAdmin
      .from("practice_history")
      .insert({
        user_id: user.id,
        category: "listening",
        test_id: testId,
        test_name: testName,
        score: score,
        total: totalQuestions,
        metadata: {
          raw_score: rawScore,
          section_results: sectionResults,
          submission_id: submissionId,
        },
      });

    if (histErr) {
      console.error("❌ Database insertion error for practice_history:", histErr.message);
      // We don't fail the whole request since user_submissions succeeded
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ Exception in Listening Submit API:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
