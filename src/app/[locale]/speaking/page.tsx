"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Mic,
  Play,
  Sparkles,
  TrendingUp,
  Dices,
  Target,
  Headphones,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type SpeakingMode = "mock" | "part1" | "part2" | "part3";

interface SpeakingAttempt {
  id?: string;
  band?: string | number;
  mode?: SpeakingMode;
  topic?: string;
  timestamp?: string;
}

interface SpeakingTopic {
  id: string;
  title: string;
  viTitle: string;
  desc: string;
  part2Prompt: string;
  part3Focus: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  icon: React.ElementType;
  tone: string;
}

const MODES: {
  id: SpeakingMode;
  title: string;
  desc: string;
  duration: string;
  icon: React.ElementType;
}[] = [
  {
    id: "mock",
    title: "Full Mock Test",
    desc: "Mô phỏng đủ Part 1, Part 2 và Part 3 với flow liền mạch như bài thi thật.",
    duration: "12-15 phút",
    icon: Sparkles,
  },
  {
    id: "part1",
    title: "Part 1 Interview",
    desc: "Luyện phản xạ trả lời các câu hỏi ngắn về bản thân, học tập và đời sống.",
    duration: "4-5 phút",
    icon: Mic,
  },
  {
    id: "part2",
    title: "Part 2 Cue Card",
    desc: "Nhận cue card, chuẩn bị 1 phút và trình bày liên tục trong 2 phút.",
    duration: "3-4 phút",
    icon: Clock,
  },
  {
    id: "part3",
    title: "Part 3 Discussion",
    desc: "Thảo luận sâu các câu hỏi học thuật liên quan tới chủ đề Part 2.",
    duration: "4-5 phút",
    icon: BookOpen,
  },
];

const TOPICS: SpeakingTopic[] = [
  {
    id: "study",
    title: "Study & Hometown",
    viTitle: "Học tập & Quê hương",
    desc: "Các câu hỏi quen thuộc về nơi sống, trường học, thói quen học tập và trải nghiệm cá nhân.",
    part2Prompt: "Describe a subject you enjoyed studying in high school.",
    part3Focus: "The future of education and changes in rural communities.",
    difficulty: "Dễ",
    icon: BookOpen,
    tone: "bg-[#edf3e8] text-[#3B5C37] border-[#d8e4ce]",
  },
  {
    id: "work",
    title: "Work & Career",
    viTitle: "Công việc & Sự nghiệp",
    desc: "Tập trung vào trách nhiệm công việc, định hướng nghề nghiệp và cân bằng cuộc sống.",
    part2Prompt: "Describe a challenging job that you would like to try in the future.",
    part3Focus: "Work-life balance and the impact of automation on employment.",
    difficulty: "Trung bình",
    icon: BriefcaseBusiness,
    tone: "bg-[#f4efe5] text-[#8a682e] border-[#e7dac1]",
  },
  {
    id: "technology",
    title: "Technology & Daily Life",
    viTitle: "Công nghệ & Cuộc sống",
    desc: "Thảo luận về thiết bị số, mạng xã hội, AI và tác động của công nghệ tới thói quen hằng ngày.",
    part2Prompt: "Describe a piece of technology that you find useful in your daily life.",
    part3Focus: "Social connection, screen time and how people evaluate online news.",
    difficulty: "Khó",
    icon: Sparkles,
    tone: "bg-[#eef2f0] text-[#43675d] border-[#d8e2de]",
  },
];

function parseAttempts(): SpeakingAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ielts-speaking-attempts");
    return raw ? (JSON.parse(raw) as SpeakingAttempt[]) : [];
  } catch {
    return [];
  }
}

function bandValue(attempt: SpeakingAttempt) {
  const value = Number.parseFloat(String(attempt.band ?? "0"));
  return Number.isFinite(value) ? value : 0;
}

export default function SpeakingDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [attempts, setAttempts] = useState<SpeakingAttempt[]>([]);
  const [selectedMode, setSelectedMode] = useState<SpeakingMode>("mock");
  const [selectedTopic, setSelectedTopic] = useState("study");
  const [view, setView] = useState<"select" | "dashboard">("select");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    queueMicrotask(() => {
      if (mounted) setAttempts(parseAttempts());
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const selectedTopicInfo =
    TOPICS.find((topic) => topic.id === selectedTopic) ?? TOPICS[0];
  const recentAttempts = attempts.slice(0, 5);
  const averageBand = useMemo(() => {
    if (!attempts.length) return 0;
    const total = attempts.reduce((sum, attempt) => sum + bandValue(attempt), 0);
    return total / attempts.length;
  }, [attempts]);

  if (view === "select") {
    return (
      <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20">
          <div className="text-center mb-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/85 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B5C37] mb-6">
              <Sparkles className="h-4 w-4" />
              Chọn chế độ luyện tập
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-[#1b3d1e] tracking-tight leading-[1.1]">
              Hôm nay bạn muốn học thế nào?
            </h1>
            <p className="mt-5 text-[#4e5c4c] font-medium max-w-lg mx-auto md:text-lg">
              Luyện tập theo sát đề thi thực tế để đo band điểm, hoặc thử thách phản xạ với chế độ bốc thăm chủ đề ngẫu nhiên.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1200px]">
            {/* Standard Mode Card */}
            <button 
              onClick={() => setView("dashboard")} 
              className="group relative flex flex-col rounded-[32px] bg-white p-8 text-left border-2 border-[#e4e8dc] hover:border-[#3B5C37] shadow-sm hover:shadow-[0_24px_54px_rgba(59,92,55,0.12)] transition-all duration-300 active:scale-[0.98] outline-none"
            >
              <div className="h-16 w-16 bg-[#edf3e8] text-[#3B5C37] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-[#1b3d1e] mb-3">Luyện thi tiêu chuẩn</h2>
              <p className="text-sm font-medium text-[#4e5c4c] leading-relaxed mb-8 flex-1">
                Chọn Part 1, 2, 3 hoặc full mock test theo kho chủ đề IELTS. Được chấm điểm và nhận feedback chi tiết bởi AI Examiner.
              </p>
              <div className="flex items-center gap-2 text-[#3B5C37] font-bold text-sm w-full">
                <span>Vào phòng thi</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Roulette Mode Card */}
            <Link 
              href="/speaking/roulette" 
              className="group relative flex flex-col rounded-[32px] bg-gradient-to-br from-[#16352a] to-[#204a3b] p-8 text-left border-2 border-[#2a503f] hover:border-[#437d63] shadow-sm hover:shadow-[0_24px_54px_rgba(22,53,42,0.25)] transition-all duration-300 active:scale-[0.98] outline-none no-underline overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative h-16 w-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                <Dices className="h-8 w-8" />
              </div>
              <h2 className="relative text-2xl font-black text-white mb-3 flex items-center gap-2">
                Speaking Roulette <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-bold">New</span>
              </h2>
              <p className="relative text-sm font-medium text-white/70 leading-relaxed mb-8 flex-1">
                Vòng quay ngẫu nhiên các chủ đề và thẻ bài thú vị. Tăng cường khả năng phản xạ và tư duy nhanh bằng một trải nghiệm học tập mới lạ!
              </p>
              <div className="relative flex items-center gap-2 text-white font-bold text-sm w-full">
                <span>Quay ngay</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Shadowing & Dictation Card */}
            <Link 
              href="/speaking/shadowing" 
              className="group relative flex flex-col rounded-[32px] bg-gradient-to-br from-[#0f1738] to-[#1a2552] p-8 text-left border-2 border-[#1a2552] hover:border-[#2a3a78] shadow-sm hover:shadow-[0_24px_54px_rgba(15,23,56,0.25)] transition-all duration-300 active:scale-[0.98] outline-none no-underline overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#4a65e0]/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#4a65e0]/10 to-transparent" />
              
              <div className="relative h-16 w-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                <Headphones className="h-8 w-8" />
              </div>
              <h2 className="relative text-2xl font-black text-white mb-3 flex items-center gap-2">
                Shadowing & Dictation <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-bold">Hot</span>
              </h2>
              <p className="relative text-sm font-medium text-white/70 leading-relaxed mb-8 flex-1">
                Luyện kỹ năng nghe chép chính tả và nói đuổi qua các video bài diễn thuyết. Nâng cao phát âm và phản xạ một cách tự nhiên.
              </p>
              <div className="relative flex items-center gap-2 text-white font-bold text-sm w-full">
                <span>Luyện tập ngay</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738]">
      <Navbar />

      <main>
        <section
          className="relative min-h-[620px] overflow-hidden bg-[#e5ebd8] bg-cover bg-center pt-28"
          style={{
            backgroundImage: "url('/assets/hero-background-new.jpeg')",
          }}
        >
          <div className="mx-auto grid w-full max-w-[1160px] gap-8 px-6 pb-10 md:grid-cols-[0.92fr_1.08fr] md:px-9">
            <div className="flex flex-col justify-center pb-3 md:min-h-[500px]">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/85 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                <Mic className="h-3.5 w-3.5" />
                IELTS Speaking AI
              </span>
              <h1 className="mt-5 max-w-[560px] text-4xl font-black leading-[1.08] tracking-tight text-[#1b3d1e] md:text-6xl">
                Luyện Speaking giống phòng thi thật
              </h1>
              <p className="mt-5 max-w-[520px] text-sm font-medium leading-7 text-[#4e5c4c] md:text-[17px]">
                Chọn phần thi, chọn chủ đề, vào phòng nói với AI examiner và xem
                lịch sử band ngay sau khi hoàn thành bài.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {[
                  "Part 1-3 flow",
                  "Cue card timer",
                  "AI feedback",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-black text-[#3B5C37]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="self-end rounded-2xl border border-white/70 bg-white/88 p-5 shadow-[0_16px_40px_rgba(28,48,24,0.12)] backdrop-blur md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                    Start setup
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#1b3d1e]">
                    Bài luyện hôm nay
                  </h2>
                </div>
                {user && (
                  <div className="rounded-full border border-[#d8e0cc] bg-[#f7f9f2] px-3 py-1 text-[10px] font-black text-[#4e5c4c]">
                    {user.user_metadata?.name || user.email?.split("@")[0]}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = selectedMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSelectedMode(mode.id)}
                      className={`min-h-[126px] rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-[#3B5C37] bg-[#edf3e8] shadow-sm"
                          : "border-[#e4e8dc] bg-white hover:border-[#c7d1b8]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-[#3B5C37] text-white"
                              : "bg-[#f0f3ea] text-[#3B5C37]"
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-[#0f1738]">
                            {mode.title}
                          </h3>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#5d6a5a]">
                            {mode.desc}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#8a682e]">
                        {mode.duration}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Link
                href={`/speaking/test?mode=${selectedMode}&topic=${selectedTopic}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B5C37] px-5 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[#1f3e1b] active:scale-[0.99]"
              >
                <Play className="h-4 w-4 fill-white" />
                Bắt đầu Speaking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1160px] gap-8 px-6 py-10 md:px-9 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#3B5C37]">
                  Topic bank
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#141c41]">
                  Chọn chủ đề Speaking
                </h2>
              </div>
              <span className="hidden text-xs font-bold text-[#667064] sm:block">
                {selectedTopicInfo.title}
              </span>
            </div>

            <div className="grid gap-4">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                const active = selectedTopic === topic.id;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full rounded-xl border bg-white p-5 text-left transition ${
                      active
                        ? "border-[#3B5C37] shadow-[0_10px_28px_rgba(59,92,55,0.10)]"
                        : "border-[#e8ebf3] hover:border-[#c7d1b8]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${topic.tone}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[#0f1738]">
                              {topic.title}
                            </h3>
                            <span className="rounded-full bg-[#f7f8f3] px-2 py-0.5 text-[10px] font-black text-[#667064]">
                              {topic.viTitle}
                            </span>
                            <span className="rounded-full bg-[#ebefe0] px-2 py-0.5 text-[10px] font-black text-[#3B5C37]">
                              {topic.difficulty}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium leading-6 text-[#5c6488]">
                            {topic.desc}
                          </p>
                          <div className="mt-3 grid gap-2 text-xs font-semibold text-[#667064] md:grid-cols-2">
                            <p>
                              <span className="font-black text-[#3B5C37]">Part 2:</span>{" "}
                              {topic.part2Prompt}
                            </p>
                            <p>
                              <span className="font-black text-[#8a682e]">Part 3:</span>{" "}
                              {topic.part3Focus}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? "border-[#3B5C37] bg-[#3B5C37] text-white"
                            : "border-[#dce1d5] text-transparent"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#e8ebf3] bg-white p-6">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#5c6488]">
                <TrendingUp className="h-4 w-4 text-[#3B5C37]" />
                Tiến trình của bạn
              </h2>
              {attempts.length ? (
                <div className="mt-5">
                  <p className="text-4xl font-black text-[#1b3d1e]">
                    {averageBand.toFixed(1)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#667064]">
                    Band trung bình từ {attempts.length} lần luyện
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-5 text-center">
                  <Mic className="mx-auto h-7 w-7 text-[#9aa39a]" />
                  <p className="mt-3 text-xs font-semibold leading-5 text-[#667064]">
                    Chưa có lịch sử Speaking. Làm bài đầu tiên để bắt đầu theo
                    dõi band.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e8ebf3] bg-white p-6">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#5c6488]">
                <History className="h-4 w-4 text-[#3B5C37]" />
                Lịch sử gần đây
              </h2>
              {recentAttempts.length ? (
                <div className="mt-4 space-y-3">
                  {recentAttempts.map((attempt, index) => (
                    <Link
                      key={attempt.id ?? index}
                      href={`/speaking/feedback?id=${attempt.id ?? ""}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#edf0f5] bg-[#fafbfe] p-3 transition hover:border-[#3B5C37]/40 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B5C37] text-xs font-black text-white">
                          {bandValue(attempt).toFixed(1)}
                        </span>
                        <div>
                          <p className="text-xs font-black text-[#0f1738]">
                            {attempt.mode === "mock"
                              ? "Mock Test"
                              : `Part ${String(attempt.mode ?? "part1").replace("part", "")}`}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#8a91a8]">
                            <Calendar className="h-3 w-3" />
                            {attempt.timestamp
                              ? new Date(attempt.timestamp).toLocaleDateString("vi-VN")
                              : "Chưa rõ ngày"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#9aa39a]" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-5 text-center text-xs font-semibold text-[#8a91a8]">
                  Lịch sử bài nói sẽ hiển thị tại đây.
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
