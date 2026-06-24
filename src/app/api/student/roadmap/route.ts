import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getStudentRoadmap,
  saveStudentRoadmap,
  deleteStudentRoadmap,
  addNotification,
  logStudyActivity,
  StudentRoadmap,
  LearningPhase,
  PhaseTask
} from "@/lib/studentProgressDb";

// Authenticate user via bearer token or mock header
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

// Generate a detailed customized roadmap
function generateMockRoadmap(
  userId: string,
  currentBand: number,
  targetBand: number,
  dailyHours: number,
  targetDate: string,
  focusSkills: string[]
): StudentRoadmap {
  const phases: LearningPhase[] = [];
  const activeFocusSkills = focusSkills.length > 0 ? focusSkills : ["Listening", "Reading", "Writing", "Speaking"];

  // Custom phase descriptions and tasks based on student level
  if (currentBand < 5.5) {
    // Foundation level
    phases.push({
      id: "phase_1",
      title: "Giai đoạn 1: Củng cố Nền tảng Từ vựng & Ngữ pháp (Tuần 1 - 4)",
      description: "Tập trung xây dựng gốc tiếng Anh, luyện phát âm chuẩn IPA và tích lũy từ vựng cơ bản theo các chủ đề phổ biến.",
      skills: ["Vocabulary", "Grammar", ...activeFocusSkills.filter(s => s === "Speaking" || s === "Listening")],
      tasks: [
        { id: "task_1_1", title: "Luyện phát âm chuẩn 44 âm trong bảng phiên âm quốc tế IPA", completed: false, estimatedHours: 10 },
        { id: "task_1_2", title: "Học và ứng dụng 12 thì cơ bản & cấu trúc câu phức trong IELTS", completed: false, estimatedHours: 12 },
        { id: "task_1_3", title: "Tích lũy 300 từ vựng chủ đề quen thuộc (Family, Work, Hobbies, Hometown)", completed: false, estimatedHours: 8 },
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_1_4", title: "Luyện nói trôi chảy các câu trả lời ngắn cho IELTS Speaking Part 1", completed: false, estimatedHours: 10 }
        ] : []),
        ...(activeFocusSkills.includes("Listening") ? [
          { id: "task_1_5", title: "Luyện nghe chép chính tả các đoạn hội thoại ngắn chậm", completed: false, estimatedHours: 8 }
        ] : [])
      ]
    });

    phases.push({
      id: "phase_2",
      title: "Giai đoạn 2: Chiến thuật làm bài & Kỹ năng cốt lõi (Tuần 5 - 8)",
      description: "Tiếp cận các dạng câu hỏi IELTS, xây dựng cấu trúc bài nói/bài viết cơ bản và áp dụng phương pháp đọc/nghe hiểu.",
      skills: activeFocusSkills,
      tasks: [
        ...(activeFocusSkills.includes("Listening") ? [
          { id: "task_2_1", title: "Nắm vững kỹ năng làm dạng bài Form Completion & Multiple Choice trong Listening", completed: false, estimatedHours: 10 }
        ] : []),
        ...(activeFocusSkills.includes("Reading") ? [
          { id: "task_2_2", title: "Luyện tập kỹ thuật Skimming & Scanning, làm dạng bài True/False/Not Given", completed: false, estimatedHours: 12 }
        ] : []),
        ...(activeFocusSkills.includes("Writing") ? [
          { id: "task_2_3", title: "Học cách viết mở bài, tổng quan và phân tích biểu đồ cho Writing Task 1", completed: false, estimatedHours: 15 },
          { id: "task_2_4", title: "Xây dựng cấu trúc lập luận 4 đoạn chuẩn cho Writing Task 2", completed: false, estimatedHours: 15 }
        ] : []),
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_2_5", title: "Áp dụng công thức A.R.E.A để mở rộng câu trả lời Speaking Part 1 & Part 2", completed: false, estimatedHours: 12 }
        ] : [])
      ]
    });

    phases.push({
      id: "phase_3",
      title: "Giai đoạn 3: Thực chiến luyện đề & Tối ưu hóa band điểm (Tuần 9 - 12)",
      description: "Luyện đề thi thử dưới áp lực thời gian thực tế, khắc phục các điểm yếu và nâng cao phản xạ thi nói.",
      skills: activeFocusSkills,
      tasks: [
        { id: "task_3_1", title: "Hoàn thành và phân tích chi tiết 8 đề IELTS Cambridge (Cam 15-20)", completed: false, estimatedHours: 24 },
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_3_2", title: "Mô phỏng 5 phòng thi nói Speaking full 3 parts cùng AI và sửa lỗi", completed: false, estimatedHours: 10 }
        ] : []),
        ...(activeFocusSkills.includes("Writing") ? [
          { id: "task_3_3", title: "Viết hoàn chỉnh và tự sửa 6 bài viết Task 1 & Task 2 dưới 60 phút", completed: false, estimatedHours: 12 }
        ] : []),
        { id: "task_3_4", title: "Tổng hợp sổ tay lỗi sai ngữ pháp và từ vựng thường mắc khi làm đề", completed: false, estimatedHours: 6 }
      ]
    });
  } else {
    // Intermediate / Advanced level (>= 5.5) aiming for high band (7.0+)
    phases.push({
      id: "phase_1",
      title: "Giai đoạn 1: Nâng cấp cấu trúc & Phản xạ từ vựng nâng cao (Tuần 1 - 4)",
      description: "Nâng band điểm bằng cách học các cụm từ collocation chất lượng, đa dạng cấu trúc ngữ pháp và làm quen chủ đề khó.",
      skills: ["Vocabulary", "Grammar", ...activeFocusSkills],
      tasks: [
        { id: "task_1_1", title: "Học 150 cụm từ Collocations & Idioms nâng cao theo chủ đề học thuật", completed: false, estimatedHours: 10 },
        { id: "task_1_2", title: "Ứng dụng mệnh đề quan hệ rút gọn, câu đảo ngữ & câu điều kiện hỗn hợp", completed: false, estimatedHours: 10 },
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_1_3", title: "Luyện trả lời trôi chảy các chủ đề trừu tượng của Speaking Part 3 (Society, Technology)", completed: false, estimatedHours: 12 }
        ] : []),
        ...(activeFocusSkills.includes("Writing") ? [
          { id: "task_1_4", title: "Học cách viết câu chủ đề và phát triển ý tưởng đa chiều cho Writing Task 2", completed: false, estimatedHours: 12 }
        ] : []),
        ...(activeFocusSkills.includes("Reading") ? [
          { id: "task_1_5", title: "Master dạng bài Matching Headings và Matching Information có tính nhiễu cao", completed: false, estimatedHours: 8 }
        ] : [])
      ]
    });

    phases.push({
      id: "phase_2",
      title: "Giai đoạn 2: Luyện đề chuyên sâu & Kiểm soát thời gian (Tuần 5 - 8)",
      description: "Thực hành làm đề nâng cao, tập trung giải quyết các câu hỏi khó và kiểm soát thời gian làm bài chính xác.",
      skills: activeFocusSkills,
      tasks: [
        { id: "task_2_1", title: "Làm đề Listening Section 3 & 4 và Reading Passage 3 (Cam 17-20)", completed: false, estimatedHours: 15 },
        ...(activeFocusSkills.includes("Writing") ? [
          { id: "task_2_2", title: "Luyện viết Writing Task 1 trong 15 phút và Task 2 trong 35 phút", completed: false, estimatedHours: 14 }
        ] : []),
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_2_3", title: "Luyện tập mở rộng câu trả lời Part 2 trong vòng đúng 2 phút với các thẻ từ gợi ý", completed: false, estimatedHours: 10 }
        ] : []),
        { id: "task_2_4", title: "Phân tích kỹ lưỡng các lỗi bẫy thông tin (distractors) trong bài nghe/đọc", completed: false, estimatedHours: 8 }
      ]
    });

    phases.push({
      id: "phase_3",
      title: "Giai đoạn 3: Mô phỏng phòng thi thực tế & Tinh chỉnh (Tuần 9 - 12)",
      description: "Làm mock test đầy đủ dưới áp lực phòng thi, tinh chỉnh từ vựng học thuật và phát âm tự nhiên.",
      skills: activeFocusSkills,
      tasks: [
        { id: "task_3_1", title: "Thực hiện 6 bài thi thử full 4 kỹ năng tính giờ như thi thật", completed: false, estimatedHours: 20 },
        ...(activeFocusSkills.includes("Speaking") ? [
          { id: "task_3_2", title: "Tập trung cải thiện ngữ điệu nói (intonation) và liên kết từ (connected speech)", completed: false, estimatedHours: 8 }
        ] : []),
        ...(activeFocusSkills.includes("Writing") ? [
          { id: "task_3_3", title: "Viết 8 bài luận nâng cao và áp dụng các liên từ Cohesion chất lượng cao", completed: false, estimatedHours: 12 }
        ] : []),
        { id: "task_3_4", title: "Đánh giá toàn diện và tinh chỉnh những phần thường mất điểm cùng AI", completed: false, estimatedHours: 6 }
      ]
    });
  }

  return {
    userId,
    currentBand,
    targetBand,
    targetDate,
    dailyHours,
    focusSkills: activeFocusSkills,
    status: "PROPOSED",
    phases,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pathData, error: pathError } = await supabaseAdmin
      .from("learning_paths")
      .select("*, study_plans(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pathError) {
      console.error("❌ Error fetching learning path:", pathError);
      return NextResponse.json({ error: pathError.message }, { status: 500 });
    }

    if (!pathData) {
      return NextResponse.json({ success: true, roadmap: null });
    }

    const roadmap = pathData.ai_suggestion;
    if (roadmap) {
      roadmap.status = pathData.accepted ? "ACTIVE" : "PROPOSED";
    }

    return NextResponse.json({ success: true, roadmap });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/roadmap:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (action === "GENERATE") {
      const {
        currentBand = 5.0,
        targetBand = 6.5,
        dailyHours = 2.0,
        targetDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        focusSkills = ["Listening", "Reading", "Writing", "Speaking"],
        diagnosticId = null
      } = body;

      const roadmap = generateMockRoadmap(
        user.id,
        Number(currentBand),
        Number(targetBand),
        Number(dailyHours),
        targetDate,
        focusSkills
      );

      // Save to learning_paths
      const { data: pathData, error: pathError } = await supabaseAdmin
        .from("learning_paths")
        .insert({
          user_id: user.id,
          diagnostic_id: diagnosticId || null,
          ai_suggestion: roadmap,
          accepted: false
        })
        .select("id")
        .single();

      if (pathError) {
        console.error("Error saving learning path:", pathError);
        return NextResponse.json({ error: "Không thể lưu lộ trình" }, { status: 500 });
      }

      // Create study_plans for first 7 days
      const today = new Date();
      const studyPlanRows = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return {
          user_id: user.id,
          path_id: pathData.id,
          date: date.toISOString().split("T")[0],
          tasks: roadmap.phases?.[0]?.tasks || [],
          completed_count: 0
        };
      });

      const { error: spError } = await supabaseAdmin.from("study_plans").insert(studyPlanRows);
      if (spError) {
        console.error("Error saving study plans:", spError);
      }

      return NextResponse.json({
        success: true,
        pathId: pathData.id,
        roadmap
      });
    }

    if (action === "ACTIVATE") {
      const { data: pathData, error: fetchError } = await supabaseAdmin
        .from("learning_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !pathData) {
        return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("learning_paths")
        .update({ accepted: true })
        .eq("id", pathData.id);

      if (updateError) {
        console.error("Error activating learning path:", updateError);
        return NextResponse.json({ error: "Không thể kích hoạt lộ trình" }, { status: 500 });
      }

      // Generate daily task sets server-to-server
      try {
        const origin = request.nextUrl.origin;
        const generateUrl = `${origin}/api/student/learning-path/${pathData.id}/generate-daily-tasks`;
        await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        });
      } catch (err) {
        console.error("Error triggering generate-daily-tasks:", err);
      }

      const roadmap = pathData.ai_suggestion;
      roadmap.status = "ACTIVE";

      // Create notification
      await addNotification(
        user.id,
        "Lộ trình học mới đã bắt đầu! 🚀",
        `Chúc mừng bạn! Lộ trình học cá nhân hóa nâng Band từ ${roadmap.currentBand} lên ${roadmap.targetBand} đã sẵn sàng. Hãy bắt đầu chinh phục ngay hôm nay!`,
        "SYSTEM"
      );

      return NextResponse.json({ success: true, roadmap });
    }

    if (action === "TOGGLE_TASK") {
      const { phaseId, taskId, completed } = body;
      if (!phaseId || !taskId) {
        return NextResponse.json({ error: "phaseId and taskId are required" }, { status: 400 });
      }

      const { data: pathData, error: pathErr } = await supabaseAdmin
        .from("learning_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pathErr || !pathData) {
        return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
      }

      const roadmap = pathData.ai_suggestion;
      const phase = roadmap.phases?.find((p: any) => p.id === phaseId);
      if (!phase) {
        return NextResponse.json({ error: "Phase not found" }, { status: 404 });
      }

      const task = phase.tasks?.find((t: any) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const wasCompleted = task.completed;
      task.completed = !!completed;
      roadmap.updatedAt = new Date().toISOString();

      const { error: updatePathErr } = await supabaseAdmin
        .from("learning_paths")
        .update({ ai_suggestion: roadmap })
        .eq("id", pathData.id);

      if (updatePathErr) {
        console.error("Error updating learning path task:", updatePathErr);
        return NextResponse.json({ error: "Không thể cập nhật tiến độ" }, { status: 500 });
      }

      // Find and update study plan for today's date if it exists
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: plan } = await supabaseAdmin
        .from("study_plans")
        .select("*")
        .eq("path_id", pathData.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (plan && plan.tasks) {
        const updatedTasks = plan.tasks.map((t: any) => {
          if (t.id === taskId) {
            return { ...t, completed: !!completed };
          }
          return t;
        });

        await supabaseAdmin
          .from("study_plans")
          .update({
            tasks: updatedTasks,
            completed_count: updatedTasks.filter((t: any) => t.completed).length
          })
          .eq("id", plan.id);
      }

      // If task is newly completed, log study activity to boost streak
      if (task.completed && !wasCompleted) {
        await logStudyActivity(
          user.id,
          `Hoàn thành bài học: ${task.title} (${phase.title})`
        );
      }

      roadmap.status = pathData.accepted ? "ACTIVE" : "PROPOSED";
      return NextResponse.json({ success: true, roadmap });
    }

    if (action === "COMPLETE") {
      const { error } = await supabaseAdmin
        .from("learning_paths")
        .update({ status: "COMPLETED" })
        .eq("id", body.pathId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error completing roadmap:", error);
        return NextResponse.json({ error: "Không thể cập nhật trạng thái" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "DELETE") {
      const { error: deletePlansError } = await supabaseAdmin
        .from("study_plans")
        .delete()
        .eq("user_id", user.id);

      if (deletePlansError) {
        console.error("Error resetting study plans:", deletePlansError);
      }

      const { error: deleteError } = await supabaseAdmin
        .from("learning_paths")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error resetting roadmap:", deleteError);
        return NextResponse.json({ error: "Không thể xóa lộ trình" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Roadmap reset successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/roadmap:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
