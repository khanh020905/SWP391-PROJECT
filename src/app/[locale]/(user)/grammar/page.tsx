"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { BookOpen, BookOpenCheck, Clock, Zap, RefreshCw, Hash, Star, Shield, HelpCircle, Layers } from "lucide-react";

interface LessonItem {
  id: string;
  lesson_id: string;
  title: string;
  band: string;
  order_index: number;
}

const PASTEL_COLORS = [
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200"
];

const ICONS = [Zap, Clock, RefreshCw, Hash, Star, Shield, HelpCircle, Layers];

export default function GrammarListPage() {
  const router = useRouter();
  const locale = useLocale();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [selectedBand, setSelectedBand] = useState<string>("Tất cả");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      try {
        setLoading(true);
        const res = await fetch("/api/grammar");
        if (!res.ok) throw new Error("Không thể tải danh sách bài học");
        const data = await res.json();
        setLessons(data.lessons || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu bài học ngữ pháp:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLessons();
  }, []);

  // Filter bands: unique values from lessons data
  const bands = ["Tất cả", ...Array.from(new Set(lessons.map((l) => l.band)))].sort((a, b) => {
    if (a === "Tất cả") return -1;
    if (b === "Tất cả") return 1;
    return parseFloat(a) - parseFloat(b);
  });

  const filteredLessons = lessons.filter(
    (l) => selectedBand === "Tất cả" || l.band === selectedBand
  );

  // Group lessons: Basic (Band < 6.0) vs Advanced (Band >= 6.0)
  const basicLessons = filteredLessons.filter((l) => parseFloat(l.band) < 6.0);
  const advancedLessons = filteredLessons.filter((l) => parseFloat(l.band) >= 6.0);

  return (
    <div className="min-h-screen bg-[#F5F3EE] p-6 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* ================= HEADER ================= */}
        <header className="mb-10">
          <p className="text-purple-600 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 mb-2">
            <BookOpenCheck className="w-4 h-4" /> GRAMMAR
          </p>
          <h1 className="leading-none">
            <span className="text-black font-black text-5xl tracking-tight">GRAMMAR </span>
            <span className="text-purple-600 font-black text-5xl tracking-tight">REFERENCE</span>
          </h1>
          <p className="text-gray-500 text-sm font-semibold mt-4 max-w-2xl leading-relaxed">
            Hệ thống ngữ pháp IELTS bài bản từ B1 đến B6 (Band 5.0 - 7.5+). Mỗi bài học gồm quy tắc lý thuyết chi tiết, ví dụ trực quan và bài tập ôn tập thực tế giúp bạn nhanh chóng nâng band điểm.
          </p>
        </header>

        {/* ================= FILTER TABS ================= */}
        <div className="flex flex-wrap gap-2.5 mb-10 pb-4 border-b border-gray-200/50">
          {bands.map((band) => (
            <button
              key={band}
              onClick={() => setSelectedBand(band)}
              className={`px-5 py-2 text-xs font-black tracking-wide uppercase transition-all duration-200 ${
                selectedBand === band
                  ? "bg-purple-600 text-white rounded-full shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
              }`}
            >
              {band === "Tất cả" ? "Tất cả trình độ" : `Band ${band}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 font-semibold text-xs">
            <div className="w-9 h-9 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mb-3" />
            Đang tải dữ liệu bài học ngữ pháp...
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ================= BASIC GRAMMAR SECTION ================= */}
            {basicLessons.length > 0 && (
              <div>
                <p className="text-purple-600 text-xs font-black tracking-widest uppercase mb-4">
                  □ BASIC GRAMMAR (BAND 5.0 - 5.5)
                </p>
                <div className="space-y-3">
                  {basicLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      onClick={() => router.push(`/${locale}/grammar/${lesson.lesson_id}`)}
                      className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    >
                      {/* Number Indicator */}
                      <div className="w-10 h-10 rounded-full border border-purple-300 bg-purple-50/50 flex items-center justify-center text-sm font-black text-purple-700 shrink-0">
                        {lesson.order_index}
                      </div>

                      {/* Title + Band */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-gray-900 truncate tracking-tight">{lesson.title}</p>
                        <span className="inline-block text-[9.5px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                          Band {lesson.band}
                        </span>
                      </div>

                      {/* Action */}
                      <span className="text-gray-400 font-extrabold text-xs shrink-0 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                        Học ngay <span className="text-sm">→</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= ADVANCED GRAMMAR SECTION ================= */}
            {advancedLessons.length > 0 && (
              <div>
                <p className="text-purple-600 text-xs font-black tracking-widest uppercase mb-4">
                  □ ADVANCED REFERENCE (BAND 6.0 - 7.5+)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advancedLessons.map((lesson, idx) => {
                    const ColorClass = PASTEL_COLORS[idx % PASTEL_COLORS.length];
                    const IconComponent = ICONS[idx % ICONS.length];
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => router.push(`/${locale}/grammar/${lesson.lesson_id}`)}
                        className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-400 cursor-pointer transition-all duration-200 hover:shadow-sm gap-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon with band overlay */}
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${ColorClass}`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <span className="absolute -top-2 -left-2 text-[8px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase border-2 border-white shadow-sm">
                              {lesson.band}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 tracking-tight leading-snug">
                              {lesson.title}
                            </h4>
                            <p className="text-gray-400 text-[10.5px] font-semibold mt-1 leading-normal">
                              Chủ điểm ngữ pháp quan trọng giúp bứt phá band điểm trong IELTS Writing & Speaking.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <span className="text-purple-600 font-extrabold text-xs flex items-center gap-1">
                            Học ngay <span className="text-sm">→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
