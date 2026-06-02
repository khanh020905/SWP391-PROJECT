import { NextRequest, NextResponse } from "next/server";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function extensionFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY chưa được cấu hình trên server." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as string) || "en";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Thiếu file âm thanh." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File âm thanh quá lớn (tối đa 25MB)." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "audio/webm";
    const ext = extensionFromMime(mimeType);
    const groqForm = new FormData();
    groqForm.append("file", file, `recording.${ext}`);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", language);
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");

    const groqResponse = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error("[Groq STT]", groqResponse.status, errBody);
      return NextResponse.json(
        { error: "Groq không thể nhận diện giọng nói. Vui lòng thử lại." },
        { status: groqResponse.status }
      );
    }

    const result = (await groqResponse.json()) as { text?: string };
    const text = (result.text || "").trim();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[Groq STT] Unexpected error:", error);
    return NextResponse.json(
      { error: "Lỗi server khi xử lý âm thanh." },
      { status: 500 }
    );
  }
}
