"use client";

import { X, CheckCircle2, Circle, Flag } from "lucide-react";
import { useReadingTest } from "@/context/ReadingTestContext";

export default function ReviewModal() {
  const {
    isReviewOpen,
    setReviewOpen,
    passage,
    answers,
    flagged,
    goToQuestion,
    answeredCount,
    totalQuestions,
  } = useReadingTest();

  if (!isReviewOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
      onClick={() => setReviewOpen(false)}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Review Answers</h2>
            <p className="text-xs text-gray-500">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReviewOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {passage.questions.map((q) => {
              const ans = answers[String(q.id)]?.trim();
              const isFlagged = flagged.has(q.id);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => {
                      goToQuestion(q.id);
                      setReviewOpen(false);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        ans ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {q.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium text-gray-800">
                        {q.prompt}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {ans ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {ans}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Circle className="h-3 w-3" />
                            Unanswered
                          </span>
                        )}
                        {isFlagged && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">
                            <Flag className="h-2.5 w-2.5" />
                            Flagged
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={() => setReviewOpen(false)}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Continue Test
          </button>
        </div>
      </div>
    </div>
  );
}
