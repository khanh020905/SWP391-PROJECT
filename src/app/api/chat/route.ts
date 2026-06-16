import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Basic check if a message is a greeting
function checkIfGreeting(msg: string): boolean {
  const normalized = msg.toLowerCase().trim();
  // Dùng regex để bắt các biến thể typo như heelo, helloo, hiii...
  const greetingPattern = /^(h+e+l+o+|h+i+|hey|xin ch[àa]o|ch[àa]o|alo|greetings)[!.,\s]*/i;
  return greetingPattern.test(normalized);
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    const isGreeting = checkIfGreeting(trimmedMessage);

    let systemPrompt = "";

    if (isGreeting) {
      // For greetings, bypass RAG and respond friendly
      systemPrompt = `Bạn là trợ lý IELTS chuyên nghiệp của nền tảng học IELTS. 
Hãy chào lại người dùng một cách thân thiện và giới thiệu bạn là trợ lý IELTS AI, sẵn sàng giải đáp các thắc mắc về ngữ pháp, từ vựng hoặc phương pháp học IELTS.
Trả lời ngắn gọn, vui vẻ và gợi mở câu hỏi.

CÂU HỎI: ${trimmedMessage}`;
    } else {
      // 1. Embed query using Gemini gemini-embedding-2 (768 dimensions)
      let embedding: number[] | null = null;
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const embedRes = await embeddingModel.embedContent({
          content: { role: "user", parts: [{ text: trimmedMessage }] },
          outputDimensionality: 768,
        } as any);
        embedding = embedRes.embedding.values;
        console.log('=== VECTOR LENGTH:', embedding?.length);
        console.log('=== VECTOR SAMPLE (first 5 values):', embedding?.slice(0, 5));
      } catch (embedErr) {
        console.error("Failed to generate embedding for query:", embedErr);
      }

      // 2. Query Supabase vector similarity search with threshold 0.5 (was 0.7)
      let context = "";
      if (embedding) {
        const { data: matchedChunks, error: rpcErr } = await supabaseAdmin.rpc("match_ielts_chunks", {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5,
        });
        console.log('=== RPC ERROR:', rpcErr);
        console.log('=== CHUNKS FOUND:', matchedChunks?.length);
        console.log('=== CHUNKS DATA:', JSON.stringify(matchedChunks));

        if (rpcErr) {
          console.error("Error calling RPC match_ielts_chunks:", rpcErr);
        } else if (matchedChunks && matchedChunks.length > 0) {
          context = matchedChunks
            .map((c: any, index: number) => `[Context ${index + 1} - Source: ${c.source_type}]: ${c.content}`)
            .join("\n\n");
        }
      }

      // 3. Build system prompt for non-greeting IELTS questions with RAG context
      systemPrompt = `Bạn là trợ lý IELTS chuyên nghiệp của nền tảng học IELTS.
Chỉ trả lời dựa trên context được cung cấp bên dưới.
Nếu context trống hoặc không liên quan, hãy nói:
"Mình chưa có thông tin về chủ đề này trong hệ thống.
Bạn thử hỏi về ngữ pháp hoặc từ vựng IELTS nhé!"
Trả lời bằng tiếng Việt trừ khi user hỏi bằng tiếng Anh.
Luôn kèm ví dụ thực tế khi giải thích ngữ pháp hoặc từ vựng.
Trả lời ngắn gọn, có cấu trúc rõ ràng.

CONTEXT:
${context || "Không có context liên quan."}

CÂU HỎI: ${trimmedMessage}`;
    }

    // 4. Stream response from Gemini (using stable gemini-flash-latest)
    const chatModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await chatModel.generateContentStream(systemPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          console.error("Error during streaming response:", streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Chat API route error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
