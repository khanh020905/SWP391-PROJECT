"use client";

import React, { useState, useEffect, startTransition } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Book, Clock, Star, Lock, ChevronRight, ChevronDown, Search, Zap, GraduationCap, ArrowLeft, ArrowRight, Filter, BookOpen, Layers, FileText, CheckCircle2, Sparkles, Leaf, Goal, CarFront, Drama, HeartPulse, Plane, BriefcaseBusiness, Building2, Lightbulb, Waves, Brain, PawPrint, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { cambridgeTests, essentialWordsUnits, tidPracticeTests, workbookUnits, deVolTests, getCambridgeByBook, questionTypes } from "@/data/reading-data";
import type { CambridgeTest, ReadingUnit } from "@/data/reading-data";

const BAND_FILTERS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0+"];
const QTYPE_FILTERS = ["True/False/Not Given", "Multiple Choice", "Matching Headings", "Matching Information", "Short Answer", "Note/Summary Completion", "Diagram Labelling", "Map Labelling"];

export default function ReadingListPage() {
  const [activeTab, setActiveTab] = useState<"cambridge" | "devol" | "essential" | "workbook">("cambridge");
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableReadingIds, setAvailableReadingIds] = useState<Set<string>>(new Set());
  // Tag filters
  const [taggedPassages, setTaggedPassages] = useState<{ youpass_id: string; band_level?: string; question_types?: string[]; title?: string }[]>([]);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [selectedQType, setSelectedQType] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCamLockModal, setShowCamLockModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // TEMP: lock disabled
  const daysLeft = Math.max(0, Math.ceil((new Date('2026-06-12').getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const itemsPerPage = 6;
  const cambridgeByBook = getCambridgeByBook();
  const getAvailablePassageIds = (testId: string) => [1, 2, 3]
    .map((passageNumber) => `${testId}-${passageNumber}`)
    .filter((passageId) => availableReadingIds.has(passageId));
  const getFirstAvailablePassageId = (testId: string) => getAvailablePassageIds(testId)[0] ?? null;
  const workingCambridgeTests = cambridgeTests.filter((test) => getAvailablePassageIds(test.id).length > 0);
  const bookNumbers = Array.from(new Set(workingCambridgeTests.map((test) => test.book))).sort((a, b) => b - a);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBook, selectedBand, selectedQType, sortOrder]);

  useEffect(() => {
    async function loadAvailableReadingIds() {
      try {
        const res = await fetch("/data/reading/index.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { youpass_id: string; band_level?: string; question_types?: string[]; title?: string }[] = await res.json();
        setAvailableReadingIds(new Set((data || []).map((row) => row.youpass_id).filter(Boolean)));
        setTaggedPassages(data || []);
      } catch (error) {
        console.error("Error fetching reading availability:", error);
      }
    }

    loadAvailableReadingIds();
  }, []);

  // Build tag lookup: youpass_id → tags
  const tagMap = new Map(taggedPassages.map(p => [p.youpass_id, p]));

  // Check if a test passes the active tag filters
  const testMatchesFilters = (testId: string) => {
    if (!selectedBand && !selectedQType) return true;
    const passageIds = getAvailablePassageIds(testId);
    return passageIds.some(pid => {
      const tags = tagMap.get(pid);
      if (!tags) return false;
      const bandOk = !selectedBand || tags.band_level === selectedBand;
      const qtypeOk = !selectedQType || (tags.question_types || []).includes(selectedQType);
      return bandOk && qtypeOk;
    });
  };

  // Dynamic Stats
  const minBook = bookNumbers.length > 0 ? Math.min(...bookNumbers) : 0;
  const maxBook = bookNumbers.length > 0 ? Math.max(...bookNumbers) : 0;
  const totalTests = workingCambridgeTests.length;
  const totalEssentialPassages = essentialWordsUnits.reduce((acc, unit) => acc + unit.passages.length, 0);
  const totalQuestionTypes = questionTypes.length;

  // Filter cambridge tests by search + tags
  const filteredCambridge = selectedBook
    ? (cambridgeByBook[selectedBook] || []).filter((test) => getAvailablePassageIds(test.id).length > 0)
    : workingCambridgeTests;

  const sortedCambridge = [...filteredCambridge].sort((a, b) => {
    if (sortOrder === "desc") {
      return b.book - a.book || a.test - b.test;
    } else {
      return a.book - b.book || a.test - b.test;
    }
  });

  const searchFiltered = sortedCambridge.filter(t => {
    const matchSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.passages.some((p, idx) => {
        const passageId = `${t.id}-${idx + 1}`;
        const dbTitle = tagMap.get(passageId)?.title ?? "";
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || dbTitle.toLowerCase().includes(q);
      });
    return matchSearch && testMatchesFilters(t.id);
  });

  const totalItems = searchFiltered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCambridge = searchFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTopicColor = (topic: string) => {
    const t = topic.toLowerCase();
    if (t.includes('history')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
    if (t.includes('science')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' };
    if (t.includes('natural')) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' };
    if (t.includes('society') || t.includes('culture')) return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' };
    return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
  };

  const getEssentialUnitIcon = (unitNumber: number): { icon: LucideIcon; className: string } => {
    const unitIcons: Record<number, { icon: LucideIcon; className: string }> = {
      1: { icon: Leaf, className: "text-lime-600 bg-lime-50 border-lime-100" },
      2: { icon: Goal, className: "text-rose-500 bg-rose-50 border-rose-100" },
      3: { icon: CarFront, className: "text-sky-600 bg-sky-50 border-sky-100" },
      4: { icon: Drama, className: "text-amber-500 bg-amber-50 border-amber-100" },
      5: { icon: HeartPulse, className: "text-pink-500 bg-pink-50 border-pink-100" },
      6: { icon: Plane, className: "text-indigo-500 bg-indigo-50 border-indigo-100" },
      7: { icon: BriefcaseBusiness, className: "text-stone-600 bg-stone-50 border-stone-100" },
      8: { icon: Building2, className: "text-cyan-600 bg-cyan-50 border-cyan-100" },
      9: { icon: GraduationCap, className: "text-violet-600 bg-violet-50 border-violet-100" },
      10: { icon: Lightbulb, className: "text-orange-500 bg-orange-50 border-orange-100" },
    };

    return unitIcons[unitNumber] ?? { icon: BookOpen, className: "text-slate-600 bg-slate-50 border-slate-100" };
  };

  const getWorkbookUnitIcon = (unitNumber: number): { icon: LucideIcon; className: string } => {
    const icons: Record<number, { icon: LucideIcon; className: string }> = {
      1: { icon: Building2, className: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      2: { icon: Waves, className: "text-cyan-600   bg-cyan-50   border-cyan-100" },
      3: { icon: CarFront, className: "text-orange-500 bg-orange-50 border-orange-100" },
      4: { icon: Lightbulb, className: "text-amber-500  bg-amber-50  border-amber-100" },
      5: { icon: PawPrint, className: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      6: { icon: Brain, className: "text-violet-600 bg-violet-50 border-violet-100" },
    };
    return icons[unitNumber] ?? { icon: BookOpen, className: "text-slate-600 bg-slate-50 border-slate-100" };
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] relative flex flex-col font-sans overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-herb/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-herb-50/40 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-36 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full z-10 relative">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-herb-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại chọn kỹ năng
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-herb-50 text-herb-700 px-3 py-1.5 rounded-xl mb-4 border border-herb-100">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-black text-[9px] uppercase tracking-[0.2em]">IELTS Reading Practice</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
                Luyện Reading
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-lg">
                Cambridge {maxBook}-{minBook} đầy đủ & Essential Words for the IELTS — True/False/Not Given, điền từ, và nhiều dạng câu hỏi khác.
              </p>
            </div>
          </div>
        </header>

        {/* Promo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Đọc báo song ngữ */}
          <div className="bg-[#FAF6EC] rounded-[32px] overflow-hidden relative flex shadow-sm hover:shadow-md transition-all h-[320px] md:h-[360px]">
            <div className="p-8 md:p-10 flex-1 relative z-20 flex flex-col justify-center">
              <div className="flex items-center gap-3 font-black text-5xl md:text-[54px] tracking-tight relative z-10">
                <span className="text-[#252525]">Đọc</span>
                <span className="bg-[#D82B49] text-white px-5 py-1.5 rounded-[40px] text-[40px] leading-tight mt-1">báo</span>
              </div>
              <div className="flex items-center gap-3 mb-6 pl-1 -mt-2 relative z-20">
                <span className="text-[#F3B438] text-[65px] md:text-[75px] -rotate-3 leading-none" style={{ fontFamily: '"Brush Script MT", "Great Vibes", cursive', textShadow: '1px 1px 0px rgba(0,0,0,0.05)' }}>song</span>
                <div className="relative mt-2">
                  <span className="bg-[#1A4C33] text-white px-5 py-1.5 rounded-[24px] text-4xl font-black relative z-10 inline-block tracking-tight">
                    ngữ
                    <div className="absolute -bottom-2.5 left-5 w-0 h-0 border-t-[14px] border-t-[#1A4C33] border-l-[12px] border-l-transparent"></div>
                  </span>
                </div>
              </div>
              <p className="text-slate-700 text-[13px] md:text-[14px] font-medium mb-6 max-w-[320px] leading-relaxed relative z-10">
                Bên cạnh việc đọc test cambridge<br className="hidden md:block" />
                chán ời nà chánnn, các bạn có thể<br className="hidden md:block" />
                đọc các bài báo siêu thú vị từ các<br className="hidden md:block" />
                đầu báo xịn xò trong này nha
              </p>
              <div>
                <Link href="/reading/bilingual" className="inline-flex items-center gap-3 bg-[#FCAF3C] text-[#1c1c1c] px-5 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-transform shadow-sm relative z-10">
                  <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#FCAF3C] fill-[#FCAF3C]" />
                  </div>
                  <span className="pr-1">Explore ngay</span>
                  <ArrowRight className="w-4 h-4 -ml-1" />
                </Link>
              </div>
            </div>
            {/* Abstract shapes right side */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] overflow-hidden pointer-events-none z-10">
              {/* Red pill top */}
              <div className="absolute top-[5%] right-[20%] w-[160px] h-[90px] bg-[#D82B49] rounded-full" />
              {/* Green circle top right */}
              <div className="absolute top-[12%] -right-[10px] w-[70px] h-[70px] bg-[#1A4C33] rounded-full" />
              {/* Yellow petal */}
              <div className="absolute top-[35%] right-[32%] w-[130px] h-[130px] bg-[#F5BC3A] rounded-tl-full rounded-bl-full" />
              {/* Beige petal */}
              <div className="absolute top-[35%] right-[6%] w-[130px] h-[130px] bg-[#EADECE] rounded-tl-full rounded-tr-full" />
              {/* Green bottom left piece */}
              <div className="absolute top-[65%] right-[35%] w-[90px] h-[110px] bg-[#1A4C33] rounded-bl-[90px]" />
              {/* Red bottom right piece */}
              <div className="absolute bottom-[-10px] right-[10%] w-[100px] h-[100px] bg-[#D82B49] rounded-tl-[100px]" />

              {/* Grid dots top right */}
              <div className="absolute top-[12%] right-[10%] grid grid-cols-4 gap-2">
                {[...Array(12)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#EADECE]" />)}
              </div>
              {/* Grid dots bottom left */}
              <div className="absolute bottom-[10%] left-[5%] grid grid-cols-5 gap-2">
                {[...Array(15)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#1A4C33]" />)}
              </div>
            </div>
          </div>

          {/* Card 2: Đọc sách song ngữ */}
          <div className="bg-[#FAF6EC] rounded-[32px] overflow-hidden relative flex shadow-sm hover:shadow-md transition-all h-[320px] md:h-[360px]">
            <div className="p-8 md:p-10 flex-1 relative z-20 flex flex-col justify-center">
              <div className="flex items-end gap-2 relative w-max z-10">
                <span className="text-[#165A36] text-[56px] md:text-[68px] font-black uppercase tracking-tighter leading-none" style={{ fontFamily: '"Playfair Display", "Didot", "Bodoni MT", "Times New Roman", serif' }}>ĐỌC</span>
                <span className="text-[#165A36] text-[52px] md:text-[64px] italic leading-none font-bold relative -mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  sách
                  <svg className="absolute -top-3 -right-8 w-8 h-8 text-[#165A36]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4,10 L1,4 M10,12 L14,2 M16,16 L22,10" />
                  </svg>
                </span>
              </div>
              <div className="mb-7 mt-1 pl-2 relative z-20">
                <span className="inline-block bg-[#165A36] text-white px-3 py-1 rounded-[16px] text-[34px] md:text-[38px] font-black relative tracking-tight leading-none pt-2 pb-1.5">
                  song ngữ
                  <div className="absolute -bottom-2 left-4 w-0 h-0 border-t-[12px] border-t-[#165A36] border-l-[10px] border-l-transparent"></div>
                </span>
              </div>
              <p className="text-slate-700 text-[13px] md:text-[14px] font-medium mb-7 max-w-[320px] leading-relaxed relative z-10">
                Những cuốn sách nổi tiếng được trình bày<br className="hidden md:block" />
                song ngữ để các bạn vừa đọc hiểu,<br className="hidden md:block" />
                vừa nhặt vocab siêu tự nhiên.
              </p>
              <div>
                <Link href="/reading/song-ngu" className="inline-flex items-center gap-2 bg-[#165A36] text-white px-5 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-transform shadow-sm relative z-10">
                  <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#165A36] fill-[#165A36]" />
                  </div>
                  <span className="pr-1">Explore</span>
                  <ArrowRight className="w-4 h-4 -ml-1" />
                </Link>
              </div>
            </div>

            {/* Right side pattern container */}
            <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-[#A1C5B0] overflow-hidden z-10">
              {/* Wavy border edge */}
              <svg className="absolute top-0 bottom-0 -left-[1px] h-full w-[24px] text-[#FAF6EC] z-20" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0,0 C60,10 60,20 0,33 C-60,46 -60,56 0,66 C60,76 60,86 0,100 L-10,100 L-10,0 Z" />
              </svg>

              {/* Spiral patterns */}
              <div className="absolute inset-0 opacity-[0.8]">
                {/* Manual placement of spirals for organic look */}
                <svg className="absolute -top-[10%] left-[20%] w-[120px] h-[120px] text-[#165A36]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="50" cy="50" r="45" strokeWidth="4" />
                  <circle cx="50" cy="50" r="35" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="25" />
                  <circle cx="50" cy="50" r="15" strokeDasharray="2 4" />
                  <path d="M50 50 m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" />
                  {/* Sun rays */}
                  {[...Array(24)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2="10" transform={`rotate(${i * 15} 50 50)`} strokeWidth="2" />
                  ))}
                </svg>

                <svg className="absolute top-[30%] -right-[10%] w-[140px] h-[140px] text-[#165A36]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="50" cy="50" r="45" strokeWidth="4" />
                  <circle cx="50" cy="50" r="35" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="25" />
                  <circle cx="50" cy="50" r="15" strokeDasharray="2 4" />
                  <path d="M50 50 m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" />
                  {[...Array(24)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2="10" transform={`rotate(${i * 15} 50 50)`} strokeWidth="2" />
                  ))}
                </svg>

                <svg className="absolute bottom-[5%] left-[10%] w-[110px] h-[110px] text-[#165A36]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="50" cy="50" r="45" strokeWidth="4" />
                  <circle cx="50" cy="50" r="35" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="25" />
                  <circle cx="50" cy="50" r="15" strokeDasharray="2 4" />
                  <path d="M50 50 m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" />
                  {[...Array(24)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2="10" transform={`rotate(${i * 15} 50 50)`} strokeWidth="2" />
                  ))}
                </svg>

                <svg className="absolute -bottom-[20%] right-[20%] w-[130px] h-[130px] text-[#165A36]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="50" cy="50" r="45" strokeWidth="4" />
                  <circle cx="50" cy="50" r="35" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="25" />
                  <circle cx="50" cy="50" r="15" strokeDasharray="2 4" />
                  <path d="M50 50 m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" />
                  {[...Array(24)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2="10" transform={`rotate(${i * 15} 50 50)`} strokeWidth="2" />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Bộ Cambridge", value: `${maxBook} → ${minBook}`, icon: GraduationCap, color: "text-herb-600 bg-herb-50" },
            { label: "Tổng bài thi", value: `${totalTests} Tests`, icon: FileText, color: "text-blue-600 bg-blue-50" },
            { label: "Essential Words", value: `${totalEssentialPassages} Passages`, icon: Layers, color: "text-amber-600 bg-amber-50" },
            { label: "Dạng câu hỏi", value: `${totalQuestionTypes} Dạng bài`, icon: CheckCircle2, color: "text-purple-600 bg-purple-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Band + Question type filter */}
        {activeTab === "cambridge" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest hover:text-herb-600 transition-colors focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Lọc theo tiêu chí
                {selectedQType && (
                  <span className="ml-2 px-2.5 py-0.5 bg-herb-100 text-herb-700 text-[9px] font-black rounded-md normal-case tracking-normal">
                    Đang lọc
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 capitalize normal-case tracking-normal">
                  {isFilterExpanded ? "Thu gọn" : "Mở rộng"}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isFilterExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isFilterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-4 pt-4"
                >
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dạng câu hỏi</p>
                    <div className="flex flex-wrap gap-2">
                      {QTYPE_FILTERS.map(qt => (
                        <button key={qt} onClick={() => setSelectedQType(selectedQType === qt ? null : qt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${selectedQType === qt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                          {qt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedQType && (
                    <button onClick={() => setSelectedQType(null)}
                      className="text-xs font-black text-red-500 hover:text-red-700 transition-colors pt-2 block">
                      ✕ Xóa bộ lọc
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => startTransition(() => { setActiveTab("cambridge"); setSelectedBook(null); })}
            className={`flex items-center px-7 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === "cambridge"
                ? "bg-herb-600 text-white shadow-xl shadow-herb-600/20"
                : "bg-white text-slate-400 border border-slate-100 hover:border-herb-200"
              }`}
          >
            <GraduationCap className="w-[18px] h-[18px] mr-2" />
            Cambridge {maxBook} – {minBook}
          </button>
          {/* <button
            onClick={() => startTransition(() => setActiveTab("devol"))}
            className={`flex items-center px-7 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === "devol"
                ? "bg-[#007e64] text-white shadow-xl shadow-[#007e64]/20 border-2 border-black"
                : "bg-white text-slate-400 border border-slate-100 hover:border-[#007e64]/30"
              }`}
          >
            <BookOpen className="w-[18px] h-[18px] mr-2" />
            Đề Vol Siêu Chuẩn
          </button> */}
          <button
            onClick={() => startTransition(() => setActiveTab("essential"))}
            className={`relative flex items-center px-7 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === "essential"
                ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                : "bg-white text-slate-400 border border-slate-100 hover:border-amber-200"
              }`}
          >
            <BookOpen className="w-[18px] h-[18px] mr-2" />
            Essential Words
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce">
              NEW
            </span>
          </button>
          <button
            onClick={() => startTransition(() => setActiveTab("workbook"))}
            className={`relative flex items-center px-7 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === "workbook"
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                : "bg-white text-slate-400 border border-slate-100 hover:border-emerald-200"
              }`}
          >
            <BookOpen className="w-[18px] h-[18px] mr-2" />
            TID Workbook
          </button>
        </div>

        {/* ===================== CAMBRIDGE TAB ===================== */}
        {activeTab === "cambridge" && (
          <div className={!isAdmin ? "relative" : ""}>
            <div className={!isAdmin ? "opacity-50 pointer-events-none select-none" : ""}>
            {/* Book selector + Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Book pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                <button
                  onClick={() => setSelectedBook(null)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${selectedBook === null
                      ? "bg-herb-600 text-white shadow-md"
                      : "bg-white text-slate-400 border border-slate-100 hover:border-herb-200"
                    }`}
                >
                  Tất cả
                </button>
                {bookNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedBook(num)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${selectedBook === num
                        ? "bg-herb-600 text-white shadow-md"
                        : "bg-white text-slate-400 border border-slate-100 hover:border-herb-200"
                      }`}
                  >
                    Cam {num}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative w-full md:w-56 shrink-0 z-20">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:border-herb-200 transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400 font-normal">Sắp xếp:</span>
                    {sortOrder === "desc" ? "Cam 20 → 9" : "Cam 9 → 20"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <>
                      {/* Click outside backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsSortOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1.5"
                      >
                        <button
                          onClick={() => {
                            setSortOrder("desc");
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between ${sortOrder === "desc"
                              ? "bg-herb-50 text-herb-700"
                              : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          <span>Cam 20 → 9 (Mới nhất)</span>
                          {sortOrder === "desc" && <span className="w-1.5 h-1.5 rounded-full bg-herb-600" />}
                        </button>
                        <button
                          onClick={() => {
                            setSortOrder("asc");
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between ${sortOrder === "asc"
                              ? "bg-herb-50 text-[#007e64]"
                              : "text-slate-655 hover:bg-slate-50"
                            }`}
                        >
                          <span>Cam 9 → 20 (Cũ nhất)</span>
                          {sortOrder === "asc" && <span className="w-1.5 h-1.5 rounded-full bg-herb-600" />}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Tìm bài reading..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-herb-300 focus:ring-2 focus:ring-herb-100 transition-all"
                />
              </div>
            </div>

            {/* Cambridge Test Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {paginatedCambridge.map((test, testIdx) => {
                const firstAvailablePassageId = getFirstAvailablePassageId(test.id);
                const availablePassageIds = new Set(getAvailablePassageIds(test.id));
                const hasAnyPassage = Boolean(firstAvailablePassageId);

                return (
                  <motion.div
                    key={test.id}
                    initial={testIdx === 0 ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={hasAnyPassage ? { y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : undefined}
                    className={`group rounded-[32px] border transition-all p-7 md:p-8 relative overflow-hidden flex flex-col h-full shadow-sm ${hasAnyPassage
                        ? "bg-white border-slate-100 hover:border-[#4a5d23]/20"
                        : "bg-slate-50/80 border-slate-200"
                      }`}
                  >
                    {/* Book badge */}
                    <div className="absolute top-0 right-0 bg-[#fffbe6] text-[#4a5d23] px-6 py-2.5 rounded-bl-[32px] text-[10px] font-black uppercase tracking-[0.2em] border-l border-b border-[#fff5c2]">
                      CAM {test.book}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mb-8">
                      {/* Book Cover Image & Title Clickable */}
                      {firstAvailablePassageId ? (
                        <Link
                          href={`/reading/cam/${test.id}?mode=practice`}
                          className="group/cover block shrink-0 relative"
                        >
                          <div className="w-28 md:w-36 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-slate-100 bg-slate-900 relative group-hover/cover:shadow-2xl group-hover/cover:scale-[1.02] transition-all duration-500">
                            <Image
                              src="/assets/cambridge-reading-book.webp"
                              alt={test.title}
                              fill
                              sizes="(max-width: 768px) 112px, 144px"
                              className="object-cover opacity-90"
                              priority={testIdx === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-0 right-0 text-center">
                              <span className="text-[18px] font-black text-white tracking-widest drop-shadow-lg">
                                {test.book}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="shrink-0 relative opacity-70">
                          <div className="w-28 md:w-36 aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative flex items-center justify-center">
                            <Lock className="w-8 h-8 text-slate-400" />
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-center pt-2">
                        {firstAvailablePassageId ? (
                          <Link href={`/reading/cam/${test.id}?mode=practice`}>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3 leading-[1.1] hover:text-herb-600 transition-colors">
                              {test.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="text-2xl md:text-3xl font-black text-slate-500 tracking-tight mb-3 leading-[1.1]">
                            {test.title}
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-2.5 items-center mt-1 mb-2">
                          <div className="flex items-center gap-2 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-[12px] font-black text-amber-700 uppercase tracking-widest">{test.level}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#007e64] text-white px-3.5 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-[10px] font-black tracking-wider uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
                            <span>Giao diện chuẩn thi thật 100%</span>
                          </div>
                        </div>
                        {!hasAnyPassage && (
                          <p className="mt-3 text-sm font-semibold text-slate-400">
                            ChÆ°a cÃ³ passage nÃ o sáºµn sÃ ng cho test nÃ y.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Passages preview */}
                    <div className="space-y-3 mb-10 flex-grow">
                      {test.passages.map((p, idx) => {
                        const colors = getTopicColor(p.topic);
                        const passageId = `${test.id}-${idx + 1}`;
                        const isAvailable = availablePassageIds.has(passageId);

                        if (!isAvailable) return null;

                        return (
                          <Link
                            key={idx}
                            href={`/reading/cam/${test.id}?mode=practice&passage=${idx + 1}`}
                            className="flex items-center gap-4 px-5 py-4 bg-[#f8fafc]/50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md transition-all group/p"
                          >
                            <span className="w-9 h-9 bg-[#e8f5e9] text-[#2e7d32] rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-[#d4edda] group-hover/p:bg-[#4a5d23] group-hover/p:text-white transition-all duration-300">
                              {idx + 1}
                            </span>
                            <span className="text-base font-bold text-slate-700 truncate group-hover/p:text-slate-900 transition-colors">
                              {tagMap.get(passageId)?.title || p.title}
                            </span>
                            <span className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border shrink-0 transition-all ${colors.bg} ${colors.text} ${colors.border} group-hover/p:scale-105 shadow-sm`}>
                              {p.topic}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      <Link
                        href={`/reading/cam/${test.id}?mode=practice`}
                        className="flex items-center justify-center gap-3 bg-[#f0f9f7] text-[#007e64] border border-[#007e64]/10 py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#e6f4f1] transition-all active:scale-95 group/btn shadow-sm"
                      >
                        <Book size={18} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                        LUYỆN TẬP
                      </Link>
                      <Link
                        href={`/reading/cam/${test.id}?mode=exam`}
                        className="flex items-center justify-center gap-3 bg-[#007e64] text-white py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#006651] shadow-xl shadow-[#007e64]/20 transition-all active:scale-95 group/btn"
                      >
                        <Clock size={18} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                        ĐI THI
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {searchFiltered.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-300">
                <Search className="w-10 h-10 mb-3" />
                <p className="font-black text-sm">Không tìm thấy bài reading nào</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:border-herb-300 hover:text-herb-600 transition-all disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${currentPage === page
                        ? "bg-herb-600 text-white shadow-md shadow-herb-600/20"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-herb-300 hover:text-herb-600"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:border-herb-300 hover:text-herb-600 transition-all disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  Sau
                </button>
              </div>
            )}
            </div>{/* end cambridge dimmer */}
            {!isAdmin && (
              <>
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => setShowCamLockModal(true)}
                />
                <div className="absolute inset-x-0 top-0 z-20 pointer-events-none flex justify-center pt-6">
                  <div className="bg-[#fafaf7] border-2 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-2xl px-7 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-widest text-slate-900">Tạm thời bị khóa</p>
                      <p className="text-xs font-medium text-slate-500">Nhấp để xem thêm</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== ĐỀ VOL SIÊU CHUẨN TAB ===================== */}
        {activeTab === "devol" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {deVolTests.map((test, testIdx) => {
                const firstAvailablePassageId = getFirstAvailablePassageId(test.id);
                const availablePassageIds = new Set(getAvailablePassageIds(test.id));
                const hasAnyPassage = Boolean(firstAvailablePassageId);

                return (
                  <motion.div
                    key={test.id}
                    initial={testIdx === 0 ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={hasAnyPassage ? { y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : undefined}
                    className={`group rounded-xl border-2 border-black transition-all p-7 md:p-8 relative overflow-hidden flex flex-col h-full shadow-[6px_6px_0_rgba(0,0,0,1)] ${hasAnyPassage
                        ? "bg-[#fafaf7] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)]"
                        : "bg-slate-100 opacity-80"
                      }`}
                  >
                    {/* Badge */}
                    <div className="absolute top-0 right-0 bg-[#007e64] text-white border-l-2 border-b-2 border-black rounded-bl-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] z-10">
                      VOL {test.test}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mb-8">
                      {/* Cover Image Placeholder */}
                      {firstAvailablePassageId ? (
                        <Link
                          href={`/reading/cam/${test.id}?mode=practice`}
                          className="group/cover block shrink-0 relative"
                        >
                          <div className="w-28 md:w-36 aspect-[3/4] border-2 border-black bg-[#007e64] relative group-hover/cover:-translate-y-1 group-hover/cover:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden">
                            <Image
                              src="/assets/cambridge-reading-book.webp"
                              alt={test.title}
                              fill
                              sizes="(max-width: 768px) 112px, 144px"
                              className="object-cover opacity-90 grayscale"
                              priority={testIdx === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-0 right-0 text-center">
                              <span className="text-[18px] font-black text-white tracking-widest drop-shadow-lg">
                                VOL {test.test}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="shrink-0 relative opacity-70">
                          <div className="w-28 md:w-36 aspect-[3/4] border-2 border-black bg-slate-200 relative flex items-center justify-center">
                            <Lock className="w-8 h-8 text-slate-400" />
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-center pt-2">
                        {firstAvailablePassageId ? (
                          <Link href={`/reading/cam/${test.id}?mode=practice`}>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3 leading-[1.1] hover:text-[#007e64] transition-colors">
                              {test.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="text-2xl md:text-3xl font-black text-slate-500 tracking-tight mb-3 leading-[1.1]">
                            {test.title}
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-2.5 items-center mt-1 mb-2">
                          <div className="flex items-center gap-2 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-[12px] font-black text-amber-700 uppercase tracking-widest">{test.level}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#007e64] text-white px-3.5 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-[10px] font-black tracking-wider uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
                            <span>Giao diện chuẩn thi thật 100%</span>
                          </div>
                        </div>
                        {!hasAnyPassage && (
                          <p className="mt-3 text-sm font-semibold text-slate-400">
                            Chưa có passage nào sẵn sàng cho test này.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Passages preview */}
                    <div className="space-y-3 mb-10 flex-grow">
                      {test.passages.map((p, idx) => {
                        const colors = getTopicColor(p.topic);
                        const passageId = `${test.id}-${idx + 1}`;
                        const isAvailable = availablePassageIds.has(passageId);

                        if (!isAvailable) return null;

                        return (
                          <Link
                            key={idx}
                            href={`/reading/cam/${test.id}?mode=practice&passage=${idx + 1}`}
                            className="flex items-center gap-4 px-5 py-4 bg-[#f8fafc]/50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md transition-all group/p"
                          >
                            <span className="w-9 h-9 bg-[#e8f5e9] text-[#2e7d32] rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-[#d4edda] group-hover/p:bg-[#4a5d23] group-hover/p:text-white transition-all duration-300">
                              {idx + 1}
                            </span>
                            <span className="text-base font-bold text-slate-700 truncate group-hover/p:text-slate-900 transition-colors">
                              {tagMap.get(passageId)?.title || p.title}
                            </span>
                            <span className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border shrink-0 transition-all ${colors.bg} ${colors.text} ${colors.border} group-hover/p:scale-105 shadow-sm`}>
                              {p.topic}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      <Link
                        href={`/reading/cam/${test.id}?mode=practice`}
                        className="flex items-center justify-center gap-3 bg-[#f0f9f7] text-[#007e64] border border-[#007e64]/10 py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#e6f4f1] transition-all active:scale-95 group/btn shadow-sm"
                      >
                        <Book size={18} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                        LUYỆN TẬP
                      </Link>
                      <Link
                        href={`/reading/cam/${test.id}?mode=exam`}
                        className="flex items-center justify-center gap-3 bg-[#007e64] text-white py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#006651] shadow-xl shadow-[#007e64]/20 transition-all active:scale-95 group/btn"
                      >
                        <Clock size={18} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                        ĐI THI
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== ESSENTIAL WORDS TAB ===================== */}
        {activeTab === "essential" && (
          <div>
            {/* Header info */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-8 md:p-10 mb-10 text-white relative overflow-hidden shadow-2xl shadow-amber-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[28px] flex items-center justify-center text-5xl shadow-inner border border-white/30 shrink-0 animate-float">
                  📚
                </div>
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4 border border-white/20">
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">Tài liệu độc quyền</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Essential Words for the IELTS</h2>
                  <p className="text-amber-100 font-medium text-lg max-w-2xl leading-relaxed mb-6">
                    Trọn bộ {essentialWordsUnits.length} Units với {totalEssentialPassages} bài đọc chuyên sâu, tập trung vào việc mở rộng vốn từ vựng học thuật theo các chủ đề phổ biến nhất trong kỳ thi IELTS.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {[`${essentialWordsUnits.length} Units`, `${totalEssentialPassages} Passages`, "Academic Vocab", "Standard Format"].map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-black/20 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Units accordion — free for all users */}
            <div className="grid grid-cols-1 gap-4">
              {essentialWordsUnits.map((unit) => {
                const isExpanded = expandedUnit === unit.unit;
                const unitIcon = getEssentialUnitIcon(unit.unit);
                const UnitIcon = unitIcon.icon;
                return (
                  <motion.div
                    key={`${unit.unit}-${unit.topic}`}
                    layout
                    className={`bg-white rounded-[24px] border transition-all duration-500 ${isExpanded
                        ? "border-amber-400 shadow-2xl shadow-amber-500/10 scale-[1.01]"
                        : "border-slate-100 hover:border-amber-200 shadow-sm"
                      }`}
                  >
                    {/* Unit header */}
                    <button
                      onClick={() => setExpandedUnit(isExpanded ? null : unit.unit)}
                      className="w-full flex items-center gap-4 p-6 md:p-8 text-left group"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isExpanded
                          ? "bg-amber-500 text-white border-amber-500 rotate-6 shadow-lg shadow-amber-500/30"
                          : `${unitIcon.className} group-hover:scale-110`
                        }`}>
                        <UnitIcon className="w-7 h-7" strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isExpanded ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                            }`}>
                            Unit {unit.unit}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3 Bài đọc</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          {unit.topic}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isExpanded ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-300"
                          }`}>
                          <ChevronDown
                            className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Passages list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-8 space-y-4">
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-6" />
                            {unit.passages.map((passage, idx) => (
                              <div
                                key={passage.id}
                                className="group/item flex flex-col md:flex-row md:items-center gap-4 p-5 bg-slate-50/50 rounded-2xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                              >
                                <Link
                                  href={`/reading/cam/${passage.id}?mode=practice`}
                                  className="flex items-center gap-4 flex-1 min-w-0"
                                >
                                  <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-amber-100 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all duration-300">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="text-base font-bold text-slate-800 mb-1 group-hover/item:text-amber-700 transition-colors truncate">
                                      {passage.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <Clock className="w-3 h-3" /> 20 mins
                                      </span>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      <span className="text-[10px] font-bold text-slate-400">
                                        Trang {passage.page}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                                <div className="flex gap-2 shrink-0">
                                  <Link
                                    href={`/reading/cam/${passage.id}?mode=practice`}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-all shadow-sm active:scale-95"
                                  >
                                    Luyện tập
                                  </Link>
                                  <Link
                                    href={`/reading/cam/${passage.id}?mode=exam`}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                                  >
                                    Vào thi
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== WORKBOOK TAB ===================== */}
        {activeTab === "workbook" && (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[32px] p-8 md:p-10 mb-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-600/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[28px] flex items-center justify-center text-5xl shadow-inner border border-white/30 shrink-0">
                  📖
                </div>
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4 border border-white/20">
                    <Sparkles className="w-3 h-3 text-emerald-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-50">TID Reading Workbook</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">IELTS Reading Workbook</h2>
                  <p className="text-emerald-100 font-medium text-lg max-w-2xl leading-relaxed mb-6">
                    6 Units với {workbookUnits.reduce((acc, u) => acc + u.passages.length, 0)} bài đọc ngắn — phù hợp để luyện kỹ năng điền từ, True/False và đọc hiểu nhanh ở band 2.5 - 3.5.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {["6 Units", `${workbookUnits.reduce((acc, u) => acc + u.passages.length, 0)} Passages`, "Band 2.5 - 3.5", "Gap Filling"].map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-black/20 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Units accordion — free for all users */}
            <div className="grid grid-cols-1 gap-4">
              {workbookUnits.map((unit) => {
                const isExpanded = expandedUnit === unit.unit + 100;
                const wbIcon = getWorkbookUnitIcon(unit.unit);
                const WbIcon = wbIcon.icon;
                return (
                  <motion.div
                    key={unit.unit}
                    layout
                    className={`bg-white rounded-[24px] border transition-all duration-500 ${isExpanded
                        ? "border-emerald-400 shadow-2xl shadow-emerald-500/10 scale-[1.01]"
                        : "border-slate-100 hover:border-emerald-200 shadow-sm"
                      }`}
                  >
                    <button
                      onClick={() => setExpandedUnit(isExpanded ? null : unit.unit + 100)}
                      className="w-full flex items-center gap-4 p-6 md:p-8 text-left group"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isExpanded
                          ? "bg-emerald-500 border-emerald-500 rotate-6 shadow-lg shadow-emerald-500/30"
                          : `${wbIcon.className} group-hover:scale-110`
                        }`}>
                        <WbIcon className={`w-7 h-7 ${isExpanded ? "text-white" : ""}`} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isExpanded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}>
                            Unit {unit.unit}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit.passages.length} Bài đọc</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{unit.topic}</h3>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isExpanded ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                        }`}>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-8 space-y-4">
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-6" />
                            {unit.passages.map((passage, idx) => {
                              const isAvailable = availableReadingIds.has(passage.id);
                              return (
                                <div
                                  key={passage.id}
                                  className="group/item flex flex-col md:flex-row md:items-center gap-4 p-5 bg-slate-50/50 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                                >
                                  <Link
                                    href={`/reading/cam/${passage.id}?mode=practice`}
                                    className="flex items-center gap-4 flex-1 min-w-0"
                                  >
                                    <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-emerald-100 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <h4 className="text-base font-bold text-slate-800 mb-1 group-hover/item:text-emerald-700 transition-colors truncate">
                                        {passage.title}
                                      </h4>
                                      {!isAvailable && (
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                          <Lock className="w-3 h-3" /> Chưa có nội dung
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                  {isAvailable && (
                                    <div className="flex gap-2 shrink-0">
                                      <Link
                                        href={`/reading/cam/${passage.id}?mode=practice`}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                                      >
                                        Luyện tập
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Cambridge lock modal */}
      <AnimatePresence>
        {showCamLockModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCamLockModal(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#fafaf7] border-2 border-black shadow-[12px_12px_0_rgba(0,0,0,1)] rounded-3xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-3">
                {daysLeft > 0 ? `Đang cập nhật trong ${daysLeft} ngày tới` : 'Đang cập nhật'}
              </h2>
              <p className="text-slate-600 font-medium mb-6 leading-relaxed text-sm">
                Phần Cambridge Reading Tests đang được cập nhật. Trong thời gian này, hãy thử đọc báo song ngữ — thú vị hơn nhiều!
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/reading/bilingual"
                  onClick={() => setShowCamLockModal(false)}
                  className="flex items-center justify-center gap-2 bg-[#FCAF3C] text-[#1c1c1c] px-6 py-3.5 rounded-2xl font-black text-sm border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
                >
                  Đọc báo song ngữ ngay
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setShowCamLockModal(false)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
