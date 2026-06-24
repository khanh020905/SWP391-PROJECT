import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_OR_INSTRUCTOR } from "@/lib/roles";

// GET /api/admin/exams — List all exams
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_OR_INSTRUCTOR);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("exams")
      .select("*, exam_sections(id, section_no, title)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ exams: data });
  } catch (err) {
    console.error("GET /api/admin/exams error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/exams — Create a new exam
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_OR_INSTRUCTOR);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { title, description, audio_url, cambridge_no, test_no, status, category, duration_minutes, sections } = body;

    if (!title) {
      return Response.json({ error: "Tiêu đề đề thi là bắt buộc" }, { status: 400 });
    }

    // Insert exam
    const { data: exam, error: examError } = await supabaseAdmin
      .from("exams")
      .insert({
        title,
        description: description || null,
        audio_url: audio_url || null,
        cambridge_no: cambridge_no ? parseInt(cambridge_no) : null,
        test_no: test_no ? parseInt(test_no) : null,
        status: status || "draft",
        category: category || "listening",
        category_id: test_no
          ? `${(category || "listening").charAt(0).toUpperCase()}${test_no}`
          : `${(category || "listening").charAt(0).toUpperCase()}1`,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : (category === "listening" ? 30 : category === "speaking" ? 15 : 60),
      })
      .select()
      .single();

    if (examError) {
      return Response.json({ error: examError.message }, { status: 500 });
    }

    // Insert sections if provided
    if (sections && Array.isArray(sections) && sections.length > 0) {
      const sectionsToInsert = sections.map((s: any) => ({
        exam_id: exam.id,
        section_no: s.section_no,
        title: s.title || `Section ${s.section_no}`,
        content: s.content || null,
        answers: s.answers || null,
      }));

      const { error: sectionsError } = await supabaseAdmin
        .from("exam_sections")
        .insert(sectionsToInsert);

      if (sectionsError) {
        // Rollback exam if sections fail
        await supabaseAdmin.from("exams").delete().eq("id", exam.id);
        return Response.json({ error: sectionsError.message }, { status: 500 });
      }

      // Sync speaking topics to speaking_topics table for user-facing lobby
      if (category === "speaking") {
        try {
          const part1Section = sections.find((s: any) => s.section_no === 1);
          const part2Section = sections.find((s: any) => s.section_no === 2);
          const part3Section = sections.find((s: any) => s.section_no === 3);

          const topicsToInsert = [
            {
              part: 1,
              topic: title,
              questions: part1Section?.answers || [],
              band_target: 5,
              is_active: (status || "draft") === "published",
            },
            {
              part: 2,
              topic: title,
              questions: part2Section?.answers || {},
              band_target: 5,
              is_active: (status || "draft") === "published",
            },
            {
              part: 3,
              topic: title,
              questions: part3Section?.answers || [],
              band_target: 5,
              is_active: (status || "draft") === "published",
            },
          ];

          await supabaseAdmin.from("speaking_topics").insert(topicsToInsert);
        } catch (err) {
          console.error("Error syncing speaking topics on create:", err);
        }
      }

      // Sync writing tasks to writing_tasks table for user-facing lobby
      if (category === "writing") {
        try {
          const task1Section = sections.find((s: any) => s.section_no === 1);
          const task2Section = sections.find((s: any) => s.section_no === 2);

          const task1Answers = task1Section?.answers || {};
          const imageUrl = task1Answers.image_url || null;

          const tasksToInsert = [
            {
              youpass_id: `exam_task1_${exam.id}`,
              task_type: "task1",
              title: title + " - Task 1",
              description: task1Section?.content || "",
              thumbnail_url: imageUrl,
              cloudinary_url: imageUrl,
              is_visible: (status || "draft") === "published",
              band_level: "6.5",
            },
            {
              youpass_id: `exam_task2_${exam.id}`,
              task_type: "task2",
              title: title + " - Task 2",
              description: task2Section?.content || "",
              thumbnail_url: null,
              cloudinary_url: null,
              is_visible: (status || "draft") === "published",
              band_level: "6.5",
            },
          ];

          await supabaseAdmin.from("writing_tasks").insert(tasksToInsert);
        } catch (err) {
          console.error("Error syncing writing tasks on create:", err);
        }
      }
    }

    return Response.json({ exam }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/exams error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
