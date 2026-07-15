import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  let items: any[] = [];
  try {
    const body = await request.json();
    items = body.items || [];
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
    }

    const itemsPrompt = items.map((item, idx) => `
Item ${idx + 1}:
- ID: "${item.id}"
- Vietnamese Prompt: "${item.vi_prompt}"
- Expected English Translation: "${item.expected}"
- Student English Translation: "${item.input}"
    `).join("\n");

    const prompt = `
You are an IELTS Writing tutor grading Vietnamese-to-English translation exercises.
Compare the student's English translation with the expected correct translation, based on the Vietnamese prompt.
Determine if the student's translation is grammatically correct and conveys the exact semantic meaning of the prompt.
Be encouraging but precise:
- Allow correct alternative phrasing, synonyms, or different valid grammatical structures.
- Deduct points for actual grammar errors, tense mismatch, or missing key information.
- Calculate an accuracy score from 0.0 to 1.0. If the score is >= 0.8, set 'correct' to true, else false.
- Provide a brief Vietnamese feedback explaining why it's graded so and how to improve.

Items to check:
${itemsPrompt}

Respond ONLY with a JSON array of objects in this exact format (no markdown code blocks, just raw JSON array):
[
  {
    "id": "item_id_here",
    "correct": boolean,
    "score": number,
    "feedback": "Vietnamese explanation and improvements suggestion here"
  },
  ...
]
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = cleanAndParseJSON(text);

    return NextResponse.json({ results: json });
  } catch (err: any) {
    console.error("Error running Gemini translation batch check:", err);
    
    // Fallback comparison if Gemini fails
    const fallbackResults = (items || []).map((item: any) => {
      const cleanExpected = (item.expected || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
      const cleanInput = (item.input || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
      const correct = cleanExpected === cleanInput;
      return {
        id: item.id,
        correct,
        score: correct ? 1.0 : 0.0,
        feedback: correct ? "Chính xác!" : "Chưa chính xác. Vui lòng đối chiếu với đáp án."
      };
    });

    return NextResponse.json({ results: fallbackResults });
  }
}
