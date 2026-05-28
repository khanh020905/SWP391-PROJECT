"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Sparkles, Mic, Calendar, Award, TrendingUp, Clock, 
  ArrowRight, History, User, LogOut, ShieldAlert, Play, 
  ChevronRight, BookOpen, Volume2, Award as MedalIcon
} from "lucide-react";

export default function SpeakingDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // History state
  const [attempts, setAttempts] = useState<any[]>([]);

  // Selected config for starting a test
  const [selectedMode, setSelectedMode] = useState<"mock" | "part1" | "part2" | "part3">("mock");
  const [selectedTopic, setSelectedTopic] = useState<string>("study");

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session verification error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Load past attempts from LocalStorage
    const savedAttempts = localStorage.getItem("ielts-speaking-attempts");
    if (savedAttempts) {
      try {
        setAttempts(JSON.parse(savedAttempts));
      } catch (e) {
        console.error("Failed to parse attempts history", e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    window.location.reload();
  };

  // Prepare overall progress chart data
  const chartAttempts = [...attempts].reverse().slice(-5); // Last 5 attempts, chronological
  const hasHistory = attempts.length > 0;

  // Topics description
  const topics = [
    {
      id: "study",
      title: "Study & Hometown",
      vietnamese: "Học tập & Quê hương",
      desc: "Phỏng vấn về chủ đề trường học, ngành học, cùng các câu hỏi mô tả về nơi sinh sống và quê hương bạn.",
      part2Prompt: "Mô tả về một môn học bạn yêu thích hồi còn đi học ở trường cấp ba.",
      part3Focus: "Sự thay đổi của giáo dục và sự đô thị hóa ở các vùng quê.",
      difficulty: "Dễ",
      color: "from-blue-500 to-indigo-500"
    },
    {
      id: "work",
      title: "Work & Career",
      vietnamese: "Công việc & Sự nghiệp",
      desc: "Thảo luận về công việc hiện tại hoặc tương lai, các trách nhiệm, áp lực nghề nghiệp và ước mơ phát triển.",
      part2Prompt: "Mô tả một công việc đầy thử thách mà bạn muốn thử làm trong tương lai.",
      part3Focus: "Sự cân bằng cuộc sống - công việc và vai trò của trí tuệ nhân tạo trong nghề nghiệp.",
      difficulty: "Trung bình",
      color: "from-emerald-500 to-teal-500"
    },
    {
      id: "technology",
      title: "Technology & Daily Life",
      vietnamese: "Công nghệ & Cuộc sống",
      desc: "Khám phá tác động của công nghệ số, thiết bị thông minh và AI lên thói quen sinh hoạt và học tập hàng ngày.",
      part2Prompt: "Mô tả một thiết bị công nghệ hữu ích giúp cuộc sống của bạn tiện lợi hơn.",
      part3Focus: "Sự cô lập xã hội do mạng xã hội và tương lai của robot trong dịch vụ.",
      difficulty: "Khó",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="bg-[#f4f5f9] text-[#0f1738] min-h-screen font-sans">
      {/* Premium Header */}
      <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between px-6 py-6 relative z-30">
        <div className="flex items-center gap-2 text-xl font-extrabold text-[#11193f]">
          <span className="text-[#3B5C37]">*</span>
          <Link href="/" className="hover:opacity-80 transition-opacity">QualiCode</Link>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#404965] md:flex">
          <Link href="/">Trang chủ</Link>
          <Link href="/speaking" className="text-[#3B5C37] font-bold">Luyện Speaking</Link>
          <Link href="/exam/review" className="hover:text-[#3B5C37] transition-colors">Review Đáp án</Link>
          <a href="#">Cambridge Cams</a>
          <a href="#">Bảng xếp hạng</a>
          <a href="#">Hỗ trợ</a>
        </nav>
        {/* Dynamic Auth Header section */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {loading ? (
            <div className="w-8 h-8 border-2 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin" />
          ) : user ? (
            <>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#7c3aed] text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(59, 92, 55,0.15)] hover:scale-105 transition-all outline-none border border-white/40 select-none relative group"
                aria-label="User menu"
              >
                <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-all duration-300" />
                <span>
                  {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl bg-white border border-slate-100 shadow-[0_16px_48px_rgba(15,23,56,0.1)] backdrop-blur-md p-4 animate-scale-in z-50 text-left">
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Đang đăng nhập</p>
                    <p className="text-xs font-black text-[#0d153a] truncate">
                      {user.user_metadata?.name || "Người dùng QualiCode"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37] transition-all cursor-pointer border-none outline-none"
                    >
                      <User className="w-4 h-4 text-[#3B5C37]" />
                      <span>Thông tin tài khoản</span>
                    </button>

                    {user.user_metadata?.role === "ADMIN" && (
                      <Link
                        href="/admin/users"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#7c3aed] transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#7c3aed]" />
                        <span>Trang Quản trị Admin</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none outline-none border-t border-slate-50 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="rounded-xl border border-[#e7e9f1] px-5 py-2 text-sm font-semibold hover:bg-slate-100 transition-colors text-[#0f1738]"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth"
                className="rounded-xl bg-[#3B5C37] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2f4a2b] transition-colors shadow-sm"
              >
                Bắt đầu
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="mx-auto w-full max-w-[1160px] px-6 pb-16 pt-2">
        
        {/* Banner Hero */}
        <section className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-[#0d1330] via-[#151d45] to-[#25184f] text-white p-8 md:p-12 shadow-[0_16px_40px_rgba(15,20,50,0.15)] border border-white/5">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#3B5C37]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#7c3aed]/10 blur-3xl" />
          
          <div className="relative z-10 max-w-[700px]">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3B5C37]/15 text-[#ff8a1f] text-xs font-bold uppercase tracking-wider mb-5 border border-[#3B5C37]/25">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Luyện thi AI thế hệ mới
            </span>
            
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-white">
              Phòng Luyện Thi IELTS <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#3B5C37] to-[#a78bfa] bg-clip-text text-transparent">Speaking Thực Tế</span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-8 max-w-[580px]">
              Trải nghiệm bài thi Speaking hoàn chỉnh cùng Giám khảo AI QualiCode. 
              Nhận kết quả chấm điểm Band Score tức thì, phân tích phát âm, ngữ pháp và gợi ý nâng cấp từ vựng chi tiết theo tiêu chuẩn Cambridge.
            </p>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Mic className="w-4 h-4 text-[#3B5C37]" /> Nhận diện giọng nói chính xác
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Volume2 className="w-4 h-4 text-violet-400" /> Giọng đọc Giám khảo AI tự nhiên
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* Left Column: Selection Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Mode Selection */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3]">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] font-black text-sm flex items-center justify-center">1</span>
                <h2 className="text-lg font-black text-[#0f1738]">Chọn chế độ luyện tập</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Mode: Mock Test */}
                <button
                  onClick={() => setSelectedMode("mock")}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl text-left border cursor-pointer select-none transition-all outline-none ${
                    selectedMode === "mock" 
                      ? "border-[#3B5C37] bg-[#e8ede6]/20 shadow-[0_8px_20px_rgba(59, 92, 55,0.06)]"
                      : "border-[#eef1f6] hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${selectedMode === "mock" ? "bg-[#3B5C37] text-white" : "bg-orange-100 text-[#3B5C37]"}`}>
                    <MedalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0f1738] mb-1">Full Mock Test</h3>
                    <p className="text-xs text-[#5c6488] leading-normal">
                      Mô phỏng đầy đủ 3 phần thi nói thực tế từ Part 1 đến Part 3. Có thời gian chuẩn bị 60s cho Part 2. (Khoảng 12-15 phút).
                    </p>
                  </div>
                  {selectedMode === "mock" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#3B5C37]" />
                  )}
                </button>

                {/* Mode: Part 1 */}
                <button
                  onClick={() => setSelectedMode("part1")}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl text-left border cursor-pointer select-none transition-all outline-none ${
                    selectedMode === "part1" 
                      ? "border-[#3B5C37] bg-[#e8ede6]/20 shadow-[0_8px_20px_rgba(59, 92, 55,0.06)]"
                      : "border-[#eef1f6] hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${selectedMode === "part1" ? "bg-[#3B5C37] text-white" : "bg-orange-100 text-[#3B5C37]"}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0f1738] mb-1">Part 1: Phỏng vấn</h3>
                    <p className="text-xs text-[#5c6488] leading-normal">
                      Khởi động với các chủ đề giao tiếp quen thuộc hàng ngày như học tập, sở thích, gia đình. Gồm 3 câu hỏi (4-5 phút).
                    </p>
                  </div>
                  {selectedMode === "part1" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#3B5C37]" />
                  )}
                </button>

                {/* Mode: Part 2 */}
                <button
                  onClick={() => setSelectedMode("part2")}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl text-left border cursor-pointer select-none transition-all outline-none ${
                    selectedMode === "part2" 
                      ? "border-[#3B5C37] bg-[#e8ede6]/20 shadow-[0_8px_20px_rgba(59, 92, 55,0.06)]"
                      : "border-[#eef1f6] hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${selectedMode === "part2" ? "bg-[#3B5C37] text-white" : "bg-orange-100 text-[#3B5C37]"}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0f1738] mb-1">Part 2: Thuyết trình</h3>
                    <p className="text-xs text-[#5c6488] leading-normal">
                      Nhận 1 thẻ Cue Card và trả lời chi tiết. Bao gồm 1 phút để chuẩn bị nháp và 2 phút để tự trình bày liên tục.
                    </p>
                  </div>
                  {selectedMode === "part2" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#3B5C37]" />
                  )}
                </button>

                {/* Mode: Part 3 */}
                <button
                  onClick={() => setSelectedMode("part3")}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl text-left border cursor-pointer select-none transition-all outline-none ${
                    selectedMode === "part3" 
                      ? "border-[#3B5C37] bg-[#e8ede6]/20 shadow-[0_8px_20px_rgba(59, 92, 55,0.06)]"
                      : "border-[#eef1f6] hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${selectedMode === "part3" ? "bg-[#3B5C37] text-white" : "bg-orange-100 text-[#3B5C37]"}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0f1738] mb-1">Part 3: Thảo luận sâu</h3>
                    <p className="text-xs text-[#5c6488] leading-normal">
                      Phân tích nâng cao về các câu hỏi mang tính học thuật, vĩ mô liên quan trực tiếp tới chủ đề đã chọn ở Part 2.
                    </p>
                  </div>
                  {selectedMode === "part3" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#3B5C37]" />
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Topic Selection */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3]">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] font-black text-sm flex items-center justify-center">2</span>
                <h2 className="text-lg font-black text-[#0f1738]">Chọn chủ đề thi nói</h2>
              </div>
              
              <div className="space-y-4">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    className={`w-full relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl text-left border cursor-pointer select-none transition-all outline-none ${
                      selectedTopic === t.id 
                        ? "border-[#3B5C37] bg-[#e8ede6]/10 shadow-sm"
                        : "border-[#eef1f6] hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Color Tag Indicator */}
                      <div className={`w-3.5 h-12 rounded-lg bg-gradient-to-b ${t.color} flex-shrink-0`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-[#0f1738]">{t.title}</h3>
                          <span className="text-[11px] font-bold text-slate-500">({t.vietnamese})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.difficulty === "Dễ" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                            t.difficulty === "Trung bình" ? "bg-amber-50 border-amber-200 text-amber-600" :
                            "bg-rose-50 border-rose-200 text-rose-600"
                          }`}>
                            {t.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-[#5c6488] leading-relaxed mt-1">{t.desc}</p>
                        
                        {/* Summary of Questions in mode preview */}
                        {selectedMode !== "part1" && (
                          <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[#3B5C37] font-semibold">
                            <span className="underline">Part 2 Cue:</span>
                            <span className="text-slate-600 italic font-medium truncate">{t.part2Prompt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:text-right flex items-center justify-end flex-shrink-0">
                      {selectedTopic === t.id ? (
                        <div className="w-6 h-6 rounded-full bg-[#3B5C37] text-white flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-200" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="flex justify-end pt-2">
              <Link
                href={`/speaking/test?mode=${selectedMode}&topic=${selectedTopic}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] px-8 py-4 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(59, 92, 55,0.3)] hover:shadow-[0_16px_36px_rgba(59, 92, 55,0.4)] active:scale-95 transition-all select-none cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white text-white" />
                <span>Bắt đầu thi thử ngay</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

          </div>

          {/* Right Column: Profile & Analytics History */}
          <div className="space-y-8">
            
            {/* Quick Status Card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3B5C37]/5 to-transparent rounded-full" />
              
              <h2 className="text-sm font-black text-[#5c6488] uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3B5C37]" />
                Tiến trình Speaking của bạn
              </h2>

              {hasHistory ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-extrabold text-[#0f1738]">
                      {(attempts.reduce((sum, item) => sum + parseFloat(item.band), 0) / attempts.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">Band trung bình</span>
                  </div>

                  {/* SVG Chart showing band history */}
                  <div className="relative h-28 rounded-2xl bg-[#fafbfe] border border-slate-100 p-2 overflow-hidden mb-4">
                    <div className="absolute inset-0 flex flex-col justify-between py-2 px-3">
                      <div className="border-b border-dashed border-slate-100" />
                      <div className="border-b border-dashed border-slate-100" />
                      <div className="border-b border-dashed border-slate-100" />
                    </div>
                    
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B5C37" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3B5C37" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Path */}
                      <path 
                        d={chartAttempts.reduce((path, item, idx) => {
                          const x = idx * (100 / (chartAttempts.length - 1 || 1));
                          // Map score 1-9 to Y-axis 35 to 5 (lower value = higher physically)
                          const scoreVal = parseFloat(item.band);
                          const y = 35 - ((scoreVal - 4) / 5) * 30; // Scale between 4.0 and 9.0
                          return path + `${idx === 0 ? "M" : "L"} ${x} ${Math.max(5, Math.min(35, y))}`;
                        }, "")} 
                        fill="none" 
                        stroke="#3B5C37" 
                        strokeWidth="1.8" 
                        strokeLinecap="round" 
                      />
                      {/* Area */}
                      {chartAttempts.length > 1 && (
                        <path 
                          d={chartAttempts.reduce((path, item, idx) => {
                            const x = idx * (100 / (chartAttempts.length - 1));
                            const scoreVal = parseFloat(item.band);
                            const y = 35 - ((scoreVal - 4) / 5) * 30;
                            return path + `${idx === 0 ? "M" : "L"} ${x} ${Math.max(5, Math.min(35, y))}`;
                          }, "") + ` L 100 40 L 0 40 Z`} 
                          fill="url(#chartGrad)" 
                        />
                      )}
                    </svg>
                    
                    {/* Month labels or date indicators */}
                    <div className="absolute bottom-0 inset-x-0 flex justify-between px-3 text-[8px] font-bold text-slate-400">
                      <span>Lần đầu</span>
                      <span>Lần gần đây</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Đã luyện tập: <strong>{attempts.length} lần</strong></span>
                    <span>Tỷ lệ hoàn thành: <strong>100%</strong></span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-normal">
                    Hãy làm bài thi nói Speaking đầu tiên để bắt đầu theo dõi tiến độ nâng Band của bạn!
                  </p>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3]">
              <h2 className="text-sm font-black text-[#0f1738] mb-4 flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-[#3B5C37]" />
                Lịch sử thi & kết quả
              </h2>
              
              {hasHistory ? (
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {attempts.map((item, idx) => (
                    <Link
                      key={item.id || idx}
                      href={`/speaking/feedback?id=${item.id}`}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-[#eef1f6] bg-[#fafbfe] hover:bg-white hover:border-[#3B5C37]/40 transition-all select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {/* Circular Score Badge */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#7c3aed] text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                          {parseFloat(item.band).toFixed(1)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0f1738] group-hover:text-[#3B5C37] transition-colors leading-none mb-1">
                            {item.mode === "mock" ? "Mock Test" : `Part ${item.mode.replace("part", "")}`}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-[#3B5C37] transition-colors">
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[#eef1f6] rounded-2xl bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-400">Không tìm thấy lịch sử làm bài</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Premium Glassmorphic User Profile Modal */}
      {showProfileModal && user && (
        <div 
          onClick={() => setShowProfileModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-3xl bg-white border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.15)] p-6 md:p-8 animate-scale-in text-left relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#7c3aed]/10 blur-2xl" />

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(59, 92, 55,0.15)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0d153a]">Thông tin tài khoản</h3>
                <p className="text-[10px] font-bold text-slate-400">Chi tiết tài khoản học viên QualiCode</p>
              </div>
            </div>

            <div className="space-y-5 mb-6 relative z-10">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#fafaff] to-[#fff8f2] border border-slate-100/60 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#3B5C37] via-[#ff9e4f] to-[#7c3aed] text-white text-xl font-extrabold flex items-center justify-center shadow-[0_4px_16px_rgba(59, 92, 55,0.2)]">
                  {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#0d153a]">
                    {user.user_metadata?.name || "Thành viên QualiCode"}
                  </h4>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#3B5C37]/10 text-[#3B5C37] border border-[#3B5C37]/25">
                    {user.user_metadata?.role === "ADMIN" ? "Quản trị viên (ADMIN)" : user.user_metadata?.role === "STUDENT" ? "Học sinh (STUDENT)" : "Khách (GUEST)"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa chỉ Email</label>
                  <p className="text-xs font-bold text-[#0d153a]">{user.email}</p>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã định danh User</label>
                  <p className="text-[10px] font-medium text-slate-600 font-mono truncate">{user.id}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-600 transition-colors border-none outline-none select-none cursor-pointer"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
