"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  Brain,
  FileText,
  Copy,
  Check,
  PenLine,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getWritingAttempt, updateWritingAttempt } from "@/lib/writingStorage";
import { WRITING_TEST_META } from "@/lib/writingMockData";
import type { WritingAttemptPayload } from "@/types/writing";


interface CriteriaFeedback {
  score: number;
  explanationVi: string;
}

interface GrammarCorrection {
  original: string;
  correction: string;
  reasonVi: string;
  context?: string;
}

interface TaskFeedback {
  taskId: "task1" | "task2";
  wordCount: number;
  estimatedBand: number;
  criteria?: {
    ta_tr: CriteriaFeedback;
    cc: CriteriaFeedback;
    lr: CriteriaFeedback;
    gra: CriteriaFeedback;
  };
  strengths: string[];
  improvements: string[];
  grammarCorrections?: GrammarCorrection[];
  modelAnswer?: string;
}

interface WritingGradeResult {
  attemptId: string;
  estimatedBand: number;
  taskFeedback: TaskFeedback[];
  overallFeedbackVi: string;
  gradedAt: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("id");

  const [attempt, setAttempt] = useState<WritingAttemptPayload | null>(null);
  const [grade, setGrade] = useState<WritingGradeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradeSource, setGradeSource] = useState<"deepseek" | "fallback" | "">("");
  const [activeTab, setActiveTab] = useState<"task1" | "task2">("task1");
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Fetch or trigger DeepSeek grading
  useEffect(() => {
    if (!attemptId) {
      queueMicrotask(() => {
        setError("Không tìm thấy mã bài làm.");
        setLoading(false);
      });
      return;
    }

    const saved = getWritingAttempt(attemptId);
    if (!saved) {
      queueMicrotask(() => {
        setError("Không tìm thấy bài làm trong bộ nhớ trình duyệt.");
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      setAttempt(saved);
    });

    // If already has DeepSeek feedback (characterized by criteria objects in taskFeedback)
    if (saved.feedback && saved.feedback.taskFeedback?.[0]?.criteria) {
      queueMicrotask(() => {
        setGrade(saved.feedback as WritingGradeResult);
        setGradeSource("deepseek");
        setLoading(false);
      });
      return;
    }

    const gradeAttempt = async () => {
      try {
        // Get user token if authenticated
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/writing/grade", {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: attemptId,
            answers: saved.answers,
            timeRemaining: saved.timeRemaining,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Chấm bài Writing thất bại");
        }

        const result = data.grade as WritingGradeResult;
        setGrade(result);
        setGradeSource(data.source === "deepseek" ? "deepseek" : "fallback");

        // Update local storage attempt with graded feedback
        updateWritingAttempt(attemptId, {
          feedback: result,
        });
      } catch (err) {
        console.error("Lỗi chấm bài:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg || "Đã xảy ra lỗi khi kết nối với AI chấm bài.");
      } finally {
        setLoading(false);
      }
    };

    void gradeAttempt();
  }, [attemptId]);

  const handleCopyModelAnswer = useCallback((text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#f5f8f5] to-white p-6 text-center">
        <div className="relative mb-6 h-20 w-20">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#e1ebd9] border-t-[#3B5C37]" />
          <Brain className="absolute inset-0 m-auto h-8 w-8 text-[#3B5C37] animate-pulse" />
        </div>
        <h1 className="text-xl font-black text-[#0f1738]">
          DeepSeek AI đang phân tích bài thi Writing...
        </h1>
        <p className="mt-2.5 max-w-md text-xs font-semibold leading-6 text-slate-500">
          Giám khảo AI đang phân tích từ vựng, ngữ pháp, tính mạch lạc và độ đáp ứng đề bài của cả 2 phần thi. Quá trình này có thể mất khoảng 5-15 giây.
        </p>
      </div>
    );
  }

  if (error || !grade) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8faf6] p-6 text-center">
        <XCircle className="h-14 w-14 text-rose-500" />
        <h1 className="text-lg font-black text-[#0f1738]">Không thể chấm bài viết</h1>
        <p className="max-w-sm text-xs font-bold text-rose-600">{error || "Không có kết quả chấm bài."}</p>
        <Link
          href="/writing"
          className="mt-2 rounded-xl bg-[#3B5C37] px-5 py-2.5 text-xs font-black text-white hover:bg-[#2f4a2b] transition"
        >
          Quay lại phòng thi
        </Link>
      </div>
    );
  }

  const activeTask = grade.taskFeedback.find((t) => t.taskId === activeTab) || grade.taskFeedback[0];
  const userOriginalText = attempt?.answers?.[activeTab] || "";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f4f7f2] to-[#fafcf9] pb-16 text-[#0f1738]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-[#dfe6d8] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/writing"
            className="flex items-center gap-2 text-xs font-black text-[#3B5C37] hover:text-[#2f4a2b] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Lịch sử thi
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[#f0f4ed] px-3 py-1.5 text-[10px] font-black text-[#3B5C37] border border-[#d2dfcb]">
              <Sparkles className="h-3.5 w-3.5" />
              {gradeSource === "deepseek" ? "DeepSeek v4 AI Grader" : "Phân tích tự động"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-4 py-8 md:px-6">
        {/* Title */}
        <div className="mb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3B5C37]">
            Kết quả đánh giá chi tiết
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#0f1738] md:text-3xl">
            {WRITING_TEST_META.testTitle}
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Ngày nộp bài: {new Date(grade.gradedAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Overview Score Card */}
        <div className="grid gap-6 md:grid-cols-[1fr_2fr] items-stretch mb-8">
          {/* Circular Score Badge */}
          <div className="rounded-3xl border border-[#dfe6d8] bg-white p-6 text-center shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#3B5C37]/5 to-transparent rounded-full pointer-events-none" />
            <Award className="h-10 w-10 text-[#3B5C37] mb-2" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Band Score quy đổi</p>
            <div className="mt-3 relative flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f0f2eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#3B5C37"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(grade.estimatedBand / 9) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute text-3xl font-black text-[#0f1738]">{grade.estimatedBand}</span>
            </div>
            <p className="mt-4 text-[10px] font-extrabold text-[#3B5C37] bg-[#f0f4ed] px-3 py-1 rounded-full border border-[#d2dfcb]">
              Mục tiêu nâng band: +1.5
            </p>
          </div>

          {/* AI Comments */}
          <div className="rounded-3xl border border-[#dfe6d8] bg-gradient-to-br from-[#1e341b] to-[#0c180b] p-6 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">Nhận xét của Giám khảo AI</h2>
              </div>
              <p className="text-xs font-medium leading-relaxed text-[#cadcc4] md:text-sm">
                {grade.overallFeedbackVi}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-[11px] font-bold text-slate-300">
              <span>Task 1: <strong className="text-white text-xs">{grade.taskFeedback.find(t => t.taskId === "task1")?.estimatedBand || "-"}</strong></span>
              <span>•</span>
              <span>Task 2: <strong className="text-white text-xs">{grade.taskFeedback.find(t => t.taskId === "task2")?.estimatedBand || "-"}</strong></span>
              <span>•</span>
              <span>Tổng từ vựng: <strong className="text-white text-xs">{(grade.taskFeedback.reduce((acc, curr) => acc + curr.wordCount, 0))} từ</strong></span>
            </div>
          </div>
        </div>

        {/* Task Selection Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[#dfe6d8] pb-px">
          {(["task1", "task2"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition select-none ${
                activeTab === tab
                  ? "border-[#3B5C37] text-[#3B5C37]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab === "task1" ? "Task 1 (Report)" : "Task 2 (Essay)"}
            </button>
          ))}
        </div>

        {/* Active Task Details */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Criteria sub-scores (5/12 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-[#dfe6d8] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#5c6488] flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-[#3B5C37]" />
                Điểm tiêu chí (Criteria Sub-scores)
              </h3>

              {activeTask.criteria ? (
                <div className="space-y-4">
                  {[
                    {
                      key: "ta_tr",
                      label: activeTab === "task1" ? "Task Achievement (TA)" : "Task Response (TR)",
                      color: "from-emerald-500 to-teal-600",
                      data: activeTask.criteria.ta_tr
                    },
                    {
                      key: "cc",
                      label: "Coherence & Cohesion (CC)",
                      color: "from-blue-500 to-indigo-600",
                      data: activeTask.criteria.cc
                    },
                    {
                      key: "lr",
                      label: "Lexical Resource (LR)",
                      color: "from-amber-500 to-orange-600",
                      data: activeTask.criteria.lr
                    },
                    {
                      key: "gra",
                      label: "Grammatical Range & Accuracy (GRA)",
                      color: "from-purple-500 to-fuchsia-600",
                      data: activeTask.criteria.gra
                    }
                  ].map((item) => (
                    <div key={item.key} className="border-b border-[#f4f7f2] pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1 text-[11px] font-black">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-[#3B5C37] bg-[#f0f4ed] px-2 py-0.5 rounded">{item.data?.score || 0}/9.0</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${((item.data?.score || 0) / 9) * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] leading-5 text-slate-500 font-medium">
                        {item.data?.explanationVi}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400">Không có dữ liệu tiêu chí.</p>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div className="rounded-2xl border border-[#dfe6d8] bg-white p-5 shadow-sm space-y-4">
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-black uppercase text-[#3B5C37] mb-2.5">
                  <TrendingUp className="h-4 w-4" />
                  Điểm mạnh của bài viết
                </h4>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-600">
                  {activeTask.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#f4f7f2]">
                <h4 className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-700 mb-2.5">
                  <Lightbulb className="h-4 w-4" />
                  Điểm cần khắc phục
                </h4>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-600">
                  {activeTask.improvements.map((imp, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Grammar Errors, Model Answer, Original Response (7/12 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Grammar Corrections */}
            <div className="rounded-2xl border border-[#dfe6d8] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#5c6488] flex items-center gap-1.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#3B5C37]" />
                Phân tích & sửa lỗi ngữ pháp / từ vựng
              </h3>

              {activeTask.grammarCorrections && activeTask.grammarCorrections.length > 0 ? (
                <div className="space-y-4">
                  {activeTask.grammarCorrections.map((corr, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-[#fbfcfb] p-4 text-xs space-y-2.5"
                    >
                      {corr.context && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Ngữ cảnh: &quot;{corr.context}&quot;
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-rose-50/70 border border-rose-100 p-2.5">
                          <p className="font-extrabold text-rose-500 mb-1">Bản gốc của bạn:</p>
                          <p className="font-semibold text-rose-950 line-through leading-relaxed">{corr.original}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-2.5">
                          <p className="font-extrabold text-emerald-600 mb-1">AI đề xuất sửa lại:</p>
                          <p className="font-semibold text-emerald-950 leading-relaxed">{corr.correction}</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-500 border-t border-slate-100 pt-2">
                        <strong>Lý do sửa:</strong> {corr.reasonVi}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#dfe4ed] bg-[#fbfcfb] p-6 text-center text-xs font-semibold text-slate-400">
                  Chúc mừng! Không phát hiện lỗi ngữ pháp hay từ vựng nghiêm trọng nào cần sửa.
                </div>
              )}
            </div>

            {/* Model Essay Band 8.5+ */}
            {activeTask.modelAnswer && (
              <div className="rounded-2xl border border-[#dfe6d8] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#5c6488] flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-[#3B5C37]" />
                    Bài mẫu tham khảo gợi ý (Band 8.5+)
                  </h3>
                  <button
                    onClick={() => handleCopyModelAnswer(activeTask.modelAnswer)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Sao chép bài mẫu
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-xl bg-[#fafbfa] border border-[#f0f3eb] p-4 text-[13px] font-semibold leading-8 text-[#253e20] whitespace-pre-line max-h-[380px] overflow-y-auto font-sans">
                  {activeTask.modelAnswer}
                </div>
              </div>
            )}

            {/* Collapsible Original User Answer */}
            <div className="rounded-2xl border border-[#dfe6d8] bg-white p-5 shadow-sm">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full flex items-center justify-between gap-4 text-xs font-black uppercase tracking-wider text-[#5c6488] outline-none"
              >
                <span className="flex items-center gap-1.5">
                  <PenLine className="h-4.5 w-4.5 text-[#3B5C37]" />
                  Xem lại bài viết gốc của bạn ({activeTask.wordCount} từ)
                </span>
                {showOriginal ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
              </button>

              {showOriginal && (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-150 p-4 text-[13px] font-semibold leading-8 text-slate-800 whitespace-pre-line font-mono select-text">
                  {userOriginalText || "(Trống)"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Retake & Lobby Actions */}
        <div className="mt-12 flex flex-wrap justify-center gap-3.5 border-t border-[#dfe6d8] pt-8">
          <Link
            href="/writing/test"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6d8] bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-sm hover:border-[#c7d1b8] hover:bg-[#fafbfa] transition active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            Luyện tập lại đề này
          </Link>
          <Link
            href="/writing"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3B5C37] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#2f4a2b] transition active:scale-[0.99]"
          >
            Về sảnh IELTS Writing
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function WritingResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#f8faf6]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e1ebd9] border-t-[#3B5C37]" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
