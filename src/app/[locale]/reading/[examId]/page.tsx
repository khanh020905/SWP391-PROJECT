"use client";

import Header from "@/components/reading/Header";
import PassagePanel from "@/components/reading/PassagePanel";
import QuestionPanel from "@/components/reading/QuestionPanel";
import BottomNavigation from "@/components/reading/BottomNavigation";
import ReviewModal from "@/components/reading/ReviewModal";
import ReadingTestSkeleton from "@/components/reading/ReadingTestSkeleton";
import { ReadingTestProvider, useReadingTest } from "@/context/ReadingTestContext";

function ReadingTestContent() {
  const {
    isLoading,
    mobileTab,
    setMobileTab,
    userRole,
    passages,
    activePassageIndex,
    setActivePassageIndex,
    passageProgress,
  } = useReadingTest();

  if (isLoading) {
    return <ReadingTestSkeleton />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-100">
      <Header />

      {userRole === "GUEST" && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Bạn đang làm bài với tư cách <strong>Khách</strong>.{" "}
          <a href="/auth" className="font-bold text-blue-600 underline">
            Đăng nhập
          </a>{" "}
          để đồng bộ tiến độ lên tài khoản học viên.
        </div>
      )}

      {/* Passage Tab Selector */}
      <div className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-0 overflow-x-auto">
          {passages.map((p, idx) => {
            const prog = passageProgress[idx];
            const isActive = idx === activePassageIndex;
            const pct = prog.total > 0 ? Math.round((prog.answered / prog.total) * 100) : 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePassageIndex(idx)}
                className={`relative flex shrink-0 flex-col items-start gap-0.5 border-b-2 px-4 py-2.5 text-left transition-all ${
                  isActive
                    ? "border-blue-600 bg-blue-50/60 text-blue-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {p.sectionLabel}
                </span>
                <span className="text-[11px] font-semibold leading-tight max-w-[160px] truncate text-current opacity-70">
                  {p.title}
                </span>
                {/* Mini progress bar */}
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct === 100 ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${pct === 100 ? "text-green-600" : "text-gray-400"}`}>
                  {prog.answered}/{prog.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile tab switcher (passage vs questions) */}
      <div className="flex shrink-0 border-b border-gray-200 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("passage")}
          className={`flex-1 py-2.5 text-xs font-bold transition ${
            mobileTab === "passage"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Passage
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-2.5 text-xs font-bold transition ${
            mobileTab === "questions"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Questions
        </button>
      </div>

      {/* Main split panels */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Passage — 60% desktop, full mobile tab */}
        <div
          className={`min-h-0 border-r border-gray-200 md:block md:w-[60%] lg:w-[58%] ${
            mobileTab === "passage" ? "flex w-full flex-1 flex-col" : "hidden"
          }`}
        >
          <PassagePanel />
        </div>

        {/* Questions — 40% desktop */}
        <div
          className={`min-h-0 md:w-[40%] lg:w-[42%] ${
            mobileTab === "questions" ? "flex w-full flex-1 flex-col" : "hidden md:flex"
          }`}
        >
          <QuestionPanel />
        </div>
      </div>

      <BottomNavigation />
      <ReviewModal />
    </div>
  );
}

export default function ReadingTestPage() {
  return (
    <ReadingTestProvider>
      <ReadingTestContent />
    </ReadingTestProvider>
  );
}
