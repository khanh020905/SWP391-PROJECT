import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // Check cookies for sb-*-auth-token
    const cookies = request.cookies.getAll();
    const authCookie = cookies.find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (authCookie) {
      try {
        const parsed = JSON.parse(authCookie.value);
        if (Array.isArray(parsed)) {
          token = parsed[0];
        } else if (parsed && typeof parsed === "object" && parsed.access_token) {
          token = parsed.access_token;
        } else {
          token = authCookie.value;
        }
      } catch {
        token = authCookie.value;
      }
    }
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
