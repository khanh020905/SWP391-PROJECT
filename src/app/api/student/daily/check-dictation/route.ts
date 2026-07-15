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
  
  // Try wrapping in array if it parsed as object but we want array
  const parsed = JSON.parse(cleaned);
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json(); // Array of { id, input, expected }
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
    }

    const itemsPrompt = items.map((item, idx) => `
Item ${idx + 1}:
- ID: "${item.id}"
- Expected: "${item.expected}"
- Student Input: "${item.input}"
    `).join("\n");

    const prompt = `
You are an IELTS Listening Dictation checker.
Compare the student's typed text with the expected transcription for each of the following items.
Determine if they are basically the same sentence. Allow minor concessions:
- Ignore casing, extra spaces, and basic punctuation differences (periods, commas, hyphens, double quotes, question marks, exclamation marks).
- Allow minor spelling slips (e.g. 'Mam' instead of 'ma'am', 'experients' instead of 'experience') if the sentence structure and pronunciation are largely intact.
- Calculate an accuracy score from 0.0 to 1.0. If the score is >= 0.85, set 'correct' to true, else false.
- Provide a brief Vietnamese feedback pointing out any spelling corrections needed.

Items to check:
${itemsPrompt}

Respond ONLY with a JSON array of objects in this exact format (no markdown code blocks, just raw JSON array):
[
  {
    "id": "item_id_here",
    "correct": boolean,
    "score": number,
    "feedback": "Vietnamese spelling feedback here"
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
    console.error("Error running Gemini batch dictation check:", err);
    
    // Fallback comparison for all items if Gemini fails
    const { items } = await request.clone().json().catch(() => ({}));
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
