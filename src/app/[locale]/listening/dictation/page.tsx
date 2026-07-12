"use client";

// IELTS Dictation hub — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/app/practice/listening/page.tsx).
// Lesson data is served statically from /data/dictation/index.json.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, BookHeadphones, ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { Bookshelf2D } from "@/components/listening/Bookshelf2D";
import { parseListeningGroups, CamVolume, DictationIndexEntry } from "@/lib/listening/dictationParser";

export default function ListeningDictationDirectory() {
  const [volumes, setVolumes] = useState<CamVolume[]>([]);
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
    async function loadIndex() {
      setLoading(true);
      try {
        const res = await fetch("/data/dictation/index.json");
        const entries: DictationIndexEntry[] = await res.json();
        setVolumes(parseListeningGroups(entries));
      } catch (err) {
        console.error("Failed to load dictation index:", err);
      }
      setLoading(false);
    }
    loadIndex();
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
              href="/listening"
              className="group flex items-center gap-3 bg-moss text-white border-2 border-transparent px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-herb-700 transition-all shadow-xl shadow-moss/20 hover:-translate-y-0.5 active:scale-95 w-full md:w-auto justify-center"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              Làm bài thi Cambridge đầy đủ ở đây
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
    </div>
  );
}
