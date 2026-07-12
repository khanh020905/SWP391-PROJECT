import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import DictationClient from "./DictationClient";
import type { DictationLesson } from "@/lib/listening/dictationParser";

// Dictation exercise page — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/app/practice/listening/[exerciseId]/page.tsx).
// Lesson data is read from the static JSON exported to public/data/dictation/.

export default async function DictationPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  // Lesson ids are numeric — reject anything else so the id can't escape the data dir
  if (!/^\d+$/.test(exerciseId)) notFound();

  const filePath = path.join(process.cwd(), "public", "data", "dictation", `${exerciseId}.json`);

  let data: DictationLesson;
  try {
    data = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f1f3f0] text-slate-900 font-sans w-full selection:bg-herb/20">
      <DictationClient data={data} />
    </div>
  );
}
