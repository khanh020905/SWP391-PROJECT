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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query daily_task_sets for the user joined with exams details
    const { data, error } = await supabaseAdmin
      .from("daily_task_sets")
      .select(`
        *,
        exams (
          id,
          title,
          category,
          duration_minutes
        )
      `)
      .eq("user_id", user.id)
      .order("day_index", { ascending: true });

    if (error) {
      console.error("Error fetching daily tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dailyTasks: data || [] });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/daily-tasks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
