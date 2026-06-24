import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { requireRole, ADMIN_OR_INSTRUCTOR } from "@/lib/roles";

// GET /api/admin/exams/[id] — Get exam detail with sections
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: exam, error } = await supabaseAdmin
      .from("exams")
      .select("*, exam_sections(*)")
      .eq("id", id)
      .order("section_no", { referencedTable: "exam_sections", ascending: true })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json({ error: "Không tìm thấy đề thi" }, { status: 404 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ exam });
  } catch (err) {
    console.error("GET /api/admin/exams/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/exams/[id] — Update exam + sections
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, audio_url, cambridge_no, test_no, status, category, duration_minutes, sections } = body;

    if (!title) {
      return Response.json({ error: "Tiêu đề đề thi là bắt buộc" }, { status: 400 });
    }

    // Fetch old title and category for speaking topics sync
    const { data: oldExam } = await supabaseAdmin
      .from("exams")
      .select("title, category")
      .eq("id", id)
      .single();

    // Update exam metadata
    const { data: exam, error: examError } = await supabaseAdmin
      .from("exams")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (examError) {
      return Response.json({ error: examError.message }, { status: 500 });
    }

    // Update sections: delete existing and re-insert
    if (sections && Array.isArray(sections)) {
      await supabaseAdmin.from("exam_sections").delete().eq("exam_id", id);

      if (sections.length > 0) {
        const sectionsToInsert = sections.map((s: any) => ({
          exam_id: id,
          section_no: s.section_no,
          title: s.title || `Section ${s.section_no}`,
          content: s.content || null,
          answers: s.answers || null,
        }));

        const { error: sectionsError } = await supabaseAdmin
          .from("exam_sections")
          .insert(sectionsToInsert);

        if (sectionsError) {
          return Response.json({ error: sectionsError.message }, { status: 500 });
        }
      }
    }

    // Sync speaking topics to speaking_topics table
    if (category === "speaking" || oldExam?.category === "speaking") {
      try {
        if (oldExam?.title) {
          await supabaseAdmin
            .from("speaking_topics")
            .delete()
            .eq("topic", oldExam.title);
        }

        if (category === "speaking" && sections && Array.isArray(sections)) {
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
        }
      } catch (err) {
        console.error("Error syncing speaking topics on update:", err);
      }
    }

    // Sync writing tasks to writing_tasks table
    if (category === "writing" || oldExam?.category === "writing") {
      try {
        await supabaseAdmin
          .from("writing_tasks")
          .delete()
          .ilike("youpass_id", `exam_task%_${id}`);

        if (category === "writing" && sections && Array.isArray(sections)) {
          const task1Section = sections.find((s: any) => s.section_no === 1);
          const task2Section = sections.find((s: any) => s.section_no === 2);

          const task1Answers = task1Section?.answers || {};
          const imageUrl = task1Answers.image_url || null;

          const tasksToInsert = [
            {
              youpass_id: `exam_task1_${id}`,
              task_type: "task1",
              title: title + " - Task 1",
              description: task1Section?.content || "",
              thumbnail_url: imageUrl,
              cloudinary_url: imageUrl,
              is_visible: (status || "draft") === "published",
              band_level: "6.5"
            },
            {
              youpass_id: `exam_task2_${id}`,
              task_type: "task2",
              title: title + " - Task 2",
              description: task2Section?.content || "",
              thumbnail_url: null,
              cloudinary_url: null,
              is_visible: (status || "draft") === "published",
              band_level: "6.5"
            }
          ];

          await supabaseAdmin.from("writing_tasks").insert(tasksToInsert);
        }
      } catch (err) {
        console.error("Error syncing writing tasks on update:", err);
      }
    }

    return Response.json({ exam });
  } catch (err) {
    console.error("PUT /api/admin/exams/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/exams/[id] — Delete exam (sections cascade, then remove audio)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First fetch to get audio_url, title, and category for storage & speaking topics cleanup
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("audio_url, title, category")
      .eq("id", id)
      .single();

    // Fetch section answers to get audio_url values before deletion
    const { data: sectionsData } = await supabaseAdmin
      .from("exam_sections")
      .select("answers")
      .eq("exam_id", id);

    // Delete exam (cascade deletes sections)
    const { error } = await supabaseAdmin.from("exams").delete().eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Cleanup speaking topics if category is speaking
    if (exam?.category === "speaking" && exam.title) {
      try {
        await supabaseAdmin
          .from("speaking_topics")
          .delete()
          .eq("topic", exam.title);
      } catch (err) {
        console.warn("Could not remove speaking topics for exam:", id, err);
      }
    }

    // Cleanup writing tasks if category is writing
    if (exam?.category === "writing") {
      try {
        await supabaseAdmin
          .from("writing_tasks")
          .delete()
          .ilike("youpass_id", `exam_task%_${id}`);
      } catch (err) {
        console.warn("Could not remove writing tasks for exam:", id, err);
      }
    }

    // Cleanup audio from Supabase Storage if exists
    if (exam?.audio_url) {
      try {
        const url = new URL(exam.audio_url);
        // Extract path after /storage/v1/object/public/exam-audio/
        const examAudioMatch = url.pathname.match(/\/exam-audio\/(.+)$/);
        if (examAudioMatch) {
          const relativePath = decodeURIComponent(examAudioMatch[1]);
          await supabaseAdmin.storage.from("exam-audio").remove([relativePath]);
        }
        
        // Extract path after /storage/v1/object/public/audio/
        const audioMatch = url.pathname.match(/\/audio\/(.+)$/);
        if (audioMatch) {
          const relativePath = decodeURIComponent(audioMatch[1]);
          await supabaseAdmin.storage.from("audio").remove([relativePath]);
        }
      } catch (err) {
        console.warn("Could not remove audio file from storage for exam:", id, err);
      }
    }

    // Cleanup section-level audios and images from Supabase Storage if they exist
    if (sectionsData && sectionsData.length > 0) {
      for (const s of sectionsData) {
        const answersObj = s.answers as any;
        if (answersObj && typeof answersObj === "object") {
          // Reclaim audio
          if (answersObj.audio_url) {
            try {
              const url = new URL(answersObj.audio_url);
              
              // Extract path after /storage/v1/object/public/exam-audio/
              const examAudioMatch = url.pathname.match(/\/exam-audio\/(.+)$/);
              if (examAudioMatch) {
                const relativePath = decodeURIComponent(examAudioMatch[1]);
                await supabaseAdmin.storage.from("exam-audio").remove([relativePath]);
              }
              
              // Extract path after /storage/v1/object/public/audio/
              const audioMatch = url.pathname.match(/\/audio\/(.+)$/);
              if (audioMatch) {
                const relativePath = decodeURIComponent(audioMatch[1]);
                await supabaseAdmin.storage.from("audio").remove([relativePath]);
              }
            } catch (err) {
              console.warn("Could not remove section audio from storage:", err);
            }
          }

          // Reclaim image
          if (answersObj.image_url) {
            try {
              const url = new URL(answersObj.image_url);
              
              // Extract path after /storage/v1/object/public/exam-images/
              const imageMatch = url.pathname.match(/\/exam-images\/(.+)$/);
              if (imageMatch) {
                const relativePath = decodeURIComponent(imageMatch[1]);
                await supabaseAdmin.storage.from("exam-images").remove([relativePath]);
              }
            } catch (err) {
              console.warn("Could not remove section image from storage:", err);
            }
          }
        }
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/exams/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
