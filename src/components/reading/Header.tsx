"use client";

import Link from "next/link";
import { BookOpen, ClipboardList, LogIn, Shield } from "lucide-react";
import Timer from "./Timer";
import { useReadingTest } from "@/context/ReadingTestContext";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-violet-100 text-violet-700 border-violet-200" },
  STUDENT: { label: "Học viên", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  GUEST: { label: "Khách", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function Header() {
  const {
    meta,
    passage,
    userRole,
    userName,
    progressPercent,
    answeredCount,
    totalQuestions,
    setReviewOpen,
    submitTest,
    isSubmitting,
  } = useReadingTest();

  const roleBadge = ROLE_BADGE[userRole] ?? ROLE_BADGE.GUEST;

  const handleSubmit = () => {
    if (
      confirm(
        `Nộp bài Reading?\n\nĐã trả lời: ${answeredCount}/${totalQuestions} câu.\nBạn sẽ không thể chỉnh sửa sau khi nộp.`
      )
    ) {
      submitTest();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/reading"
            className="flex shrink-0 items-center gap-2 text-blue-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
              IELTS
            </div>
            <span className="hidden font-bold tracking-tight text-gray-900 sm:inline">
              QualiCode
            </span>
          </Link>

          <div className="hidden h-6 w-px bg-gray-200 md:block" />

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-500">
              {meta.testTitle}
            </p>
            <p className="flex items-center gap-1.5 truncate text-sm font-bold text-gray-900">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              {passage.sectionLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadge.className}`}
            >
              {userRole === "ADMIN" && <Shield className="mr-0.5 inline h-3 w-3" />}
              {roleBadge.label}
            </span>
            {userName && (
              <span className="max-w-[100px] truncate text-xs text-gray-500">
                {userName}
              </span>
            )}
            {userRole === "GUEST" && (
              <Link
                href="/auth"
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
              >
                <LogIn className="h-3 w-3" />
                Đăng nhập
              </Link>
            )}
          </div>

          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Tiến độ
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
          </div>

          <Timer />

          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 sm:flex"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Review
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Đang nộp..." : "Submit"}
          </button>
        </div>
      </div>
    </header>
  );
}
