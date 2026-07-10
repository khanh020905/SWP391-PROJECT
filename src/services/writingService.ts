import { supabase } from "@/lib/supabase";

export async function fetchWritingTasks() {
  const { data, error } = await supabase
    .from("writing_tasks")
    .select("id, youpass_id, title, task_type, thumbnail_url, cloudinary_url, band_level, tags, is_visible, description")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching writing tasks:", error);
    throw error;
  }
  return data;
}

export async function fetchWritingTaskById(id: string) {
  const { data, error } = await supabase
    .from("writing_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching writing task ${id}:`, error);
    throw error;
  }
  return data;
}

export async function saveWritingSubmission(payload: {
  userId: string;
  taskId: string;
  essayText: string;
  wordCount: number;
  aiBandScore: number;
  startTime: Date | string;
}) {
  const { data, error } = await supabase.from("user_submissions").insert({
    user_id: payload.userId,
    exam_id: payload.taskId,
    answers: { essay: payload.essayText, word_count: payload.wordCount },
    score: payload.aiBandScore,
    started_at: payload.startTime,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving writing submission:", error);
    throw error;
  }
  return data;
}
