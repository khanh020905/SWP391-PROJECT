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
import { fetchSpeakingTopics } from "@/services/speakingService";
import type { ElementType } from "react";

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

import { Search, Copy, Check, ChevronDown, ChevronUp, ArrowLeft, Loader2, Sparkles as SparklesIcon, X } from "lucide-react";

export default function SpeakingDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [attempts, setAttempts] = useState<SpeakingAttempt[]>([]);
  const [view, setView] = useState<"select" | "dashboard">("select");
  const [activeTab, setActiveTab] = useState<"part1_req" | "part1_topics" | "part2_3">("part1_req");
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Accordion lists
  const [expandedPart1, setExpandedPart1] = useState<Record<string, boolean>>({});
  const [expandedPart3, setExpandedPart3] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Practice modal state
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [modalExam, setModalExam] = useState<any>(null);

  // Load user status and attempts
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user ?? null);
    }).catch((err) => console.warn(err));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    setAttempts(parseAttempts());

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Speaking Exams dynamically
  useEffect(() => {
    async function loadSpeakingExams() {
      try {
        setIsLoading(true);
        // Get published speaking exams
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("id, title, category, status, cambridge_no, test_no")
          .eq("category", "speaking")
          .eq("status", "published");

        if (examsError) throw examsError;

        if (examsData && examsData.length > 0) {
          const examIds = examsData.map(e => e.id);
          // Get sections
          const { data: sectionsData, error: sectionsError } = await supabase
            .from("exam_sections")
            .select("*")
            .in("exam_id", examIds);

          if (sectionsError) throw sectionsError;

          const mapped = examsData.map(exam => {
            const sections = (sectionsData || []).filter(s => s.exam_id === exam.id);
            const part1Sec = sections.find(s => s.section_no === 1);
            const part2Sec = sections.find(s => s.section_no === 2);
            const part3Sec = sections.find(s => s.section_no === 3);

            let part1Qs: string[] = [];
            if (part1Sec?.answers) {
              part1Qs = Array.isArray(part1Sec.answers)
                ? part1Sec.answers
                : typeof part1Sec.answers === 'string'
                  ? JSON.parse(part1Sec.answers)
                  : [];
            }

            let part2CueCard = "";
            let part2Bullets: string[] = [];
            if (part2Sec?.answers) {
              const ans = typeof part2Sec.answers === 'string' ? JSON.parse(part2Sec.answers) : part2Sec.answers;
              if (ans && typeof ans === 'object') {
                part2CueCard = ans.cue_card || "";
                part2Bullets = ans.bullet_points || [];
              }
            }
            if (!part2CueCard && part2Sec?.content) {
              part2CueCard = part2Sec.content;
            }

            let part3Qs: string[] = [];
            if (part3Sec?.answers) {
              part3Qs = Array.isArray(part3Sec.answers)
                ? part3Qs = part3Sec.answers
                : typeof part3Sec.answers === 'string'
                  ? JSON.parse(part3Sec.answers)
                  : [];
            }

            let part1Topic = "General Intro";
            if (part1Sec?.content) {
              const match = part1Sec.content.match(/Topic:\s*(.*)/i);
              if (match && match[1]) {
                part1Topic = match[1].trim();
              } else {
                part1Topic = part1Sec.content.replace("Part 1 Topic:", "").trim();
              }
            }

            return {
              id: exam.id,
              title: exam.title,
              cambridge_no: exam.cambridge_no,
              test_no: exam.test_no,
              part1: {
                topicName: part1Topic,
                questions: part1Qs
              },
              part2: {
                cue_card: part2CueCard,
                bullet_points: part2Bullets
              },
              part3: {
                questions: part3Qs
              }
            };
          });

          // Sort alphabetically / by Cambridge number & test number
          mapped.sort((a, b) => {
            if (a.cambridge_no && b.cambridge_no) {
              if (a.cambridge_no !== b.cambridge_no) {
                return a.cambridge_no - b.cambridge_no;
              }
            }
            if (a.test_no && b.test_no) {
              return a.test_no - b.test_no;
            }
            return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
          });

          setExams(mapped);
        }
      } catch (err) {
        console.error("Failed to load speaking exams:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSpeakingExams();
  }, []);

  const isRequiredPart1 = (topicName: string, testNo?: number) => {
    const name = topicName.toLowerCase();
    return (
      name.includes("hometown") ||
      name.includes("home") ||
      name.includes("live") ||
      name.includes("study") ||
      name.includes("work") ||
      name.includes("accommodation") ||
      testNo === 1
    );
  };

  // Filter exams based on tab and search term
  const filteredItems = useMemo(() => {
    return exams.filter(exam => {
      const matchSearch = 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.part1.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.part2.cue_card.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === "part1_req") {
        return isRequiredPart1(exam.part1.topicName, exam.test_no);
      } else if (activeTab === "part1_topics") {
        return !isRequiredPart1(exam.part1.topicName, exam.test_no);
      } else {
        // part2_3
        return true;
      }
    });
  }, [exams, activeTab, searchTerm]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePart1 = (id: string) => {
    setExpandedPart1(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePart3 = (id: string) => {
    setExpandedPart3(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openPractice = (exam: any) => {
    setModalExam(exam);
    setShowPracticeModal(true);
  };

  if (view === "select") {
    return (
      <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20">
          <div className="text-center mb-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/85 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B5C37] mb-6">
              <SparklesIcon className="h-4 w-4" />
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
        <Footer />
      </div>
    );
  }

  // Dashboard layout with the requested style:
  // Yellow/emerald palettes, heavy black borders & offset shadows.
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 pt-28 pb-20">
        
        {/* Navigation back */}
        <button
          onClick={() => setView("select")}
          className="flex items-center gap-2 text-black font-extrabold text-sm hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3px]" />
          Về trang Speaking
        </button>

        {/* Heading section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded border-2 border-black bg-[#3B5C37] px-3.5 py-1 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] mb-4">
              THE IELTS DICTIONARY • QUÝ 2 • 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-black uppercase">
              Bộ dự đoán đề thi IELTS
            </h1>
            <h2 className="text-3xl md:text-4xl font-black text-black mt-2">
              SPEAKING QUÝ 2 <span className="text-[#3B5C37] text-2xl md:text-3xl font-medium block md:inline md:ml-3">(THÁNG 5 - THÁNG 8) NĂM 2026</span>
            </h2>
          </div>

          {/* Search Input box */}
          <div className="relative w-full max-w-[340px] shrink-0">
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-black bg-white px-4 py-3.5 pr-10 text-sm font-bold text-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-black stroke-[2.5px]" />
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex flex-wrap items-center gap-3.5 mb-10 border-b border-black/10 pb-6">
          <button
            onClick={() => setActiveTab("part1_req")}
            className={`px-5 py-3 font-extrabold rounded-lg border-2 border-black text-sm transition-all duration-150 active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] ${
              activeTab === "part1_req"
                ? "bg-[#3B5C37] text-white shadow-[3px_3px_0px_0px_#000]"
                : "bg-white text-black hover:bg-[#FAF9F5] shadow-[3px_3px_0px_0px_#000]"
            }`}
          >
            PART 1 BẮT BUỘC ({exams.filter(e => isRequiredPart1(e.part1.topicName, e.test_no)).length})
          </button>
          <button
            onClick={() => setActiveTab("part1_topics")}
            className={`px-5 py-3 font-extrabold rounded-lg border-2 border-black text-sm transition-all duration-150 active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] ${
              activeTab === "part1_topics"
                ? "bg-[#3B5C37] text-white shadow-[3px_3px_0px_0px_#000]"
                : "bg-white text-black hover:bg-[#FAF9F5] shadow-[3px_3px_0px_0px_#000]"
            }`}
          >
            PART 1 CHỦ ĐỀ ({exams.filter(e => !isRequiredPart1(e.part1.topicName, e.test_no)).length})
          </button>
          <button
            onClick={() => setActiveTab("part2_3")}
            className={`px-5 py-3 font-extrabold rounded-lg border-2 border-black text-sm transition-all duration-150 active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] ${
              activeTab === "part2_3"
                ? "bg-[#3B5C37] text-white shadow-[3px_3px_0px_0px_#000]"
                : "bg-white text-black hover:bg-[#FAF9F5] shadow-[3px_3px_0px_0px_#000]"
            }`}
          >
            PART 2 + 3 ({exams.length})
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#3B5C37] stroke-[3px] mb-3" />
            <p className="font-extrabold text-sm text-[#3B5C37]">Đang tải kho đề thi Speaking...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-black/20 rounded-2xl bg-white/40">
            <p className="text-base font-extrabold text-gray-500">Không tìm thấy chủ đề nào phù hợp.</p>
          </div>
        ) : (
          <div className={activeTab === "part2_3" ? "grid md:grid-cols-2 gap-8" : "flex flex-col gap-6"}>
            
            {/* Render Items */}
            {filteredItems.map((exam, index) => {
              const examKey = exam.id;
              
              if (activeTab === "part1_req" || activeTab === "part1_topics") {
                const hasQs = exam.part1.questions && exam.part1.questions.length > 0;
                const isExpanded = !!expandedPart1[examKey];
                
                return (
                  <div 
                    key={examKey} 
                    className="border-2 border-black bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-5 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-black">
                          {index + 1}. {exam.part1.topicName}
                        </span>
                        <span className="hidden sm:inline-block rounded bg-[#FAF9F5] border border-black/20 px-2 py-0.5 text-[10px] font-black uppercase text-gray-500">
                          {exam.title.replace("Speaking Test", "Test")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Practice Button */}
                        <button
                          onClick={() => openPractice(exam)}
                          className="flex items-center gap-2 rounded-lg border-2 border-black bg-[#3B5C37] hover:bg-[#2d472a] px-4.5 py-2 text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
                        >
                          <Play className="h-3 w-3 fill-white text-white" />
                          Luyện tập
                        </button>

                        {/* Copy Questions Button */}
                        {hasQs && (
                          <button
                            onClick={() => copyToClipboard(exam.part1.questions.join("\n"), examKey)}
                            title="Sao chép danh sách câu hỏi"
                            className="p-2 border-2 border-black rounded-lg bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
                          >
                            {copiedId === examKey ? (
                              <Check className="h-4 w-4 text-green-600 stroke-[3px]" />
                            ) : (
                              <Copy className="h-4 w-4 stroke-[2.5px]" />
                            )}
                          </button>
                        )}

                        {/* Accordion Expand Button */}
                        {hasQs && (
                          <button
                            onClick={() => togglePart1(examKey)}
                            title="Xem chi tiết câu hỏi"
                            className="p-2 border-2 border-black rounded-lg bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 stroke-[3px]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 stroke-[3px]" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Part 1 Expanded Questions */}
                    {isExpanded && hasQs && (
                      <div className="bg-[#FAF9F5] border-t-2 border-black p-5">
                        <p className="text-xs font-black uppercase text-gray-500 tracking-wider mb-3">Danh sách câu hỏi Part 1 ({exam.part1.questions.length})</p>
                        <ul className="space-y-2.5">
                          {exam.part1.questions.map((q: string, qIdx: number) => (
                            <li key={qIdx} className="flex gap-2.5 text-sm font-semibold text-gray-800 leading-relaxed">
                              <span className="font-extrabold text-[#3B5C37]">{qIdx + 1}.</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              } else {
                // PART 2 + 3 Cards style
                const isPart3Expanded = !!expandedPart3[examKey];
                const hasPart3 = exam.part3.questions && exam.part3.questions.length > 0;
                
                return (
                  <div 
                    key={examKey} 
                    className="border-2 border-black bg-white rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <span className="rounded bg-[#FAF9F5] border border-black px-2 py-0.5 text-[9px] font-black uppercase text-gray-500">
                          {exam.title}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openPractice(exam)}
                            className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#3B5C37] hover:bg-[#2d472a] px-3.5 py-1.5 text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
                          >
                            <Play className="h-3 w-3 fill-white text-white" />
                            Luyện tập
                          </button>
                          
                          <button
                            onClick={() => {
                              const textToCopy = `Part 2 Cue Card:\n${exam.part2.cue_card}\n\nBullet points:\n${exam.part2.bullet_points.map((b: string) => `- ${b}`).join("\n")}`;
                              copyToClipboard(textToCopy, examKey);
                            }}
                            title="Sao chép Cue Card"
                            className="p-1.5 border-2 border-black rounded-lg bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
                          >
                            {copiedId === examKey ? (
                              <Check className="h-3.5 w-3.5 text-green-600 stroke-[3px]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 stroke-[2.5px]" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Part 2 Card Content */}
                      <h3 className="text-base font-black text-black mb-4 leading-snug">
                        {index + 1}. {exam.part2.cue_card}
                      </h3>
                      
                      <div className="border border-black/10 rounded-lg bg-[#FAF9F5]/70 p-4.5 mb-2">
                        <p className="text-[10px] font-black uppercase text-[#B38F4D] tracking-wider mb-2">You should say:</p>
                        <ul className="space-y-1.5">
                          {exam.part2.bullet_points.map((bullet: string, bIdx: number) => (
                            <li key={bIdx} className="flex gap-2 text-xs font-bold text-gray-700">
                              <span className="text-[#3B5C37] font-black">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Part 3 Expandable Footer Accordion */}
                    {hasPart3 && (
                      <div className="border-t-2 border-black">
                        <button
                          onClick={() => togglePart3(examKey)}
                          className="w-full flex items-center justify-between px-6 py-4 bg-[#FAF9F5] hover:bg-[#F2EFE8] transition-colors text-left"
                        >
                          <span className="text-xs font-black uppercase tracking-wider text-black">
                            Part 3 Questions ({exam.part3.questions.length})
                          </span>
                          {isPart3Expanded ? (
                            <ChevronUp className="h-4 w-4 stroke-[3px] text-black" />
                          ) : (
                            <ChevronDown className="h-4 w-4 stroke-[3px] text-black" />
                          )}
                        </button>

                        {isPart3Expanded && (
                          <div className="px-6 pb-6 pt-2 bg-white">
                            <ul className="space-y-3.5">
                              {exam.part3.questions.map((q: string, qIdx: number) => (
                                <li key={qIdx} className="flex gap-2.5 text-xs font-bold text-gray-800 leading-relaxed">
                                  <span className="font-extrabold text-[#3B5C37]">{qIdx + 1}.</span>
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}
      </main>

      {/* Select Practice Mode Dialog Modal */}
      {showPracticeModal && modalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-[480px] bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setShowPracticeModal(false)}
              className="absolute right-4 top-4 p-1.5 border-2 border-black rounded-lg bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
            >
              <X className="h-4 w-4 stroke-[3px]" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <span className="inline-flex rounded border-2 border-black bg-[#FAF9F5] px-2 py-0.5 text-[9px] font-black uppercase text-gray-500">
                {modalExam.title}
              </span>
              <h3 className="text-xl font-black text-black mt-2.5 leading-snug">
                Bắt đầu luyện Speaking
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-1 leading-relaxed">
                Chọn phần mà bạn muốn AI examiner bắt đầu phỏng vấn bạn.
              </p>
            </div>

            {/* Selection Grid */}
            <div className="flex flex-col gap-3">
              {/* Full Test Mode */}
              <Link
                href={`/speaking/test?examId=${modalExam.id}&mode=mock`}
                className="w-full flex items-center justify-between rounded-xl border-2 border-black bg-[#3B5C37] hover:bg-[#2d472a] p-4 text-left shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] transition-all no-underline text-white"
              >
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Thi thử đầy đủ (Mock Test)</h4>
                  <p className="text-xs font-bold text-white/75 mt-0.5">Trải nghiệm toàn bộ Part 1, Part 2, và Part 3 liền mạch.</p>
                </div>
                <ArrowRight className="h-5 w-5 stroke-[3px]" />
              </Link>

              {/* Part 1 Mode */}
              <Link
                href={`/speaking/test?examId=${modalExam.id}&mode=part1`}
                className="w-full flex items-center justify-between rounded-xl border-2 border-black bg-white hover:bg-gray-100 p-4 text-left shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] transition-all no-underline text-black"
              >
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Luyện tập Part 1</h4>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Trả lời các câu hỏi phỏng vấn ngắn về chủ đề: {modalExam.part1.topicName}.</p>
                </div>
                <ArrowRight className="h-5 w-5 stroke-[3px]" />
              </Link>

              {/* Part 2 Mode */}
              <Link
                href={`/speaking/test?examId=${modalExam.id}&mode=part2`}
                className="w-full flex items-center justify-between rounded-xl border-2 border-black bg-white hover:bg-gray-100 p-4 text-left shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] transition-all no-underline text-black"
              >
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Luyện tập Part 2</h4>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Đọc Cue card, chuẩn bị 1 phút và trình bày bài nói 2 phút.</p>
                </div>
                <ArrowRight className="h-5 w-5 stroke-[3px]" />
              </Link>

              {/* Part 3 Mode */}
              <Link
                href={`/speaking/test?examId=${modalExam.id}&mode=part3`}
                className="w-full flex items-center justify-between rounded-xl border-2 border-black bg-white hover:bg-gray-100 p-4 text-left shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] transition-all no-underline text-black"
              >
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Luyện tập Part 3</h4>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Thảo luận sâu sắc, nâng cao phản xạ học thuật.</p>
                </div>
                <ArrowRight className="h-5 w-5 stroke-[3px]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
