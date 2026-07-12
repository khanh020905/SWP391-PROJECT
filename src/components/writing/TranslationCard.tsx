"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ChevronRight, AlertCircle, HelpCircle, BookOpen } from "lucide-react";
import { WritingPracticeSentence } from "@/types/writingTranslation";
import { compareSentences, DiffToken } from "@/lib/diffHelper";

interface TranslationCardProps {
  sentence: WritingPracticeSentence;
  onNext: () => void;
  isLast: boolean;
}

interface HintWordToken {
  original: string;
  display: string;
  revealed: boolean;
}

export default function TranslationCard({ sentence, onNext, isLast }: TranslationCardProps) {
  const t = useTranslations("writingTranslation");
  const [userInput, setUserInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [diffTokens, setDiffTokens] = useState<DiffToken[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [hintTokens, setHintTokens] = useState<HintWordToken[]>([]);
  const [showVocabHints, setShowVocabHints] = useState(false);

  // Initialize masked hint tokens when sentence changes
  useEffect(() => {
    setUserInput("");
    setIsChecked(false);
    setDiffTokens([]);
    setErrorMsg("");
    setShowVocabHints(false);

    if (sentence?.en_content) {
      const words = sentence.en_content.trim().split(/\s+/).filter(Boolean);
      const tokens = words.map((word) => {
        const match = word.match(/^([a-zA-Z0-9'-]+)([^a-zA-Z0-9'-]*)$/);
        let base = word;
        let punc = "";
        if (match) {
          base = match[1];
          punc = match[2];
        }

        let display = "";
        if (base.length <= 1) {
          display = "*";
        } else {
          display = base.charAt(0) + "*".repeat(base.length - 1);
        }
        display += punc;

        return {
          original: word,
          display,
          revealed: false,
        };
      });
      setHintTokens(tokens);
    }
  }, [sentence]);

  const handleCheck = () => {
    if (!userInput.trim()) {
      setErrorMsg(t("emptyInput"));
      return;
    }
    setErrorMsg("");

    const diff = compareSentences(userInput, sentence.en_content);
    setDiffTokens(diff);
    setIsChecked(true);
    
    // Auto reveal all hint tokens on check
    setHintTokens(prev => prev.map(tok => ({ ...tok, revealed: true })));
  };

  const toggleRevealAll = () => {
    const allRevealed = hintTokens.every((tok) => tok.revealed);
    setHintTokens(prev => prev.map(tok => ({ ...tok, revealed: !allRevealed })));
  };

  const toggleRevealToken = (idx: number) => {
    setHintTokens(prev => prev.map((tok, i) => i === idx ? { ...tok, revealed: !tok.revealed } : tok));
  };

  // Get difficulty badge color class
  const getDiffBadge = (level: string) => {
    switch (level) {
      case "easy":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "medium":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "hard":
        return "bg-rose-50 border-rose-200 text-rose-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="w-full bg-white border-2 border-[#1b3d1e] rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(27,61,30,0.04)] transition-all duration-300">
      {/* Header: VN TIẾNG VIỆT -> ENGLISH */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <span className="text-xs font-black tracking-widest text-[#3B5C37] uppercase flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-[#3B5C37] text-white text-[10px]">VN</span>
          TIẾNG VIỆT &rarr; ENGLISH
        </span>
        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${getDiffBadge(sentence.difficulty_level)}`}>
          {t(`difficulty.${sentence.difficulty_level}`)}
        </span>
      </div>

      {/* Target Vietnamese Prompt */}
      <div className="mb-6">
        <p className="text-xl md:text-2xl font-extrabold text-[#1b3d1e] leading-tight">
          {sentence.vi_content}
        </p>
      </div>

      {/* Masked model answer pills */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 mb-3 border-b border-gray-200/60 pb-2">
          <span className="text-[10px] font-black tracking-wider uppercase text-gray-400">
            CÂU MẪU - NHỚ ĐÚNG ĐỂ MỞ TỪ:
          </span>
          <button 
            onClick={toggleRevealAll}
            className="text-[10px] font-bold text-[#3B5C37] hover:underline flex items-center gap-1"
          >
            👁 {hintTokens.every(tok => tok.revealed) ? "Ẩn tất cả" : "Hiện tất cả"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hintTokens.map((tok, idx) => (
            <button
              key={idx}
              onClick={() => toggleRevealToken(idx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                tok.revealed 
                  ? "bg-white border-[#3B5C37] text-[#1b3d1e]" 
                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
              }`}
            >
              {!tok.revealed && <span className="text-[10px]">👁</span>}
              {tok.revealed ? tok.original : tok.display}
            </button>
          ))}
        </div>
      </div>

      {/* Vocab Hints toggle */}
      {sentence.explanation.vocabulary && sentence.explanation.vocabulary.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowVocabHints(!showVocabHints)}
            className="text-xs font-extrabold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            💡 {showVocabHints ? "Ẩn gợi ý từ vựng" : "Xem gợi ý từ vựng"}
          </button>
          {showVocabHints && (
            <div className="mt-3 bg-amber-50/40 border border-amber-100 rounded-2xl p-4 space-y-2 animate-fade-in">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Từ vựng gợi ý:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sentence.explanation.vocabulary.map((vocab, idx) => (
                  <div key={idx} className="flex items-start gap-1 font-medium">
                    <span className="text-[#3B5C37] font-bold">• {vocab.term}:</span>
                    <span className="text-gray-600">{vocab.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User English Input */}
      <div className="mb-6">
        <label htmlFor="translation-input" className="block text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-2">
          BÀI DỊCH CỦA EM:
        </label>
        <textarea
          id="translation-input"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            if (errorMsg) setErrorMsg("");
          }}
          disabled={isChecked}
          placeholder="Gõ bản dịch của bạn tại đây..."
          className="w-full min-h-[110px] border-2 border-[#ccd6c5] focus:border-[#3B5C37] rounded-2xl p-4 text-sm font-medium outline-none resize-none disabled:bg-gray-50 disabled:text-gray-600 transition-colors duration-200"
        />
        {errorMsg && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Check/Next Actions */}
      <div className="flex gap-4 mb-8">
        {!isChecked ? (
          <button
            onClick={handleCheck}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3B5C37] px-6 py-4 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(59,92,55,0.15)] hover:bg-[#2c472a] active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t("check").toUpperCase()}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#008060] px-6 py-4 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(0,128,96,0.15)] hover:bg-[#006b50] active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            {isLast ? "HOÀN THÀNH" : t("next").toUpperCase()}
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

      {/* Check Answer Feedback Section */}
      {isChecked && (
        <div className="space-y-8 animate-fade-in border-t border-gray-150 pt-6">
          {/* Diff Visual Feedback */}
          <div>
            <h4 className="text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-3">Comparison Feedback</h4>
            <div className="bg-[#f8f9fa] border-2 border-gray-200 rounded-2xl p-5 flex flex-wrap gap-x-1 gap-y-2 text-sm md:text-base font-medium">
              {diffTokens.map((token, index) => {
                if (token.status === "correct") {
                  return (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                    >
                      {token.word}
                    </span>
                  );
                } else if (token.status === "incorrect") {
                  return (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through font-bold"
                    >
                      {token.word}
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 rounded bg-gray-150 text-gray-500 border border-dashed border-gray-300 font-bold"
                    >
                      {token.word}
                    </span>
                  );
                }
              })}
            </div>
            <p className="mt-2.5 text-xs font-bold text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Correct
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ml-2"></span> Incorrect
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block ml-2"></span> Missing/Expected
            </p>
          </div>

          {/* Model Answer */}
          <div>
            <h4 className="text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-2">{t("correctAnswer")}</h4>
            <div className="bg-[#edf3e8]/30 border border-[#b2cbb1] rounded-2xl p-4 font-extrabold text-[#1b3d1e] text-base leading-relaxed">
              {sentence.en_content}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="border-t border-dashed border-gray-300 pt-6">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-[#3B5C37]" />
              <h3 className="text-lg font-black text-[#1b3d1e] tracking-tight">{t("explanation")}</h3>
            </div>

            <div className="space-y-6">
              {/* Vocabulary Notes */}
              {sentence.explanation.vocabulary && sentence.explanation.vocabulary.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-3">{t("vocabulary")}</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-3 font-black text-[#3B5C37] w-1/3">{t("term")}</th>
                          <th className="p-3 font-black text-[#3B5C37]">{t("meaning")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {sentence.explanation.vocabulary.map((vocab, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-[#1b3d1e]">{vocab.term}</td>
                            <td className="p-3 text-gray-600 font-medium">{vocab.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grammar Points */}
              {sentence.explanation.grammar && sentence.explanation.grammar.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-[#3B5C37] tracking-wider uppercase mb-3">{t("grammar")}</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-3 font-black text-[#3B5C37] w-1/3">{t("structure")}</th>
                          <th className="p-3 font-black text-[#3B5C37]">{t("usage")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {sentence.explanation.grammar.map((gram, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-[#1b3d1e]">{gram.structure}</td>
                            <td className="p-3 text-gray-600 font-medium">{gram.usage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Study Tips */}
              {sentence.explanation.tips && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-amber-800 tracking-wider uppercase mb-1">{t("tips")}</h5>
                    <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                      {sentence.explanation.tips}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
