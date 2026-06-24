"use client";

import { Flag } from "lucide-react";
import type { ReadingQuestion, TfngOption } from "@/types/reading";
import { useReadingTest } from "@/context/ReadingTestContext";

const TFNG_OPTIONS: TfngOption[] = ["TRUE", "FALSE", "NOT GIVEN"];

interface QuestionCardProps {
  question: ReadingQuestion;
  showInstruction?: boolean;
}

export default function QuestionCard({ question, showInstruction }: QuestionCardProps) {
  const {
    answers,
    flagged,
    currentQuestionId,
    setAnswer,
    toggleFlag,
    registerQuestionRef,
  } = useReadingTest();

  const answerKey = String(question.id);
  const selected = answers[answerKey] ?? "";
  const isActive = currentQuestionId === question.id;
  const isFlagged = flagged.has(question.id);

  return (
    <div
      ref={(el) => registerQuestionRef(question.id, el)}
      id={`question-${question.id}`}
      className={`scroll-mt-24 rounded-xl border bg-white p-4 shadow-sm transition-all md:p-5 ${
        isActive
          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
          : "border-gray-200 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
              selected
                ? "bg-green-500 text-white"
                : isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {question.id}
          </span>
          <div>
            {showInstruction && question.instruction && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {question.instruction}
              </p>
            )}
            <p className="text-sm font-semibold leading-relaxed text-gray-900">
              {question.prompt}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleFlag(question.id)}
          className={`shrink-0 rounded-lg p-1.5 transition ${
            isFlagged
              ? "bg-yellow-100 text-yellow-600"
              : "text-gray-300 hover:bg-gray-100 hover:text-yellow-500"
          }`}
          aria-label={isFlagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
        >
          <Flag className={`h-4 w-4 ${isFlagged ? "fill-current" : ""}`} />
        </button>
      </div>

      {question.type === "mcq" && (
        <div className="ml-11 space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                selected === opt.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.key}
                checked={selected === opt.key}
                onChange={() => setAnswer(question.id, opt.key)}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-800">
                <strong className="text-blue-700">{opt.key}.</strong> {opt.text}
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === "tfng" && (
        <div className="ml-11 flex flex-wrap gap-2">
          {TFNG_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswer(question.id, opt)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                selected === opt
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "matching" && (
        <div className="ml-11">
          <select
            value={selected}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              selected ? "border-green-400" : "border-gray-200"
            }`}
          >
            <option value="">
              {question.instruction?.toLowerCase().includes("paragraph")
                ? "— Chọn đoạn văn —"
                : question.instruction?.toLowerCase().includes("heading")
                ? "— Chọn heading —"
                : "— Chọn đáp án —"}
            </option>
            {question.headings.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      )}

      {question.type === "fill" && (
        <div className="ml-11">
          {question.maxWords && (
            <p className="mb-1.5 text-[10px] font-semibold text-gray-400">
              NO MORE THAN {question.maxWords} WORDS
            </p>
          )}
          <input
            type="text"
            value={selected}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder={question.placeholder ?? "Type your answer"}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              selected.trim()
                ? "border-green-400 bg-green-50/30"
                : "border-gray-200 bg-gray-50"
            }`}
          />
        </div>
      )}
    </div>
  );
}
