import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("avatar") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `${user.id}-${Date.now()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_url: urlData.publicUrl },
  });

  return NextResponse.json({ avatar_url: urlData.publicUrl });
}
