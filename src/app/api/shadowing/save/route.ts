import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkShadowingRateLimit } from "../_utils";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { videoId, segments, title, thumbnailUrl } = body;

    if (!videoId || !segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "Missing required fields or empty segments" }, { status: 400 });
    }

    if (segments.length > 1500) {
      return NextResponse.json({ error: "Too many segments (max 1500)" }, { status: 400 });
    }

    const lastSeg = segments[segments.length - 1];
    if (lastSeg && (lastSeg.start_time + lastSeg.duration > 1200)) {
      return NextResponse.json({ error: "Video quá dài. Vui lòng chọn video dưới 20 phút." }, { status: 400 });
    }

    // Rate Limit check
    const rateLimit = await checkShadowingRateLimit(user);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded", reason: rateLimit.reason }, { status: 429 });
    }

    // Check for duplicate
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("shadowing_videos")
      .select("id")
      .eq("youtube_id", videoId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id, youtubeId: videoId }, { status: 409 });
    }

    // Determine title / thumbnail via oEmbed
    let finalTitle = title || `Video tự chọn (${videoId})`;
    let finalThumbnail = thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    let finalDuration = "--:--";
    if (lastSeg) {
      const totalSeconds = Math.round(lastSeg.start_time + lastSeg.duration);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      finalDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) finalTitle = oembedData.title;
        if (oembedData.thumbnail_url) finalThumbnail = oembedData.thumbnail_url;
      }
    } catch (e) {
      console.warn("Failed to fetch oEmbed data", e);
    }

    // Step 1: Insert into shadowing_videos
    const { data: videoRecord, error: videoErr } = await supabaseAdmin
      .from("shadowing_videos")
      .insert({
        youtube_id: videoId,
        title: finalTitle,
        thumbnail_url: finalThumbnail,
        category: "Custom",
        level: "Custom",
        duration: finalDuration,
        segments: segments.length,
        user_id: user.id,
        is_custom: true,
        is_community: true,
        // created_at is handled by default
      })
      .select("id")
      .single();

    if (videoErr || !videoRecord) {
      console.error("Video insert error:", videoErr);
      return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
    }

    const newVideoId = videoRecord.id;

    // Step 2: Batch insert subtitles
    const BATCH_SIZE = 100;
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE).map((s: any) => ({
        video_id: newVideoId,
        text: s.text,
        ipa: s.ipa,
        start_time: s.start_time,
        duration: s.duration,
        vietnamese_text: s.vietnamese_text || null
      }));

      const { error: subErr } = await supabaseAdmin
        .from("shadowing_subtitles")
        .insert(batch);

      if (subErr) {
        console.error("Subtitle batch insert error:", subErr);
        // Rollback video
        await supabaseAdmin.from("shadowing_videos").delete().eq("id", newVideoId);
        return NextResponse.json({ error: "Failed to save subtitles" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id: newVideoId, youtubeId: videoId });
  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
