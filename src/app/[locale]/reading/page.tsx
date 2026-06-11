"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  User,
  Shield,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchReadingPassages } from "@/services/readingService";
import { READING_TEST_META } from "@/lib/readingMockData"; // fallback/meta title
import type { UserRole } from "@/types/reading";

export default function ReadingLobbyPage() {
  const [userRole, setUserRole] = useState<UserRole>("UNKNOWN");
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [passages, setPassages] = useState<any[]>([]);

  useEffect(() => {
    fetchReadingPassages()
      .then((data) => {
        const valid = data ? data.filter((p: any) => p.questions && p.questions.length > 0) : [];
        setPassages(valid);
      })
      .catch((err) => console.error("Error loading passages:", err));

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        setUserRole(
          role === "ADMIN" || role === "STUDENT" || role === "GUEST" ? role : "GUEST"
        );
        setUserName(
          session.user.user_metadata?.name || session.user.email?.split("@")[0] || null
        );
      } else {
        setUserRole("GUEST");
      }
      setLoading(false);
    });
  }, []);

  const roleConfig = {
    ADMIN: {
      icon: Shield,
      label: "Quản trị viên",
      color: "text-violet-700 bg-violet-50 border-violet-200",
      cta: "Vào phòng thi Reading",
    },
    STUDENT: {
      icon: User,
      label: "Học viên",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      cta: "Bắt đầu làm bài",
    },
    GUEST: {
      icon: LogIn,
      label: "Khách",
      color: "text-gray-600 bg-gray-50 border-gray-200",
      cta: "Làm thử ngay",
    },
    UNKNOWN: {
      icon: BookOpen,
      label: "Đang tải...",
      color: "text-gray-400 bg-gray-50 border-gray-200",
      cta: "Bắt đầu",
    },
  };

  const cfg = roleConfig[userRole] ?? roleConfig.GUEST;
  const RoleIcon = cfg.icon;

  const passageColors = [
    {
      bg: "from-[#3B5C37] to-[#568140]",
      badge: "bg-[#2c4728] text-white",
      border: "border-[#3B5C37]/20",
      label: "Passage 1",
      diff: "Dễ",
      diffColor: "bg-emerald-100 text-emerald-700",
    },
    {
      bg: "from-[#1a3a5c] to-[#2563a8]",
      badge: "bg-[#1a3a5c] text-white",
      border: "border-blue-200",
      label: "Passage 2",
      diff: "Trung bình",
      diffColor: "bg-amber-100 text-amber-700",
    },
    {
      bg: "from-[#4a1f6b] to-[#7c3aed]",
      badge: "bg-[#4a1f6b] text-white",
      border: "border-violet-200",
      label: "Passage 3",
      diff: "Khó",
      diffColor: "bg-rose-100 text-rose-700",
    },
  ];

  const totalQuestions = passages.reduce((sum, p) => sum + (p.questions?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] font-sans">
      {/* Header */}
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold text-[#11193f]">
            <span className="text-[#3B5C37]">*</span> QualiCode
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#404965] md:flex">
            <Link href="/" className="hover:text-[#3B5C37] transition-colors">Trang chủ</Link>
            <Link href="/reading" className="text-[#3B5C37] font-bold">Luyện Reading</Link>
            <Link href="/speaking" className="hover:text-[#3B5C37] transition-colors">Luyện Speaking</Link>
          </nav>
          <div className="flex items-center gap-3">
            {!loading && userRole === "GUEST" && (
              <Link
                href="/auth"
                className="rounded-xl border border-[#e7e9f1] px-5 py-2 text-sm font-semibold hover:bg-slate-100 transition-colors text-[#0f1738]"
              >
                Đăng nhập
              </Link>
            )}
            {!loading && userRole !== "UNKNOWN" && userRole !== "GUEST" && (
              <span className="text-sm font-semibold text-[#3B5C37]">
                Xin chào, {userName || userRole}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-6 pb-16 pt-10">

        {/* Hero banner */}
        <section className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-[#1b3d1e] via-[#2d5727] to-[#3B5C37] text-white p-8 md:p-12 shadow-[0_16px_40px_rgba(27,61,30,0.2)] border border-white/5">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#568140]/20 blur-3xl" />

          <div className="relative z-10 max-w-[700px]">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-green-200 text-xs font-bold uppercase tracking-wider mb-5 border border-white/15">
              <BookOpen className="w-3.5 h-3.5" />
              IELTS Academic Reading
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-white">
              Phòng Thi Reading{" "}
              <span className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
                Thực Chiến
              </span>
            </h1>

            <p className="text-sm md:text-base text-green-100/80 leading-relaxed mb-8 max-w-[560px]">
              Mô phỏng bài thi IELTS Academic Reading chuẩn Cambridge — 3 passage, 40 câu hỏi, đồng hồ đếm ngược 60 phút và đánh giá chi tiết sau khi nộp bài.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Clock, label: "60 phút" },
                { icon: BookOpen, label: "3 Passages" },
                { icon: CheckCircle2, label: `${totalQuestions} câu hỏi` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs font-semibold text-green-100 bg-white/8 px-3 py-1.5 rounded-lg border border-white/10">
                  <item.icon className="w-3.5 h-3.5 text-green-300" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role info */}
        {!loading && (
          <div className={`mb-8 flex items-center gap-4 rounded-2xl border p-4 ${cfg.color}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60">Vai trò của bạn</p>
              <p className="text-sm font-extrabold">
                {cfg.label}{userName ? ` — ${userName}` : ""}
              </p>
            </div>
            {userRole === "ADMIN" && (
              <Link href="/admin/exams" className="ml-auto text-xs font-bold underline">
                Quản lý đề thi →
              </Link>
            )}
          </div>
        )}

        {/* Test info card */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_40px_rgba(20,28,60,0.08)] mb-8">
          <div className="border-b border-gray-100 bg-gradient-to-r from-[#1b3d1e] to-[#3B5C37] px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-green-200">
              {READING_TEST_META.cambridge}
            </p>
            <h2 className="mt-1 text-xl font-bold">{READING_TEST_META.testTitle}</h2>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {[
              { label: "Thời gian", value: "60 phút", icon: Clock },
              { label: "Passage", value: "3 đoạn văn", icon: BookOpen },
              { label: "Câu hỏi", value: `${totalQuestions} câu`, icon: CheckCircle2 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#f4f5f9] p-4"
              >
                <item.icon className="h-5 w-5 text-[#3B5C37] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Passages preview */}
        <h2 className="text-xl font-black text-[#1b3d1e] mb-4">Nội dung 3 Passages</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {passages.length === 0 ? (
            <div className="col-span-3 py-10 text-center font-bold text-gray-500 bg-white rounded-3xl border border-gray-200 shadow-sm">
              Chưa có đề thi
            </div>
          ) : (
            passages.map((passage, idx) => {
              const pc = passageColors[idx % passageColors.length];
              const qCount = passage.questions?.length || 0;
              const types = passage.question_types || (passage.questions ? [...new Set(passage.questions.map((q: any) => q.type))] : []);
              const typeLabels: Record<string, string> = {
                tfng: "T/F/NG",
                true_false: "T/F/NG",
                mcq: "Multiple Choice",
                multiple_choice: "Multiple Choice",
                matching: "Matching",
                fill: "Fill in Blank",
              };
              return (
                <div
                  key={passage.id}
                  className={`relative overflow-hidden rounded-3xl border-[3px] ${pc.border} border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group`}
                >
                  {/* Color top strip */}
                  <div className={`h-2 bg-gradient-to-r ${pc.bg}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${pc.badge}`}>
                        {pc.label}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.diffColor}`}>
                        {passage.band_level ? `Band ${passage.band_level}` : pc.diff}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-[#1b3d1e] text-base leading-tight mb-2">
                      {passage.title}
                    </h3>

                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3 line-clamp-2">
                      {passage.subtitle || (passage.content_html ? passage.content_html.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : "")}
                    </p>

                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600">
                        {qCount} câu hỏi
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {types.slice(0, 3).map((t: string) => (
                          <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            {typeLabels[t] || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Question types */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_32px_rgba(20,28,60,0.04)] p-6 mb-8">
          <h3 className="text-sm font-black text-[#1b3d1e] uppercase tracking-wider mb-4">Dạng câu hỏi trong bài</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "True / False / Not Given", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
              { label: "Yes / No / Not Given", color: "bg-teal-50 border-teal-200 text-teal-700" },
              { label: "Multiple Choice", color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "Matching Headings / Information", color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "Sentence Completion", color: "bg-rose-50 border-rose-200 text-rose-700" },
            ].map((t) => (
              <span key={t.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${t.color}`}>
                <CheckCircle2 className="w-3 h-3" />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/reading/test"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#2c4728] to-[#3B5C37] px-8 py-4 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(44,71,40,0.3)] hover:shadow-[0_16px_36px_rgba(44,71,40,0.4)] active:scale-95 transition-all select-none cursor-pointer"
          >
            {cfg.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-[#3B5C37] hover:border-[#3B5C37] hover:bg-[#f0f4ee] transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Quay lại trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
