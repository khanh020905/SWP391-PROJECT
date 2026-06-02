import {
  WRITING_ATTEMPTS_KEY,
  WRITING_TASKS,
} from "@/lib/writingMockData";
import type {
  WritingAttemptPayload,
  WritingFeedbackResult,
  WritingTask,
  WritingTaskFeedback,
  WritingTaskType,
} from "@/types/writing";

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getWritingAttempts(): WritingAttemptPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WRITING_ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as WritingAttemptPayload[]) : [];
  } catch {
    return [];
  }
}

export function getWritingAttempt(id: string): WritingAttemptPayload | null {
  return getWritingAttempts().find((attempt) => attempt.id === id) ?? null;
}

export function saveWritingAttempt(attempt: WritingAttemptPayload) {
  if (typeof window === "undefined") return;
  const attempts = getWritingAttempts();
  localStorage.setItem(
    WRITING_ATTEMPTS_KEY,
    JSON.stringify([attempt, ...attempts.filter((item) => item.id !== attempt.id)])
  );
}

export function updateWritingAttempt(
  id: string,
  patch: Partial<WritingAttemptPayload>
) {
  if (typeof window === "undefined") return;
  const next = getWritingAttempts().map((attempt) =>
    attempt.id === id ? { ...attempt, ...patch } : attempt
  );
  localStorage.setItem(WRITING_ATTEMPTS_KEY, JSON.stringify(next));
}

function bandForTask(task: WritingTask, answer: string): number {
  const wordCount = countWords(answer);
  const sentences = answer.split(/[.!?]+/).filter((item) => item.trim()).length;
  const paragraphs = answer.split(/\n\s*\n/).filter((item) => item.trim()).length;
  const lower = answer.toLowerCase();
  const linkingWords = [
    "however",
    "therefore",
    "moreover",
    "whereas",
    "overall",
    "in contrast",
    "on the other hand",
    "for example",
    "in conclusion",
  ].filter((item) => lower.includes(item)).length;

  let band = 5;
  if (wordCount >= task.minimumWords) band += 0.8;
  if (wordCount >= task.minimumWords + 60) band += 0.4;
  if (sentences >= 8) band += 0.5;
  if (paragraphs >= (task.id === "task1" ? 3 : 4)) band += 0.6;
  if (linkingWords >= 3) band += 0.5;
  if (task.id === "task1" && lower.includes("overall")) band += 0.4;
  if (task.id === "task2" && (lower.includes("i believe") || lower.includes("in my opinion"))) {
    band += 0.4;
  }

  if (wordCount < task.minimumWords * 0.75) band -= 0.8;
  if (wordCount < 40) band -= 1.2;

  return Math.max(3, Math.min(8, Math.round(band * 2) / 2));
}

function buildTaskFeedback(
  task: WritingTask,
  answer: string
): WritingTaskFeedback {
  const wordCount = countWords(answer);
  const estimatedBand = bandForTask(task, answer);
  const strengths: string[] = [];
  const improvements: string[] = [];
  const lower = answer.toLowerCase();

  if (wordCount >= task.minimumWords) {
    strengths.push(`Đạt yêu cầu tối thiểu ${task.minimumWords} từ.`);
  } else {
    improvements.push(
      `Bài còn thiếu từ: cần ít nhất ${task.minimumWords} từ, hiện có ${wordCount} từ.`
    );
  }

  if (task.id === "task1") {
    if (lower.includes("overall")) {
      strengths.push("Có overview, đúng yêu cầu quan trọng của Task 1.");
    } else {
      improvements.push("Task 1 nên có câu overview nêu xu hướng chính.");
    }
    if (/\d/.test(answer)) {
      strengths.push("Có sử dụng số liệu để hỗ trợ mô tả.");
    } else {
      improvements.push("Cần đưa số liệu cụ thể để so sánh chính xác hơn.");
    }
  }

  if (task.id === "task2") {
    if (lower.includes("on the other hand") || lower.includes("however")) {
      strengths.push("Có dấu hiệu thảo luận hai mặt của vấn đề.");
    } else {
      improvements.push("Nên thể hiện rõ cả hai quan điểm trước khi nêu ý kiến.");
    }
    if (lower.includes("in my opinion") || lower.includes("i believe")) {
      strengths.push("Có nêu quan điểm cá nhân.");
    } else {
      improvements.push("Cần nêu opinion rõ ràng và giữ nhất quán.");
    }
  }

  return {
    taskId: task.id,
    wordCount,
    estimatedBand,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}

export function buildWritingFeedback(
  attemptId: string,
  answers: Record<WritingTaskType, string>
): WritingFeedbackResult {
  const taskFeedback = WRITING_TASKS.map((task) =>
    buildTaskFeedback(task, answers[task.id] ?? "")
  );
  const task1 = taskFeedback.find((item) => item.taskId === "task1")?.estimatedBand ?? 0;
  const task2 = taskFeedback.find((item) => item.taskId === "task2")?.estimatedBand ?? 0;
  const estimatedBand = Math.round(((task1 + task2 * 2) / 3) * 2) / 2;

  return {
    attemptId,
    estimatedBand,
    taskFeedback,
    overallFeedbackVi:
      "Đây là feedback tự động dựa trên độ dài, cấu trúc, dấu hiệu overview/opinion và coherence cơ bản. Để chấm sát IELTS hơn, có thể gắn bước AI đánh giá theo 4 tiêu chí chính thức.",
    gradedAt: new Date().toISOString(),
  };
}
