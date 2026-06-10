import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript, question } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const prompt = `You are a certified IELTS Speaking examiner.${question ? ` The candidate was answering: "${question}"` : ""}

The candidate said:
"${transcript}"

Evaluate this using official IELTS Speaking band descriptors. Be realistic and strict.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "evaluation": {
    "overall": 6.5,
    "fluency_coherence": { "band": 7.0, "feedback": "2-3 sentence examiner comment" },
    "lexical_resource": { "band": 6.0, "feedback": "2-3 sentence examiner comment" },
    "grammatical_range": { "band": 6.5, "feedback": "2-3 sentence examiner comment" },
    "pronunciation": { "band": 6.0, "feedback": "2-3 sentence examiner comment" },
    "summary": "One overall examiner comment sentence"
  }
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
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
      const parsed = JSON.parse(cleaned);
      evaluation = parsed.evaluation || null;
    } catch {
      // evaluation stays null, no crash
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
