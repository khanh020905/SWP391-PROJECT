import { NextResponse } from "next/server";

export const maxDuration = 60;

import { getGroqKeys } from "@/lib/groq";

// OpenAI-compatible call (works for both OpenRouter and Groq)
async function callOpenAICompat(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  extraHeaders?: Record<string, string>
) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the translation exercises as requested in JSON format." },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
}

function parseContent(res: any): any {
  const content = res.choices[0]?.message?.content;
  return JSON.parse(content);
}

export async function POST(request: Request) {
  try {
    const { topic, level, sentenceCount } = await request.json();

    const systemPrompt = `
      You are an expert English teacher for Vietnamese students preparing for the IELTS exam.
      Your task is to generate English-Vietnamese translation exercises.

      Given the following requirements:
      - Topic: ${topic}
      - Level/Focus: ${level}
      - Number of sentences: ${sentenceCount}

      Please generate exactly ${sentenceCount} Vietnamese sentences that are suitable for translating into English at the requested level and topic.
      The output must strictly be a JSON object with the following structure:
      {
        "sentences": [
          {
            "id": 1,
            "vi": "Vietnamese sentence here",
            "answer": "Suggested English translation here",
            "hint": "Optional hint or grammar point here (can be omitted)"
          }
        ]
      }

      Level-specific sentence rules — follow these strictly:

      If Level is "Tập trung vào collocation":
      - Each Vietnamese sentence is SHORT (1 clause, 8–14 words).
      - The English answer MUST contain at least 2 strong, natural collocations (e.g. "make a significant contribution", "raise public awareness", "take drastic measures").
      - Hint field: name the key collocation(s) to notice.

      If Level is "Band 6.5":
      - Each Vietnamese sentence is MEDIUM length (2 clauses, 18–28 words).
      - Uses clear connectors (although, while, which means that, as a result).
      - English answer is grammatically correct, natural, band 6.5 level — no overly complex vocabulary.
      - Hint field: name 1 grammar structure used (e.g. "relative clause", "concessive clause").

      If Level is "Band 8.0":
      - Each Vietnamese sentence is LONG and COMPLEX (3–4 clauses, 35–55 words). Make it genuinely difficult.
      - The sentence must combine: a concessive/conditional structure + a nominalization + at least one advanced collocation.
      - English answer uses sophisticated vocabulary (e.g. "exacerbate", "proliferation", "mitigate", "underpin", "inextricably linked"), passive voice where appropriate, and varied syntax.
      - The Vietnamese source sentence itself should feel challenging to parse — multi-layered reasoning, not just a simple statement with fancy words.
      - Hint field: point out the hardest structural or vocabulary challenge.

      General constraints:
      - Ensure the Vietnamese sentences sound natural to a native speaker.
      - Do NOT output any markdown blocks or text, only valid JSON.
    `;

    // ── 1. Try Gemini 2.5 Flash via OpenRouter ──────────────────────────────
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      const res = await callOpenAICompat(
        "https://openrouter.ai/api/v1/chat/completions",
        openrouterKey,
        "google/gemini-2.5-flash",
        systemPrompt,
        { "HTTP-Referer": "https://theieltsdictionary.com", "X-Title": "TID Translation Generator" }
      );
      if (res.ok) {
        const data = await res.json();
        try {
          return NextResponse.json(parseContent(data));
        } catch {
          console.warn("Gemini response parse failed, falling back to Groq");
        }
      } else {
        console.warn(`Gemini via OpenRouter failed (${res.status}), falling back to Groq`);
      }
    }

    // ── 2. Fallback: rotate through all Groq keys ───────────────────────────
    const groqKeys = getGroqKeys();
    let lastError: any = null;
    for (const key of groqKeys) {
      const res = await callOpenAICompat(
        "https://api.groq.com/openai/v1/chat/completions",
        key,
        "llama-3.3-70b-versatile",
        systemPrompt
      );
      if (res.ok) {
        const data = await res.json();
        try {
          return NextResponse.json(parseContent(data));
        } catch {
          return NextResponse.json({ error: "Failed to parse generation result" }, { status: 500 });
        }
      }
      lastError = await res.json().catch(() => ({ status: res.status }));
      console.warn(`Groq key failed (${res.status}), trying next...`);
      if (res.status === 400) break;
    }

    console.error("All providers exhausted:", lastError);
    return NextResponse.json(
      { error: "Không thể tạo bài lúc này, thử lại sau vài giây nhé!", details: lastError },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
