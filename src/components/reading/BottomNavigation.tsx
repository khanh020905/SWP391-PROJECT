"use client";

import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useReadingTest } from "@/context/ReadingTestContext";

export default function BottomNavigation() {
  const {
    passage,
    answers,
    flagged,
    currentQuestionId,
    goToQuestion,
    goPrevious,
    goNext,
    toggleFlag,
  } = useReadingTest();

  const questionIds = passage.questions.map((q) => q.id);
  const currentIdx = questionIds.indexOf(currentQuestionId);

  const getButtonClass = (id: number) => {
    const answered = Boolean(answers[String(id)]?.trim());
    const isCurrent = id === currentQuestionId;
    const isFlagged = flagged.has(id);

    if (isCurrent) {
      return "border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/20";
    }
    if (isFlagged) {
      return "border border-yellow-400 bg-yellow-100 text-yellow-800 font-semibold";
    }
    if (answered) {
      return "border border-green-400 bg-green-500 text-white font-semibold";
    }
    return "border border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300";
  };

  return (
    <nav className="sticky bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {questionIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => goToQuestion(id)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs transition ${getButtonClass(id)}`}
              aria-label={`Question ${id}`}
              aria-current={id === currentQuestionId ? "true" : undefined}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentIdx <= 0}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={() => toggleFlag(currentQuestionId)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
              flagged.has(currentQuestionId)
                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Mark for Review
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={currentIdx >= questionIds.length - 1}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
