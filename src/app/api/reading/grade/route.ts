import { NextRequest, NextResponse } from "next/server";
import { READING_ANSWER_KEY, checkAnswer } from "@/lib/readingAnswerKey";
import { READING_PASSAGE_1, READING_TEST_META } from "@/lib/readingMockData";
import type { ReadingAttemptPayload, ReadingGradeResult } from "@/types/readingGrade";
import { buildReadingExplanationVi } from "@/lib/readingExplainEngine";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function bandFromRaw(correct: number, total: number): number {
  const ratio = correct / total;
  if (ratio >= 0.9) return 9;
  if (ratio >= 0.8) return 8;
  if (ratio >= 0.7) return 7.5;
  if (ratio >= 0.6) return 7;
  if (ratio >= 0.5) return 6.5;
  if (ratio >= 0.4) return 6;
  if (ratio >= 0.3) return 5.5;
  return 5;
}

function parseGeminiJson(text: string): Partial<ReadingGradeResult> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Partial<ReadingGradeResult>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Partial<ReadingGradeResult>;
    } catch {
      return null;
    }
  }
}

function fallbackGrade(
  attemptId: string,
  answers: Record<string, string>
): ReadingGradeResult {
  const questionResults = READING_PASSAGE_1.questions.map((q) => {
    const userAnswer = answers[String(q.id)] ?? "";
    const correctAnswer = READING_ANSWER_KEY[q.id] ?? "";
    const isCorrect = checkAnswer(q.id, userAnswer);
    const explanation = buildReadingExplanationVi(q, userAnswer, isCorrect);
    return {
      questionId: q.id,
      isCorrect,
      correctAnswer: explanation.correctAnswer || correctAnswer,
      userAnswer: userAnswer || "(không trả lời)",
      explanationVi: explanation.explanationVi,
      tipVi: explanation.tipVi,
    };
  });

  const rawScore = questionResults.filter((r) => r.isCorrect).length;
  const total = questionResults.length;

  return {
    attemptId,
    rawScore,
    totalQuestions: total,
    bandScore: bandFromRaw(rawScore, total),
    overallFeedbackVi: `Bạn đạt ${rawScore}/${total} câu đúng. Hãy ôn lại các dạng câu sai và luyện đọc lướt (skimming) + đọc tìm chi tiết (scanning).`,
    strengths: rawScore >= total / 2 ? ["Hoàn thành phần lớn câu hỏi"] : [],
    improvements: ["Đọc kỹ từ khóa trong đề", "Chú ý dạng True/False/Not Given"],
    questionResults,
    gradedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình trên server." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ReadingAttemptPayload;
    const { id: attemptId, answers } = body;

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Thiếu dữ liệu bài nộp." }, { status: 400 });
    }

    const prelim = fallbackGrade(attemptId, answers);

    const wrongQuestions = prelim.questionResults
      .filter((r) => !r.isCorrect)
      .slice(0, 6)
      .map((r) => `Q${r.questionId}: user="${r.userAnswer}" | correct="${r.correctAnswer}"`)
      .join("\n");

    const prompt = `Bạn là giám khảo IELTS Reading. Viết NHẬN XÉT TỔNG QUAN bằng TIẾNG VIỆT dựa trên kết quả chấm tự động (không cần tính điểm lại).

Thông tin:
- Raw score: ${prelim.rawScore}/${prelim.totalQuestions}
- Band ước tính: ${prelim.bandScore}
- Nhận xét hệ thống hiện có: ${prelim.overallFeedbackVi}
- Câu sai (tối đa 6 câu):
${wrongQuestions || "(Không có câu sai)"}

Hãy:
1) Viết overallFeedbackVi 2-4 câu, tông thân thiện, có định hướng.
2) Đưa strengths (2-3 gạch đầu dòng) dựa trên câu đúng.
3) Đưa improvements (2-3 gạch đầu dòng) dựa trên câu sai.

Trả về ĐÚNG 1 JSON object (không markdown) schema:
{
  "overallFeedbackVi": string,
  "strengths": string[],
  "improvements": string[]
}`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[Gemini Reading]", geminiRes.status, errText);
      return NextResponse.json({ grade: prelim, source: "fallback" });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseGeminiJson(rawText);

    if (!parsed?.overallFeedbackVi || !String(parsed.overallFeedbackVi).trim()) {
      return NextResponse.json({ grade: prelim, source: "fallback" });
    }

    const grade: ReadingGradeResult = {
      attemptId,
      rawScore: parsed.rawScore ?? prelim.rawScore,
      totalQuestions: parsed.totalQuestions ?? prelim.totalQuestions,
      bandScore: parsed.bandScore ?? prelim.bandScore,
      overallFeedbackVi: parsed.overallFeedbackVi ?? prelim.overallFeedbackVi,
      strengths: parsed.strengths ?? prelim.strengths,
      improvements: parsed.improvements ?? prelim.improvements,
      // Guarantee correctness + evidence-based explanations via local engine.
      questionResults: prelim.questionResults,
      gradedAt: new Date().toISOString(),
    };

    return NextResponse.json({ grade, source: "gemini" });
  } catch (error) {
    console.error("[Gemini Reading] Unexpected:", error);
    return NextResponse.json({ error: "Lỗi server khi chấm bài." }, { status: 500 });
  }
}
