import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnosticQuestions";
import { DIAGNOSTIC_PROMPT } from "@/lib/diagnosticSystemPrompt";
import { GoogleGenerativeAI } from "@google/generative-ai";


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

// Fallback logic to generate realistic grading in case Anthropic/Gemini API fails or is not set up
function generateFallbackResult(answers: any, userId: string, answerKey?: any) {
  // Simple check on objective answers
  let lCorrect = 0;
  let rCorrect = 0;

  if (answerKey) {
    // Grade dynamically based on answerKey
    if (answerKey.listening && Array.isArray(answerKey.listening)) {
      answerKey.listening.forEach((q: any) => {
        const userAns = (answers[q.id] || "").trim().toLowerCase();
        if (!userAns) return;
        
        if (q.id === "l1" && userAns.includes("monday") && (userAns.includes("2") || userAns.includes("two"))) {
          lCorrect += 2;
        } else if (q.id === "l1" && (userAns.includes("monday") || userAns.includes("2"))) {
          lCorrect += 1;
        } else {
          const possibleAnswers = (q.answers || [q.correctAnswer] || [])
            .map((a: any) => String(a).trim().toLowerCase())
            .filter(Boolean);
          const isMatch = possibleAnswers.some((pa: string) => userAns.includes(pa) || pa.includes(userAns));
          if (isMatch) {
            lCorrect += 1;
          }
        }
      });
    }

    if (answerKey.reading && Array.isArray(answerKey.reading)) {
      const r1 = answerKey.reading[0];
      if (r1 && r1.items) {
        r1.items.forEach((item: any, idx: number) => {
          const key = `r1_${idx}`;
          const userAns = (answers[key] || "").trim().toUpperCase();
          const correctAns = (item.correctAnswer || item.correct_answer || "").trim().toUpperCase();
          if (userAns && userAns === correctAns) {
            rCorrect += 1;
          }
        });
      }

      const r2 = answerKey.reading[1];
      if (r2) {
        const userAns = (answers.r2 || "").trim().toUpperCase();
        const correctAns = (r2.correctAnswer || r2.correct_answer || "").trim().toUpperCase();
        if (userAns && correctAns && userAns.charAt(0) === correctAns.charAt(0)) {
          rCorrect += 1;
        }
      }
    }
  } else {
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
  }

  // Band calculations
  const lBand = Math.min(9.0, 3.5 + lCorrect * 1.0);
  const rBand = Math.min(9.0, 3.5 + rCorrect * 1.0);

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
    const { answers, isRetest, retestPathId, answerKey: reqAnswerKey } = body;

    if (!answers) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let finalResult: any = null;

    const answerKey = reqAnswerKey || {
      listening: DIAGNOSTIC_QUESTIONS.listening.map(q => ({ id: q.id, answers: q.answers, correctAnswer: q.correctAnswer })),
      reading: DIAGNOSTIC_QUESTIONS.reading.map(q => ({ id: q.id, items: q.items, correctAnswer: q.correctAnswer }))
    };

    if (apiKey) {
      const userMessage = DIAGNOSTIC_PROMPT.buildUserMessage(answers, answerKey);

      // Attempt to call Gemini API with a retry count of 1
      let attempts = 0;
      const maxAttempts = 2;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      while (attempts < maxAttempts && !finalResult) {
        attempts++;
        try {
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            systemInstruction: DIAGNOSTIC_PROMPT.system,
          });

          const responseText = result.response.text();
          finalResult = parseClaudeJson(responseText);

          if (!finalResult || typeof finalResult.overall_band !== "number") {
            finalResult = null;
            throw new Error("Failed to parse valid JSON structure from Gemini output.");
          }
        } catch (apiError) {
          console.error(`[Gemini Diagnostic Submit Attempt ${attempts} failed]`, apiError);
          if (attempts >= maxAttempts) {
            console.log("Exceeded maximum API retries. Falling back to local scoring script.");
          }
        }
      }
    } else {
      console.log("No GEMINI_API_KEY configured. Falling back to rule-based grading.");
    }

    // Fallback if Claude call fails or key is missing
    if (!finalResult) {
      finalResult = generateFallbackResult(answers, user.id, answerKey);
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

    let comparisonResult: any = null;

    if (isRetest && retestPathId) {
      // Lấy thông tin lộ trình đang theo + band lúc tạo lộ trình
      const { data: pathData } = await supabaseAdmin
        .from("learning_paths")
        .select("id, diagnostic_id, ai_suggestion")
        .eq("id", retestPathId)
        .single();

      if (pathData) {
        // Lấy band cũ từ diagnostic_results gốc
        const { data: oldDiagnostic } = await supabaseAdmin
          .from("diagnostic_results")
          .select("overall_band")
          .eq("id", pathData.diagnostic_id)
          .single();

        const oldBand = oldDiagnostic?.overall_band || 0;
        const newBand = finalResult.overall_band;
        const targetBand = pathData.ai_suggestion?.targetBand || null;

        const improved = newBand > oldBand;
        const reachedTarget = targetBand ? newBand >= targetBand : false;

        comparisonResult = {
          oldBand,
          newBand,
          targetBand,
          improved,
          reachedTarget,
          bandDiff: Math.round((newBand - oldBand) * 10) / 10
        };

        // Lưu kết quả retest, link tới path_id qua diagnostic_id mới
        await supabaseAdmin
          .from("diagnostic_results")
          .update({ 
            full_result: { ...finalResult, comparison: comparisonResult, retest_of_path: retestPathId }
          })
          .eq("id", insertedData.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: insertedData.id, 
      result: finalResult,
      comparison: comparisonResult
    });

  } catch (err: any) {
    console.error("❌ Exception in Diagnostic Submit API:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
