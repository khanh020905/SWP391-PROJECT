"use client";

import QuestionCard from "./QuestionCard";
import { useReadingTest } from "@/context/ReadingTestContext";

export default function QuestionPanel() {
  const { passage } = useReadingTest();

  const shownInstructions = new Set<string>();

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-3 md:px-6">
        <h2 className="text-sm font-bold text-gray-900">Questions</h2>
        <p className="text-xs text-gray-500">
          Questions 1–{passage.questions.length} — select or type your answers
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        {passage.questions.map((q) => {
          const showInstruction = Boolean(
            q.instruction && !shownInstructions.has(q.instruction)
          );
          if (showInstruction && q.instruction) {
            shownInstructions.add(q.instruction);
          }
          return (
            <QuestionCard
              key={q.id}
              question={q}
              showInstruction={showInstruction}
            />
          );
        })}
      </div>
    </div>
  );
}
