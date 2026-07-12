import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractBandScore } from "@/utils/bandScore";
import { getGroqKeys } from "@/lib/groq";

export const maxDuration = 60;

// IELTS Writing grading — ported from The IELTS Dictionary (/api/evaluate, category "writing").
// Returns { evaluation: { type: "markdown", content, estimatedBandScore } } for WritingGradeUI.
async function evaluateWriting(payload: any) {
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  const { answers, testData } = payload;
  const taskType = testData?.taskType || "task1";
  const isTask2 = taskType === "task2";
  const isFull = taskType === "full";
  const studentEssay = isFull
    ? `Task 1:\n${answers?.task1 || "N/A"}\n\nTask 2:\n${answers?.task2 || "N/A"}`
    : isTask2
      ? (answers?.task2 || answers?.task1 || "N/A")
      : (answers?.task1 || "N/A");
  const taskPromptText = testData?.task1Description || testData?.task2Description || "N/A";
  const cleanTask = taskPromptText.length > 20 ? stripHtml(taskPromptText).slice(0, 500) : "N/A";
  const taskLabel = isFull ? "Full Test (Task 1 + Task 2)" : isTask2 ? "Task 2 – Academic Writing" : "Task 1 – Academic Writing";

  const writingPrompt = `You are an expert IELTS Writing Examiner. Your task is to evaluate an IELTS Writing essay, provide a realistic estimated overall band score, give detailed feedback based on the 4 official grading criteria, list specific grammatical or lexical errors, and provide an upgraded version of the essay.

Please output the entire response in Vietnamese, but keep specific IELTS terminology (Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy, Band Score) in English or paired with Vietnamese translation.

Follow this strict Markdown structure:

---
### 1. Estimated Overall Band Score: [number e.g. 6.5]

Briefly introduce the general impression of the essay in 2-3 sentences. Mention core strengths and the biggest bottleneck holding the student back.

### 2. Detailed Evaluation by Criteria

* **Task Achievement / Task Response: Band [integer]**
  - Điểm mạnh (strengths).
  - Điểm yếu / hướng cải thiện (weaknesses).

* **Coherence and Cohesion: Band [integer]**
  - Đánh giá cấu trúc đoạn, tính logic, và cohesive devices.

* **Lexical Resource: Band [integer]**
  - Đánh giá vốn từ, tone học thuật, và độ chính xác.

* **Grammatical Range and Accuracy: Band [integer]**
  - Đánh giá cấu trúc câu, thì, và độ chính xác ngữ pháp.

### 3. Error Identification & Correction (Sửa lỗi chi tiết)

List specific errors as bullet points: original error → reason (Vietnamese) → correction.
- *"...the table **illustrate**..."* → Sửa thành: **illustrates** (Chủ ngữ "the table" là số ít, cần chia động từ thêm 's').

### 4. Upgraded Version (Bản sửa lỗi hoàn chỉnh — Mục tiêu Band 8.0+)

Fully edited and polished version of the student's essay. **Bold** the corrected/improved words.

---

SCORING CONSTRAINTS:
1. Be encouraging but precise. Do not over-inflate scores, but do not be overly strict.
2. Individual criteria scores MUST be whole integers only (5, 6, 7, 8). NO half-bands (5.5, 6.5) for individual criteria.
3. Overall Band Score = average of 4 criteria, rounded to nearest 0.5 per official IELTS rules (avg 6.125 → 6.0; avg 6.25 → 6.5; avg 6.75 → 7.0).
4. All error explanations must be in Vietnamese.

---

TASK TYPE: ${taskLabel}
TASK PROMPT: ${cleanTask}

STUDENT ESSAY:
${studentEssay}`;

  const apiMessages = [{ role: "user", content: writingPrompt }];
  const maxTokens = 5000;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  let resultText = "";

  // Try OpenRouter first (Gemini Flash — fast, ~3-8s)
  if (openRouterApiKey) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 50000);
      const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (orResponse.ok) {
        const orData = await orResponse.json();
        resultText = orData.choices[0].message.content;
      } else {
        console.error("OpenRouter error, falling back to Groq:", await orResponse.text());
      }
    } catch (err) {
      console.error("OpenRouter network error, falling back to Groq:", err);
    }
  }

  // Fallback to Groq if OpenRouter wasn't used or failed
  if (!resultText) {
    const groqKeys = getGroqKeys();
    if (groqKeys.length === 0) {
      return NextResponse.json({ error: "API Key configuration error." }, { status: 500 });
    }
    const groqBody = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    let groqResponse;
    for (const key of groqKeys) {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: groqBody,
      });
      if (groqResponse.status !== 429) break;
    }

    if (!groqResponse || !groqResponse.ok) {
      let errorData: any = {};
      if (groqResponse) {
        try { errorData = await groqResponse.json(); } catch {}
      }
      const groqMsg = errorData?.error?.message || errorData?.message || groqResponse?.statusText || "Unknown Groq error or all keys rate limited";
      console.error(`Groq API Error [${groqResponse?.status}]:`, JSON.stringify(errorData));
      return NextResponse.json(
        { error: `Groq [${groqResponse?.status}]: ${groqMsg}` },
        { status: groqResponse?.status || 502 }
      );
    }

    const groqData = await groqResponse.json();
    resultText = groqData.choices[0].message.content;
  }

  const estimatedBandScore = extractBandScore(resultText);
  return NextResponse.json({ evaluation: { type: "markdown", content: resultText, estimatedBandScore } });
}

export async function POST(req: Request) {
  try {
    const { category, payload } = await req.json();

    if (!category || !payload) {
      return NextResponse.json({ error: "Missing category or payload" }, { status: 400 });
    }

    // Writing grading is open to everyone — no auth required
    if (category === "writing") {
      return await evaluateWriting(payload);
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let prompt = "";

    if (category === "vocab_sentence") {
      const { word, definition, pos, sentence } = payload;
      prompt = `You are a STRICT IELTS examiner grading a single student sentence for vocabulary practice. Be rigorous and honest — do NOT inflate scores. Most learner sentences are band 5–6; band 7+ must be earned.

Target word: "${word}" (${pos})
Word definition: ${definition}
Student's sentence: "${sentence}"

Grade the sentence on a 0–9 IELTS band scale using these calibrated descriptors:
- Band 9: Flawless, fully natural, sophisticated. Precise word choice with strong collocations and complex, well-controlled structure.
- Band 7–8: Grammatically correct AND shows range — a complex/compound structure, a less common but accurate collocation, or precise nuance. Natural and idiomatic.
- Band 6: Correct and clear but SIMPLE — basic structure (e.g. "X is so beautiful"), common/generic vocabulary, no complexity or notable range.
- Band 5: Communicates meaning but with a noticeable error, awkward phrasing, or very basic/childish construction.
- Band 4 or below: Frequent errors, the word is misused, or meaning is unclear.

STRICT RULES:
- A short, simple, grammatically-correct sentence (e.g. "The jungle is so beautiful") is BAND 5–6, NOT 7. Reserve 7+ for genuine grammatical range or natural collocation.
- Set "is_correct": true ONLY if the sentence is grammatically correct AND uses the target word with its given meaning. Otherwise false.
- Set "uses_word": false if the target word (or a valid inflection) is missing or used with a wrong meaning — then band must be ≤ 4.
- "correction" must be a genuinely IMPROVED, higher-band rewrite (richer structure/collocation), NOT a copy of the student's sentence.
- List concrete issues in "errors" (grammar, collocation, word_form, register). Empty array only if the sentence is truly band 8+.
- "feedback_vi" in Vietnamese: state the band, WHY (cite the actual structure/word choice), and one specific tip to reach a higher band.

Return ONLY valid JSON: { "is_correct": true, "uses_word": true, "band": 6.0, "feedback_vi": "...", "correction": "...", "errors": [{ "type": "...", "issue": "...", "fix": "..." }] }`;

    } else if (category === "vocab_generate_sentence") {
      const { word, definition, pos } = payload;
      prompt = `You are an expert English teacher creating an IELTS-appropriate example sentence for a student.
Target word: "${word}" (${pos})
Meaning: ${definition}

Create exactly ONE short, natural, and idiomatic sentence that clearly demonstrates the meaning of the target word.
The sentence should be band 6.0-7.0 level—natural but not overly complex. Keep it under 15 words if possible.

Return ONLY valid JSON: { "sentence": "The example sentence containing the target word." }`;
    } else {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter error:", errText);
      return NextResponse.json(
        { error: `OpenRouter error ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";

    let evaluation = null;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      evaluation = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse evaluation JSON", content);
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate" },
      { status: 500 }
    );
  }
}
