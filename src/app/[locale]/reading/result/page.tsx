"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { READING_PASSAGE_1, READING_TEST_META } from "@/lib/readingMockData";
import {
  getReadingAttempt,
  updateReadingAttempt,
} from "@/lib/readingStorage";
import type { ReadingAttemptPayload, ReadingGradeResult } from "@/types/readingGrade";
import { supabase } from "@/lib/supabaseClient";

function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("id");

  const [attempt, setAttempt] = useState<ReadingAttemptPayload | null>(null);
  const [grade, setGrade] = useState<ReadingGradeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradeSource, setGradeSource] = useState<"gemini" | "fallback" | "">("");

  useEffect(() => {
    if (!attemptId) {
      setError("Không tìm thấy mã bài làm.");
      setLoading(false);
      return;
    }

    const saved = getReadingAttempt(attemptId);
    if (!saved) {
      setError("Không tìm thấy bài làm trong bộ nhớ cục bộ.");
      setLoading(false);
      return;
    }

    setAttempt(saved);

    if (saved.grade) {
      setGrade(saved.grade);
      setLoading(false);
      return;
    }

    const gradeAttempt = async () => {
      try {
        let session = null;
        try {
          const sessionRes = await supabase.auth.getSession();
          session = sessionRes.data.session;
        } catch (e) {
          console.warn("[Reading Result] Failed to retrieve Supabase session:", e);
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/reading/grade", {
          method: "POST",
          headers,
          body: JSON.stringify(saved),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Chấm bài thất bại");
        }

        const result = data.grade as ReadingGradeResult;
        setGrade(result);
        setGradeSource(data.source === "gemini" ? "gemini" : "fallback");
        
        // Update local storage attempt status and grade
        updateReadingAttempt(attemptId, {
          grade: result,
          status: "graded",
        });

        // Save progress to Supabase user_submissions and practice_history
        if (session?.user) {
          try {
            const userId = session.user.id;
            const submissionId = typeof window !== "undefined" && window.crypto?.randomUUID 
              ? window.crypto.randomUUID() 
              : "00000000-0000-0000-0000-" + Math.random().toString(16).substring(2, 14).padEnd(12, '0');

            // 1. Save to user_submissions
            const { error: subErr } = await supabase.from("user_submissions").insert({
              id: submissionId,
              user_id: userId,
              exam_id: READING_TEST_META.id,
              score: result.bandScore,
              answers: {
                userAnswers: saved.answers,
                feedback: result,
              },
              started_at: saved.submittedAt || new Date().toISOString(),
              completed_at: new Date().toISOString(),
            });

            if (subErr) {
              console.error("❌ Lỗi khi lưu kết quả Reading vào user_submissions:", subErr);
            } else {
              console.log("✅ Lưu kết quả Reading vào user_submissions thành công!");
            }

            // 2. Save to practice_history for dashboard display
            const { error: histErr } = await supabase.from("practice_history").insert({
              user_id: userId,
              category: "reading",
              test_id: READING_TEST_META.id,
              test_name: READING_TEST_META.testTitle,
              score: result.rawScore,
              total: result.totalQuestions,
              metadata: {
                raw_score: result.rawScore,
                band_level: result.bandScore,
                submission_id: submissionId,
              },
            });

            if (histErr) {
              console.error("❌ Lỗi khi lưu kết quả Reading vào practice_history:", histErr);
            } else {
              console.log("✅ Lưu kết quả Reading vào practice_history thành công!");
            }

            // 3. Register learning activity to study log API
            await fetch("/api/student/study-log", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                activity: `Hoàn thành bài Luyện đọc IELTS Reading - Kết quả: ${result.rawScore}/${result.totalQuestions} câu đúng (Band: ${result.bandScore})`
              })
            }).catch(e => console.error("❌ Không thể ghi nhận study log:", e));
          } catch (dbErr) {
            console.error("❌ Lỗi khi thực hiện lưu kết quả lên Supabase:", dbErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi chấm bài");
        updateReadingAttempt(attemptId, { status: "error" });
      } finally {
        setLoading(false);
      }
    };

    void gradeAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6 text-center">
        <div className="relative mb-6 h-20 w-20">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
        </div>
        <h1 className="text-lg font-bold text-gray-900">
          Gemini AI đang chấm bài Reading...
        </h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Hệ thống phân tích đáp án, tính điểm và soạn nhận xét chi tiết cho từng
          câu. Vui lòng đợi vài giây.
        </p>
      </div>
    );
  }

  if (error || !grade) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm font-semibold text-red-600">{error || "Không có kết quả"}</p>
        <Link
          href="/reading"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Về phòng Reading
        </Link>
      </div>
    );
  }

  const questionsById = Object.fromEntries(
    READING_PASSAGE_1.questions.map((q) => [q.id, q])
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-blue-50/30">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/reading"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Phòng Reading
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
            <Sparkles className="h-3 w-3" />
            {gradeSource === "gemini" ? "Gemini 2.0 Flash" : "Chấm tự động"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Kết quả chấm bài
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900 md:text-3xl">
            {READING_TEST_META.testTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{READING_PASSAGE_1.title}</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm">
            <Award className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <p className="text-[10px] font-bold uppercase text-gray-400">Band ước tính</p>
            <p className="text-4xl font-black text-blue-600">{grade.bandScore}</p>
          </div>
          <div className="rounded-2xl border border-green-100 bg-white p-5 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-[10px] font-bold uppercase text-gray-400">Câu đúng</p>
            <p className="text-4xl font-black text-green-600">
              {grade.rawScore}
              <span className="text-lg text-gray-400">/{grade.totalQuestions}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-500" />
            <p className="text-[10px] font-bold uppercase text-gray-400">Tỷ lệ</p>
            <p className="text-4xl font-black text-gray-800">
              {Math.round((grade.rawScore / grade.totalQuestions) * 100)}%
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-bold">Nhận xét từ Gemini AI</h2>
          </div>
          <p className="text-sm leading-relaxed text-blue-50">{grade.overallFeedbackVi}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-blue-200">
                <TrendingUp className="h-3.5 w-3.5" /> Điểm mạnh
              </p>
              <ul className="space-y-1">
                {grade.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-white/90">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-blue-200">
                <Lightbulb className="h-3.5 w-3.5" /> Cần cải thiện
              </p>
              <ul className="space-y-1">
                {grade.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-white/90">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
          Chi tiết từng câu
        </h2>
        <div className="space-y-4">
          {grade.questionResults.map((qr) => {
            const q = questionsById[qr.questionId];
            return (
              <div
                key={qr.questionId}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  qr.isCorrect ? "border-green-200" : "border-red-100"
                }`}
              >
                <div className="mb-3 flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white ${
                      qr.isCorrect ? "bg-green-500" : "bg-red-400"
                    }`}
                  >
                    {qr.questionId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {q?.prompt ?? `Question ${qr.questionId}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {qr.isCorrect ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          <XCircle className="h-3 w-3" /> Sai
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-11 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-bold text-gray-400">Bạn trả lời</p>
                    <p className="mt-0.5 font-semibold text-gray-800">{qr.userAnswer}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="font-bold text-blue-400">Đáp án đúng</p>
                    <p className="mt-0.5 font-semibold text-blue-900">{qr.correctAnswer}</p>
                  </div>
                </div>

                <p className="ml-11 mt-3 text-sm leading-relaxed text-gray-600">
                  {qr.explanationVi}
                </p>
                {qr.tipVi && (
                  <p className="ml-11 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <strong>Mẹo:</strong> {qr.tipVi}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/reading/test"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm hover:border-blue-300"
          >
            <RefreshCw className="h-4 w-4" />
            Làm lại bài
          </Link>
          <Link
            href="/reading"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
          >
            Về phòng Reading
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ReadingResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
