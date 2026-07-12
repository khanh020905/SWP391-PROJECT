"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  ChevronRight, 
  BookOpen, 
  Menu, 
  X, 
  Award, 
  Compass, 
  RefreshCw 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import TranslationCard from "@/components/writing/TranslationCard";
import { fetchTranslationTopics, fetchSentencesByTopic } from "@/services/writingTranslationService";
import { Topic, WritingPracticeSentence } from "@/types/writingTranslation";

// A lightweight custom useQuery hook that matches TanStack Query API signature.
// This allows dynamic data fetching, caching-like behavior, and error handling
// without needing extra NPM packages or root layout providers.
function useQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    queryFn()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(queryKey)]);

  return { data, isLoading, error };
}

export default function WritingTranslationPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const t = useTranslations("writingTranslation");

  // Mobile sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active topic & sentence states
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  // Track completed sentences in localStorage
  const [completedSentences, setCompletedSentences] = useState<Record<string, boolean>>({});

  // 1. Fetch translation topics
  const { data: topics, isLoading: isLoadingTopics, error: topicsError } = useQuery(
    ["topics"],
    fetchTranslationTopics
  );

  // Set initial topic once loaded
  useEffect(() => {
    if (topics && topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  // 2. Fetch sentences for selected topic
  const { data: sentences, isLoading: isLoadingSentences, error: sentencesError } = useQuery(
    ["sentences", selectedTopicId],
    () => (selectedTopicId ? fetchSentencesByTopic(selectedTopicId) : Promise.resolve([]))
  );

  // Reset index when topic changes
  useEffect(() => {
    setCurrentSentenceIndex(0);
  }, [selectedTopicId]);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("writing_translation_progress");
        if (stored) {
          setCompletedSentences(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load progress:", e);
      }
    }
  }, []);

  const handleNext = () => {
    if (!sentences) return;
    
    // Mark current sentence as completed
    const currentSentence = sentences[currentSentenceIndex];
    const newProgress = { ...completedSentences, [currentSentence.id]: true };
    setCompletedSentences(newProgress);
    localStorage.setItem("writing_translation_progress", JSON.stringify(newProgress));

    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    }
  };

  const activeSentence = sentences?.[currentSentenceIndex];

  // Calculate progress stats
  const totalSentences = sentences?.length || 0;
  const finishedCount = sentences?.filter(s => completedSentences[s.id]).length || 0;
  const progressPercent = totalSentences > 0 ? Math.round((finishedCount / totalSentences) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-[1200px] w-full px-4 md:px-6 pb-16 pt-24 flex flex-col">
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href={`/${locale}/writing`} 
            className="text-sm font-bold text-[#3B5C37] hover:underline flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> IELTS Writing Lobby
          </Link>

          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-[#1b3d1e] text-[#1b3d1e] font-extrabold text-xs shadow-[2px_2px_0px_#1b3d1e]"
          >
            <Menu className="w-4 h-4" />
            {t("sidebarTitle")}
          </button>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1b3d1e] tracking-tight">{t("title")}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{t("subtitle")}</p>
        </div>

        {/* Dynamic error / loading states */}
        {topicsError || sentencesError ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white border-2 border-[#1b3d1e] rounded-3xl p-12 text-center shadow-[4px_4px_0px_#1b3d1e]">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng thử lại.</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5C37] text-white font-bold rounded-xl text-sm hover:bg-[#2c472a] transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Tải lại trang
            </button>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
            {/* Sidebar / Left Column (Topic selection and Sentence Navigation) */}
            <aside 
              className={`
                fixed inset-0 z-40 bg-white p-6 border-r-2 border-[#1b3d1e] transition-transform duration-300 md:relative md:inset-auto md:z-0 md:bg-transparent md:p-0 md:border-r-0 md:translate-x-0 md:col-span-4
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              `}
            >
              <div className="flex flex-col h-full md:bg-white md:border-2 md:border-[#1b3d1e] md:rounded-3xl md:p-5 md:shadow-[4px_4px_0px_#1b3d1e]">
                {/* Mobile Close Button */}
                <div className="flex items-center justify-between mb-6 md:hidden">
                  <h3 className="font-black text-lg text-[#1b3d1e]">{t("sidebarTitle")}</h3>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded-lg border-2 border-gray-300 text-gray-500 hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Topic Selector */}
                <div className="mb-6">
                  <label className="block text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-2">
                    {t("selectTopic")}
                  </label>
                  {isLoadingTopics ? (
                    <div className="h-11 w-full bg-gray-100 animate-pulse rounded-xl" />
                  ) : (
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-[#ccd6c5] focus:border-[#3B5C37] rounded-xl text-sm font-bold outline-none cursor-pointer"
                    >
                      {topics?.map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Progress tracker */}
                <div className="mb-6 bg-[#f8f9fa] border border-gray-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center text-xs font-black text-[#3B5C37] mb-2">
                    <span>{t("progress").toUpperCase()}</span>
                    <span>{finishedCount}/{totalSentences}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#3B5C37] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1.5 block">
                    Hoàn thành {progressPercent}% câu dịch trong chủ đề.
                  </span>
                </div>

                {/* Sentences list */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-3">
                    {t("sidebarTitle")}
                  </h4>
                  
                  {isLoadingSentences ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-14 w-full bg-gray-100 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : !sentences || sentences.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 py-6 text-center">{t("noSentences")}</p>
                  ) : (
                    <div className="overflow-y-auto max-h-[360px] md:max-h-[420px] space-y-2 pr-1.5 scrollbar-thin">
                      {sentences.map((s, idx) => {
                        const isActive = idx === currentSentenceIndex;
                        const isDone = completedSentences[s.id];
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setCurrentSentenceIndex(idx);
                              setIsSidebarOpen(false); // Close mobile menu
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                              isActive
                                ? "bg-[#edf3e8] border-[#3B5C37] text-[#1b3d1e]"
                                : "bg-white border-gray-150 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-extrabold truncate">
                                Sentence {idx + 1}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                                {s.vi_content}
                              </p>
                            </div>
                            {isDone && (
                              <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Interactive Panel / Right Column */}
            <section className="md:col-span-8 flex flex-col w-full">
              {isLoadingSentences ? (
                <div className="bg-white border-2 border-[#1b3d1e] rounded-3xl p-6 md:p-8 space-y-6 animate-pulse">
                  <div className="h-4 w-1/4 bg-gray-100 rounded" />
                  <div className="h-20 w-full bg-gray-100 rounded-2xl" />
                  <div className="h-28 w-full bg-gray-100 rounded-2xl" />
                  <div className="h-12 w-full bg-gray-100 rounded-2xl" />
                </div>
              ) : activeSentence ? (
                <TranslationCard
                  sentence={activeSentence}
                  onNext={handleNext}
                  isLast={currentSentenceIndex === totalSentences - 1}
                />
              ) : (
                <div className="bg-white border-2 border-[#1b3d1e] rounded-3xl p-12 text-center shadow-[4px_4px_0px_#1b3d1e]">
                  <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-gray-500">{t("noSentences")}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </div>
  );
}
