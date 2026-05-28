import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/profile — returns current user profile
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name,
    role: user.user_metadata?.role,
    avatar_url: user.user_metadata?.avatar_url,
    bio: user.user_metadata?.bio,
    phone: user.user_metadata?.phone,
    created_at: user.created_at,
  });
}

// PATCH /api/profile — update name, phone, bio
export async function PATCH(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { name, phone, bio } = await request.json();

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, name, phone, bio },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data.user });
}
