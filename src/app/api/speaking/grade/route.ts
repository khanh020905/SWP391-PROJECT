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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const { answers, mode, topic } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers must be a valid array." }, { status: 400 });
    }

    const fullTranscriptText = answers.map((ans: any) => `[${ans.part} - ${ans.questionText}]: ${ans.transcript}`).join("\n\n");

    const prompt = `
      You are an expert IELTS Speaking Examiner. Grade the following student speaking response transcripts for an IELTS speaking test (Mode: ${mode || "mock"}, Topic: ${topic || "general"}).
      
      Here are the student answers transcripts:
      ${fullTranscriptText}

      Evaluate strictly using the IELTS Speaking Band Descriptors (from 0 to 9.0, in increments of 0.5):
      1. Fluency and Coherence (FC)
      2. Lexical Resource (LR)
      3. Grammatical Range and Accuracy (GRA)
      4. Pronunciation (P)

      Generate detailed, high-quality, constructive feedback comments in VIETNAMESE. Also provide specific grammatical or vocabulary corrections if necessary.

      Respond ONLY with a JSON object in this exact schema structure:
      {
        "overallBand": 6.5,
        "fc": 6.5,
        "fcComment": "Vietnamese feedback on Fluency and Coherence...",
        "lr": 6.0,
        "lrComment": "Vietnamese feedback on Lexical Resource...",
        "gra": 6.5,
        "graComment": "Vietnamese feedback on Grammatical Range...",
        "p": 7.0,
        "pComment": "Vietnamese feedback on Pronunciation...",
        "feedbackVi": "General summary and actionable tips in Vietnamese to improve speaking score...",
        "corrections": [
          { "original": "original text with issue", "corrected": "corrected version", "explanation": "explanation of correction in Vietnamese" }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = cleanAndParseJSON(text);

    return NextResponse.json({ success: true, grade: parsed });
  } catch (error: any) {
    console.error("❌ Speaking AI Grading Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
