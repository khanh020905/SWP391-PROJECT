import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_OR_INSTRUCTOR } from "@/lib/roles";

// POST /api/admin/exams/upload-audio — Upload audio file to Supabase Storage
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_OR_INSTRUCTOR);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Không tìm thấy file audio" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      return Response.json({ error: "File phải là định dạng audio (MP3, WAV, OGG, M4A, AAC)" }, { status: 400 });
    }

    // Max 200MB
    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File audio không được vượt quá 200MB" }, { status: 400 });
    }

    // Generate storage path under 'admin/<filename-no-ext>/<filename>_<timestamp>.<ext>' in 'audio' bucket
    const timestamp = Date.now();
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const ext = file.name.split(".").pop() || "mp3";
    const folderName = originalName.trim();
    const storagePath = `admin/${folderName}/${originalName}_${timestamp}.${ext}`;

    // Convert File to ArrayBuffer then Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("audio")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return Response.json({ error: `Lỗi upload: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("audio")
      .getPublicUrl(storagePath);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      fileName: storagePath,
    });
  } catch (err) {
    console.error("POST /api/admin/exams/upload-audio error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
