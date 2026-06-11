import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { WRITING_TASKS } from "@/lib/writingMockData";
import { countWords, buildWritingFeedback } from "@/lib/writingStorage";

const DEEPSEEK_MODEL = "deepseek-chat";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

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

function parseDeepSeekJson(text: string) {
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

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY chưa được cấu hình trên server." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { id: attemptId, answers, timeRemaining } = body;

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Thiếu dữ liệu bài nộp." }, { status: 400 });
    }

    const wordCounts = {
      task1: countWords(answers.task1 || ""),
      task2: countWords(answers.task2 || ""),
    };

    const user = await getAuthenticatedUser(request);

    // Call DeepSeek to evaluate
    const prompt = `Bạn là một giám khảo chấm thi IELTS chuyên nghiệp. Hãy đánh giá chi tiết bài thi viết IELTS sau đây.
Bài thi bao gồm 2 phần: Task 1 và Task 2.

ĐỀ BÀI TASK 1:
- Loại: Academic Report
- Đề bài: ${WRITING_TASKS[0].prompt}
- Dữ liệu chi tiết: ${WRITING_TASKS[0].visualTitle} - ${WRITING_TASKS[0].visualDescription}. 
  Internet: 2000(32%) -> 2020(93%)
  Smartphone: 2000(4%) -> 2020(88%)
  Washing machine: 2000(74%) -> 2020(90%)
  Dishwasher: 2000(28%) -> 2020(58%)

BÀI LÀM TASK 1 CỦA HỌC VIÊN:
"""
${answers.task1 || "(Học viên không nộp bài cho Task 1)"}
"""

---

ĐỀ BÀI TASK 2:
- Loại: Essay
- Đề bài: ${WRITING_TASKS[1].prompt}

BÀI LÀM TASK 2 CỦA HỌC VIÊN:
"""
${answers.task2 || "(Học viên không nộp bài cho Task 2)"}
"""

Hãy đánh giá bài viết và chấm điểm cho từng Task theo 4 tiêu chí chính thức của IELTS:
1. Task Achievement / Task Response (TA/TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Mỗi tiêu chí chấm điểm từ 0.0 đến 9.0 (bước nhảy 0.5, ví dụ: 6.0, 6.5, 7.0).
Tính điểm tổng cho từng Task là trung bình cộng của 4 tiêu chí, làm tròn đến 0.5 gần nhất.
Tính điểm Overall Band Score của toàn bộ bài thi theo công thức: Overall = (Score_Task1 + Score_Task2 * 2) / 3, sau đó làm tròn đến 0.5 gần nhất (ví dụ: 6.25 làm tròn thành 6.5, 6.75 làm tròn thành 7.0, 5.15 làm tròn thành 5.0).

Bạn PHẢI trả về ĐÚNG 1 JSON object (không chứa định dạng markdown \`\`\`json hay text bên ngoài) theo schema mẫu sau đây bằng tiếng Việt:
{
  "estimatedBand": 6.5,
  "overallFeedbackVi": "Nhận xét tổng quan toàn bài thi viết của học viên, khích lệ và chỉ ra định hướng chung...",
  "taskFeedback": [
    {
      "taskId": "task1",
      "wordCount": ${wordCounts.task1},
      "estimatedBand": 6.0,
      "criteria": {
        "ta_tr": {
          "score": 6.0,
          "explanationVi": "Nhận xét chi tiết về mức độ đáp ứng yêu cầu đề bài của Task 1..."
        },
        "cc": {
          "score": 6.5,
          "explanationVi": "Nhận xét về tính mạch lạc và liên kết của Task 1..."
        },
        "lr": {
          "score": 6.0,
          "explanationVi": "Nhận xét về vốn từ vựng sử dụng trong Task 1..."
        },
        "gra": {
          "score": 5.5,
          "explanationVi": "Nhận xét về độ đa dạng và chính xác ngữ pháp trong Task 1..."
        }
      },
      "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
      "improvements": ["Điểm cần sửa 1", "Điểm cần sửa 2"],
      "grammarCorrections": [
        {
          "original": "câu sai ngữ pháp hoặc dùng từ sai của học viên",
          "correction": "câu đã được sửa lại cho đúng",
          "reasonVi": "giải thích vì sao sai và quy tắc sửa lỗi bằng tiếng Việt",
          "context": "ngữ cảnh xung quanh lỗi"
        }
      ],
      "modelAnswer": "Bản viết lại toàn bộ hoặc những đoạn quan trọng nâng cấp lên band 8.5+ dựa trên ý tưởng của học viên..."
    },
    {
      "taskId": "task2",
      "wordCount": ${wordCounts.task2},
      "estimatedBand": 6.5,
      "criteria": {
        "ta_tr": {
          "score": 6.5,
          "explanationVi": "Nhận xét chi tiết về cách trả lời luận đề Task 2..."
        },
        "cc": {
          "score": 6.5,
          "explanationVi": "Nhận xét về cấu trúc đoạn văn, liên kết ý trong Task 2..."
        },
        "lr": {
          "score": 6.0,
          "explanationVi": "Nhận xét về sử dụng từ vựng, từ đồng nghĩa trong Task 2..."
        },
        "gra": {
          "score": 7.0,
          "explanationVi": "Nhận xét về cấu trúc câu phức và độ chính xác ngữ pháp trong Task 2..."
        }
      },
      "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
      "improvements": ["Điểm cần sửa 1", "Điểm cần sửa 2"],
      "grammarCorrections": [
        {
          "original": "câu sai của học viên ở Task 2",
          "correction": "câu đúng",
          "reasonVi": "giải thích lỗi ngữ pháp/từ vựng bằng tiếng Việt",
          "context": "ngữ cảnh"
        }
      ],
      "modelAnswer": "Bài luận mẫu nâng cấp band 8.5+ dựa trên cấu trúc bài làm của học viên..."
    }
  ]
}`;

    const deepseekRes = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert IELTS Writing examiner. You output strictly valid raw JSON without any markdown formatting or wrapper.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("[DeepSeek Writing API Error]", deepseekRes.status, errText);
      throw new Error(`DeepSeek API returned status ${deepseekRes.status}`);
    }

    const deepseekData = await deepseekRes.json();
    const rawText = deepseekData.choices?.[0]?.message?.content ?? "";
    const parsed = parseDeepSeekJson(rawText);

    if (!parsed || typeof parsed.estimatedBand !== "number") {
      throw new Error("Không thể parse kết quả JSON hợp lệ từ DeepSeek");
    }

    const feedbackResult = {
      attemptId,
      estimatedBand: parsed.estimatedBand,
      taskFeedback: parsed.taskFeedback,
      overallFeedbackVi: parsed.overallFeedbackVi,
      gradedAt: new Date().toISOString(),
    };

    // Save submission to Supabase user_submissions if user is authenticated
    if (user) {
      const { error: dbError } = await supabaseAdmin.from("user_submissions").insert({
        user_id: user.id,
        exam_id: null, // lobby practice test has no persistent exam UUID in database yet
        score: feedbackResult.estimatedBand,
        answers: {
          answers,
          wordCounts,
          feedback: feedbackResult,
        },
        started_at: new Date(Date.now() - (60 * 60 * 1000 - (timeRemaining || 0) * 1000)).toISOString(),
        completed_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("❌ Lỗi khi lưu kết quả vào bảng user_submissions:", dbError);
      } else {
        console.log("✅ Lưu kết quả chấm bài của học viên vào Supabase thành công!");
      }
    }

    return NextResponse.json({ grade: feedbackResult, source: "deepseek" });
  } catch (error) {
    console.error("[DeepSeek Writing Exception]", error);
    
    // Fallback to local heuristic grading
    try {
      const body = await request.json().catch(() => ({}));
      const { id: attemptId, answers } = body;
      
      const localFeedback = buildWritingFeedback(attemptId || `writing_${Date.now()}`, answers || { task1: "", task2: "" });
      
      // Inject standard criteria and placeholders for UI fallback compliance
      const formattedFeedback = {
        attemptId: localFeedback.attemptId,
        estimatedBand: localFeedback.estimatedBand,
        overallFeedbackVi: localFeedback.overallFeedbackVi + " (Lưu ý: Do trục trặc kết nối AI DeepSeek, hệ thống đang hiển thị kết quả đánh giá sơ bộ tự động bằng thuật toán.)",
        gradedAt: localFeedback.gradedAt,
        taskFeedback: localFeedback.taskFeedback.map((tf) => ({
          taskId: tf.taskId,
          wordCount: tf.wordCount,
          estimatedBand: tf.estimatedBand,
          criteria: {
            ta_tr: { score: tf.estimatedBand, explanationVi: "Đánh giá sơ bộ dựa trên từ vựng và câu cú." },
            cc: { score: tf.estimatedBand, explanationVi: "Đánh giá cấu trúc đoạn văn sơ bộ." },
            lr: { score: tf.estimatedBand, explanationVi: "Độ đa dạng từ vựng ước tính." },
            gra: { score: tf.estimatedBand, explanationVi: "Độ chính xác ngữ pháp ước tính." }
          },
          strengths: tf.strengths,
          improvements: tf.improvements,
          grammarCorrections: [],
          modelAnswer: tf.taskId === "task1" ? "Vui lòng kết nối DeepSeek AI để nhận bài mẫu viết lại." : "Vui lòng kết nối DeepSeek AI để nhận bài luận mẫu hoàn chỉnh."
        }))
      };

      const user = await getAuthenticatedUser(request);
      if (user && attemptId && answers) {
        await supabaseAdmin.from("user_submissions").insert({
          user_id: user.id,
          exam_id: null,
          score: formattedFeedback.estimatedBand,
          answers: {
            answers,
            wordCounts: {
              task1: countWords(answers.task1 || ""),
              task2: countWords(answers.task2 || ""),
            },
            feedback: formattedFeedback,
          },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ grade: formattedFeedback, source: "fallback" });
    } catch {
      return NextResponse.json({ error: "Lỗi hệ thống khi chấm bài viết." }, { status: 500 });
    }
  }
}
