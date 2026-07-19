"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Award, LayoutGrid, Eye, CornerDownRight } from "lucide-react";
import { useListeningTest } from "@/context/ListeningTestContext";
import { useRouter } from "next/navigation";

interface ListeningResultModalProps {
  onClose: () => void;
  locale: string;
}

export default function ListeningResultModal({ onClose, locale }: ListeningResultModalProps) {
  const router = useRouter();
  const { result, sections } = useListeningTest();
  const [showDetails, setShowDetails] = useState<boolean>(false);

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header Results */}
        <div className="text-center shrink-0 border-b border-slate-100 pb-5 mb-5 relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center text-white mx-auto shadow-lg mb-3">
            <Award className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#0f1738] tracking-tight">
            Kết Quả Luyện Thi Listening
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Bài thi đã được chấm điểm tự động bằng hệ thống chấm điểm IELTS
          </p>
        </div>

        {/* Scrollable breakdown content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
          {/* Main scores display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 text-center">
              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">Điểm Band IELTS</span>
              <span className="text-3xl font-black text-emerald-800 mt-1 block">{result.bandScore.toFixed(1)}</span>
            </div>
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 text-center">
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider block">Số Câu Đúng</span>
              <span className="text-3xl font-black text-blue-800 mt-1 block">{result.correctCount} / {result.totalQuestions}</span>
            </div>
          </div>

          {/* Section table breakdown */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <h3 className="text-xs font-black text-[#0f1738] uppercase tracking-wider mb-3">Chi tiết từng Section</h3>
            <div className="divide-y divide-slate-200/60 text-xs">
              {result.sectionResults.map((sec) => (
                <div key={sec.sectionNumber} className="flex justify-between py-2.5 first:pt-0 last:pb-0 items-center">
                  <span className="font-bold text-slate-500">Section {sec.sectionNumber}</span>
                  <span className="font-black text-slate-800">{sec.correct} / {sec.total} đúng</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Question Review Toggle */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full bg-slate-50/80 hover:bg-slate-100 px-4 py-3.5 text-xs font-black text-slate-700 flex justify-between items-center transition-all cursor-pointer select-none"
            >
              <span>Xem chi tiết đáp án từng câu</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                {showDetails ? "Ẩn" : "Hiện"}
              </span>
            </button>

            {showDetails && (
              <div className="divide-y divide-slate-100 p-4 bg-white max-h-[200px] overflow-y-auto space-y-2.5">
                {sections.flatMap((sec) => sec.questions).map((q) => {
                  const userAns = result.answers[q.id] || "";
                  const correctAns = result.correctAnswers[q.id] || "";
                  
                  const isCorrect = q.type === "mcq"
                    ? userAns.toLowerCase().trim() === correctAns.toLowerCase().trim()
                    : q.acceptedAnswers.some(a => userAns.toLowerCase().trim() === a);

                  return (
                    <div key={q.id} className="text-xs py-2 flex flex-col gap-1 first:pt-0">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-600 flex items-center gap-1">
                          Câu {q.globalOrder}: <span className="text-slate-400 font-semibold truncate max-w-[200px]">{q.text}</span>
                        </span>
                        {isCorrect ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 fill-current" /> Đúng
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 fill-current" /> Sai
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 pl-3 mt-1 text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1 font-semibold">
                          <CornerDownRight className="w-3 h-3 text-slate-400" /> Bạn chọn:{" "}
                          <strong className={isCorrect ? "text-emerald-700" : "text-red-700"}>
                            {userAns || "(Chưa làm)"}
                          </strong>
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 font-semibold">
                          <CornerDownRight className="w-3 h-3 text-slate-400" /> Đáp án chuẩn:{" "}
                          <strong className="text-emerald-700">{correctAns}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className="shrink-0 border-t border-slate-100 pt-5 mt-5 grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
          >
            <Eye className="w-4 h-4" /> Xem lại bài làm
          </button>
          
          <button
            type="button"
            onClick={() => {
              const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
              if (sp?.get("source") === "daily_task") {
                router.push(`/${locale}/learning/daily`);
              } else {
                router.push(`/${locale}/listening`);
              }
            }}
            className="w-full py-3 rounded-2xl bg-[#3B5C37] hover:bg-[#2c4728] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border-none outline-none shadow-md shadow-[#3B5C37]/10"
          >
            <LayoutGrid className="w-4 h-4 text-white" /> {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("source") === "daily_task" ? "Quay lại Lộ trình" : "Chọn đề thi khác"}
          </button>
        </div>
      </div>
    </div>
  );
}
