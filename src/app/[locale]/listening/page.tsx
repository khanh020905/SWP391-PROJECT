"use client";

// Listening hub — exact UI port from The IELTS Dictionary
// (Website-Ielts frontend/src/app/practice/listening/page.tsx).
// Cambridge full tests come from this project's `exams` table;
// dictation lessons come from the static /data/dictation/index.json.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, BookHeadphones, ArrowRight, ClipboardList, Star, CheckCircle2, Pencil, Clock, ChevronRight, Headphones, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { Bookshelf2D } from "@/components/listening/Bookshelf2D";
import { parseListeningGroups, CamVolume, DictationIndexEntry } from "@/lib/listening/dictationParser";
import { useSubscription } from "@/hooks/useSubscription";
import { VipUpgradeModal } from "@/components/VipGate";

interface CamTestEntry {
  testId: string;
  testName: string;
  volume: number;
  testNumber: number;
  hasAudio: boolean;
}

export default function ListeningDirectory() {
  const { isVip } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [volumes, setVolumes] = useState<CamVolume[]>([]);
  const [camTests, setCamTests] = useState<CamTestEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const listeningCategories = [
    { id: "all", name: "Tất cả" },
    { id: "cambridge", name: "Cambridge" },
    { id: "spelling", name: "Spelling" },
    { id: "numbers", name: "Numbers" },
    { id: "ipa", name: "Pronunciation" },
    { id: "conversations", name: "Conversations" },
  ];

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [dictResult, camResult] = await Promise.all([
        fetch("/data/dictation/index.json").then((r) => r.json()).catch(() => null),
        fetch("/data/cam-tests/index.json").then((r) => r.json()).catch(() => null),
      ]);

      if (dictResult) {
        setVolumes(parseListeningGroups(dictResult as DictationIndexEntry[]));
      } else {
        console.error("Failed to load dictation index");
      }

      if (camResult) {
        const mapped: CamTestEntry[] = (camResult as {
          test_id: string; test_name: string; volume: number; test_number: number; has_audio: boolean;
        }[]).map((t) => ({
          testId: t.test_id,
          testName: t.test_name,
          volume: t.volume,
          testNumber: t.test_number,
          hasAudio: t.has_audio,
        }));
        setCamTests(mapped);
      } else {
        console.error("Failed to load cam tests index");
      }
      setLoading(false);
    }

    loadAll();
  }, []);

  const filteredVolumes = volumes.filter(vol => {
    // 1. Search Query Filter
    const matchesSearch = vol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(vol.tests).some(tasks =>
        tasks.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    if (!matchesSearch) return false;

    // 2. Category Filter
    if (selectedCategory === "all") return true;
    if (selectedCategory === "cambridge") return vol.id.startsWith("cam");
    return vol.id === selectedCategory;
  });

  // Limit initial view to the most recent volumes
  const displayedVolumes = showAll || searchQuery ? filteredVolumes : filteredVolumes.slice(0, 6);

  return (
    <div className="min-h-screen bg-white font-sans w-full overflow-x-clip relative">
      <Navbar />

      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-herb-100/30 pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-herb-200/20 rounded-full blur-[100px] -z-10" />

      <main className="max-w-6xl mx-auto px-6 py-28 relative z-10 w-full">
        {/* Header section */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center justify-center space-x-2 bg-herb-50 text-herb-700 px-4 py-2 rounded-full mb-4 border border-herb-100">
            <BookHeadphones className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-[2px]">Listening Practice Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-moss mb-4 tracking-tight leading-tight">
            IELTS <span className="text-herb-600">Dictation</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl font-medium">
            Luyện nghe chép chính tả IELTS Listening với dữ liệu đề thi Cambridge mới nhất. Rèn luyện kỹ năng bắt âm và tránh sai sót.
          </p>

          <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
            <Link
              href="/speaking/shadowing?mode=dictation"
              className="group flex items-center gap-3 bg-moss text-white border-2 border-transparent px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-herb-700 transition-all shadow-xl shadow-moss/20 hover:-translate-y-0.5 active:scale-95 w-full md:w-auto justify-center"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              Luyện dictation video youtube ở đây
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
            </Link>

            <button
              onClick={() => {
                setSelectedCategory('cambridge');
                document.getElementById('library-archives')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex items-center gap-3 bg-white text-moss border-2 border-moss px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-moss hover:text-white transition-all shadow-lg hover:shadow-xl hover:shadow-moss/20 hover:-translate-y-0.5 active:scale-95 w-full md:w-auto justify-center"
            >
              <div className="w-8 h-8 bg-moss/10 group-hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                <BookHeadphones className="w-4 h-4" />
              </div>
              Luyện dictation Cambridge ở đây
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
            </button>
          </div>
        </div>

        {/* Cambridge Full Tests Section */}
        {camTests.length > 0 && (
          <div className="mb-14 relative">
            <div>
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-black text-moss uppercase tracking-[3px]">
                Cambridge Full Tests
              </h2>
              <span className="bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                Thi thật
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-6 max-w-xl">
              Làm bài thi nghe IELTS Cambridge đầy đủ — nghe audio một lần, trả lời 40 câu hỏi như thi thật.
            </p>

            {/* Group by volume */}
            {Array.from(new Set(camTests.map((t) => t.volume))).map((vol, volIdx) => {
              const testsInVol = camTests.filter((t) => t.volume === vol);
              return (
                <div key={vol} className="mb-10">
                  <div className="flex items-center gap-4 mb-5">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-widest">
                      Cambridge IELTS {vol}
                    </h3>
                    <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm shadow-blue-200/50 hidden sm:inline-block">
                      Giao diện giống thi thật 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {testsInVol.map((t, idx) => {
                      const isLocked = !isVip && (volIdx > 0 || idx > 0);
                      const cardColors = [
                        { bg: "bg-[#d97736]", btnIconBg: "bg-orange-100", btnIconColor: "text-orange-600" },
                        { bg: "bg-[#cf6a93]", btnIconBg: "bg-pink-100", btnIconColor: "text-pink-600" },
                        { bg: "bg-[#cc665c]", btnIconBg: "bg-red-100", btnIconColor: "text-red-600" },
                        { bg: "bg-[#8668c6]", btnIconBg: "bg-purple-100", btnIconColor: "text-purple-600" }
                      ];
                      const testIndex = (t.testNumber - 1) % 4;
                      const theme = cardColors[testIndex];

                      // Fake play count starting in tens of thousands
                      const playCount = 35000 + (t.volume * 1000) + (t.testNumber * 123);

                      const renderBackgroundPattern = () => {
                        switch (testIndex) {
                          case 0: // Orange - Thick wavy brush strokes
                            return (
                              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id={`pattern-${t.testId}`} width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                                    <path d="M0,50 Q25,25 50,50 T100,50" fill="none" stroke="white" strokeWidth="15" strokeLinecap="round" opacity="0.6"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#pattern-${t.testId})`}/>
                              </svg>
                            );
                          case 1: // Pink - Intersecting curves
                            return (
                              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id={`pattern-${t.testId}`} width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
                                    <path d="M-20,60 Q40,0 140,60 M-20,100 Q40,40 140,100" fill="none" stroke="white" strokeWidth="20" strokeLinecap="round" opacity="0.5"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#pattern-${t.testId})`}/>
                              </svg>
                            );
                          case 2: // Red - Dashes / sprinkles
                            return (
                              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id={`pattern-${t.testId}`} width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                    <path d="M10,10 l0,15 M40,30 l0,15 M25,50 l0,15" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.6"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#pattern-${t.testId})`}/>
                              </svg>
                            );
                          case 3: // Purple - Rain / straight lines
                            return (
                              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id={`pattern-${t.testId}`} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                                    <path d="M20,-20 l0,120 M60,-20 l0,120" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.5"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#pattern-${t.testId})`}/>
                              </svg>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <div key={t.testId} className={`relative flex flex-col rounded-3xl p-5 ${theme.bg} text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
                          {/* Background Pattern */}
                          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay">
                            {renderBackgroundPattern()}
                          </div>

                          {/* Header */}
                          <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="text-[11px] font-medium opacity-90 tracking-widest">
                              the | ielts | dictionary
                            </div>
                            <div className="flex items-center gap-2">
                              {!t.hasAudio && (
                                <span className="text-[8px] bg-black/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                  No audio
                                </span>
                              )}
                              {isLocked ? (
                                <Lock className="w-5 h-5 opacity-90" />
                              ) : (
                                <Headphones className="w-5 h-5 opacity-90" />
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-[3.25rem] font-black mb-6 relative z-10 tracking-tight drop-shadow-sm uppercase" style={{ fontFamily: '"Cooper Black", "Fraunces", "Georgia", serif' }}>
                            TEST {t.testNumber}
                          </h4>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-[13px] font-medium mb-6 relative z-10 opacity-90">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{playCount.toLocaleString()} lượt nghe</span>
                            </div>
                            <div className="w-px h-3 bg-white/40"></div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>80%</span>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
                            {isLocked ? (
                              <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="col-span-2 flex items-center justify-center gap-2 bg-[#fdfaf6] text-slate-400 rounded-xl py-3 border border-gray-200 cursor-pointer hover:bg-slate-50 transition"
                              >
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-[11px] font-black uppercase">ĐÃ KHÓA (VIP ONLY)</span>
                              </button>
                            ) : (
                              <>
                                <Link
                                  href={`/listening/cam-test/${t.testId}?mode=practice`}
                                  className="flex items-center justify-between bg-[#fdfaf6] text-slate-800 rounded-xl px-2 py-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-6 h-6 shrink-0 rounded-full ${theme.btnIconBg} flex items-center justify-center ${theme.btnIconColor}`}>
                                      <Pencil className="w-3 h-3" />
                                    </div>
                                    <span className="text-[11px] font-black whitespace-nowrap">Luyện tập</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                </Link>

                                <Link
                                  href={`/listening/cam-test/${t.testId}?mode=real_test`}
                                  className="flex items-center justify-between bg-[#fdfaf6] text-slate-800 rounded-xl px-2 py-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-6 h-6 shrink-0 rounded-full ${theme.btnIconBg} flex items-center justify-center ${theme.btnIconColor}`}>
                                      <Clock className="w-3 h-3" />
                                    </div>
                                    <span className="text-[11px] font-black whitespace-nowrap">Thi thật</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="border-b border-gray-100 mt-8" />
            </div>{/* end cambridge dimmer */}

          </div>
        )}

        {/* Bookshelf Section */}
        <div className="mb-10" id="library-archives">
          <div className="flex flex-col space-y-6 mb-8 border-b border-gray-100 pb-8">
            <h2 className="text-xl font-black text-moss uppercase tracking-[3px] flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-herb-600" />
              Library Archives
            </h2>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2">
                {listeningCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedCategory === cat.id
                        ? "bg-moss text-white shadow-lg shadow-moss/20 scale-105"
                        : "bg-white text-slate-400 border border-slate-100 hover:border-moss/30 hover:text-moss"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-80 shadow-sm rounded-xl group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-herb-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-herb-500 focus:border-herb-500 sm:text-sm transition-all duration-300"
                  placeholder="Tìm bài nghe (VD: Cam 20)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-herb-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-slate-400 font-bold animate-pulse text-[10px] uppercase tracking-[10px] ml-[10px]">Đang tải thư viện...</p>
            </div>
          ) : (
            <div className="space-y-12">
              <Bookshelf2D volumes={displayedVolumes} />

              {!showAll && !searchQuery && filteredVolumes.length > 6 && (
                <div className="flex flex-col items-center pt-8 border-t border-gray-50">
                  <p className="text-slate-400 text-sm font-medium mb-6 italic">
                    Khám phá thêm các bài nghe khác trong kho lưu trữ...
                  </p>
                  <button
                    onClick={() => setShowAll(true)}
                    className="group relative px-10 py-4 bg-white border-2 border-moss text-moss font-black rounded-full overflow-hidden transition-all hover:bg-moss hover:text-white active:scale-95 shadow-lg hover:shadow-moss/20"
                  >
                    <span className="relative z-10 flex items-center uppercase tracking-widest text-xs">
                      Xem thêm tài liệu Cambridge
                      <motion.span
                        animate={{ y: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="ml-2"
                      >
                        ↓
                      </motion.span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {showUpgradeModal && <VipUpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
