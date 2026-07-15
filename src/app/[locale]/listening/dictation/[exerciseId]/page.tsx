import { notFound } from "next/navigation";
import DictationClient from "./DictationClient";
import type { DictationLesson } from "@/lib/listening/dictationParser";
import { supabaseAdmin } from "@/lib/supabase";

export default async function DictationPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  // Lesson ids are numeric
  if (!/^\d+$/.test(exerciseId)) notFound();

  try {
    const { data: task, error } = await supabaseAdmin
      .from('listening_tasks')
      .select('*')
      .eq('lesson_id', parseInt(exerciseId))
      .maybeSingle();

    if (error || !task) {
      notFound();
    }

    const data: DictationLesson = {
      lessonId: String(task.lesson_id),
      lessonName: task.lesson_name,
      audioSrc: task.audio_src,
      challenges: task.challenges || []
    };

    return (
      <div className="min-h-screen bg-[#f1f3f0] text-slate-900 font-sans w-full selection:bg-herb/20">
        <DictationClient data={data} />
      </div>
    );
  } catch (err) {
    console.error("Error loading dictation details from Supabase:", err);
    notFound();
  }
}
