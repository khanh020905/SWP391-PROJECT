"use client";

import { Clock } from "lucide-react";
import { useReadingTest } from "@/context/ReadingTestContext";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Timer() {
  const { timeRemaining, isTimerLow } = useReadingTest();

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors ${
        isTimerLow
          ? "border-red-300 bg-red-50 text-red-600 animate-pulse"
          : "border-blue-100 bg-blue-50 text-blue-700"
      }`}
      aria-live="polite"
    >
      <Clock className={`h-4 w-4 shrink-0 ${isTimerLow ? "text-red-500" : "text-blue-600"}`} />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
}
