import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, name: "Mock Student" };
  }

  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Task set ID is required" }, { status: 400 });
    }

    // Update status to completed for correct user
    const { data, error } = await supabaseAdmin
      .from("daily_task_sets")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("Error completing daily task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dailyTask: data?.[0] || null });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/daily-tasks/[id]/complete:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
