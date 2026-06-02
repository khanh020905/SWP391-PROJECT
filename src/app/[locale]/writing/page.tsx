"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  History,
  PenLine,
} from "lucide-react";
import { WRITING_TASKS, WRITING_TEST_META } from "@/lib/writingMockData";
import { getWritingAttempts } from "@/lib/writingStorage";
import type { WritingAttemptPayload } from "@/types/writing";

export default function WritingLobbyPage() {
  const [attempts, setAttempts] = useState<WritingAttemptPayload[]>([]);

  useEffect(() => {
    setAttempts(getWritingAttempts().slice(0, 4));
  }, []);

  return (
    <div className="min-h-dvh bg-[#f4f5f9] text-[#0f1738]">
      <header className="border-b border-[#e5e8f0] bg-white">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-black text-[#1b3d1e]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B5C37] text-white">
              Q
            </span>
            Quali IELTS
          </Link>
          <div className="flex items-center gap-4 text-sm font-bold text-[#4e5c4c]">
            <Link href="/reading" className="hover:text-[#3B5C37]">
              Reading
            </Link>
            <Link href="/speaking" className="hover:text-[#3B5C37]">
              Speaking
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-6 py-8 md:py-10">
        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
          <div className="rounded-2xl border border-[#e2e7da] bg-[#e8ede6] p-7 md:p-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c9d6bf] bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#3B5C37]">
              <PenLine className="h-3.5 w-3.5" />
              IELTS {WRITING_TEST_META.module} Writing
            </span>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight text-[#16351a] md:text-5xl">
              Computer-Based Writing Test
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4e5c4c] md:text-base">
              Mô phỏng bài thi Writing online thực tế: Task 1 report, Task 2
              essay, đồng hồ 60 phút, đếm từ, autosave bài làm và nộp bài để xem
              rubric feedback sơ bộ.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Thời gian", value: "60 phút", icon: Clock },
                { label: "Tasks", value: "2 bài viết", icon: FileText },
                { label: "Minimum", value: "150 + 250 từ", icon: CheckCircle2 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/70 bg-white/75 p-4"
                >
                  <item.icon className="h-5 w-5 text-[#3B5C37]" />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#6b7567]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#16351a]">{item.value}</p>
                </div>
              ))}
            </div>

            <Link
              href="/writing/test"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B5C37] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#3B5C37]/20 transition hover:bg-[#2f4a2b] active:scale-[0.99] sm:w-auto"
            >
              Bắt đầu thi Writing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <aside className="rounded-2xl border border-[#e8ebf3] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#5c6488]">
              <BarChart3 className="h-4 w-4 text-[#3B5C37]" />
              Cấu trúc bài thi
            </h2>
            <div className="mt-5 space-y-4">
              {WRITING_TASKS.map((task) => (
                <div key={task.id} className="rounded-xl border border-[#edf0f5] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                        {task.label}
                      </p>
                      <h3 className="mt-1 text-sm font-black text-[#0f1738]">
                        {task.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#f0f4ed] px-2 py-1 text-[10px] font-black text-[#3B5C37]">
                      {task.recommendedMinutes}m
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#5c6488]">{task.prompt}</p>
                  <p className="mt-3 text-[11px] font-bold text-[#5c6488]">
                    Minimum: {task.minimumWords} words
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl border border-[#e8ebf3] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#5c6488]">
              <History className="h-4 w-4 text-[#3B5C37]" />
              Lịch sử Writing
            </h2>
            <span className="text-xs font-bold text-[#8a91a8]">
              {attempts.length ? `${attempts.length} bài gần nhất` : "Chưa có bài làm"}
            </span>
          </div>

          {attempts.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/writing/result?id=${attempt.id}`}
                  className="rounded-xl border border-[#edf0f5] bg-[#fafbfe] p-4 transition hover:border-[#3B5C37]/40 hover:bg-white"
                >
                  <p className="text-xs font-black text-[#0f1738]">
                    {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-2 text-[11px] font-bold text-[#5c6488]">
                    Task 1: {attempt.wordCounts.task1} words • Task 2:{" "}
                    {attempt.wordCounts.task2} words
                  </p>
                  {attempt.feedback && (
                    <p className="mt-2 text-sm font-black text-[#3B5C37]">
                      Band ước tính {attempt.feedback.estimatedBand}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-6 text-center text-xs font-semibold text-[#8a91a8]">
              Bài Writing đã nộp sẽ xuất hiện ở đây.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
