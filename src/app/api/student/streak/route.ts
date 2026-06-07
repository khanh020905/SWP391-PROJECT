import { NextRequest, NextResponse } from "next/server";
import { getStudentStreak, logStudyMinutes, updateStudentGoal } from "@/lib/studentProgressDb";
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

    const streak = await getStudentStreak(user.id);
    return NextResponse.json({ success: true, streak });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/streak:", error);
    return NextResponse.json(
      { success: false, message: "Không thể lấy thông tin streak.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "UPDATE_GOAL") {
      const { dailyGoalMinutes } = body;
      if (typeof dailyGoalMinutes !== "number" || dailyGoalMinutes <= 0) {
        return NextResponse.json({ error: "dailyGoalMinutes must be a positive number" }, { status: 400 });
      }

      const streak = await updateStudentGoal(user.id, dailyGoalMinutes);
      return NextResponse.json({ success: true, streak });
    }

    if (action === "LOG_MINUTES") {
      const { minutes, activity } = body;
      if (typeof minutes !== "number" || minutes <= 0) {
        return NextResponse.json({ error: "minutes must be a positive number" }, { status: 400 });
      }

      const streak = await logStudyMinutes(user.id, minutes, activity);
      return NextResponse.json({ success: true, streak });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/streak:", error);
    return NextResponse.json(
      { success: false, message: "Không thể xử lý yêu cầu streak.", error: error.message },
      { status: 500 }
    );
  }
}
