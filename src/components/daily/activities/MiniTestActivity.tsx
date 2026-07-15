'use client';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';

interface MiniTestActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

export default function MiniTestActivity({ activity, onComplete }: MiniTestActivityProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const data = activity.data || {};
  const hasPassage = data.passage_text && data.passage_title;
  
  const questions = hasPassage ? (data.questions || []) : (Array.isArray(activity.data) ? activity.data : []);

  const handleSelectAnswer = (qId: string, optionLabel: string) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionLabel }));
  };

  const getOptions = (q: any) => {
    if (Array.isArray(q.options)) {
      return q.options;
    }
    // Handle True/False/Not Given default options
    if (q.question_type === 'true_false' || q.question_type === 'tfng' || q.question_type === 'true_false_not_given') {
      return [
        { label: 'TRUE', text: 'True' },
        { label: 'FALSE', text: 'False' },
        { label: 'NOT GIVEN', text: 'Not Given' }
      ];
    }
    if (q.question_type === 'ynng') {
      return [
        { label: 'YES', text: 'Yes' },
        { label: 'NO', text: 'No' },
        { label: 'NOT GIVEN', text: 'Not Given' }
      ];
    }
    return [];
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleFinish = () => {
    const results = questions.map((q: any) => {
      const selected = selectedAnswers[q.id] || "";
      const isCorrect = String(q.correct_answer).trim().toLowerCase() === selected.trim().toLowerCase();
      return {
        id: q.id,
        correct: isCorrect,
        selected: selected
      };
    });

    onComplete({
      itemIds: questions.map((q: any) => q.id),
      results: results,
      xpEarned: activity.xp
    });
  };

  const allAnswered = questions.every((q: any) => selectedAnswers[q.id] !== undefined);
  const correctCount = questions.filter((q: any) => {
    const selected = selectedAnswers[q.id] || "";
    return String(q.correct_answer).trim().toLowerCase() === selected.trim().toLowerCase();
  }).length;

  return (
    <div className="flex flex-col space-y-6">
      {/* Passage Layout if present */}
      {hasPassage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Reading Passage */}
          <div className="bg-[#F7F8F2] border border-[#E9EFE0] rounded-2xl p-5 overflow-y-auto max-h-[50vh] md:max-h-[60vh] prose prose-slate prose-sm max-w-none">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-[#5D6B2D]" />
              {data.passage_title}
            </h3>
            <div 
              className="text-slate-600 leading-relaxed space-y-4 text-xs font-semibold"
              dangerouslySetInnerHTML={{ __html: data.passage_text }}
            />
          </div>

          {/* Right Column: Questions */}
          <div className="space-y-4 overflow-y-auto max-h-[50vh] md:max-h-[60vh] pr-1">
            {questions.map((q: any, idx: number) => {
              const selected = selectedAnswers[q.id];
              const options = getOptions(q);
              const isCorrect = String(q.correct_answer).trim().toLowerCase() === String(selected).trim().toLowerCase();

              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="font-bold text-slate-800 text-xs leading-relaxed">
                      {q.text}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-1.5 pl-7">
                    {options.map((opt: any) => {
                      const isThisSelected = selected === opt.label;
                      const isThisCorrectAnswer = String(q.correct_answer).trim().toLowerCase() === String(opt.label).trim().toLowerCase();
                      
                      let optionStyle = "border-slate-200 hover:border-slate-300 bg-white text-slate-700";
                      if (submitted) {
                        if (isThisCorrectAnswer) {
                          optionStyle = "border-emerald-500 bg-emerald-50/50 text-emerald-800";
                        } else if (isThisSelected && !isCorrect) {
                          optionStyle = "border-rose-500 bg-rose-50/50 text-rose-800";
                        } else {
                          optionStyle = "border-slate-100 bg-slate-50/30 text-slate-400 cursor-default";
                        }
                      } else if (isThisSelected) {
                        optionStyle = "border-[#5D6B2D] bg-[#F7F8F2] text-[#5D6B2D]";
                      }

                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleSelectAnswer(q.id, opt.label)}
                          disabled={submitted}
                          className={`flex items-center gap-2 border p-2.5 rounded-lg text-xs font-bold text-left transition-all ${optionStyle}`}
                        >
                          <span className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shrink-0 border ${
                            submitted && isThisCorrectAnswer
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : submitted && isThisSelected && !isCorrect
                              ? "bg-rose-500 text-white border-rose-600"
                              : isThisSelected
                              ? "bg-[#5D6B2D] text-white border-[#4A5722]"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {opt.label}
                          </span>
                          <span className="flex-1 text-[11px]">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {submitted && (
                    <div className={`ml-7 p-2.5 rounded-lg border flex gap-2 text-[11px] leading-relaxed ${
                      isCorrect 
                        ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" 
                        : "bg-rose-50/30 border-rose-100 text-rose-800"
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold mb-0.5">
                          {isCorrect ? "Đáp án chính xác" : "Đáp án chưa đúng"}
                        </p>
                        <p className="text-slate-500">
                          Đáp án đúng: <strong className="text-emerald-700">{q.correct_answer}</strong>.
                        </p>
                        {q.explanation && (
                          <p className="text-slate-400 italic mt-1">Giải thích: {q.explanation}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback Layout (Just Questions) */}
      {!hasPassage && (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q: any, idx: number) => {
            const selected = selectedAnswers[q.id];
            const options = getOptions(q);
            const isCorrect = String(q.correct_answer).trim().toLowerCase() === String(selected).trim().toLowerCase();

            return (
              <div key={q.id} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm leading-relaxed mb-4">
                      {q.text}
                    </p>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2">
                      {options.map((opt: any) => {
                        const isThisSelected = selected === opt.label;
                        const isThisCorrectAnswer = String(q.correct_answer).trim().toLowerCase() === String(opt.label).trim().toLowerCase();
                        
                        let optionStyle = "border-slate-200 hover:border-slate-300 bg-white text-slate-700";
                        if (submitted) {
                          if (isThisCorrectAnswer) {
                            optionStyle = "border-emerald-500 bg-emerald-50/50 text-emerald-800";
                          } else if (isThisSelected && !isCorrect) {
                            optionStyle = "border-rose-500 bg-rose-50/50 text-rose-800";
                          } else {
                            optionStyle = "border-slate-100 bg-slate-50/30 text-slate-400 cursor-default";
                          }
                        } else if (isThisSelected) {
                          optionStyle = "border-[#5D6B2D] bg-[#F7F8F2] text-[#5D6B2D]";
                        }

                        return (
                          <button
                            key={opt.label}
                            onClick={() => handleSelectAnswer(q.id, opt.label)}
                            disabled={submitted}
                            className={`flex items-center gap-3 border-2 p-3 rounded-xl text-xs font-bold text-left transition-all ${optionStyle}`}
                          >
                            <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border ${
                              submitted && isThisCorrectAnswer
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : submitted && isThisSelected && !isCorrect
                                ? "bg-rose-500 text-white border-rose-600"
                                : isThisSelected
                                ? "bg-[#5D6B2D] text-white border-[#4A5722]"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              {opt.label}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Explanation */}
                    {submitted && (
                      <div className={`mt-3 p-3 rounded-xl border flex gap-2 text-xs leading-relaxed ${
                        isCorrect 
                          ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" 
                          : "bg-rose-50/30 border-rose-100 text-rose-800"
                      }`}>
                        <div className="mt-0.5 shrink-0">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold mb-0.5">
                            {isCorrect ? "Đáp án chính xác" : "Đáp án chưa đúng"}
                          </p>
                          <p className="text-slate-500">
                            Đáp án đúng là <strong className="text-emerald-700">{q.correct_answer}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Button Actions */}
      <div className="flex items-center justify-between gap-6 pt-3 border-t border-slate-200/80">
        {submitted ? (
          <div className="bg-[#F7F8F2] border border-[#E9EFE0] px-4 py-2.5 rounded-xl text-xs font-bold text-[#5D6B2D]">
            Đúng {correctCount} / {questions.length} câu hỏi
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-400">
            Hãy trả lời hết câu hỏi để hoàn tất
          </div>
        )}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md ${
              !allAnswered
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-slate-800 hover:bg-slate-900 text-white"
            }`}
          >
            Nộp bài kiểm tra
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Hoàn thành Mini Test
          </button>
        )}
      </div>
    </div>
  );
}
