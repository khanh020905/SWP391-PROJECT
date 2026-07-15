import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  
  // Find first '[' and last ']'
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
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
- Expected: "${item.expected}"
- Student Input: "${item.input}"
    `).join("\n");

    const prompt = `
You are an IELTS Listening tutor checking dictation transcriptions.
Compare the student's typed text with the expected transcription.
BE EXTREMELY LENIENT ON MINOR SPELLING TYPOS, ARTICLES, AND SYMBOLS:
- Completely ignore casing, spacing, and all punctuation marks (commas, periods, double/single quotes, exclamation/question marks).
- Accept homophones or minor phonetic spelling mistakes (e.g., 'Mam' for 'ma'am', 'experients' for 'experience', 'Australian' for 'Australia's') as CORRECT.
- If the student's text sounds exactly or very similar to the expected audio transcription, set 'correct' to true.
- Accuracy score should range from 0.0 to 1.0. If the score is >= 0.70, mark 'correct' as true.
- Provide a brief Vietnamese feedback pointing out spelling corrections if any, while keeping the overall result marked as correct.

Items to check:
${itemsPrompt}

Respond ONLY with a JSON array of objects in this exact format:
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
