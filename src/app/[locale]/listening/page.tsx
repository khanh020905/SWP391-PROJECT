"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Headphones,
  Disc,
  History,
  Star,
  Check,
  PenLine,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ListeningTestProvider, useListeningTest } from "@/context/ListeningTestContext";

import Navbar from "@/components/Navbar";

// Define visual configurations for the 4 card types
interface CardConfig {
  bgClass: string;
  logoColorClass: string;
  textColorClass: string;
  btnPracticeClass: string;
  btnExamClass: string;
  statsBgClass: string;
  pattern: React.ReactNode;
}

const cardConfigs: CardConfig[] = [
  // Test 1: Peach/Orange
  {
    bgClass: "bg-gradient-to-br from-[#ffd9bf] to-[#f9bca2]",
    logoColorClass: "text-[#934f26]/40",
    textColorClass: "text-[#803d15]",
    btnPracticeClass: "bg-white/90 text-[#b25b27] hover:bg-white",
    btnExamClass: "bg-white/90 text-[#b25b27] hover:bg-white",
    statsBgClass: "bg-white/10 text-white",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-10,50 C20,70 40,30 70,60 C90,80 110,40 120,50 L120,110 L-10,110 Z" fill="#e29b71" />
        <path d="M-10,65 C25,85 45,45 75,75 C95,95 105,55 120,65 L120,110 L-10,110 Z" fill="#c37d53" />
      </svg>
    )
  },
  // Test 2: Pink/Rose
  {
    bgClass: "bg-gradient-to-br from-[#fbc7e6] to-[#f7afd6]",
    logoColorClass: "text-[#9c4c78]/40",
    textColorClass: "text-[#8a3363]",
    btnPracticeClass: "bg-white/90 text-[#b0457f] hover:bg-white",
    btnExamClass: "bg-white/90 text-[#b0457f] hover:bg-white",
    statsBgClass: "bg-white/10 text-white",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="90" cy="10" r="35" fill="#e28cb9" />
        <circle cx="10" cy="90" r="45" fill="#e28cb9" />
        <circle cx="50" cy="50" r="20" fill="#d67ba9" />
      </svg>
    )
  },
  // Test 3: Red/Coral
  {
    bgClass: "bg-gradient-to-br from-[#f7c7c3] to-[#f2a59f]",
    logoColorClass: "text-[#a64e49]/40",
    textColorClass: "text-[#913732]",
    btnPracticeClass: "bg-white/90 text-[#b34f49] hover:bg-white",
    btnExamClass: "bg-white/90 text-[#b34f49] hover:bg-white",
    statsBgClass: "bg-white/10 text-white",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="10" x2="30" y2="10" stroke="#da807a" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
        <line x1="20" y1="30" x2="60" y2="30" stroke="#da807a" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
        <line x1="5" y1="50" x2="45" y2="50" stroke="#da807a" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
        <line x1="40" y1="70" x2="90" y2="70" stroke="#da807a" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
        <line x1="15" y1="85" x2="55" y2="85" stroke="#da807a" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
      </svg>
    )
  },
  // Test 4: Lavender/Purple
  {
    bgClass: "bg-gradient-to-br from-[#dcd6fa] to-[#c1b4f3]",
    logoColorClass: "text-[#6255a6]/40",
    textColorClass: "text-[#4d3f94]",
    btnPracticeClass: "bg-white/90 text-[#7362cf] hover:bg-white",
    btnExamClass: "bg-white/90 text-[#7362cf] hover:bg-white",
    statsBgClass: "bg-white/10 text-white",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-20,20 L120,-120 M-20,50 L120,-90 M-20,80 L120,-60 M-20,110 L120,-30 M-20,140 L120,0" stroke="#9a8ae1" strokeWidth="8" />
      </svg>
    )
  }
];

function ListeningTestListContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const {
    testList,
    loadTestList,
    isLoading
  } = useListeningTest();

  const [historyScores, setHistoryScores] = useState<Record<string, { score: number; date: string }>>({});
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Fetch test list
  useEffect(() => {
    loadTestList();
  }, []);

  // Fetch previous test results
  useEffect(() => {
    async function fetchHistory() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setSessionUser(session.user);

      const { data, error } = await supabase
        .from("user_submissions")
        .select(`
          id,
          exam_id,
          score,
          completed_at,
          answers,
          exams (
            title
          )
        `)
        .eq("user_id", session.user.id)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error loading history results:", error);
        return;
      }

      // Filter out only listening submissions (those having answers.sectionResults or exams.title containing 'Listening')
      const listeningSubs = (data || []).filter((row: any) => {
        const isListeningTitle = row.exams?.title?.toLowerCase().includes("listening");
        const hasSectionResults = !!row.answers?.sectionResults;
        return isListeningTitle || hasSectionResults;
      });

      setHistoryList(listeningSubs);

      const scoreMap: Record<string, { score: number; date: string }> = {};
      listeningSubs.forEach((row: any) => {
        if (!scoreMap[row.exam_id]) {
          scoreMap[row.exam_id] = {
            score: row.score,
            date: new Date(row.completed_at).toLocaleDateString("vi-VN")
          };
        }
      });
      setHistoryScores(scoreMap);
    }
    fetchHistory();
  }, [testList]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3B5C37] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách đề thi...</p>
        </div>
      </div>
    );
  }

  // Active database test (usually "IELTS Listening Practice Test" or similar)
  const activeDbTest = testList[0];

  // Cambridge volumes definition to display in the UI
  const volumes = [
    {
      title: "CAMBRIDGE IELTS 9",
      badgeText: "GIAO DIỆN GIỐNG THI THẬT 100%",
      tests: [
        { testNum: 1, statsListens: "44,123", statsPct: "80%", isActive: true },
        { testNum: 2, statsListens: "44,246", statsPct: "80%", isActive: false },
        { testNum: 3, statsListens: "44,369", statsPct: "80%", isActive: false },
        { testNum: 4, statsListens: "44,492", statsPct: "80%", isActive: false }
      ]
    },
    {
      title: "CAMBRIDGE IELTS 10",
      badgeText: "GIAO DIỆN GIỐNG THI THẬT 100%",
      tests: [
        { testNum: 1, statsListens: "38,512", statsPct: "78%", isActive: false },
        { testNum: 2, statsListens: "39,120", statsPct: "81%", isActive: false },
        { testNum: 3, statsListens: "37,945", statsPct: "79%", isActive: false },
        { testNum: 4, statsListens: "38,220", statsPct: "80%", isActive: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f1738] font-sans pb-20">
      <Navbar />

      <main className="mx-auto max-w-[1200px] px-6 pt-24">
        {/* Intro Banner */}
        <section className="mb-12 mt-4 text-center sm:text-left">
          <p className="text-xs font-black uppercase tracking-wider text-[#3B5C37] mb-2">
            IELTS Listening Practice Room
          </p>
          <p className="text-sm text-slate-500 max-w-xl">
            Làm bài thi nghe IELTS Cambridge đầy đủ — nghe audio một lần, tự điền câu trả lời và nhận kết quả chi tiết như thi thật.
          </p>
        </section>

        {/* Lịch sử làm bài gần đây */}
        {historyList.length > 0 && (
          <section className="mb-12 bg-white rounded-3xl border border-slate-150 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-[#3B5C37]" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Lịch sử luyện tập gần đây
              </h2>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {historyList.slice(0, 3).map((item) => {
                const dateStr = new Date(item.completed_at).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                });
                
                const rawScore = item.answers?.rawScore ?? item.answers?.correctCount ?? 0;
                const totalQuestions = item.answers?.totalQuestions ?? 40;
                const testName = item.exams?.title || "IELTS Listening Practice Test";

                return (
                  <div 
                    key={item.id} 
                    className="flex flex-col justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {dateStr}
                        </span>
                        <div className="bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-sm">
                          {parseFloat(item.score).toFixed(1)} Band
                        </div>
                      </div>
                      
                      <h4 className="text-xs font-black text-slate-700 tracking-tight line-clamp-2 mb-2">
                        {testName}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-t border-slate-200/50 pt-2.5 mt-2">
                      <span>Độ chính xác:</span>
                      <span className="text-[#3B5C37] font-black">
                        {rawScore} / {totalQuestions} câu ({Math.round((rawScore / totalQuestions) * 100)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cambridge Volumes */}
        <div className="space-y-12">
          {volumes.map((volume) => (
            <section key={volume.title} className="space-y-6">
              {/* Header Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {volume.title}
                </h2>
                {volume.badgeText && (
                  <span className="inline-block self-start sm:self-auto text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                    {volume.badgeText}
                  </span>
                )}
              </div>

              {/* Grid of 4 tests */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {volume.tests.map((test, index) => {
                  const config = cardConfigs[index % cardConfigs.length];
                  
                  // If it's active or we want all of them to route to the database test
                  const handleNavigate = () => {
                    if (activeDbTest) {
                      router.push(`/${locale}/listening/${activeDbTest.id}`);
                    } else {
                      alert("Không tìm thấy dữ liệu đề thi trên hệ thống.");
                    }
                  };

                  return (
                    <div
                      key={`${volume.title}-test-${test.testNum}`}
                      className={`relative overflow-hidden rounded-3xl ${config.bgClass} p-6 flex flex-col justify-between h-[280px] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                    >
                      {/* Background SVG Pattern */}
                      {config.pattern}

                      {/* Header Logo & Headphones */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.logoColorClass}`}>
                          the | ielts | dictionary
                        </span>
                        <Headphones className="w-5 h-5 text-white/80" />
                      </div>

                      {/* Large Test Title */}
                      <div className="relative z-10 my-auto flex flex-col gap-1.5">
                        <h3 className="text-4xl font-black text-white tracking-wide drop-shadow-sm uppercase">
                          TEST {test.testNum}
                        </h3>
                        {test.isActive && activeDbTest && historyScores[activeDbTest.id] && (
                          <div className="self-start bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">
                            Kết quả gần nhất: <span className="text-yellow-300 font-black">{historyScores[activeDbTest.id].score} Band</span> ({historyScores[activeDbTest.id].date})
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 space-y-4">
                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs font-bold text-white/90">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-white/80 stroke-none" />
                            {test.statsListens} lượt nghe
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            {test.statsPct}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleNavigate}
                            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-black transition-all border-none outline-none cursor-pointer ${config.btnPracticeClass}`}
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            Luyện tập
                          </button>
                          <button
                            type="button"
                            onClick={handleNavigate}
                            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-black transition-all border-none outline-none cursor-pointer ${config.btnExamClass}`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Thi thật
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ListeningPage() {
  return (
    <ListeningTestProvider>
      <ListeningTestListContent />
    </ListeningTestProvider>
  );
}

