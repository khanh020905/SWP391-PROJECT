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
- Vietnamese Prompt: "${item.vi_prompt}"
- Expected English Translation: "${item.expected}"
- Student English Translation: "${item.input}"
    `).join("\n");

    const prompt = `
You are an IELTS Writing tutor grading translation exercises.
Compare the student's English translation with the expected translation based on the Vietnamese prompt.
BE EXTREMELY LENIENT AND FOCUS ON SEMANTIC MEANING:
- Accept different valid sentence structures, correct use of synonyms, active/passive voice swaps, and minor spelling slips.
- If the student's translation communicates the same meaning correctly, it MUST be graded as correct (correct: true).
- Only mark as false if the translation is completely wrong, missing major information, or contains severe grammar mistakes that break the meaning.
- Accuracy score should reflect semantic closeness (0.0 to 1.0). If semantic closeness is >= 0.70, set 'correct' to true.
- Provide a friendly, constructive feedback in Vietnamese, suggesting the model answer only as an alternative style rather than marking the student wrong.

Items to check:
${itemsPrompt}

Respond ONLY with a JSON array of objects in this exact format:
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
