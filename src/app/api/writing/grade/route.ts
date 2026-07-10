import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { WRITING_TASKS } from "@/lib/writingMockData";
import { countWords } from "@/lib/writingStorage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }
  
  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return JSON.parse(cleaned);
}

async function gradeWithGemini(prompt: string): Promise<any> {
  // Use gemini-flash-latest which resolves to stable 1.5-flash in the SDK
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return cleanAndParseJSON(text);
  } catch {
    throw new Error("Gemini trả về JSON không hợp lệ: " + text.slice(0, 200));
  }
}


export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

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

    if (!apiKey) {
      console.warn("[Gemini Writing] GEMINI_API_KEY is not configured. Returning mock grade.");
      const mockFeedbackResult = {
        attemptId,
        estimatedBand: 6.5,
        overallFeedbackVi: "Đây là kết quả mẫu (Mock Grade) do GEMINI_API_KEY chưa được cấu hình trên server. Khi cấu hình khóa, Gemini AI sẽ đánh giá bài viết chi tiết dựa trên tiêu chí IELTS.",
        taskFeedback: [
          {
            taskId: "task1",
            wordCount: wordCounts.task1,
            estimatedBand: 6.0,
            criteria: {
              ta_tr: { score: 6.0, explanationVi: "Bài viết Task 1 đáp ứng được các yêu cầu cơ bản của đề bài." },
              cc: { score: 6.0, explanationVi: "Cấu trúc mạch lạc, liên kết ý ở mức trung bình." },
              lr: { score: 6.0, explanationVi: "Từ vựng khá đa dạng, tuy nhiên cần cải thiện từ vựng học thuật." },
              gra: { score: 6.0, explanationVi: "Cấu trúc câu đơn giản chính xác, cần tăng cường câu phức." }
            },
            strengths: ["Bố cục rõ ràng", "Nêu được các xu hướng chính"],
            improvements: ["Sử dụng thêm từ nối đa dạng", "Tránh lặp từ"],
            grammarCorrections: [],
            modelAnswer: "Đây là bài mẫu viết lại cho Task 1..."
          },
          {
            taskId: "task2",
            wordCount: wordCounts.task2,
            estimatedBand: 6.5,
            criteria: {
              ta_tr: { score: 6.5, explanationVi: "Trả lời đầy đủ luận đề Task 2, phát triển ý tốt." },
              cc: { score: 6.5, explanationVi: "Sử dụng từ nối mạch lạc giữa các đoạn." },
              lr: { score: 6.5, explanationVi: "Từ vựng phù hợp chủ đề luận." },
              gra: { score: 6.5, explanationVi: "Kiểm soát tốt lỗi ngữ pháp." }
            },
            strengths: ["Ý kiến rõ ràng xuyên suốt", "Có ví dụ thực tế hỗ trợ"],
            improvements: ["Mở rộng thêm phần giải thích sâu hơn", "Sử dụng cấu trúc đảo ngữ hoặc câu điều kiện nâng cao"],
            grammarCorrections: [],
            modelAnswer: "Đây là bài mẫu viết lại cho Task 2..."
          }
        ],
        gradedAt: new Date().toISOString(),
      };

      if (user) {
        const { error: dbError } = await supabaseAdmin.from("user_submissions").insert({
          user_id: user.id,
          exam_id: null,
          score: mockFeedbackResult.estimatedBand,
          answers: {
            answers,
            wordCounts,
            feedback: mockFeedbackResult,
          },
          started_at: new Date(Date.now() - (60 * 60 * 1000 - (timeRemaining || 0) * 1000)).toISOString(),
          completed_at: new Date().toISOString(),
        });

        if (dbError) {
          console.error("❌ Lỗi khi lưu kết quả mock vào bảng user_submissions:", dbError);
        }
      }

      return NextResponse.json({ grade: mockFeedbackResult, source: "fallback" });
    }

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
}

QUAN TRỌNG: Chỉ trả về JSON thuần túy.
Không được bọc trong \`\`\`json hay bất kỳ text nào bên ngoài JSON.`;

    const parsed = await gradeWithGemini(prompt);

    if (!parsed || typeof parsed.estimatedBand !== "number") {
      throw new Error("Không thể nhận được kết quả chấm bài từ Gemini.");
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
        exam_id: null,
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

    return NextResponse.json({ grade: feedbackResult, source: "gemini" });
  } catch (error) {
    console.error("[Gemini Writing Exception]", error);
    return NextResponse.json(
      { error: "Không thể chấm bài lúc này, vui lòng thử lại sau." },
      { status: 503 }
    );
  }
}
