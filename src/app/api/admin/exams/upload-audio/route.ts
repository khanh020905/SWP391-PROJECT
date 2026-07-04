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
    const examTitle = formData.get("examTitle") as string | null;
    const cambridgeNo = formData.get("cambridgeNo") as string | null;
    const testNo = formData.get("testNo") as string | null;

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

    // Generate storage path under 'admin/Cambridge X/Test Y/' if available, otherwise try to extract it, falling back to 'admin/<examTitle>'
    const timestamp = Date.now();
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const ext = file.name.split(".").pop() || "mp3";
    
    let cam = cambridgeNo?.trim();
    let test = testNo?.trim();

    // 1. Try to extract from examTitle if not provided
    if ((!cam || !test) && examTitle) {
      const camMatch = examTitle.match(/Cam(?:bridge)?(?:\s*IELTS)?\s*(\d+)/i);
      const testMatch = examTitle.match(/Test\s*(\d+)/i);

      if (!cam && camMatch) cam = camMatch[1];
      if (!test && testMatch) test = testMatch[1];
    }

    // 2. Try to extract from file.name if still not provided
    if ((!cam || !test) && file.name) {
      const camMatch = file.name.match(/Cam(?:bridge)?(?:\s*IELTS)?\s*(\d+)/i);
      const testMatch = file.name.match(/Test\s*(\d+)/i);

      if (!cam && camMatch) cam = camMatch[1];
      if (!test && testMatch) test = testMatch[1];
    }

    let folderPath = "";
    if (cam && test) {
      const cleanCam = cam.replace(/[\/\\:\*\?"<>\|]/g, "_");
      const cleanTest = test.replace(/[\/\\:\*\?"<>\|]/g, "_");
      folderPath = `admin/Cambridge ${cleanCam}/Test ${cleanTest}`;
    } else if (cam) {
      const cleanCam = cam.replace(/[\/\\:\*\?"<>\|]/g, "_");
      folderPath = `admin/Cambridge ${cleanCam}`;
    } else {
      const folderName = examTitle ? examTitle.trim().replace(/[\/\\:\*\?"<>\|]/g, "_") : originalName.trim();
      folderPath = `admin/${folderName}`;
    }
    const storagePath = `${folderPath}/${originalName}_${timestamp}.${ext}`;

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
