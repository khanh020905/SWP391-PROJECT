import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStudentStreak } from "@/lib/studentProgressDb";

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

  // 1. Get streak and history from lib
  const streakData = await getStudentStreak(user.id);

  // 2. Query skills from diagnostic_results
  const { data: skillsData } = await supabaseAdmin
    .from('diagnostic_results')
    .select('reading_band, writing_band, listening_band, speaking_band, overall_band')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const skillRow = skillsData?.[0] || null;

  const skills = {
    reading: skillRow?.reading_band ?? null,
    writing: skillRow?.writing_band ?? null,
    listening: skillRow?.listening_band ?? null,
    speaking: skillRow?.speaking_band ?? null,
    overall: skillRow?.overall_band ?? null
  };

  // 3. Query recent history from student_submissions (or return [] if table doesn't exist)
  const { data: historyData } = await supabaseAdmin
    .from('student_submissions')
    .select('title, created_at, score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  let recentHistory: any[] = [];
  if (historyData) {
    recentHistory = historyData.map((h: any) => {
      const diffMs = Date.now() - new Date(h.created_at).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let agoStr = "Vừa xong";
      if (diffDays > 0) agoStr = `${diffDays} ngày trước`;
      else if (diffHours > 0) agoStr = `${diffHours} giờ trước`;
      else if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        agoStr = `${diffMins} phút trước`;
      }
      
      return {
        title: h.title,
        ago: agoStr,
        score: h.score || '--/--'
      };
    });
  }

  // 4. Query vocab history
  const { data: vocabHistory } = await supabaseAdmin
    .from('practice_history')
    .select('score, total, metadata')
    .eq('user_id', user.id)
    .eq('category', 'vocabulary');

  const vocabStats: Record<string, { avgScore: number, sumScore: number, maxScore: number, attempts: number }> = {};
  if (vocabHistory) {
    vocabHistory.forEach(row => {
      const setIdx = row.metadata?.setIdx;
      if (setIdx !== undefined) {
        if (!vocabStats[setIdx]) vocabStats[setIdx] = { sumScore: 0, attempts: 0, maxScore: 0, avgScore: 0 };
        // Giả sử score là số câu đúng, rating trên thang 5.0 => (score/total)*5.0
        const rating = row.total ? (row.score / row.total) * 5.0 : 0;
        vocabStats[setIdx].sumScore += rating;
        vocabStats[setIdx].attempts += 1;
        vocabStats[setIdx].maxScore = Math.max(vocabStats[setIdx].maxScore, rating);
      }
    });
    for (const key in vocabStats) {
      (vocabStats[key] as any).avgScore = (vocabStats[key] as any).sumScore / vocabStats[key].attempts;
    }
  }

  return NextResponse.json({
    streak: streakData.currentStreak,
    history: streakData.history,
    skills,
    recentHistory,
    vocabStats
  });
}
