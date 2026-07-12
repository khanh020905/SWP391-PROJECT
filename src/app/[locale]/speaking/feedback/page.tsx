"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { 
  Award, Calendar, ArrowLeft, ShieldAlert, Sparkles, User, 
  LogOut, Mic, Volume2, CheckCircle2, AlertCircle, ChevronRight,
  Bookmark, Play, Pause, FileText, Check, ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function SpeakingFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Attempt data
  const [attempt, setAttempt] = useState<any | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Lỗi lấy cấu hình:", err));
  }, []);
  
  // Audio Player state
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"transcript" | "grammar" | "vocabulary">("transcript");

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

    // Load attempt data by ID from localStorage
    const savedAttempts = localStorage.getItem("ielts-speaking-attempts");
    if (savedAttempts && attemptId) {
      try {
        const list = JSON.parse(savedAttempts);
        const found = list.find((a: any) => a.id === attemptId);
        if (found) {
          setAttempt(found);
        }
      } catch (e) {
        console.error("Failed to load attempt details", e);
      }
    }
  }, [attemptId]);

  // Audio playing handler
  const handlePlayAudio = (idx: number, blobUrl: string) => {
    if (playingIndex === idx) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingIndex(null);
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingIndex(idx);
      audio.onended = () => {
        setPlayingIndex(null);
      };
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    window.location.reload();
  };

  // Generate automated vocabulary corrections/upgrades
  const getVocabularyUpgrades = (text: string) => {
    const list = [
      { regex: /\bvery good\b/gi, replacement: "exceptional / exemplary", type: "adjective" },
      { regex: /\bvery bad\b/gi, replacement: "adverse / detrimental", type: "adjective" },
      { regex: /\bimportant\b/gi, replacement: "paramount / crucial", type: "adjective" },
      { regex: /\buse\b/gi, replacement: "utilize / implement", type: "verb" },
      { regex: /\bvery happy\b/gi, replacement: "exhilarated / ecstatic", type: "adjective" },
      { regex: /\bhard\b/gi, replacement: "formidable / arduous", type: "adjective" },
      { regex: /\bmany\b/gi, replacement: "a myriad of / substantial", type: "quantifier" },
      { regex: /\bhelp\b/gi, replacement: "facilitate / foster", type: "verb" },
      { regex: /\bchange\b/gi, replacement: "revolutionize / transform", type: "verb" },
      { regex: /\blike\b/gi, replacement: "be highly passionate about / advocate", type: "verb" }
    ];

    const found: Array<{ original: string; upgrade: string; type: string }> = [];
    
    list.forEach(item => {
      if (item.regex.test(text)) {
        const matches = text.match(item.regex);
        if (matches) {
          found.push({
            original: matches[0],
            upgrade: item.replacement,
            type: item.type
          });
        }
      }
    });

    return found;
  };

  // Generate automated grammar corrections
  const getGrammarCorrections = (text: string) => {
    const corrections = [];
    
    // Check missing articles
    if (/\b(is|become|like)\s+(student|teacher|doctor|computer|phone)\b/i.test(text)) {
      corrections.push({
        error: "Thiếu mạo từ 'a/an'",
        desc: "Trước các danh từ đếm được số ít chỉ nghề nghiệp hoặc vật thể, cần có mạo từ.",
        correction: "Thêm 'a' trước từ chỉ danh từ (ví dụ: 'a student', 'a phone')"
      });
    }

    // Check subject-verb agreement
    if (/\b(he|she|it)\s+(do|go|have|like|want)\b/i.test(text)) {
      const wrongVerb = text.match(/\b(he|she|it)\s+(do|go|have|like|want)\b/i);
      const verbMap: Record<string, string> = { do: "does", go: "goes", have: "has", like: "likes", want: "wants" };
      const baseVerb = wrongVerb ? wrongVerb[2].toLowerCase() : "";
      corrections.push({
        error: "Chia sai động từ ngôi thứ 3 số ít",
        desc: "Với chủ ngữ là He/She/It, động từ thường ở hiện tại đơn cần thêm đuôi -s/es.",
        correction: `Sửa '${baseVerb}' thành '${verbMap[baseVerb] || baseVerb + "s"}'`
      });
    }

    // Check relative clauses formatting
    if (/\bwhich\s+it\s+/i.test(text)) {
      corrections.push({
        error: "Thừa đại từ trong mệnh đề quan hệ",
        desc: "Khi dùng 'which' làm chủ ngữ thay thế cho vật, không cần thêm đại từ 'it' phía sau.",
        correction: "Lược bỏ 'it' (ví dụ: 'which is very useful' thay vì 'which it is very useful')"
      });
    }

    return corrections;
  };

  const getBandFeedback = (bandScore: number) => {
    if (!settings || !settings.bandScore) {
      // Fallback default feedback
      if (bandScore <= 4.5) return "Bạn đang ở cấp độ cơ bản. Hãy tập trung cải thiện phát âm các từ đơn lẻ và mở rộng vốn từ vựng thông dụng cơ bản trước.";
      if (bandScore <= 6.5) return "Kỹ năng Speaking ở mức khá. Cần tập trung liên kết các ý dài hơn, hạn chế lặp từ và sửa lỗi ngữ pháp thì chia động từ khi nói nhanh.";
      return "Kỹ năng nói xuất sắc! Hãy tiếp tục duy trì độ trôi chảy, sử dụng thêm các thành ngữ (idiomatic expressions) và các cấu trúc câu phức tạp để đạt band điểm cao hơn nữa.";
    }

    const { beginnerMaxBand, intermediateMaxBand, advancedMinBand, beginnerFeedback, intermediateFeedback, advancedFeedback } = settings.bandScore;

    if (bandScore <= Number(beginnerMaxBand)) {
      return beginnerFeedback;
    } else if (bandScore <= Number(intermediateMaxBand)) {
      return intermediateFeedback;
    } else if (bandScore >= Number(advancedMinBand)) {
      return advancedFeedback;
    } else {
      return intermediateFeedback;
    }
  };

  if (!attempt) {
    return (
      <div className="bg-[#f4f5f9] text-[#0f1738] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-[#3B5C37] mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black mb-2">Không tìm thấy kết quả làm bài</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Có vẻ đường dẫn kết quả không chính xác hoặc bài thi này đã bị xóa khỏi thiết bị của bạn.
        </p>
        <Link href="/speaking" className="px-6 py-3 rounded-2xl bg-[#3B5C37] hover:bg-[#2f4a2b] text-xs font-bold text-white transition-colors">
          Quay lại phòng luyện Speaking
        </Link>
      </div>
    );
  }

  // Formatting date
  const testDate = new Date(attempt.timestamp).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

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
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(59, 92, 55,0.15)] hover:scale-105 transition-all outline-none border border-white/40 select-none relative group"
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
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37] transition-all cursor-pointer border-none outline-none"
                    >
                      <User className="w-4 h-4 text-[#3B5C37]" />
                      <span>Thông tin tài khoản</span>
                    </button>

                    {user.user_metadata?.role === "ADMIN" && (
                      <Link
                        href="/admin/users"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#B38F4D] transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B38F4D]" />
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
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/speaking" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#3B5C37] transition-colors select-none">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại phòng luyện Speaking</span>
          </Link>
        </div>

        {/* Hero attempt stats */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3] mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  {attempt.mode === "mock" ? "Full Mock Test" : `Luyện tập Part ${attempt.mode.replace("part", "")}`}
                </span>
                <span className="text-xs font-bold px-3 py-1 bg-[#3B5C37]/10 text-[#3B5C37] rounded-lg capitalize">
                  Chủ đề: {attempt.topic}
                </span>
              </div>
              
              <h1 className="text-2xl font-black text-[#0f1738] mb-1.5">Báo cáo kết quả phân tích Speaking AI</h1>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                <Calendar className="w-4 h-4" />
                <span>Hoàn thành lúc: {testDate}</span>
              </div>
            </div>

            {/* Circular Gauge band */}
            <div className="flex items-center gap-4 bg-gradient-to-tr from-slate-900 to-[#1c1d3c] text-white p-5 rounded-2xl border border-slate-800 shadow-md flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2b4b" strokeWidth="6" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke="#3B5C37" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeDasharray={`${(parseFloat(attempt.band) / 9) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-white">{parseFloat(attempt.band).toFixed(1)}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">OVERALL BAND SCORE</span>
                <h3 className="text-base font-black text-[#3B5C37] leading-none mb-1">
                  {parseFloat(attempt.band) >= 7.5 ? "Cực kỳ xuất sắc!" : parseFloat(attempt.band) >= 6.5 ? "Khá tốt!" : "Cần cố gắng thêm!"}
                </h3>
                <p className="text-[10px] text-slate-300 leading-normal max-w-[200px]">Đánh giá theo thang chuẩn IELTS Rubric.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Rubric sub-scores grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { 
              score: attempt.scores.fc, 
              label: "Fluency & Coherence", 
              vietnamese: "Độ trôi chảy & Mạch lạc",
              color: "text-blue-500", 
              bg: "bg-blue-500/10",
              desc: parseFloat(attempt.scores.fc) >= 7.0 
                ? "Nói mạch lạc, sử dụng liên từ tự nhiên, ít ngập ngừng." 
                : "Nói tương đối rõ ràng nhưng đôi chỗ còn dừng lâu hoặc ngập ngừng tìm từ."
            },
            { 
              score: attempt.scores.lr, 
              label: "Lexical Resource", 
              vietnamese: "Vốn từ vựng",
              color: "text-purple-500", 
              bg: "bg-purple-500/10",
              desc: parseFloat(attempt.scores.lr) >= 7.0 
                ? "Sử dụng từ vựng đa dạng, có sử dụng collocation và từ vựng nâng cao." 
                : "Sử dụng từ phổ thông thường xuyên. Cần nâng cấp các từ đồng nghĩa cao cấp."
            },
            { 
              score: attempt.scores.gra, 
              label: "Grammatical Range", 
              vietnamese: "Ngữ pháp phong phú",
              color: "text-amber-500", 
              bg: "bg-amber-500/10",
              desc: parseFloat(attempt.scores.gra) >= 7.0 
                ? "Kết hợp tốt câu đơn và câu phức (relative clauses, passives, conditionals)." 
                : "Cấu trúc câu đa số ở câu đơn giản. Xuất hiện một số lỗi chia động từ cơ bản."
            },
            { 
              score: attempt.scores.p, 
              label: "Pronunciation", 
              vietnamese: "Phát âm & Ngữ điệu",
              color: "text-emerald-500", 
              bg: "bg-emerald-500/10",
              desc: parseFloat(attempt.scores.p) >= 7.0 
                ? "Phát âm các phụ âm cuối rõ ràng, ngữ điệu lên xuống tự nhiên." 
                : "Phát âm rõ ràng giúp hiểu được ý chính, tuy nhiên ngữ điệu hơi đều và bằng phẳng."
            }
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-[#e8ebf3] shadow-[0_4px_24px_rgba(20,28,60,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${card.bg} ${card.color}`}>
                    Band {parseFloat(card.score).toFixed(1)}
                  </span>
                  
                  {/* Miniature progress bar */}
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${card.bg.replace('/10', '')}`} style={{ width: `${(parseFloat(card.score) / 9) * 100}%` }} />
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-[#0f1738] mb-0.5">{card.label}</h3>
                <p className="text-[10px] font-bold text-slate-400 mb-2">({card.vietnamese})</p>
                <p className="text-xs text-[#5c6488] leading-normal">{card.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Tab interactive system */}
        <section className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* Left Area: Answers & Audio review (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3]">
              <h2 className="text-lg font-black text-[#0f1738] mb-6 flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#3B5C37]" />
                Xem lại câu hỏi và file ghi âm giọng nói
              </h2>

              <div className="space-y-6">
                {attempt.answers.map((ans: any, idx: number) => (
                  <div 
                    key={ans.questionId || idx}
                    className="p-5 rounded-2xl border border-[#eef1f6] bg-[#fafbfe] hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3 flex-wrap">
                      <span className="text-[10px] font-black text-[#3B5C37] uppercase tracking-wider block">
                        {ans.part} - Câu {idx + 1}
                      </span>
                      
                      {/* Audio player check */}
                      {ans.audioBlobUrl && (
                        <button
                          onClick={() => handlePlayAudio(idx, ans.audioBlobUrl)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer ${
                            playingIndex === idx
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-[#3B5C37]/5 border-[#3B5C37]/20 text-[#3B5C37] hover:bg-[#3B5C37]/10"
                          }`}
                        >
                          {playingIndex === idx ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Dừng nghe
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-[#3B5C37]" /> Nghe lại giọng bạn
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-extrabold text-[#0f1738] leading-relaxed mb-3">
                      &ldquo; {ans.questionText} &rdquo;
                    </p>

                    <div className="p-3.5 bg-white border border-[#eef1f6] rounded-xl">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">VĂN BẢN HỌC SINH NÓI (TRANSCRIPT)</label>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        {ans.transcript}
                      </p>
                    </div>

                    {/* Quick highlights within answer card */}
                    <div className="mt-3.5 flex items-center gap-4 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400">Từ vựng nâng cấp:</span>
                      <div className="flex gap-2 flex-wrap">
                        {getVocabularyUpgrades(ans.transcript).slice(0, 2).map((v, i) => (
                          <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200">
                            {v.original} &rarr; {v.upgrade.split(" / ")[0]}
                          </span>
                        ))}
                        {getVocabularyUpgrades(ans.transcript).length === 0 && (
                          <span className="text-[9px] text-slate-400 italic font-medium">Không phát hiện từ vựng cần thay thế nhanh</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Area: Detailed AI Diagnostics (1 Col) */}
          <div className="space-y-6">
            
            {/* General AI Examiner Feedback */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3] space-y-3">
              <h2 className="text-sm font-black text-[#0f1738] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#3B5C37]" />
                Nhận xét & Lời khuyên từ Giám khảo AI
              </h2>
              <p className="text-xs text-[#5c6488] leading-relaxed">
                {getBandFeedback(parseFloat(attempt.band))}
              </p>
            </div>

            {/* Tabs navigator */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_32px_rgba(20,28,60,0.04)] border border-[#e8ebf3]">
              <div className="flex border-b border-slate-100 pb-3 mb-5 gap-2">
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`flex-1 pb-2 text-center text-xs font-black border-b-2 transition-all outline-none cursor-pointer ${
                    activeTab === "transcript"
                      ? "border-[#3B5C37] text-[#3B5C37]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Ngữ pháp AI
                </button>
                <button
                  onClick={() => setActiveTab("vocabulary")}
                  className={`flex-1 pb-2 text-center text-xs font-black border-b-2 transition-all outline-none cursor-pointer ${
                    activeTab === "vocabulary"
                      ? "border-[#3B5C37] text-[#3B5C37]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Từ vựng Booster
                </button>
              </div>

              {/* Tab 1: Grammar checks */}
              {activeTab === "transcript" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-black text-[#0f1738]">Lỗi ngữ pháp cần sửa đổi</h3>
                  </div>

                  {attempt.answers.reduce((acc: any[], ans: any) => {
                    return [...acc, ...getGrammarCorrections(ans.transcript)];
                  }, []).length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-[#eef1f6] rounded-2xl bg-emerald-50/25">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-extrabold text-emerald-700 leading-none">Tuyệt vời! Ngữ pháp cực kỳ chuẩn xác</p>
                      <p className="text-[10px] text-emerald-500 mt-1 max-w-[200px] mx-auto">Không tìm thấy lỗi chia động từ, mạo từ hay bổ từ cơ bản.</p>
                    </div>
                  ) : (
                    attempt.answers.reduce((acc: any[], ans: any, ansIdx: number) => {
                      const errs = getGrammarCorrections(ans.transcript);
                      return [...acc, ...errs.map(e => ({ ...e, ansIdx }))];
                    }, []).map((err: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 text-left">
                        <div className="flex items-center gap-2 text-xs font-black text-rose-600 mb-1">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <h4>{err.error}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal mb-2">
                          Tại câu trả lời {err.ansIdx + 1}: {err.desc}
                        </p>
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-100 text-rose-700 text-xs font-black">
                          {err.correction}
                        </div>
                      </div>
                    ))
                  )}

                  <div className="p-4 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed border border-slate-800">
                    <span className="font-extrabold text-[#3B5C37] flex items-center gap-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Lời khuyên ngữ pháp từ AI:
                    </span>
                    Để bứt phá lên Band 7.5+ Grammatical Range, hãy sử dụng đa dạng các câu phức (ví dụ mệnh đề quan hệ &ldquo;which/who&rdquo; hoặc câu điều kiện loại 2 &ldquo;If I had the chance, I would...&rdquo;).
                  </div>
                </div>
              )}

              {/* Tab 2: Vocabulary boosters */}
              {activeTab === "vocabulary" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3 className="text-xs font-black text-[#0f1738]">Gợi ý nâng cấp từ vựng Band 8.0+</h3>
                  </div>

                  {attempt.answers.reduce((acc: any[], ans: any) => {
                    return [...acc, ...getVocabularyUpgrades(ans.transcript)];
                  }, []).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">Không tìm thấy từ vựng lặp cơ bản. Từ vựng bạn dùng tương đối phong phú!</p>
                    </div>
                  ) : (
                    // Display unique upgrades
                    Array.from(
                      new Set(
                        attempt.answers.reduce((acc: any[], ans: any) => {
                          return [...acc, ...getVocabularyUpgrades(ans.transcript)];
                        }, []).map(JSON.stringify)
                      )
                    ).map((str: any) => JSON.parse(str)).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-purple-100 bg-purple-50/10">
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">{item.type}</span>
                          <span className="text-xs font-black text-slate-500 line-through leading-none">{item.original}</span>
                        </div>
                        
                        <div className="text-right flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-black text-purple-600 bg-purple-100 border border-purple-200 py-1.5 px-2.5 rounded-lg">
                            {item.upgrade.split(" / ")[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="p-4 rounded-xl bg-[#fafbfe] border border-[#3B5C37]/20 text-[11px] leading-relaxed text-[#5c6488]">
                    <span className="font-extrabold text-[#3B5C37] block mb-1">💡 Mẹo tích lũy Lexical Resource:</span>
                    Thay thế các tính từ thường gặp như <span className="font-bold">"very good"</span> thành <span className="font-bold text-purple-600">"exemplary"</span>, <span className="font-bold">"important"</span> thành <span className="font-bold text-purple-600 font-sans">"crucial"</span> để thu hút sự chú ý của Giám khảo chấm thi.
                  </div>
                </div>
              )}

            </div>
          </div>

        </section>
      </main>
      
    </div>
  );
}

export default function SpeakingFeedback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[#3B5C37]/20 border-t-[#3B5C37] animate-spin" />
        </div>
        <p className="text-sm font-black text-slate-400">Đang tải kết quả bài thi Speaking...</p>
      </div>
    }>
      <SpeakingFeedbackContent />
    </Suspense>
  );
}
