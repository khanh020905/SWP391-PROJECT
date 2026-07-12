"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Clock, FileText, PlayCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function CategoryPage() {
  const category = "writing-tests";
  const router = useRouter();
  
  const [dynamicTests, setDynamicTests] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "task1" | "task2" | "task_builder">("all");
  const [task1SubFilter, setTask1SubFilter] = useState<"all" | "bar_chart" | "line_graph" | "map" | "mixed_graph" | "pie_chart" | "process" | "table">("all");
  const [task2SubFilter, setTask2SubFilter] = useState<"all" | "discuss" | "opinion" | "adv_dis" | "problem" | "two_part">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/data/writing/index.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any[] = await res.json();
        const formatted = (data || []).map(item => ({
          ...item,
          id: item.youpass_id,
          taskType: item.task_type,
          task1Description: item.description,
          task2Description: item.description,
          task1Title: item.title,
          task2Title: item.title,
          thumbnail: item.cloudinary_url || item.thumbnail_url
        }));
        setDynamicTests(formatted);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [category]);

  // Format title
  const title = category.charAt(0).toUpperCase() + category.slice(1);

  // Derive chart type label + badge style from youpass_id prefix
  const getChartBadge = (id: string): { label: string; className: string } => {
    if (id?.startsWith('bc-'))   return { label: 'Bar Chart',   className: 'bg-amber-500 text-white' };
    if (id?.startsWith('lg-'))   return { label: 'Line Graph',  className: 'bg-blue-600 text-white' };
    if (id?.startsWith('map-'))  return { label: 'Map',         className: 'bg-teal-600 text-white' };
    if (id?.startsWith('mg-'))   return { label: 'Mixed Graph', className: 'bg-purple-600 text-white' };
    if (id?.startsWith('pc-'))   return { label: 'Pie Chart',   className: 'bg-rose-500 text-white' };
    if (id?.startsWith('proc-')) return { label: 'Process',     className: 'bg-emerald-600 text-white' };
    if (id?.startsWith('tbl-'))  return { label: 'Table',       className: 'bg-slate-600 text-white' };
    return { label: 'Chart', className: 'bg-[#1e234c] text-white' };
  };

  const getEssayTypeBadge = (description: string): { label: string; type: string; className: string } => {
    const d = (description || "").toLowerCase();
    if (d.includes("discuss both") || d.includes("both views") || d.includes("both sides"))
      return { label: "Discuss Both Views", type: "discuss", className: "bg-purple-600 text-white" };
    if (d.includes("to what extent") || d.includes("agree or disagree") || d.includes("do you agree"))
      return { label: "Opinion Essay", type: "opinion", className: "bg-blue-600 text-white" };
    if ((d.includes("advantages") && d.includes("disadvantages")) || d.includes("outweigh"))
      return { label: "Advantages & Disadvantages", type: "adv_dis", className: "bg-amber-500 text-white" };
    if (d.includes("causes") || (d.includes("problem") && d.includes("solution")))
      return { label: "Problem & Solution", type: "problem", className: "bg-rose-500 text-white" };
    const questionCount = (description.match(/\?/g) || []).length;
    if (questionCount >= 2)
      return { label: "Two-part Question", type: "two_part", className: "bg-teal-600 text-white" };
    return { label: "Essay", type: "other", className: "bg-[#1e234c] text-white" };
  };

  // Filter logic
  let tests: any[] = [];
  const baseTests = dynamicTests;

  if (category === "writing" || category === "writing-tests") {
    if (activeFilter === "task1") {
      let t1 = baseTests.filter(t => t.taskType === "task1");
      const prefixMap: Record<string, string> = {
        bar_chart: 'bc-', line_graph: 'lg-', map: 'map-',
        mixed_graph: 'mg-', pie_chart: 'pc-', process: 'proc-', table: 'tbl-',
      };
      const pfx = prefixMap[task1SubFilter];
      if (pfx) t1 = t1.filter(t => t.id?.startsWith(pfx));
      tests = t1;
    } else if (activeFilter === "task2") {
      let t2 = baseTests.filter(t => t.taskType === "task2");
      if (task2SubFilter !== "all") {
        t2 = t2.filter(t => getEssayTypeBadge(t.description || t.task2Description || "").type === task2SubFilter);
      }
      tests = t2;
    } else if (activeFilter === "task_builder") {
      tests = baseTests.filter(t => t.taskType === "task_builder");
    } else {
      tests = baseTests;
    }
  } else {
    tests = baseTests;
  }

  // Handle Pagination
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(tests.length / ITEMS_PER_PAGE);
  const paginatedTests = tests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Extract text safely from HTML
  const stripHtml = (html: string | undefined | null) => {
    if (!html) return "Nội dung đang được cập nhật...";
    return html.replace(/<[^>]+>/g, '').trim();
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50 rounded-bl-[100%] pointer-events-none" />
      
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Các Kỹ Năng Khác
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Thư Viện <span className="text-indigo-600">{title}</span>
              </h1>
              <p className="text-slate-600 mt-3 text-lg">
                Phát triển kỹ năng {title} với bộ đề thi được mô phỏng bám sát định dạng thực tế.
              </p>
            </div>
            
            {(category === "writing" || category === "writing-tests") && (
              <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                <button
                  onClick={() => { setActiveFilter("all"); setTask1SubFilter("all"); setTask2SubFilter("all"); setCurrentPage(1); }}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeFilter === "all" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => { setActiveFilter("task1"); setTask1SubFilter("all"); setTask2SubFilter("all"); setCurrentPage(1); }}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeFilter === "task1" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Task 1
                </button>
                <button
                  onClick={() => { setActiveFilter("task2"); setTask1SubFilter("all"); setTask2SubFilter("all"); setCurrentPage(1); }}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeFilter === "task2" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Task 2
                </button>

              </div>
            )}
          </div>
        </div>

        {/* Task 1 sub-category filter */}
        {(category === "writing" || category === "writing-tests") && activeFilter === "task1" && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-500 mr-1">Loại biểu đồ:</span>
            {(
              [
                { key: "all" as const,         label: "Tất cả",      icon: "◈", active: "bg-slate-800 text-white border-slate-800",   inactive: "border-slate-300 text-slate-600 hover:bg-slate-50",   prefix: null },
                { key: "bar_chart" as const,   label: "Bar Chart",   icon: "▦", active: "bg-amber-500 text-white border-amber-500",   inactive: "border-amber-300 text-amber-700 hover:bg-amber-50",   prefix: 'bc-' },
                { key: "line_graph" as const,  label: "Line Graph",  icon: "〜", active: "bg-blue-600 text-white border-blue-600",     inactive: "border-blue-300 text-blue-700 hover:bg-blue-50",     prefix: 'lg-' },
                { key: "map" as const,         label: "Map",         icon: "⊞", active: "bg-teal-600 text-white border-teal-600",     inactive: "border-teal-300 text-teal-700 hover:bg-teal-50",     prefix: 'map-' },
                { key: "mixed_graph" as const, label: "Mixed Graph", icon: "⋈", active: "bg-purple-600 text-white border-purple-600", inactive: "border-purple-300 text-purple-700 hover:bg-purple-50", prefix: 'mg-' },
                { key: "pie_chart" as const,   label: "Pie Chart",   icon: "◕", active: "bg-rose-500 text-white border-rose-500",     inactive: "border-rose-300 text-rose-700 hover:bg-rose-50",     prefix: 'pc-' },
                { key: "process" as const,     label: "Process",     icon: "→", active: "bg-emerald-600 text-white border-emerald-600", inactive: "border-emerald-300 text-emerald-700 hover:bg-emerald-50", prefix: 'proc-' },
                { key: "table" as const,       label: "Table",       icon: "⊟", active: "bg-slate-600 text-white border-slate-600",   inactive: "border-slate-300 text-slate-600 hover:bg-slate-100", prefix: 'tbl-' },
              ]
            ).map(({ key, label, icon, active, inactive, prefix }) => (
              <button
                key={key}
                onClick={() => { setTask1SubFilter(key); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-sm transition-all ${task1SubFilter === key ? active : inactive}`}
              >
                <span className="text-xs">{icon}</span>
                {label}
                {prefix && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${task1SubFilter === key ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>
                    {baseTests.filter(t => t.taskType === "task1" && t.id?.startsWith(prefix)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Task 2 essay-type sub-filter */}
        {(category === "writing" || category === "writing-tests") && activeFilter === "task2" && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-500 mr-1">Dạng bài:</span>
            {(
              [
                { key: "all" as const,      label: "Tất cả",                   icon: "◈", active: "bg-slate-800 text-white border-slate-800",     inactive: "border-slate-300 text-slate-600 hover:bg-slate-50" },
                { key: "discuss" as const,  label: "Discuss Both Views",        icon: "⇆", active: "bg-purple-600 text-white border-purple-600",   inactive: "border-purple-300 text-purple-700 hover:bg-purple-50" },
                { key: "opinion" as const,  label: "Opinion Essay",             icon: "✎", active: "bg-blue-600 text-white border-blue-600",       inactive: "border-blue-300 text-blue-700 hover:bg-blue-50" },
                { key: "adv_dis" as const,  label: "Advantages & Disadvantages",icon: "⇅", active: "bg-amber-500 text-white border-amber-500",    inactive: "border-amber-300 text-amber-700 hover:bg-amber-50" },
                { key: "problem" as const,  label: "Problem & Solution",        icon: "⚙", active: "bg-rose-500 text-white border-rose-500",       inactive: "border-rose-300 text-rose-700 hover:bg-rose-50" },
                { key: "two_part" as const, label: "Two-part Question",         icon: "?", active: "bg-teal-600 text-white border-teal-600",       inactive: "border-teal-300 text-teal-700 hover:bg-teal-50" },
              ]
            ).map(({ key, label, icon, active, inactive }) => {
              const count = key === "all"
                ? baseTests.filter(t => t.taskType === "task2").length
                : baseTests.filter(t => t.taskType === "task2" && getEssayTypeBadge(t.description || t.task2Description || "").type === key).length;
              return (
                <button
                  key={key}
                  onClick={() => { setTask2SubFilter(key); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-sm transition-all ${task2SubFilter === key ? active : inactive}`}
                >
                  <span className="text-xs">{icon}</span>
                  {label}
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${task2SubFilter === key ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Đang tải danh sách bài tập...</p>
            </div>
          ) : (
            paginatedTests.map((test) => {
              const imageMatch = (test.description || test.task1Description)?.match(/<img[^>]+src="([^">]+)"/);
              const embeddedImage = imageMatch ? imageMatch[1] : null;
              const rawImage = test.task1ImageUrl || test.thumbnail || embeddedImage || null;

              const badge = (category === 'writing' || category === 'writing-tests') && test.taskType === 'task1'
                ? getChartBadge(test.id)
                : (category === 'writing' || category === 'writing-tests') && test.taskType === 'task2'
                ? getEssayTypeBadge(test.description || test.task2Description || "")
                : {
                    label: (test.tags && Array.isArray(test.tags) && test.tags.filter((t: any) => t).length > 0)
                      ? test.tags.filter((t: any) => t)[0]
                      : title,
                    className: 'bg-[#1e234c] text-white',
                  };

              const descriptionPreview = stripHtml(test.description || test.task1Description || test.task2Description);
              const hasImage = !!rawImage;

              return (
                <div
                  key={test.id}
                  onClick={() => router.push(`/writing/tests/${test.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-row group"
                >
                  {/* Left Thumbnail — only shown when an image exists */}
                  {hasImage && (
                    <div className="relative w-[35%] bg-slate-50 border-r border-slate-100 flex-shrink-0 flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={rawImage}
                        alt="Thumbnail"
                        className="w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <div className={`absolute top-0 left-0 text-[11px] px-3 py-1 font-bold rounded-br-lg shadow-sm truncate max-w-[90%] ${badge.className}`}>
                        {badge.label}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`${hasImage ? 'w-[65%]' : 'w-full'} p-5 flex flex-col justify-start relative`}>
                    {!hasImage && (
                      <div className={`inline-flex self-start text-[11px] px-3 py-1 font-bold rounded-lg shadow-sm mb-2 ${badge.className}`}>
                        {badge.label}
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-blue-600 hover:text-blue-700 mb-2 leading-snug line-clamp-2">
                      {test.title || test.task1Title || test.task2Title}
                    </h3>
                    <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-3">
                      {descriptionPreview}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          
          {!loading && tests.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
              <p className="text-slate-500">Hiện tại chưa có đề thi nào trong mục này.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {tests.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center mt-12 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Trang trước
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-indigo-50 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (
                (page === 2 && currentPage > 4) ||
                (page === totalPages - 1 && currentPage < totalPages - 3)
              ) {
                return <span key={page} className="px-2 text-slate-400">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Trang sau
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
