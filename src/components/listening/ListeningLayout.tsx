"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useListeningTest } from "@/context/ListeningTestContext";
import SectionTabs from "./SectionTabs";
import AudioPanel from "./AudioPanel";
import QuestionPanel from "./QuestionPanel";
import ListeningResultModal from "./ListeningResultModal";

export default function ListeningLayout() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const {
    selectedTest,
    sections,
    answers,
    submitTest,
    isSubmitting,
    showResult,
    resetTest
  } = useListeningTest();

  // Calculate stats to decide submit button eligibility
  const totalQuestions = useMemo(() => {
    return sections.reduce((sum, s) => sum + s.questions.length, 0);
  }, [sections]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter(
      (key) => answers[key] !== undefined && answers[key].trim() !== ""
    ).length;
  }, [answers]);

  const isSubmitDisabled = false;

  const testName = selectedTest?.test_name || "IELTS Listening Practice";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans">
      {/* Header bar */}
      <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title and Back */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn rời đi? Tiến trình làm bài sẽ mất.")) {
                router.push(`/${locale}/listening`);
              }
            }}
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200/60 cursor-pointer select-none transition-colors border-none outline-none"
            aria-label="Back to listening test list"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[280px] md:max-w-md">
              {testName}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              Đã làm: {answeredCount} / {totalQuestions} câu hỏi
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="shrink-0">
          <SectionTabs />
        </div>

        {/* Submit action */}
        <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={submitTest}
            disabled={isSubmitting || isSubmitDisabled}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-xs font-black hover:opacity-95 shadow-md shadow-[#3B5C37]/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none border-none outline-none hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang nộp...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Nộp bài</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main split panels */}
      <main className="flex-1 flex min-h-0 overflow-hidden bg-slate-50">
        {/* Left Panel: MockAudioPlayer + TranscriptViewer */}
        <section className="hidden md:flex flex-col w-[38%] xl:w-[35%] h-full p-4 border-r border-slate-200 bg-white">
          <AudioPanel />
        </section>

        {/* Right Panel: Question Cards */}
        <section className="flex-1 h-full min-w-0 bg-slate-50">
          {/* Mobile warning message for audio panel */}
          <div className="md:hidden p-3 bg-amber-50 text-amber-800 text-[10px] font-semibold border-b border-amber-200/60 flex flex-col gap-1">
            <span>⚠️ Chế độ Audio & Transcript chỉ khả dụng trên màn hình máy tính (Desktop).</span>
          </div>
          <QuestionPanel />
        </section>
      </main>

      {/* Results modal */}
      {showResult && (
        <ListeningResultModal
          onClose={() => resetTest()}
          locale={locale}
        />
      )}
    </div>
  );
}
