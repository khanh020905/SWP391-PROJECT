"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useListeningTest } from "@/context/ListeningTestContext";
import ListeningQuestion from "./ListeningQuestion";

export default function QuestionPanel() {
  const {
    currentSection,
    currentSectionIndex,
    sections,
    goToNextSection,
    goToPrevSection,
  } = useListeningTest();

  if (!currentSection) return null;

  const { from, to } = currentSection.questionRange;

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      {/* Header section range */}
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-4 md:px-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">Questions panel</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
            Questions {from}–{to} — select or type your answers
          </p>
        </div>
        <span className="text-[10px] font-black bg-[#3B5C37]/10 text-[#3B5C37] px-2.5 py-1 rounded-lg">
          Section {currentSection.sectionNumber}
        </span>
      </div>

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
        {currentSection.imageUrl && (
          <div className="mb-5 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSection.imageUrl}
              alt="Section map/diagram"
              className="max-w-full max-h-[380px] object-contain rounded-lg border border-slate-100/50"
            />
          </div>
        )}
        {currentSection.questions.map((q) => (
          <ListeningQuestion key={q.id} question={q} />
        ))}
      </div>

      {/* Navigation footer */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-4 flex items-center justify-between shadow-inner">
        <button
          type="button"
          onClick={goToPrevSection}
          disabled={currentSectionIndex === 0}
          className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <button
          type="button"
          onClick={goToNextSection}
          disabled={currentSectionIndex === sections.length - 1}
          className="px-4.5 py-2.5 rounded-xl bg-[#3B5C37] hover:bg-[#2c4728] text-white disabled:opacity-30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all select-none border-none outline-none"
        >
          Tiếp theo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
