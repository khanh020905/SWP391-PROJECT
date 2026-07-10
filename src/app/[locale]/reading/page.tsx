"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
import Navbar from "@/components/Navbar";

// Helper function to map Cambridge number to book cover
function getBookCover(cambridgeNo: number | null | undefined): string {
  if (!cambridgeNo) return "/assets/cambridge/cam-12.jpeg";
  if (cambridgeNo === 20) return "/assets/cambridge/cam-20.jpeg";
  if (cambridgeNo === 18) return "/assets/cambridge/cam-12.jpeg";
  if (cambridgeNo === 17) return "/assets/cambridge/cam-13.jpeg";
  if (cambridgeNo === 16) return "/assets/cambridge/cam-11.jpeg";
  if (cambridgeNo === 10) return "/assets/cambridge/cam-10.jpeg";
  if (cambridgeNo === 9) return "/assets/cambridge/cam-9.jpeg";
  return "/assets/cambridge/cam-12.jpeg";
}

// Helper to determine the badge topic/color based on passage title
function getPassageBadge(title: string, sectionNo: number) {
  const t = title.toLowerCase();
  if (t.includes("urban") || t.includes("farm") || t.includes("food") || t.includes("forest") || t.includes("environment") || t.includes("climate") || t.includes("nature") || t.includes("tree")) {
    return { label: "ENVIRONMENT", color: "bg-emerald-50 border-emerald-100 text-emerald-600" };
  }
  if (t.includes("psychology") || t.includes("mind") || t.includes("brain") || t.includes("decision") || t.includes("behavio") || t.includes("stress") || t.includes("cognit")) {
    return { label: "PSYCHOLOGY", color: "bg-purple-50 border-purple-100 text-purple-600" };
  }
  if (t.includes("ocean") || t.includes("sea") || t.includes("space") || t.includes("planet") || t.includes("earth") || t.includes("dinosaurs") || t.includes("mammal") || t.includes("animal") || t.includes("science")) {
    return { label: "NATURAL SCIENCE", color: "bg-orange-50 border-orange-100 text-orange-600" };
  }
  if (t.includes("history") || t.includes("archaeo") || t.includes("ancient") || t.includes("century") || t.includes("development") || t.includes("railway") || t.includes("london")) {
    return { label: "HISTORY", color: "bg-amber-50 border-amber-100 text-amber-600" };
  }
  if (t.includes("technology") || t.includes("robot") || t.includes("computer") || t.includes("ai") || t.includes("machine") || t.includes("engineer")) {
    return { label: "TECHNOLOGY", color: "bg-blue-50 border-blue-100 text-blue-600" };
  }
  
  if (sectionNo === 1) {
    return { label: "GENERAL SCIENCE", color: "bg-emerald-50 border-emerald-100 text-emerald-600" };
  }
  if (sectionNo === 2) {
    return { label: "SOCIOLOGY", color: "bg-purple-50 border-purple-100 text-purple-600" };
  }
  return { label: "ACADEMIC", color: "bg-orange-50 border-orange-100 text-orange-600" };
}

export default function ReadingLobbyPage() {
  const params = useParams();
  const locale = params?.locale || "vi";
  const [userRole, setUserRole] = useState<UserRole>("UNKNOWN");
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [passages, setPassages] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [view, setView] = useState<"select" | "dashboard">("select");
  const [comingSoonTest, setComingSoonTest] = useState<string>("");

  useEffect(() => {
    fetchReadingPassages()
      .then((data) => {
        const valid = data ? data.filter((p: any) => p.questions && p.questions.length > 0) : [];
        const filtered = valid.filter((p: any) => p.youpass_id && p.youpass_id.startsWith("bc-passage-"));
        filtered.sort((a: any, b: any) => a.youpass_id.localeCompare(b.youpass_id));
        setPassages(filtered);
      })
      .catch((err) => console.error("Error loading passages:", err));

    // Fetch published reading exams from supabase
    supabase
      .from("exams")
      .select(`
        id, title, cambridge_no, test_no, duration_minutes,
        exam_sections(id, section_no, title),
        questions(id)
      `)
      .eq("category", "reading")
      .eq("status", "published")
      .order("cambridge_no", { ascending: false })
      .order("test_no", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching exams:", error);
        } else {
          // Sort sections inside each exam by section_no ascending
          const sortedExams = (data || []).map((exam: any) => {
            if (exam.exam_sections) {
              exam.exam_sections.sort((a: any, b: any) => a.section_no - b.section_no);
            }
            return exam;
          });
          setExams(sortedExams);
        }
        setLoadingExams(false);
      });

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
    }).catch((err) => {
      console.warn("Failed to get session in reading lobby:", err);
      setUserRole("GUEST");
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

  if (view === "select") {
    return (
      <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] font-sans flex flex-col">
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20">
          <div className="text-center mb-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/85 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B5C37] mb-6">
              <BookOpen className="h-4 w-4" />
              IELTS Reading & Vocabulary
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-[#1b3d1e] tracking-tight leading-[1.1]">
              Hôm nay bạn muốn luyện đọc thế nào?
            </h1>
            <p className="mt-5 text-[#4e5c4c] font-medium max-w-lg mx-auto md:text-lg">
              Luyện đề thi tiêu chuẩn sát với IELTS thật hoặc trau dồi từ vựng thông qua các bài báo song ngữ uy tín.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-[1000px]">
            {/* Standard Mode Card */}
            <button 
              onClick={() => setView("dashboard")} 
              className="group relative flex flex-col rounded-[32px] bg-white p-8 text-left border-2 border-[#e4e8dc] hover:border-[#3B5C37] shadow-sm hover:shadow-[0_24px_54px_rgba(59,92,55,0.12)] transition-all duration-300 active:scale-[0.98] outline-none"
            >
              <div className="h-16 w-16 bg-[#edf3e8] text-[#3B5C37] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-[#1b3d1e] mb-3">Luyện thi tiêu chuẩn</h2>
              <p className="text-sm font-medium text-[#4e5c4c] leading-relaxed mb-8 flex-1">
                Làm bài đọc 3 passages với thời gian 60 phút. Rèn luyện kỹ năng giải các dạng câu hỏi thường gặp trong kỳ thi thật.
              </p>
              <div className="flex items-center gap-2 text-[#3B5C37] font-bold text-sm w-full">
                <span>Vào phòng thi</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Bilingual Reading Card */}
            <Link 
              href="/reading/bilingual" 
              className="group relative flex flex-col rounded-[32px] bg-[#6c7c4c] p-8 text-left border-2 border-[#5c6c3c] hover:border-[#4c5c2c] shadow-sm hover:shadow-[0_24px_54px_rgba(108,124,76,0.3)] transition-all duration-300 active:scale-[0.98] outline-none no-underline overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
              
              <div className="relative h-16 w-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="relative text-2xl font-black text-white mb-3 flex items-center gap-2">
                Đọc Báo Song Ngữ <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-bold">New</span>
              </h2>
              <p className="relative text-sm font-medium text-white/80 leading-relaxed mb-8 flex-1">
                Tuyển tập bài báo uy tín từ The Atlantic, NYT, Economist... Có giải nghĩa chi tiết giúp hấp thụ từ vựng học thuật tự nhiên nhất.
              </p>
              <div className="relative flex items-center gap-2 text-white font-bold text-sm w-full">
                <span>Đọc ngay</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] font-sans">
      <Navbar />

      {/* Modal Coming Soon */}
      {comingSoonTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 border border-gray-100 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              <span className="text-xl font-bold">!</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#1b3d1e] mb-2">Đề thi chưa khả dụng</h3>
            <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
              Nội dung chi tiết của <strong>{comingSoonTest}</strong> đang được cập nhật và sẽ sớm ra mắt. 
              Bạn có muốn luyện tập đề <strong>Cambridge 18 — Test 1</strong> có sẵn không?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setComingSoonTest("")}
                className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                Hủy
              </button>
              <Link
                href="/reading/test"
                onClick={() => setComingSoonTest("")}
                className="px-5 py-2.5 rounded-2xl bg-[#008060] text-white font-bold text-sm hover:bg-[#006b50] active:scale-95 transition-all"
              >
                Thi Ngay (Cam 18)
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1160px] px-6 pb-16 pt-28">
        <div className="mb-6 flex">
          <button onClick={() => setView("select")} className="text-sm font-bold text-[#3B5C37] hover:underline flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" /> Quay lại
          </button>
        </div>

        {/* Hero banner */}
        <section 
          className="relative rounded-3xl overflow-hidden mb-10 bg-[#e5ebd8] bg-cover bg-center text-[#1b3d1e] p-8 md:p-12 shadow-[0_16px_40px_rgba(27,61,30,0.1)] border border-[#d8e0cc]"
          style={{
            backgroundImage: "url('/assets/hero-background-new.jpeg')",
          }}
        >
          <div className="relative z-10 max-w-[700px]">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-[#3B5C37] text-xs font-bold uppercase tracking-wider mb-5 border border-[#c7d1b8]/60">
              <BookOpen className="w-3.5 h-3.5" />
              IELTS Academic Reading
            </span>

            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4 text-[#1b3d1e]">
              Phòng Thi Reading{" "}
              <span className="bg-gradient-to-r from-[#1b3d1e] to-[#3B5C37] bg-clip-text text-transparent">
                Thực Chiến
              </span>
            </h1>

            <p className="text-sm md:text-base text-[#4e5c4c] font-medium leading-relaxed mb-8 max-w-[560px]">
              Mô phỏng bài thi IELTS Academic Reading chuẩn Cambridge — 3 passage, 40 câu hỏi, đồng hồ đếm ngược 60 phút và đánh giá chi tiết sau khi nộp bài.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Clock, label: "60 phút" },
                { icon: BookOpen, label: "3 Passages" },
                { icon: CheckCircle2, label: `${totalQuestions} câu hỏi` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs font-bold text-[#4e5c4c] bg-white/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#c7d1b8]/50">
                  <item.icon className="w-3.5 h-3.5 text-[#3B5C37]" />
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

        {/* Redesigned Test Cards List */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#1b3d1e] tracking-tight">Đề thi Cambridge Academic Reading</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Chọn đề thi và bắt đầu thử thách bản thân dưới áp lực thời gian thực tế.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {loadingExams ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-[#3B5C37]"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 font-medium bg-white rounded-3xl border border-gray-150 shadow-sm">
              Không tìm thấy đề thi Reading nào.
            </div>
          ) : (
            exams.map((exam) => {
              const coverImg = getBookCover(exam.cambridge_no);
              const totalQ = exam.questions?.length || 40;
              const sections = exam.exam_sections || [];
              
              return (
                <div key={exam.id} className="bg-white rounded-[32px] border border-gray-150 p-6 md:p-8 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300">
                  <div>
                    {/* Header section with book cover & metadata */}
                    <div className="flex gap-6 items-start relative">
                      {/* Cambridge tag pill */}
                      {exam.cambridge_no && (
                        <div className="absolute top-0 right-0 bg-[#fefdf0] border border-[#f5e0aa] text-[#b07d0a] text-[10px] font-black uppercase px-3 py-1 rounded-full">
                          CAM {exam.cambridge_no}
                        </div>
                      )}

                      <div className="relative w-[100px] h-[138px] sm:w-[120px] sm:h-[166px] shrink-0 rounded-2xl overflow-hidden shadow-md">
                        <img 
                          src={coverImg} 
                          alt={exam.title} 
                          className="object-cover w-full h-full"
                        />
                      </div>

                      <div className="flex flex-col gap-2.5 pt-1">
                        <h3 className="text-xl sm:text-2xl font-black text-[#0f1738] leading-tight">
                          {exam.title}
                        </h3>
                        
                        <div className="inline-flex w-fit items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <span className="text-xs">★</span> BAND 6.0-9.0
                        </div>

                        <div className="inline-flex w-fit items-center gap-1.5 bg-[#008060] text-white px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Giao diện chuẩn thi thật 100%
                        </div>
                      </div>
                    </div>

                    {/* Passages List */}
                    <div className="flex flex-col gap-3.5 my-8">
                      {sections.map((sec: any) => {
                        const badge = getPassageBadge(sec.title || "", sec.section_no);
                        return (
                          <div key={sec.id} className="flex items-center justify-between py-2.5 px-4 bg-[#f8f9fa] rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-white border-2 border-[#008060] text-[#008060] flex items-center justify-center font-black text-xs shrink-0">
                                {sec.section_no}
                              </div>
                              <span className="text-sm font-extrabold text-[#1b3d1e] truncate pr-2">
                                {sec.title}
                              </span>
                            </div>
                            <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${badge.color} shrink-0`}>
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Link
                      href={`/${locale}/reading/${exam.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#008060] bg-white px-5 py-3.5 text-sm font-extrabold text-[#008060] hover:bg-[#edf7f4] active:scale-[0.98] transition-all cursor-pointer select-none"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      LUYỆN TẬP
                    </Link>
                    <Link
                      href={`/${locale}/reading/${exam.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#008060] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(0,128,96,0.15)] hover:bg-[#006b50] hover:shadow-[0_8px_20px_rgba(0,128,96,0.25)] active:scale-[0.98] transition-all cursor-pointer select-none"
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      ĐI THI
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Question types */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_32px_rgba(20,28,60,0.04)] p-6 mb-8">
          <h3 className="text-sm font-black text-[#1b3d1e] uppercase tracking-wider mb-4">Dạng câu hỏi trong phòng thi</h3>
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
      </main>
    </div>
  );
}
