"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ChevronDown, ChevronUp, RotateCcw, LogIn, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FONTS = [
  { key: "inter",        label: "Inter",    css: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { key: "playfair",     label: "Playfair", css: "'Playfair Display', Georgia, serif" },
  { key: "merriweather", label: "Merriw.",  css: "'Merriweather', Georgia, serif" },
  { key: "lora",         label: "Lora",     css: "'Lora', Georgia, serif" },
  { key: "mono",         label: "Mono",     css: "'Roboto Mono', 'Courier New', monospace" },
] as const;

type FontKey = typeof FONTS[number]["key"];

interface WritingGradeUIProps {
  testId: string;
  taskType: "task1" | "task2" | "full";
  title: string;
  description?: string;
  imageUrl?: string | null;
  guideHtml?: string | null;
}

type UiState = "writing" | "evaluating" | "reviewed" | "limited" | "login_required";

export default function WritingGradeUI({
  testId,
  taskType,
  title,
  description,
  imageUrl,
  guideHtml,
}: WritingGradeUIProps) {
  const isTask2Only = taskType === "task2";
  const isTask1Only = taskType === "task1";
  const isFull = taskType === "full";

  const [activeTask, setActiveTask] = useState<"task1" | "task2">(isTask2Only ? "task2" : "task1");
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");
  const [uiState, setUiState] = useState<UiState>("writing");
  const [aiFeedback, setAiFeedback] = useState<{ type: "markdown"; content: string; estimatedBandScore: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [fontFamily, setFontFamily] = useState<FontKey>("inter");
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const savedHistoryRef = useRef(false);
  const sessionHistoryIdRef = useRef<string | null>(null);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{task1Text: string, task2Text: string} | null>(null);
  const [hasCheckedProgress, setHasCheckedProgress] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`writing_progress_${testId}_${taskType}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.task1Text || parsed.task2Text) {
          setSavedProgress(parsed);
          setShowResumePopup(true);
        } else {
          setHasCheckedProgress(true);
        }
      } catch (e) {
        setHasCheckedProgress(true);
      }
    } else {
      setHasCheckedProgress(true);
    }
  }, [testId, taskType]);

  useEffect(() => {
    if (uiState === "evaluating" || uiState === "reviewed" || !hasCheckedProgress) return;
    if (!task1Text && !task2Text) return;
    const toSave = { task1Text, task2Text };
    localStorage.setItem(`writing_progress_${testId}_${taskType}`, JSON.stringify(toSave));
  }, [task1Text, task2Text, testId, taskType, uiState, hasCheckedProgress]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(console.error);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const handleResume = (resume: boolean) => {
    setShowResumePopup(false);
    if (resume && savedProgress) {
      setTask1Text(savedProgress.task1Text || "");
      setTask2Text(savedProgress.task2Text || "");
    } else {
      localStorage.removeItem(`writing_progress_${testId}_${taskType}`);
    }
    setHasCheckedProgress(true);
  };

  const activeFontCss = FONTS.find((f) => f.key === fontFamily)?.css ?? FONTS[0].css;
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const activeText = activeTask === "task1" ? task1Text : task2Text;
  const targetWords = activeTask === "task1" ? 150 : 250;
  const wordCount = countWords(activeText);

  const handleEvaluate = async () => {
    const primaryText = isTask2Only ? task2Text : task1Text;
    if (!primaryText.trim() && !task2Text.trim()) return;

    setUiState("evaluating");
    setError(null);

    try {
      const answers = {
        task1: isTask2Only ? "" : task1Text,
        task2: isTask1Only ? "" : task2Text,
      };

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "writing",
          payload: {
            answers,
            testData: {
              task1Description: !isTask2Only ? (description || "N/A") : "N/A",
              task2Description: isTask2Only ? (description || "N/A") : "N/A",
              guideHtml: guideHtml || "",
              taskType,
            },
          },
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401 || json.error === "LOGIN_REQUIRED") {
          setUiState("login_required");
          return;
        }
        if (res.status === 429 || json.error === "DAILY_LIMIT") {
          setUiState("limited");
          return;
        }
        setError(json.error || json.message || "Lỗi khi chấm bài.");
        setUiState("writing");
        return;
      }

      if (json.evaluation?.type === "markdown") {
        setAiFeedback(json.evaluation);
        setUiState("reviewed");
        localStorage.removeItem(`writing_progress_${testId}_${taskType}`);
      } else {
        setError(json.error || "Lỗi khi chấm bài.");
        setUiState("writing");
      }
    } catch (err: any) {
      setError(err.message);
      setUiState("writing");
    }
  };

  const handleRewrite = () => {
    setUiState("writing");
    setAiFeedback(null);
    setError(null);
    setTask1Text("");
    setTask2Text("");
    localStorage.removeItem(`writing_progress_${testId}_${taskType}`);
  };

  const taskLabel = isTask1Only ? "Task 1" : isTask2Only ? "Task 2" : activeTask === "task1" ? "Task 1" : "Task 2";
  const minWords = activeTask === "task1" ? "150" : "250";
  const suggestTime = activeTask === "task1" ? "20" : "40";

  return (
    <div className="min-h-screen bg-herb relative">
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        <Link
          href="/writing/tests"
          className="inline-flex items-center text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Quay về
        </Link>

        {/* Top header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-white">
            <h1 className="text-3xl font-serif italic font-bold tracking-tight">chấm bài</h1>
            <span className="w-1.5 h-1.5 bg-white rounded-full mt-1" />
            <span className="text-xs tracking-widest font-bold opacity-90 mt-1 uppercase">
              THE IELTS DICTIONARY
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isFull && (
              <div className="flex bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                <button
                  onClick={() => setActiveTask("task1")}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                    activeTask === "task1" ? "bg-white text-herb shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  Task 1
                </button>
                <button
                  onClick={() => setActiveTask("task2")}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                    activeTask === "task2" ? "bg-white text-herb shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  Task 2
                </button>
              </div>
            )}
            {!isFull && (
              <div className="flex bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                <span className="px-4 py-1.5 rounded-md text-sm font-bold bg-white text-herb shadow-sm">
                  {taskLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-50 bg-herb p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 sm:gap-6 items-stretch auto-rows-fr overflow-auto"
              : "grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-6 items-start"
          }
        >
          {isFullscreen && (
            <div
              className="fixed inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          )}
          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-4 sticky top-6">
            {/* Đề bài */}
            <div className="bg-[#fdfcf9] rounded-2xl p-6 shadow-sm border border-[#e5e0d5]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Đề bài</h2>
                <span className="text-xs font-medium text-slate-500">{taskLabel} - Academic Writing</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block mb-2">PROMPT</span>
              {description ? (
                <div
                  className="prose prose-sm text-slate-800 leading-relaxed text-[15px] mb-4 [&_table]:w-full [&_table]:text-[11px] [&_th]:bg-[#f3efdf] [&_th]:p-2 [&_th]:text-left [&_td]:p-2 [&_td]:border-b [&_td]:border-slate-100"
                  style={{ fontFamily: activeFontCss }}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-slate-400 italic text-sm mb-4">Không có đề bài.</p>
              )}
              {imageUrl && (
                <img src={imageUrl} alt="Task image" className="w-full rounded-xl border border-slate-200 mb-4" />
              )}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">{taskLabel} - Academic</span>
                <span>Tối thiểu <strong className="text-slate-700">{minWords} từ</strong></span>
                <span>Gợi ý <strong className="text-slate-700">{suggestTime} phút</strong></span>
              </div>
            </div>

            {/* Band score — shown after evaluation */}
            {uiState === "reviewed" && aiFeedback && (
              <div className="bg-[#fdfcf9] rounded-2xl p-6 shadow-sm border border-[#e5e0d5]">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">OVERALL BAND</span>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[52px] font-serif italic text-[#1b4332] font-black leading-none">
                    {aiFeedback.estimatedBandScore}
                  </span>
                  <span className="text-2xl text-slate-300 font-serif italic">/ 9</span>
                </div>
                <p className="text-[12px] text-slate-500">Kéo sang phải để xem nhận xét chi tiết từ TID.</p>
              </div>
            )}

            {/* Hướng dẫn viết bài */}
            {guideHtml && (
              <div
                className="bg-[#fdfcf9] rounded-2xl shadow-sm border border-[#e5e0d5] overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setShowGuide((v) => !v)}
              >
                <div className="p-5 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Hướng dẫn viết bài + Sample 8.0</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#f1f5f9] text-slate-600 px-2 py-1 rounded">
                      TASK {activeTask === "task1" ? "1" : "2"}
                    </span>
                    {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {showGuide && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div
                      className="prose prose-sm text-slate-700 text-[14px] leading-relaxed mt-4"
                      dangerouslySetInnerHTML={{ __html: guideHtml }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className={`flex flex-col ${isFullscreen ? "h-full min-h-0" : ""}`}>
            <div
              className={`bg-[#fdfcf9] rounded-2xl shadow-sm border border-[#e5e0d5] flex flex-col relative overflow-hidden ${
                isFullscreen ? "flex-1 min-h-0" : "min-h-[600px]"
              }`}
            >
              {/* Right header */}
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 shrink-0">
                <h2 className="text-xl font-bold text-slate-800">
                  {uiState === "reviewed" ? "Nhận xét từ TID" : "Bài làm"}
                </h2>
                <div className="flex items-center gap-4 text-xs font-medium">
                  {uiState === "writing" && (
                    <span className={`font-bold ${wordCount >= targetWords ? "text-[#3f6e52]" : "text-rose-500"}`}>
                      {wordCount} / {targetWords} từ
                    </span>
                  )}
                  {uiState === "reviewed" && (
                    <button
                      onClick={handleRewrite}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Viết lại
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isFullscreen) {
                        setIsFullscreen(false);
                        if (document.fullscreenElement && document.exitFullscreen) {
                          document.exitFullscreen().catch(console.error);
                        }
                      } else {
                        setIsFullscreen(true);
                        if (document.documentElement.requestFullscreen) {
                          document.documentElement.requestFullscreen().catch(console.error);
                        }
                      }
                    }}
                    title={isFullscreen ? "Thu nhỏ (Esc)" : "Mở rộng toàn màn hình"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
                  </button>
                </div>
              </div>

              {/* Font toolbar — writing state only */}
              {uiState === "writing" && (
                <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 bg-slate-50/60 shrink-0 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Font</span>
                  <div className="flex gap-0.5">
                    {FONTS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFontFamily(f.key)}
                        className={`px-2 py-1 text-[11px] rounded transition-colors leading-none ${
                          fontFamily === f.key ? "bg-slate-800 text-white font-bold" : "text-slate-500 hover:bg-slate-100"
                        }`}
                        style={{ fontFamily: f.css }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="w-px h-3.5 bg-slate-200 mx-1" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cỡ chữ</span>
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-[11px] font-bold select-none"
                  >
                    A−
                  </button>
                  <span className="text-[11px] text-slate-500 min-w-[30px] text-center font-medium tabular-nums">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-[13px] font-bold select-none"
                  >
                    A+
                  </button>
                </div>
              )}

              {/* Writing state */}
              {uiState === "writing" && (
                <textarea
                  value={activeText}
                  onChange={(e) => {
                    if (activeTask === "task1") setTask1Text(e.target.value);
                    else setTask2Text(e.target.value);
                  }}
                  placeholder={`Viết bài ${taskLabel} của bạn tại đây (tối thiểu ${minWords} từ)...`}
                  className="flex-1 w-full px-8 py-6 bg-transparent resize-none outline-none text-slate-800 leading-[1.9] placeholder:text-slate-300"
                  style={{ fontFamily: activeFontCss, fontSize: `${fontSize}px`, minHeight: "500px" }}
                />
              )}

              {/* Login required state */}
              {uiState === "login_required" && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <LogIn className="w-12 h-12 text-herb mx-auto mb-4 opacity-60" />
                    <p className="font-bold text-slate-800 text-base mb-2">Đăng nhập để chấm bài</p>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">
                      Tính năng chấm bài yêu cầu tài khoản TID. Đăng nhập để tiếp tục.
                    </p>
                    <Link
                      href="/login"
                      className="inline-block bg-herb text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
                    >
                      Đăng nhập ngay
                    </Link>
                    <button
                      onClick={() => setUiState("writing")}
                      className="block mt-3 mx-auto text-slate-400 text-sm hover:text-slate-600 transition-colors"
                    >
                      ← Quay lại
                    </button>
                  </div>
                </div>
              )}

              {/* Limited state */}
              {uiState === "limited" && (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="max-w-sm w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
                    <p className="font-black text-amber-900 text-sm">Hello bạn,</p>
                    <p className="text-amber-800 text-sm leading-relaxed">TID hiện đang sử dụng một trong những mô hình AI mạnh nhất hiện nay để chấm và chữa bài Writing với độ chính xác cao. Mặc dù đội ngũ TID đều đồng ý là sẽ không thu phí, nhưng mỗi lần chấm bài đều phát sinh chi phí khá lớn, nên nếu mở không giới hạn cho tất cả mọi người thì chắc TID sẽ phá sản sớm mất. 🥲</p>
                    <p className="text-amber-800 text-sm leading-relaxed">Vì vậy, hiện tại tính năng chấm chữa Writing không giới hạn đang được ưu tiên dành cho các <strong>Tidians</strong>. Nếu bạn đã dùng hết lượt trong ngày, vui lòng đợi đến ngày hôm sau để gửi bài tiếp theo nhé.</p>
                    <p className="text-amber-700 text-sm leading-relaxed">Cảm ơn bạn đã thông cảm và đồng hành cùng TID.</p>
                    <button
                      onClick={() => setUiState("writing")}
                      className="mt-2 text-herb text-sm font-bold hover:underline"
                    >
                      ← Quay lại bài viết
                    </button>
                  </div>
                </div>
              )}

              {/* Evaluating state */}
              {uiState === "evaluating" && (
                <>
                  <div
                    className="flex-1 px-8 py-6 blur-sm select-none pointer-events-none text-slate-700 leading-[1.9] whitespace-pre-wrap overflow-hidden"
                    style={{ fontFamily: activeFontCss, fontSize: `${fontSize}px` }}
                  >
                    {activeText}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-3" style={{ animation: "float 2s ease-in-out infinite" }}>
                        🖊️
                      </div>
                      <p className="font-bold text-slate-800 text-lg tracking-tight">Đang chấm bài của em...</p>
                      <p className="text-sm text-slate-500 mt-1">vài giây thôi nha</p>
                    </div>
                  </div>
                </>
              )}

              {/* Reviewed state — Markdown feedback */}
              {uiState === "reviewed" && aiFeedback && (
                <div className="flex-1 px-8 py-6 overflow-y-auto writing-feedback">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiFeedback.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            {uiState === "writing" && (
              <div className="mt-4 flex items-center justify-between gap-4">
                {wordCount < 50 ? (
                  <p className="text-rose-300 text-[11px] font-bold">
                    Cần ít nhất 50 từ để chấm bài ({wordCount}/50)
                  </p>
                ) : (
                  <p className="text-white/50 text-[11px]">Chấm theo 4 tiêu chí: TR · CC · LR · GRA</p>
                )}
                <button
                  onClick={handleEvaluate}
                  disabled={wordCount < 50}
                  className="bg-white text-herb font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Chấm bài
                </button>
              </div>
            )}

            {uiState === "reviewed" && (
              <p className="text-white/70 text-[11px] font-medium mt-3 ml-2 tracking-wide">
                TID chấm xong rồi, kéo xem điểm bên trái nha
              </p>
            )}

            {error && (
              <div className="mt-4 bg-red-50/95 rounded-xl p-4 text-red-600 text-sm font-medium border border-red-200">
                Lỗi: {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;500&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .writing-feedback {
          font-size: 14px;
          color: #1e293b;
          line-height: 1.85;
        }
        .writing-feedback h3 {
          font-size: 15px;
          font-weight: 800;
          color: #1b4332;
          margin-top: 28px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #e5e0d5;
        }
        .writing-feedback h3:first-child { margin-top: 0; }
        .writing-feedback ul { margin: 8px 0; padding-left: 20px; }
        .writing-feedback li { margin: 5px 0; line-height: 1.75; }
        .writing-feedback p { margin: 8px 0; }
        .writing-feedback strong { color: #0f172a; font-weight: 700; }
        .writing-feedback em { color: #7c3aed; font-style: italic; }
        .writing-feedback hr { border: none; border-top: 1px solid #e5e0d5; margin: 20px 0; }
        .writing-feedback blockquote {
          border-left: 3px solid #1b4332;
          padding-left: 12px;
          color: #475569;
          margin: 8px 0;
          font-style: italic;
        }
        .writing-feedback code {
          background: #f1f5f9;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 0.9em;
          color: #7c3aed;
          font-family: 'Roboto Mono', monospace;
        }
      `}</style>

      {/* Resume Progress Modal */}
      <AnimatePresence>
        {showResumePopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-herb-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Loader2 className="w-8 h-8 text-herb-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Viết tiếp bài cũ?</h2>
              <p className="text-slate-500 mb-8 font-medium">Bạn có một bài viết {taskLabel} đang làm dở. Bạn có muốn khôi phục lại những gì đã viết không?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleResume(true)}
                  className="w-full bg-herb hover:bg-herb/90 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                >
                  Khôi phục bài viết
                </button>
                <button 
                  onClick={() => handleResume(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  Xóa và viết mới
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
