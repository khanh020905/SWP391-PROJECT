"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  PenLine,
  Save,
  Send,
} from "lucide-react";
import {
  WRITING_STORAGE_KEY,
  WRITING_TASKS,
  WRITING_TEST_META,
} from "@/lib/writingMockData";
import { fetchWritingTasks } from "@/services/writingService";
import { supabase } from "@/lib/supabase";
import {
  buildWritingFeedback,
  countWords,
  saveWritingAttempt,
} from "@/lib/writingStorage";
import type {
  WritingPersistedState,
  WritingTask,
  WritingTaskType,
} from "@/types/writing";

const INITIAL_SECONDS = WRITING_TEST_META.durationMinutes * 60;

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function loadPersisted(storageKey: string): Partial<WritingPersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as WritingPersistedState) : null;
  } catch {
    return null;
  }
}

function TaskChart({ task }: { task: WritingTask }) {
  if (!task.dataPoints?.length) return null;

  const years = task.dataPoints[0]?.values.map((value) => value.name) ?? [];
  const palette = ["#3B5C37", "#2563eb", "#B38F4D", "#7c3aed"];

  return (
    <div className="mt-5 rounded-xl border border-[#e6eadf] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-[#0f1738]">{task.visualTitle}</h3>
          <p className="mt-1 text-xs font-medium text-[#6b7280]">
            {task.visualDescription}
          </p>
        </div>
        <span className="rounded-full bg-[#f0f4ed] px-2 py-1 text-[10px] font-black text-[#3B5C37]">
          %
        </span>
      </div>

      <div className="space-y-4">
        {task.dataPoints.map((series, index) => (
          <div key={series.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-black text-[#374151]">
                {series.label}
              </span>
              <span className="text-[10px] font-bold text-[#8a91a8]">
                {series.values[0]?.value}% → {series.values.at(-1)?.value}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {series.values.map((point) => (
                <div key={`${series.label}-${point.name}`} className="space-y-1">
                  <div className="flex h-20 items-end rounded bg-[#f3f5f0] px-1">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max(8, point.value)}%`,
                        backgroundColor: palette[index % palette.length],
                      }}
                    />
                  </div>
                  <p className="text-center text-[9px] font-bold text-[#6b7280]">
                    {point.value}
                    {point.suffix}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 border-t border-[#edf0f5] pt-2">
        {years.map((year) => (
          <span key={year} className="text-center text-[10px] font-black text-[#6b7280]">
            {year}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WritingTestPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string | undefined;

  const [answers, setAnswers] = useState<Record<WritingTaskType, string>>({
    task1: "",
    task2: "",
  });
  const [activeTaskId, setActiveTaskId] = useState<WritingTaskType>("task1");
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_SECONDS);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examMeta, setExamMeta] = useState<any>(WRITING_TEST_META);
  const timerStarted = useRef(false);

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0] ?? WRITING_TASKS[0];
  const wordCounts = useMemo(
    () => ({
      task1: countWords(answers.task1),
      task2: countWords(answers.task2),
    }),
    [answers]
  );
  const totalWords = wordCounts.task1 + wordCounts.task2;

  useEffect(() => {
    const loadWritingData = async () => {
      try {
        if (examId) {
          // 1. Fetch exam details from exams
          const { data: examData } = await supabase
            .from("exams")
            .select("*")
            .eq("id", examId)
            .single();

          if (examData) {
            setExamMeta({
              id: examData.id,
              testTitle: examData.title || WRITING_TEST_META.testTitle,
              durationMinutes: examData.duration_minutes || WRITING_TEST_META.durationMinutes
            });
            if (examData.duration_minutes) {
              setTimeRemaining(examData.duration_minutes * 60);
            }
          }

          // 2. Fetch exam sections
          const { data: sectionsData } = await supabase
            .from("exam_sections")
            .select("*")
            .eq("exam_id", examId)
            .order("section_no", { ascending: true });

          if (sectionsData && sectionsData.length > 0) {
            const mapped = sectionsData.map((sec: any) => {
              const taskId = sec.section_no === 1 ? "task1" : "task2";
              return {
                id: taskId,
                label: sec.section_no === 1 ? "Writing Task 1" : "Writing Task 2",
                title: sec.title || (sec.section_no === 1 ? "Report" : "Essay"),
                prompt: sec.content || "",
                recommendedMinutes: sec.section_no === 1 ? 20 : 40,
                minimumWords: sec.section_no === 1 ? 150 : 250,
                bullets: [],
                assessmentFocus: ["Task Achievement", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"],
                visualTitle: sec.title,
                visualDescription: "",
                dataPoints: [],
                imageUrl: null
              };
            });
            setTasks(mapped);
            setIsLoading(false);
            return;
          }
        }

        // Fallback 1: load writing tasks from writing_tasks table
        const dbTasks = await fetchWritingTasks();
        if (dbTasks && dbTasks.length > 0) {
          let selected: any[] = [];
          if (examId) {
            const singleTask = dbTasks.find((t: any) => t.id === examId);
            if (singleTask) {
              selected = [singleTask];
            }
          }
          if (selected.length === 0) {
            const task1 = dbTasks.find((t: any) => t.task_type === 'task1');
            const task2 = dbTasks.find((t: any) => t.task_type === 'task2');
            selected = [task1, task2].filter(Boolean);
          }

          const mapped = selected.map((t: any) => ({
            id: t.task_type === 'task1' ? 'task1' : 'task2',
            label: t.task_type === 'task1' ? 'Writing Task 1' : 'Writing Task 2',
            title: t.title,
            prompt: t.description || t.prompt || "",
            recommendedMinutes: t.task_type === 'task1' ? 20 : 40,
            minimumWords: t.task_type === 'task1' ? 150 : 250,
            bullets: t.bullets || [],
            assessmentFocus: t.assessment_focus || ["Range of vocabulary and grammar", "Cohesion and coherence", "Task response"],
            visualTitle: t.visual_title || t.title,
            visualDescription: t.visual_description || "",
            dataPoints: t.data_points || [],
            imageUrl: t.cloudinary_url || t.thumbnail_url || null
          }));
          setTasks(mapped);

          // Dynamic timer and active task
          if (mapped.length > 0) {
            setActiveTaskId(mapped[0].id);
            const durationMinutes = mapped.reduce((acc, curr) => acc + curr.recommendedMinutes, 0);
            setTimeRemaining(durationMinutes * 60);
          }
        } else {
          // Fallback 2: fallback to static WRITING_TASKS
          setTasks(WRITING_TASKS);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading writing exam data:", err);
        setTasks(WRITING_TASKS);
        setIsLoading(false);
      }
    };

    const storageKey = `ielts-writing-${examId || "default"}`;
    // Clear initial state to prevent previous test content bleeding
    setAnswers({
      task1: "",
      task2: "",
    });

    loadWritingData();

    const persisted = loadPersisted(storageKey);
    if (!persisted) return;
    queueMicrotask(() => {
      if (persisted.answers) {
        setAnswers({
          task1: persisted.answers.task1 ?? "",
          task2: persisted.answers.task2 ?? "",
        });
      }
      if (persisted.activeTaskId) setActiveTaskId(persisted.activeTaskId);
      if (typeof persisted.timeRemaining === "number") {
        setTimeRemaining(persisted.timeRemaining);
      }
      if (persisted.savedAt) setSavedAt(persisted.savedAt);
    });
  }, [examId]);

  useEffect(() => {
    if (isLoading) return;
    if (timerStarted.current) return;
    timerStarted.current = true;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const storageKey = `ielts-writing-${examId || "default"}`;
    const nextSavedAt = new Date().toISOString();
    const payload: WritingPersistedState = {
      answers,
      activeTaskId,
      timeRemaining,
      savedAt: nextSavedAt,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSavedAt(nextSavedAt);
  }, [answers, activeTaskId, timeRemaining, isLoading, examId]);

  const submitTest = useCallback(() => {
    if (isSubmitting) return;
    const storageKey = `ielts-writing-${examId || "default"}`;
    const missingTask = tasks.find(
      (task) => countWords(answers[task.id as WritingTaskType]) < Math.min(20, task.minimumWords)
    );
    const message = missingTask
      ? `${missingTask.label} còn rất ngắn. Bạn vẫn muốn nộp bài?`
      : `Nộp bài Writing?\n\n` + tasks.map(t => `${t.label}: ${wordCounts[t.id as WritingTaskType]} từ`).join("\n");

    if (!confirm(message)) return;

    setIsSubmitting(true);
    const attemptId = `writing_${Date.now()}`;
    const feedback = buildWritingFeedback(attemptId, answers);
    saveWritingAttempt({
      id: attemptId,
      testId: examMeta.id || WRITING_TEST_META.id,
      answers,
      wordCounts,
      timeRemaining,
      submittedAt: new Date().toISOString(),
      feedback,
    });
    localStorage.removeItem(storageKey);
    router.push(`/writing/result?id=${attemptId}`);
  }, [answers, isSubmitting, router, timeRemaining, wordCounts, tasks, examMeta, examId]);

  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitting) {
      submitTest();
    }
  }, [isSubmitting, submitTest, timeRemaining]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#eef2ea]">
        <div className="text-center font-bold text-[#3B5C37] animate-pulse">
          Đang tải đề thi Writing từ hệ thống...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#eef2ea] text-[#0f1738]">
      <header className="shrink-0 border-b border-[#dfe6d8] bg-white">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/writing"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3B5C37] text-white"
              aria-label="Back to Writing lobby"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-wider text-[#3B5C37]">
                {examMeta.testTitle}
              </p>
              <p className="truncate text-sm font-black text-[#0f1738]">
                {activeTask.label} - {activeTask.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-1.5 rounded-lg border border-[#e8ebf3] bg-[#fafbfe] px-3 py-2 text-xs font-bold text-[#5c6488] sm:flex">
              <Save className="h-3.5 w-3.5 text-[#3B5C37]" />
              {savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Autosave"}
            </div>
            <div
              className={`rounded-lg border px-3 py-2 text-sm font-black ${
                timeRemaining <= 300
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-[#dfe6d8] bg-[#f8faf6] text-[#3B5C37]"
              }`}
            >
              <Clock className="mr-1 inline h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
            <button
              type="button"
              onClick={submitTest}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3B5C37] px-3 py-2 text-xs font-black text-white transition hover:bg-[#2f4a2b] disabled:cursor-wait disabled:opacity-70 md:px-4"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </button>
          </div>
        </div>
      </header>

      <div className="flex shrink-0 gap-2 border-b border-[#dfe6d8] bg-white px-4 py-3 md:px-6">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          const count = wordCounts[task.id as keyof typeof wordCounts];
          const ready = count >= task.minimumWords;

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => setActiveTaskId(task.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                isActive
                  ? "border-[#3B5C37] bg-[#f0f4ed] text-[#1f3e1b]"
                  : "border-[#e8ebf3] bg-white text-[#5c6488] hover:border-[#c7d1b8]"
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-wider">
                {task.label}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold">
                {count}/{task.minimumWords} words
                {ready && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
              </span>
            </button>
          );
        })}
      </div>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <section className="min-h-0 overflow-y-auto border-b border-[#dfe6d8] bg-[#f8faf6] p-5 md:w-[46%] md:border-b-0 md:border-r md:p-6 lg:w-[43%]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                {activeTask.label}
              </p>
              <h1 className="mt-1 text-xl font-black text-[#0f1738]">
                {activeTask.title}
              </h1>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#3B5C37]">
              {activeTask.recommendedMinutes} min
            </span>
          </div>

          <p className="rounded-xl border border-[#e6eadf] bg-white p-4 text-sm font-semibold leading-7 text-[#374151]">
            {activeTask.prompt}
          </p>

          {activeTask.bullets && activeTask.bullets.length > 0 && (
            <ul className="mt-4 space-y-2 rounded-xl border border-[#e6eadf] bg-white p-4 text-sm text-[#374151]">
              {activeTask.bullets.map((bullet: string) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B5C37]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {activeTask.imageUrl && (
            <div className="mt-5 overflow-hidden rounded-xl border border-[#e6eadf] bg-white p-2">
              <img
                src={activeTask.imageUrl}
                alt={activeTask.title}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          )}

          <TaskChart task={activeTask} />

          <div className="mt-5 rounded-xl border border-[#e6eadf] bg-white p-4">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#5c6488]">
              <FileText className="h-4 w-4 text-[#3B5C37]" />
              Assessment focus
            </h2>
            <div className="mt-3 grid gap-2">
              {activeTask.assessmentFocus.map((item: string) => (
                <div
                  key={item}
                  className="rounded-lg bg-[#f7f9f5] px-3 py-2 text-xs font-semibold text-[#4b5563]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="shrink-0 border-b border-[#eef1f6] px-5 py-4 md:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                  Answer sheet
                </p>
                <h2 className="mt-1 text-base font-black text-[#0f1738]">
                  Write your response for {activeTask.label}
                </h2>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-black ${
                    wordCounts[activeTask.id as keyof typeof wordCounts] >= activeTask.minimumWords
                      ? "text-emerald-600"
                      : "text-[#3B5C37]"
                  }`}
                >
                  {wordCounts[activeTask.id as keyof typeof wordCounts]}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8a91a8]">
                  words
                </p>
              </div>
            </div>
          </div>

          <textarea
            value={answers[activeTaskId]}
            onChange={(event) =>
              setAnswers((prev) => ({
                ...prev,
                [activeTaskId]: event.target.value,
              }))
            }
            spellCheck={false}
            placeholder={
              activeTask.id === "task1"
                ? "Write your Task 1 report here. Include an overview and key comparisons..."
                : "Write your Task 2 essay here. Discuss both views and give your own opinion..."
            }
            className="min-h-0 flex-1 resize-none bg-white px-5 py-5 text-[15px] leading-8 text-[#111827] outline-none placeholder:text-[#a3aab8] md:px-6"
          />

          <div className="shrink-0 border-t border-[#eef1f6] bg-[#fafbfe] px-5 py-3 md:px-6">
            <div className="flex flex-col gap-2 text-xs font-semibold text-[#5c6488] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Total words: <strong>{totalWords}</strong>
              </span>
              <span>
                Task 1 minimum 150 • Task 2 minimum 250 • You can move between
                tasks at any time.
              </span>
              <span className="inline-flex items-center gap-1 text-[#3B5C37]">
                <PenLine className="h-3.5 w-3.5" />
                CBT mode
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
