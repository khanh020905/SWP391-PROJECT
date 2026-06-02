import type { ReadingAttemptPayload } from "@/types/readingGrade";

export const READING_ATTEMPTS_KEY = "ielts-reading-attempts";

export function getReadingAttempts(): ReadingAttemptPayload[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(READING_ATTEMPTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getReadingAttempt(id: string): ReadingAttemptPayload | null {
  return getReadingAttempts().find((a) => a.id === id) ?? null;
}

export function saveReadingAttempt(attempt: ReadingAttemptPayload) {
  const list = getReadingAttempts().filter((a) => a.id !== attempt.id);
  list.unshift(attempt);
  localStorage.setItem(READING_ATTEMPTS_KEY, JSON.stringify(list.slice(0, 30)));
}

export function updateReadingAttempt(
  id: string,
  patch: Partial<ReadingAttemptPayload>
) {
  const list = getReadingAttempts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  localStorage.setItem(READING_ATTEMPTS_KEY, JSON.stringify(list));
}
