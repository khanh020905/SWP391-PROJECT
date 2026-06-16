import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnosticQuestions";
import { DIAGNOSTIC_PROMPT } from "@/lib/diagnosticSystemPrompt";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

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

function parseClaudeJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function bandFromRaw(correct: number, total: number, testType: 'academic' | 'general' = 'academic'): number {
  const scaled = Math.round((correct / total) * 40);

  const academicTable: [number, number][] = [
    [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5],
    [30, 7.0], [27, 6.5], [23, 6.0], [19, 5.5],
    [15, 5.0], [13, 4.5], [10, 4.0], [8, 3.5],
    [6, 3.0], [4, 2.5], [0, 2.0]
  ];

  const generalTable: [number, number][] = [
    [40, 9.0], [39, 8.5], [37, 8.0], [36, 7.5],
    [34, 7.0], [32, 6.5], [30, 6.0], [27, 5.5],
    [23, 5.0], [19, 4.5], [15, 4.0], [12, 3.5],
    [9, 3.0], [6, 2.5], [0, 2.0]
  ];

  const table = testType === 'general' ? generalTable : academicTable;

  for (const [minCorrect, band] of table) {
    if (scaled >= minCorrect) return band;
  }
  return 2.0;
}

function bandFromListening(correct: number): number {
  const table: [number, number][] = [
    [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5],
    [30, 7.0], [26, 6.5], [23, 6.0], [18, 5.5],
    [16, 5.0], [13, 4.5], [10, 4.0], [8, 3.5],
    [6, 3.0], [4, 2.5], [0, 2.0]
  ];
  for (const [minCorrect, band] of table) {
    if (correct >= minCorrect) return band;
  }
  return 2.0;
}

// Fallback logic to generate realistic grading in case Anthropic API fails or is not set up
function generateFallbackResult(answers: any, userId: string) {
  // Simple check on objective answers
  let lCorrect = 0;
  let rCorrect = 0;

  // Listening grading
  const l1Ans = answers.l1 || "";
  if (l1Ans.toLowerCase().includes("monday") && (l1Ans.toLowerCase().includes("2") || l1Ans.toLowerCase().includes("two"))) {
    lCorrect += 2;
  } else if (l1Ans.toLowerCase().includes("monday") || l1Ans.toLowerCase().includes("2")) {
    lCorrect += 1;
  }

  if ((answers.l2 || "").trim().toUpperCase() === "C") {
    lCorrect += 1;
  }

  const l3Ans = (answers.l3 || "").trim().toLowerCase();
  if (l3Ans.includes("1.1")) {
    lCorrect += 1;
  }

  // Reading grading
  if ((answers.r1_0 || "").trim().toUpperCase() === "TRUE") rCorrect += 1;
  if ((answers.r1_1 || "").trim().toUpperCase() === "FALSE") rCorrect += 1;
  if ((answers.r1_2 || "").trim().toUpperCase() === "NOT GIVEN") rCorrect += 1;
  if ((answers.r2 || "").trim().toUpperCase() === "B") rCorrect += 1;

  // Band calculations
  const rTotal = 4;
  const lBand = bandFromListening(lCorrect); // Listening dùng bảng riêng
  const rBand = bandFromRaw(rCorrect, rTotal, 'academic'); // Reading dùng hàm trên

  // Estimating writing & speaking bands based on word length / completeness
  const w1Len = (answers.w1 || "").trim().split(/\s+/).filter(Boolean).length;
  const w2Len = (answers.w2 || "").trim().split(/\s+/).filter(Boolean).length;
  const wBand1 = w1Len > 150 ? 6.5 : w1Len > 50 ? 5.5 : 4.0;
  const wBand2 = w2Len > 250 ? 6.5 : w2Len > 100 ? 5.5 : 4.0;
  const wBand = Math.round(((wBand1 + wBand2) / 2) * 2) / 2;

  const sp1Len = (answers.sp1_0 || "").trim().split(/\s+/).length + (answers.sp1_1 || "").trim().split(/\s+/).length;
  const sp2Len = (answers.sp2 || "").trim().split(/\s+/).filter(Boolean).length;
  const spBand = sp2Len > 100 ? 6.5 : sp2Len > 50 ? 5.5 : 4.5;

  const overall = Math.round(((lBand + rBand + wBand + spBand) / 4) * 2) / 2;

  return {
    overall_band: overall,
    skills: {
      listening: {
        band: lBand,
        correct: lCorrect,
        total: 4,
        strengths: ["Nhận diện thông tin chi tiết tốt", "Khả năng nghe điền từ ổn định"],
        weaknesses: ["Cần chú ý hơn đến chính tả của các danh từ riêng và số đo"],
        questionTypeAnalysis: {
          fill_in_blank: "Tốt ở dạng điền từ cơ bản, cần cẩn thận mạo từ và số ít/số nhiều."
        }
      },
      reading: {
        band: rBand,
        correct: rCorrect,
        total: 4,
        strengths: ["Xác định thông tin chi tiết trong bài đọc tốt", "Hiểu ý chính của đoạn văn"],
        weaknesses: ["Gặp khó khăn nhẹ ở phân biệt FALSE và NOT GIVEN"],
        questionTypeAnalysis: {
          true_false_not_given: "Khá, cần bám sát từ khóa phủ định trong passage.",
          multiple_choice: "Lựa chọn phương án chính xác."
        }
      },
      writing: {
        band: wBand,
        task1: {
          band: wBand1,
          criteria: { ta_tr: wBand1, cc: wBand1, lr: wBand1, gra: wBand1 },
          wordCount: w1Len,
          feedback: "Bài viết Task 1 đã mô tả được các thông số chính nhưng cần đa dạng cấu trúc so sánh hơn."
        },
        task2: {
          band: wBand2,
          criteria: { ta_tr: wBand2, cc: wBand2, lr: wBand2, gra: wBand2 },
          wordCount: w2Len,
          feedback: "Bài viết Task 2 lập luận tương đối rõ ràng. Cần chú ý mở rộng ý phụ và thêm ví dụ thực tế."
        }
      },
      speaking: {
        band: spBand,
        part1: {
          band: spBand,
          feedback: "Các câu trả lời Part 1 tự nhiên, tuy nhiên cần mở rộng câu trả lời bằng cách dùng công thức A.R.E.A."
        },
        part2: {
          band: spBand,
          criteria: { fc: spBand, lr: spBand, gra: spBand, pr: spBand },
          feedback: "Bài nói Part 2 có cấu trúc ổn, từ vựng sử dụng ở mức khá cơ bản. Cần thêm liên từ chuyển ý tự nhiên hơn."
        }
      }
    },
    targetBand: Math.min(9.0, overall + 1.5),
    prioritySkills: wBand < spBand ? ["Writing", "Speaking"] : ["Speaking", "Writing"],
    roadmap: [
      {
        phase: 1,
        weeks: "Tuần 1 - 2",
        focusSkill: "Grammar & Vocabulary",
        title: "Xây dựng nền tảng từ vựng học thuật & phát âm nâng cao",
        dailyStudyMinutes: 90,
        activities: [
          { type: "Vocab", description: "Học từ vựng theo chủ đề Khoa học và Môi trường", cambridgeTests: ["Cam 16 Test 1"], platformFeature: "vocab_grammar", frequency: "Hàng ngày" },
          { type: "Speaking", description: "Luyện Shadowing với các bài nói mẫu Part 1", cambridgeTests: [], platformFeature: "shadowing", frequency: "3 lần / tuần" }
        ],
        weeklyMilestone: "Nắm vững 50 từ vựng chủ đề môi trường và tự tin trả lời 10 câu hỏi Part 1."
      },
      {
        phase: 2,
        weeks: "Tuần 3 - 4",
        focusSkill: "Reading & Listening",
        title: "Chiến thuật làm bài Listening Section 3 & Reading Passage 2",
        dailyStudyMinutes: 90,
        activities: [
          { type: "Listening", description: "Luyện nghe dạng Multiple Choice & điền từ", cambridgeTests: ["Cam 17 Test 2"], platformFeature: "listening_test", frequency: "2 lần / tuần" },
          { type: "Reading", description: "Học kỹ năng Skimming & Scanning định vị từ khóa nhanh", cambridgeTests: ["Cam 17 Test 3"], platformFeature: "reading_practice", frequency: "3 lần / tuần" }
        ],
        weeklyMilestone: "Tăng tỷ lệ chính xác dạng bài True/False/Not Given lên trên 70%."
      },
      {
        phase: 3,
        weeks: "Tuần 5 - 6",
        focusSkill: "Writing Task 1",
        title: "Master cấu trúc mô tả biểu đồ & so sánh dữ liệu",
        dailyStudyMinutes: 120,
        activities: [
          { type: "Writing", description: "Luyện viết mở bài và phần tổng quan (Overview) cho các dạng biểu đồ", cambridgeTests: ["Cam 18 Test 1"], platformFeature: "writing_feedback", frequency: "3 bài / tuần" }
        ],
        weeklyMilestone: "Viết hoàn chỉnh báo cáo Task 1 trong vòng 20 phút đạt band 6.0+."
      },
      {
        phase: 4,
        weeks: "Tuần 7 - 8",
        focusSkill: "Speaking Part 2",
        title: "Phát triển ý tưởng và mở rộng bài nói trong 2 phút",
        dailyStudyMinutes: 90,
        activities: [
          { type: "Speaking", description: "Luyện nói với cue card sử dụng mindmap và phương pháp Shadowing bài nói mẫu", cambridgeTests: [], platformFeature: "shadowing", frequency: "Hàng ngày" }
        ],
        weeklyMilestone: "Nói liên tục trong 2 phút mà không bị ngập ngừng quá nhiều."
      },
      {
        phase: 5,
        weeks: "Tuần 9 - 10",
        focusSkill: "Writing Task 2",
        title: "Xây dựng lập luận chặt chẽ & cấu trúc bài luận 4 đoạn",
        dailyStudyMinutes: 120,
        activities: [
          { type: "Writing", description: "Viết bài luận nghị luận xã hội và nhận phản hồi chi tiết từ AI", cambridgeTests: ["Cam 19 Test 3"], platformFeature: "writing_feedback", frequency: "2 bài / tuần" }
        ],
        weeklyMilestone: "Hoàn thiện bài essay 250 từ mạch lạc, sử dụng các từ nối liên kết chất lượng."
      },
      {
        phase: 6,
        weeks: "Tuần 11 - 12",
        focusSkill: "Full Test Practice",
        title: "Thực chiến luyện đề dưới áp lực thời gian",
        dailyStudyMinutes: 150,
        activities: [
          { type: "Full Practice", description: "Giải đề full 4 kỹ năng trong bộ đề Cam 20", cambridgeTests: ["Cam 20 Test 1", "Cam 20 Test 2"], platformFeature: "exam_review", frequency: "2 lần / tuần" }
        ],
        weeklyMilestone: "Đạt band score mục tiêu trong tối thiểu 2 đề thi thử liên tiếp."
      }
    ],
    vocabularyFocus: ["Sustenance", "Carbon emissions", "Subsidy", "Unprecedented", "Fluctuation"],
    shadowingRecommendation: {
      recommended: true,
      frequency: "Mỗi ngày",
      sessionDurationMinutes: 15,
      suggestedContentTypes: ["TED Talks", "IELTS Speaking Part 2 model answers", "BBC Podcasts"],
      reason: "Học viên cần cải thiện nhịp điệu (rhythm), ngữ điệu (intonation) và sự trôi chảy khi trình bày các ý tưởng dài."
    },
    encouragementMessage: "Chúc mừng bạn đã hoàn thành bài thi Diagnostic Test! Điểm xuất phát của bạn rất hứa hẹn. Bằng cách tập trung vào lộ trình 12 tuần này, đặc biệt cải thiện các kỹ năng ưu tiên và chăm chỉ luyện Shadowing, bạn chắc chắn sẽ bứt phá band điểm mục tiêu!"
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { answers } = body;

    if (!answers) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let finalResult: any = null;

    if (apiKey) {
      // Build standard answer key for Claude reference
      const answerKey = {
        listening: DIAGNOSTIC_QUESTIONS.listening.map(q => ({ id: q.id, answers: q.answers, correctAnswer: q.correctAnswer })),
        reading: DIAGNOSTIC_QUESTIONS.reading.map(q => ({ id: q.id, items: q.items, correctAnswer: q.correctAnswer }))
      };

      const userMessage = DIAGNOSTIC_PROMPT.buildUserMessage(answers, answerKey);

      // Attempt to call Anthropic Claude API with a retry count of 1
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts && !finalResult) {
        attempts++;
        try {
          const res = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 4000,
              system: DIAGNOSTIC_PROMPT.system,
              messages: [{ role: "user", content: userMessage }],
              temperature: 0.3
            })
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Anthropic API returned status ${res.status}: ${errText}`);
          }

          const responseData = await res.json();
          const rawText = responseData.content?.[0]?.text || "";
          finalResult = parseClaudeJson(rawText);

          if (!finalResult || typeof finalResult.overall_band !== "number") {
            finalResult = null;
            throw new Error("Failed to parse valid JSON structure from Claude output.");
          }
        } catch (apiError) {
          console.error(`[Claude Diagnostic Submit Attempt ${attempts} failed]`, apiError);
          if (attempts >= maxAttempts) {
            console.log("Exceeded maximum API retries. Falling back to local scoring script.");
          }
        }
      }
    } else {
      console.log("No ANTHROPIC_API_KEY configured. Falling back to rule-based grading.");
    }

    // Fallback if Claude call fails or key is missing
    if (!finalResult) {
      finalResult = generateFallbackResult(answers, user.id);
    }

    // Save submission and evaluation to Supabase
    const { data: insertedData, error: dbError } = await supabaseAdmin
      .from("diagnostic_results")
      .insert({
        user_id: user.id,
        overall_band: finalResult.overall_band,
        listening_band: finalResult.skills?.listening?.band || 5.0,
        reading_band: finalResult.skills?.reading?.band || 5.0,
        writing_band: finalResult.skills?.writing?.band || 5.0,
        speaking_band: finalResult.skills?.speaking?.band || 5.0,
        full_result: finalResult,
        answers: answers
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("❌ Database insertion error for diagnostic results:", dbError.message);
      // Even if DB fails, return the graded output so frontend can show results
      return NextResponse.json({ success: true, id: `temp_${Date.now()}`, result: finalResult });
    }

    return NextResponse.json({ success: true, id: insertedData.id, result: finalResult });

  } catch (err: any) {
    console.error("❌ Exception in Diagnostic Submit API:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
