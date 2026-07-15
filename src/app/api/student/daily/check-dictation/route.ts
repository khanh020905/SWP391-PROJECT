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
  try {
    const { input, expected } = await request.json();
    if (!input || !expected) {
      return NextResponse.json({ error: "Missing input or expected text" }, { status: 400 });
    }

    const prompt = `
You are an IELTS Listening Dictation checker.
Compare the student's typed text with the expected transcription.
Determine if they are basically the same sentence. Allow minor concessions:
- Ignore casing, extra spaces, and basic punctuation differences (periods, commas, hyphens, double quotes, question marks, exclamation marks).
- Allow minor spelling slips (e.g. 'Mam' instead of 'ma'am', 'experients' instead of 'experience') if the sentence structure and pronunciation are largely intact.
- Calculate an accuracy score from 0.0 to 1.0. If the score is >= 0.85, set 'correct' to true, else false.
- Provide a brief Vietnamese feedback pointing out any spelling corrections needed.

Expected: "${expected}"
Student Input: "${input}"

Respond ONLY with a JSON object in this format:
{
  "correct": boolean,
  "score": number,
  "feedback": string
}
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

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("Error running Gemini dictation check:", err);
    // Fallback comparison if Gemini fails
    const { input, expected } = await request.clone().json().catch(() => ({}));
    const cleanExpected = (expected || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const cleanInput = (input || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const correct = cleanExpected === cleanInput;

    return NextResponse.json({
      correct,
      score: correct ? 1.0 : 0.0,
      feedback: correct ? "Chính xác!" : "Chưa chính xác. Vui lòng đối chiếu với đáp án."
    });
  }
}
