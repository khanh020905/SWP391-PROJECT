"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Loader2, ChevronRight, PenLine, Sparkles, Target, Award, Layers, ArrowLeft, Pencil, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import TranslationExercise, { DichCauExerciseData } from "@/components/writing/TranslationExercise";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "@/lib/supabase";

interface DichCauExercise {
  id: string;
  exercise_id: string;
  title: string;
  band_target: string;
  order_index: number;
}

const TRANSLATION_STEPS = [
  {
    id: "Bước 1",
    title: "Cấu trúc câu cơ bản",
    desc: "Luyện dịch các câu đơn từ Việt sang Anh. Tập trung vào việc sử dụng đúng thì, mạo từ và cấu trúc câu S-V-O cơ bản.",
    tag: null,
    icon: PenLine,
    iconBg: "bg-blue-50 text-blue-500 border-blue-100",
    hoverBorder: "hover:border-blue-300 hover:shadow-blue-100",
  },
  {
    id: "Bước 2",
    title: "Collocations & Vocab",
    desc: "Dịch từ Anh sang Việt để nắm vững các cụm từ (collocations) và từ vựng học thuật theo ngữ cảnh thực tế.",
    tag: { text: "VOCAB", bg: "bg-red-50 text-red-500 border-red-100" },
    icon: Sparkles,
    iconBg: "bg-rose-50 text-rose-500 border-rose-100",
    hoverBorder: "hover:border-rose-300 hover:shadow-rose-100",
  },
  {
    id: "Bước 3",
    title: "Dịch đoạn văn Band 6.5",
    desc: "Luyện dịch các đoạn văn ngắn từ Việt sang Anh với mục tiêu đạt độ chính xác và mạch lạc ở mức Band 6.5.",
    tag: { text: "BAND 6.5", bg: "bg-amber-50 text-amber-600 border-amber-100" },
    icon: Target,
    iconBg: "bg-amber-50 text-amber-500 border-amber-100",
    hoverBorder: "hover:border-amber-300 hover:shadow-amber-100",
  },
  {
    id: "Bước 4",
    title: "Dịch đoạn văn Band 8.0",
    desc: "Thử thách dịch các đoạn văn phức tạp, yêu cầu sử dụng từ vựng ít phổ biến và cấu trúc câu linh hoạt của Band 8.0.",
    tag: { text: "BAND 8.0", bg: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    icon: Award,
    iconBg: "bg-indigo-50 text-indigo-500 border-indigo-100",
    hoverBorder: "hover:border-indigo-300 hover:shadow-indigo-100",
  },
  {
    id: "Bước 5",
    title: "Dịch Essay hoàn chỉnh",
    desc: "Luyện dịch nguyên một bài Essay từ dàn ý tiếng Việt sang bài viết tiếng Anh học thuật hoàn chỉnh.",
    tag: { text: "PREMIUM", bg: "bg-purple-50 text-purple-600 border-purple-100" },
    icon: Layers,
    iconBg: "bg-purple-50 text-purple-500 border-purple-100",
    hoverBorder: "hover:border-purple-300 hover:shadow-purple-100",
  },
];

const PatternBlock = ({ c1, c2, c3, c4, c5 }: any) => (
  <div className="absolute top-0 right-0 h-full w-[70%] sm:w-[55%] md:w-[45%] grid grid-cols-4 grid-rows-3 opacity-[0.85] mix-blend-multiply pointer-events-none">
    {/* Row 1 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute bottom-0 right-0 w-[80%] h-[80%] rounded-tl-full ${c3}`} />
    </div>
    <div className={`relative overflow-hidden ${c2}`}>
      <div className={`absolute bottom-0 left-0 w-[120%] h-[120%] rounded-tr-full ${c1}`} />
    </div>
    <div className={`relative overflow-hidden ${c3}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c4}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-0 right-0 w-full h-full rounded-bl-full ${c2}`} />
    </div>

    {/* Row 2 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[60%] h-[100%] rounded-l-full ${c5}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full ${c1}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c1}`}>
      <div className={`absolute bottom-0 right-0 w-full h-full rounded-tl-full ${c3}`} />
    </div>
    <div className={`relative overflow-hidden ${c5}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c1}`} />
    </div>

    {/* Row 3 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-[90%] h-[90%] rounded-bl-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c1}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c2}`}>
      <div className={`absolute bottom-0 right-0 w-full h-full rounded-tl-full ${c5}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c3}`} />
    </div>
  </div>
);

const PurplePattern = () => {
  const colors = {
    c1: 'bg-[#A28EC8]', 
    c2: 'bg-[#4B3D84]', 
    c3: 'bg-[#7664A9]', 
    c4: 'bg-[#3D2F6B]', 
    c5: 'bg-[#2B204F]'
  }; 

  return <PatternBlock {...colors} />;
};

const TOPICS = [
  "Education", "Environment", "Technology", "Health", "Work", 
  "Government", "Crime", "Family & Children", "Media", "Society"
];
const LEVELS = ["Tập trung vào collocation", "Band 6.5", "Band 8.0"];
const LENGTHS = ["10", "20", "30"];

export default function TranslationHubPage() {
  const [dichCauExercises, setDichCauExercises] = useState<DichCauExercise[]>([]);
  const [dichCauLoading, setDichCauLoading] = useState(true);
  const [selectedBuoc, setSelectedBuoc] = useState("Bước 1");
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState<DichCauExerciseData | null>(null);
  const [generationError, setGenerationError] = useState("");

  const getStepExerciseCount = (stepId: string) => {
    return dichCauExercises.filter((ex) => ex.band_target === stepId).length;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: topics, error } = await supabase
          .from("topics")
          .select("*")
          .eq("category", "writing_translation");

        if (error) throw error;

        const parseMeta = (desc: string) => {
          try {
            return JSON.parse(desc);
          } catch {
            return { en: desc, exercise_id: "", band_target: "Bước 1", order_index: 0 };
          }
        };

        const mapped = (topics || []).map((topic: any) => {
          const meta = parseMeta(topic.description);
          return {
            id: topic.id,
            exercise_id: meta.exercise_id || topic.id,
            title: topic.name,
            band_target: meta.band_target || "Bước 1",
            order_index: meta.order_index || 0,
          };
        }).sort((a: any, b: any) => a.order_index - b.order_index);

        setDichCauExercises(mapped);
      } catch (err) {
        console.error("Failed to load topics from Supabase:", err);
        setDichCauExercises([]);
      } finally {
        setDichCauLoading(false);
      }
    }

    loadData();

    setIsLoggedIn(true);
    setUserRole("tidian");
  }, []);

  const isTidian = ["tidian", "super_admin", "content_editor"].includes(userRole ?? "");

  const handleGenerate = async () => {
    if (!isLoggedIn || !isTidian) {
      setGenerationError("Tính năng này hiện đang được dành riêng cho Tidians, bạn vui lòng làm các bài mà chúng mình biên soạn sẵn nha 🙏");
      return;
    }
    
    if (!selectedTopic || !selectedLevel || !selectedLength) return;
    
    setIsGenerating(true);
    setGenerationError("");
    
    try {
      const res = await fetch("/api/generate-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          level: selectedLevel,
          sentenceCount: parseInt(selectedLength)
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      setGeneratedExercise({
        id: "custom_generated",
        exercise_id: `custom_${Date.now()}`,
        title: `Chủ đề: ${selectedTopic} - ${selectedLevel}`,
        band_target: selectedLevel,
        topic: { en: `Bài dịch tự tạo về ${selectedTopic} (${selectedLength} câu)` },
        sentences: data.sentences || []
      });
      
      setShowGeneratorModal(false);
    } catch (error: any) {
      setGenerationError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedExercise) {
    return (
      <div className="min-h-screen">
        <TranslationExercise 
          exercise={generatedExercise} 
          onBack={() => setGeneratedExercise(null)} 
          storageKeyId={generatedExercise.exercise_id} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] font-sans w-full pb-20 pt-32 overflow-x-clip">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <Link href="/writing" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trở về Luyện Writing
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-pink-500 mb-3">
            <PenLine size={16} />
            <span className="uppercase tracking-widest">Translation Hub</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
            Tập dịch <span className="text-pink-500">IELTS</span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-500">
            Luyện tập dịch từ Việt sang Anh giúp bạn củng cố ngữ pháp, từ vựng và tư duy viết chuẩn học thuật.
          </p>
        </div>

        {selectedStep === null ? (
          /* Step Selection View */
          <div className="space-y-4">
            {TRANSLATION_STEPS.map((step) => {
              const StepIcon = step.icon;
              const count = getStepExerciseCount(step.id);
              const isGrammarStep = "href" in step;

              const cardContent = (
                <div className={`group bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer ${(step as any).hoverBorder || "hover:border-slate-300"}`}>
                  <div className="flex items-center gap-5">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${step.iconBg} transition-transform group-hover:scale-105 duration-200`}>
                      <StepIcon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          {step.id}
                        </span>
                        {step.tag && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider border ${step.tag.bg}`}>
                            {step.tag.text}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                    {isGrammarStep ? (
                      <>
                        <span>Học ngay</span>
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    ) : (
                      <>
                        <span>{count} mục</span>
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </div>
              );

              return isGrammarStep ? (
                <Link key={step.id} href={(step as any).href}>
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={step.id}
                  onClick={() => {
                    setSelectedStep(step.id);
                    setSelectedBuoc(step.id);
                  }}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        ) : (
          /* Step Detail View */
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setSelectedStep(null)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-pink-500 hover:text-pink-700 transition-colors uppercase tracking-widest"
              >
                <ChevronRight size={14} className="rotate-180" />
                Quay lại danh sách bước
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {TRANSLATION_STEPS.filter((step) => !("href" in step)).map((step) => {
                const isActive = selectedStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setSelectedStep(step.id);
                      setSelectedBuoc(step.id);
                    }}
                    className={`flex flex-col items-start rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                      isActive
                        ? "border-pink-500 bg-pink-500 text-white shadow-[3px_3px_0_rgba(0,0,0,1)]"
                        : "border-black bg-white text-slate-700 hover:border-pink-400 hover:text-pink-700"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">{step.id}</span>
                    <span className={`text-[11px] font-bold ${isActive ? "text-pink-100" : "text-slate-500"}`}>
                      {step.title.split(" Band")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Count info */}
            {(() => {
              const filtered = dichCauExercises.filter((ex) => ex.band_target === selectedStep);
              return (
                <>
                  <p className="mb-4 text-[11px] font-black uppercase tracking-[3px] text-pink-400">
                    {filtered.length} CHỦ ĐỀ
                  </p>

                  {dichCauLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="animate-spin text-pink-300" size={20} />
                    </div>
                  ) : filtered.length > 0 ? (
                    <div className="space-y-4">
                      {filtered.map((ex, i) => (
                        <Link key={ex.id} href={`/writing/dich-cau/${ex.id}`}>
                          <div className="group flex items-center justify-between rounded-2xl border-2 border-pink-400 bg-pink-50 p-5 shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-pink-300 bg-white text-pink-500 font-black text-sm">
                                {i + 1}
                              </div>
                              <div>
                                <h3 className="text-base font-black text-slate-900">{ex.title}</h3>
                                <span className="mt-0.5 inline-block rounded-full bg-pink-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-pink-800">
                                  {selectedStep} · Nhấn từ để xem gợi ý
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-pink-400 group-hover:text-pink-600 transition-colors">
                              Thử ngay
                              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-pink-200 py-10 text-center">
                      <PenLine size={32} className="mx-auto mb-3 text-pink-200" />
                      <p className="text-sm font-bold text-slate-400">Chưa có bài tập nào trong mục này.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* AI Generation Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => setShowGeneratorModal(true)}
          className="mt-10 mb-8 cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative min-h-[280px] w-full"
          style={{ backgroundColor: '#FCF3E3' }}
        >
          {/* Noise Texture */}
          <div
            className="absolute inset-0 z-0 opacity-[0.4] mix-blend-multiply pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />

          {/* Background Shapes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <svg className="absolute -top-[20%] -left-[5%] w-[40%] h-[60%] text-[#FF7676] fill-current" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M0,0 L100,0 C120,20 130,50 110,80 C90,110 50,120 20,100 C-10,80 -10,30 0,0 Z" />
            </svg>
            <svg className="absolute -top-[10%] left-[25%] w-[35%] h-[40%] text-[#B4E542] fill-current" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M20,0 C80,10 100,50 80,90 C60,130 10,100 0,60 C-10,20 0,0 20,0 Z" />
            </svg>
            <svg className="absolute -top-[5%] right-0 w-[40%] h-[50%] text-[#FF9B37] fill-current" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M50,0 C100,0 150,20 180,60 C210,100 150,150 100,120 C50,90 0,50 50,0 Z" />
            </svg>
            <svg className="absolute -bottom-[5%] left-[20%] w-[50%] h-[40%] text-[#FF5D8F] fill-current" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M0,100 C30,70 60,110 100,80 C140,50 180,90 200,60 L200,150 L0,150 Z" />
            </svg>
            <svg className="absolute top-[10%] -right-[5%] w-[50%] h-[120%] text-[#45C8A1] fill-current opacity-90" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M100,0 C160,20 180,80 150,140 C120,200 60,180 20,140 C-20,100 40,-20 100,0 Z" />
            </svg>
            <svg className="absolute -bottom-[20%] -left-[10%] w-[35%] h-[60%] text-[#2AC4A3] fill-current" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M50,50 C100,20 150,80 120,130 C90,180 20,150 0,100 C-20,50 0,80 50,50 Z" />
            </svg>
            <div className="absolute top-[30%] left-[2%] w-[20%] h-[40%] opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '15px 15px' }} />
            <div className="absolute top-[5%] right-[25%] w-[25%] h-[30%] opacity-[0.2] rounded-full overflow-hidden" style={{ backgroundImage: 'radial-gradient(black 2.5px, transparent 2.5px)', backgroundSize: '16px 16px' }} />
            <svg className="absolute top-[15%] left-[5%] w-20 h-16 text-black opacity-80" viewBox="0 0 100 100">
              <path fill="none" stroke="currentColor" strokeWidth="3" d="M0,30 Q12,15 25,30 T50,30 T75,30 T100,30" />
              <path fill="none" stroke="currentColor" strokeWidth="3" d="M0,50 Q12,35 25,50 T50,50 T75,50 T100,50" />
              <path fill="none" stroke="currentColor" strokeWidth="3" d="M0,70 Q12,55 25,70 T50,70 T75,70 T100,70" />
            </svg>
            <svg className="absolute top-[10%] left-[30%] w-32 h-10 text-black" viewBox="0 0 100 20">
              <polygon points="10,10 15,18 20,10" fill="currentColor" />
              <polygon points="30,10 35,18 40,10" fill="currentColor" />
              <polygon points="50,10 55,18 60,10" fill="currentColor" />
              <polygon points="70,10 75,18 80,10" fill="currentColor" />
              <polygon points="90,10 95,18 100,10" fill="currentColor" />
            </svg>
            <div className="absolute top-[15%] right-[10%] w-[30%] h-[70%] pointer-events-none transform -rotate-12 z-10 drop-shadow-2xl hidden md:block">
              <svg viewBox="0 0 100 400" className="w-full h-full text-black fill-current drop-shadow-lg">
                <path d="M20,0 L80,0 C90,0 100,10 100,20 L100,250 C100,260 95,270 90,280 L55,340 C52,345 48,345 45,340 L10,280 C5,270 0,260 0,250 L0,20 C0,10 10,0 20,0 Z" />
                <path d="M45,340 L55,340 L50,370 Z" fill="#FCF3E3" />
                <path d="M10,250 L90,250" stroke="#FCF3E3" strokeWidth="4" />
                <path d="M30,0 L30,250 M70,0 L70,250" stroke="#FCF3E3" strokeWidth="4" />
              </svg>
            </div>
          </div>

          <div className="relative z-20 flex items-center h-full p-8 sm:p-12 gap-6 sm:gap-8 max-w-[70%]">
            <div className="w-[84px] h-[84px] bg-[#E9F3E5] rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[#C8E6C9] group-hover:scale-105 transition-transform duration-300">
              <Pencil size={42} className="text-[#196B35]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[13px] font-black uppercase tracking-widest text-slate-500/80">TỰ TẠO</span>
                <span className="rounded-full bg-[#E5F4E7] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#156730]">MỚI</span>
              </div>
              <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] text-[#1D1D1F] mb-3 leading-tight">
                Tự tạo bài của chính mình
              </h2>
              <p className="text-[#6E6E73] text-[15px] sm:text-[16px] max-w-md leading-[1.6] font-medium">
                Tự thiết kế chủ đề, viết và luyện dịch theo ý bạn.<br className="hidden sm:block" /> Biến ý tưởng thành bài học của riêng bạn.
              </p>
            </div>
          </div>
        </motion.div>

        {/* TID Support Banner */}
        <div className="mt-6 relative overflow-hidden bg-[#4B3D84] rounded-2xl p-8 md:p-10 flex flex-col justify-center shadow-md group">
          <PurplePattern />
          <div className="relative z-10 w-full md:w-[65%]">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">TID support</h2>
            <p className="text-white/85 font-medium text-[15px] md:text-base leading-relaxed mb-8">
              Nếu bạn đã dịch hết các bài này,<br className="hidden sm:block" />
              và muốn chúng mình cập nhật thêm bài<br className="hidden sm:block" />
              để các bạn luyện tập tiếp, thì cứ nhắn<br className="hidden sm:block" />
              trực tiếp cho facebook TID ở đây nha ♥
            </p>
            <a 
              href="https://web.facebook.com/onthiieltss" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#7869A5] text-white px-6 py-2.5 rounded-full font-bold inline-flex items-center gap-2 hover:bg-[#685891] transition-colors shadow-sm w-fit"
            >
              Nhắn tin cho TID <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>

      {/* Generator Modal */}
      <AnimatePresence>
        {showGeneratorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isGenerating && setShowGeneratorModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-black"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <Pencil size={24} className="text-pink-500" />
                  Tạo bài dịch của bạn
                </h3>
                <button 
                  onClick={() => !isGenerating && setShowGeneratorModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-pink-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-pink-200 animate-pulse opacity-50" />
                      <Loader2 size={40} className="text-pink-500 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest animate-pulse">
                      TID đang nấu bài cho bạn... 🔥
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Group A: Topic */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                        Bạn muốn tạo bài viết về đề gì?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => setSelectedTopic(topic)}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                              selectedTopic === topic
                                ? "border-black bg-pink-500 text-white shadow-[3px_3px_0_rgba(0,0,0,1)]"
                                : "border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-500"
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Group B: Level */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                        Bạn muốn tạo bài dịch trình độ nào?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {LEVELS.map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                              selectedLevel === level
                                ? "border-black bg-pink-500 text-white shadow-[3px_3px_0_rgba(0,0,0,1)]"
                                : "border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-500"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Group C: Length */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                        Bạn muốn dịch bao nhiêu câu?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {LENGTHS.map((len) => (
                          <button
                            key={len}
                            onClick={() => setSelectedLength(len)}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                              selectedLength === len
                                ? "border-black bg-pink-500 text-white shadow-[3px_3px_0_rgba(0,0,0,1)]"
                                : "border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-500"
                            }`}
                          >
                            {len} câu
                          </button>
                        ))}
                      </div>
                    </div>

                    {generationError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                        {generationError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isGenerating && (
                <div className="p-6 border-t border-slate-100">
                  <button
                    disabled={!selectedTopic || !selectedLevel || !selectedLength}
                    onClick={handleGenerate}
                    className="w-full bg-pink-500 text-white font-black uppercase tracking-[2px] py-4 rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:border-slate-300 disabled:shadow-none disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Let TID Cook 🔥
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
