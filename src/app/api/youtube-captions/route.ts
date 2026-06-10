import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkShadowingRateLimit } from "../shadowing/_utils";
import { YoutubeTranscript } from "youtube-transcript";
import { textToIpa, decodeHtmlEntities, looksLikeEnglish } from "./ipa";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

function extractVideoId(urlOrId: string): string | null {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // Try bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = await checkShadowingRateLimit(user);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", reason: rateLimit.reason }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const videoIdRaw = searchParams.get("videoId");
  
  if (!videoIdRaw) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const videoId = extractVideoId(videoIdRaw);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube ID or URL" }, { status: 400 });
  }

  try {
    let transcript: any[] | null = null;
    let isFromYtDlp = false;

    // 1. Try yt-dlp first (primary production path)
    try {
      const { stdout } = await execAsync(`yt-dlp --dump-json "https://www.youtube.com/watch?v=${videoId}"`);
      const info = JSON.parse(stdout);
      
      // Look for manual en captions first, then auto
      const subs = info.subtitles || {};
      const autoSubs = info.automatic_captions || {};
      
      let subUrl = "";
      if (subs["en"]) subUrl = subs["en"].find((s: any) => s.ext === "json3")?.url;
      if (!subUrl && subs["en-US"]) subUrl = subs["en-US"].find((s: any) => s.ext === "json3")?.url;
      if (!subUrl && subs["en-GB"]) subUrl = subs["en-GB"].find((s: any) => s.ext === "json3")?.url;
      
      if (!subUrl && autoSubs["en"]) subUrl = autoSubs["en"].find((s: any) => s.ext === "json3")?.url;
      
      if (subUrl) {
        const subRes = await fetch(subUrl);
        const subData = await subRes.json();
        
        // json3 format has events array
        transcript = subData.events
          .filter((e: any) => e.segs && e.segs.length > 0)
          .map((e: any) => {
            const text = e.segs.map((s: any) => s.utf8).join("");
            return {
              text,
              offset: e.tStartMs,
              duration: e.dDurationMs
            };
          });
        isFromYtDlp = true;
      }
    } catch (e: any) {
      if (e?.code === 127 || e?.message?.includes('not found')) {
        console.info('[shadowing] yt-dlp not installed, using youtube-transcript fallback');
      } else {
        console.warn('[shadowing] yt-dlp failed:', e?.message);
      }
    }

    // Fallback approach
    if (!transcript || transcript.length === 0) {
      console.info("[shadowing] yt-dlp failed or no English captions, falling back to YoutubeTranscript...");
      try {
        let ytTranscript = null;
        try { ytTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }); } catch(e) {}
        if (!ytTranscript) {
          try { ytTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en-US' }); } catch(e) {}
        }
        if (!ytTranscript) {
          try { ytTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en-GB' }); } catch(e) {}
        }
        if (!ytTranscript) {
          // Absolute fallback to default
          ytTranscript = await YoutubeTranscript.fetchTranscript(videoId);
        }

        if (ytTranscript) {
          transcript = ytTranscript.map((t: any) => ({
            text: t.text,
            offset: t.offset,
            duration: t.duration
          }));
        }
      } catch (e) {
        console.warn("[shadowing] YoutubeTranscript fallback failed:", e);
      }
    }
    
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "Transcript is disabled on this video" }, { status: 400 });
    }

    // 2. Process segments
    // Both yt-dlp (tStartMs/dDurationMs) and youtube-transcript npm always return milliseconds
    const inMs = true;
    
    const segments = transcript.map((t, idx) => {
      // Decode entities
      const text = decodeHtmlEntities(t.text);
      // Unit normalization
      const start_time = inMs ? t.offset / 1000 : t.offset;
      const duration = inMs ? t.duration / 1000 : t.duration;
      // IPA generation
      const ipa = textToIpa(text);

      return {
        id: idx,
        text,
        start_time,
        duration,
        ipa,
        vietnamese_text: null
      };
    });

    // 4. Length check - rejects > 20 mins
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && (lastSeg.start_time + lastSeg.duration > 1200)) {
      return NextResponse.json({ error: "Video quá dài. Vui lòng chọn video dưới 20 phút." }, { status: 400 });
    }

    // 5. English check
    console.info('[shadowing] first segment text:', JSON.stringify(segments[0]?.text));
    if (!looksLikeEnglish(segments)) {
      return NextResponse.json({ error: "Video không có phụ đề tiếng Anh hợp lệ." }, { status: 400 });
    }

    // 6. Fetch title via noembed
    let videoTitle = undefined;
    try {
      const oembedRes = await fetch(`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/watch?v=${videoId}`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) videoTitle = oembedData.title;
      }
    } catch (e) {}

    return NextResponse.json({
      videoId,
      segments,
      title: videoTitle
    });

  } catch (error: any) {
    console.error("Youtube Caption Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transcript" }, { status: 500 });
  }
}
