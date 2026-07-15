'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';

interface TranslationActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

export default function TranslationActivity({ activity, onComplete }: TranslationActivityProps) {
  const [sentences, setSentences] = useState<any[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Array of results from Gemini: { id, correct, score, feedback }
  const [feedbackResults, setFeedbackResults] = useState<Record<string, { correct: boolean; feedback: string }>>({});

  useEffect(() => {
    async function loadSentences() {
      try {
        setLoading(true);
        if (!activity.data) {
          setLoading(false);
          return;
        }
        if (Array.isArray(activity.data)) {
          setSentences(activity.data);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("writing_practice_sentences")
          .select("*")
          .eq("topic_id", activity.data?.id)
          .order("id", { ascending: true })
          .limit(5);

        if (data) {
          setSentences(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải câu dịch:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSentences();
  }, [activity.data]);

  const handleInputChange = (sId: string, val: string) => {
    if (checked) return;
    setInputs(prev => ({ ...prev, [sId]: val }));
  };

  const handleBatchCheck = async () => {
    if (checking || checked) return;
    setChecking(true);

    const payloadItems = sentences.map((s: any) => ({
      id: String(s.id),
      input: inputs[s.id] || "",
      expected: s.en_content || "",
      vi_prompt: s.vi_content || ""
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/student/daily/check-translation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: payloadItems }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const resultsMap: Record<string, { correct: boolean; feedback: string }> = {};

        const itemsList = Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : data.results && typeof data.results === 'object'
          ? [data.results]
          : data && typeof data === 'object'
          ? [data]
          : [];

        itemsList.forEach((item: any) => {
          if (item && item.id) {
            resultsMap[item.id] = {
              correct: !!item.correct,
              feedback: item.feedback || ""
            };
          }
        });

        setFeedbackResults(resultsMap);
        setChecked(true);
      } else {
        throw new Error("Batch translation API failed");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn("AI translation grading timed out (15s). Falling back to local grading.");
      } else {
        console.error("Batch translation check error:", err);
      }
      // Fallback
      const resultsMap: Record<string, { correct: boolean; feedback: string }> = {};
      sentences.forEach((s: any) => {
        const cleanExpected = (s.en_content || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const cleanInput = (inputs[s.id] || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const correct = cleanExpected === cleanInput;
        resultsMap[s.id] = {
          correct,
          feedback: correct ? "Chính xác!" : "Chưa chính xác. Vui lòng đối chiếu với đáp án."
        };
      });
      setFeedbackResults(resultsMap);
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  const handleDone = () => {
    const finalResults = sentences.map((s: any) => ({
      id: String(s.id),
      correct: feedbackResults[s.id]?.correct || false,
      input: inputs[s.id] || "",
      expected: s.en_content || ""
    }));

    onComplete({
      itemIds: sentences.map(s => String(s.id)),
      results: finalResults,
      xpEarned: activity.xp
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-[#5D6B2D] border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs text-slate-500 font-bold">Đang tải danh sách câu dịch...</p>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 font-bold">Không có câu dịch nào hôm nay.</p>
        <button 
          onClick={() => onComplete({ itemIds: [], results: [], xpEarned: 0 })}
          className="mt-4 px-6 py-2 bg-[#5D6B2D] text-[#FFF8EB] rounded-xl font-bold"
        >
          Hoàn thành
        </button>
      </div>
    );
  }

  const allAnswered = sentences.every((s: any) => (inputs[s.id] || "").trim().length > 0);
  const correctCount = sentences.filter((s: any) => feedbackResults[s.id]?.correct).length;

  return (
    <div className="flex flex-col space-y-6">
      {/* Scrollable list of sentences */}
      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {sentences.map((s: any, idx: number) => {
          const result = feedbackResults[s.id];

          return (
            <div key={s.id} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Vietnamese Prompt */}
              <div className="bg-[#F7F8F2] border border-[#E9EFE0] p-4 rounded-xl">
                <span className="text-[10px] font-black text-[#5D6B2D] uppercase tracking-widest block mb-1">
                  Câu {idx + 1} / {sentences.length}:
                </span>
                <h4 className="text-sm font-black text-slate-800 leading-relaxed">
                  {s.vi_content}
                </h4>
              </div>

              {/* Textarea Input */}
              <div>
                <textarea
                  rows={2}
                  value={inputs[s.id] || ""}
                  onChange={(e) => handleInputChange(s.id, e.target.value)}
                  disabled={checked}
                  placeholder="Nhập bản dịch tiếng Anh ở đây..."
                  className="w-full border-2 border-slate-200/80 rounded-xl p-3 text-sm font-bold focus:border-[#5D6B2D] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                />
              </div>

              {/* Revealed Answer & AI Explanation */}
              {checked && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Đáp án gợi ý:</span>
                    <p className="font-bold text-slate-800 leading-relaxed">{s.en_content}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1 border-t border-slate-200/60 pt-2">
                    <div>
                      {result?.correct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Chính xác ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          Chưa chính xác ✗
                        </span>
                      )}
                    </div>
                    {result?.feedback && (
                      <p className="text-slate-500 mt-1 pl-1 border-l-2 border-[#B38F4D]">
                        💡 <span className="font-bold text-slate-700">AI Nhận xét:</span> {result.feedback}
                      </p>
                    )}
                  </div>

                  {s.explanation && (
                    <div className="border-t border-slate-200/60 pt-2">
                      <span className="text-[10px] text-[#B38F4D] font-black uppercase tracking-wider block mb-1">Giải thích chi tiết:</span>
                      {typeof s.explanation === 'string' ? (
                        <p className="font-semibold text-slate-500 leading-relaxed">{s.explanation}</p>
                      ) : (
                        <div className="space-y-2 font-semibold text-slate-500">
                          {s.explanation.tips && (
                            <p className="leading-relaxed"><strong className="text-slate-700">💡 Mẹo học:</strong> {s.explanation.tips}</p>
                          )}
                          {Array.isArray(s.explanation.grammar) && s.explanation.grammar.length > 0 && (
                            <div>
                              <strong className="text-slate-700 block mb-0.5">🔍 Cấu trúc ngữ pháp:</strong>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {s.explanation.grammar.map((g: any, i: number) => (
                                  <li key={i}>
                                    {typeof g === 'string'
                                      ? g
                                      : g && typeof g === 'object'
                                      ? `${g.structure || ''} ${g.usage ? `— ${g.usage}` : ''}`
                                      : JSON.stringify(g)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(s.explanation.vocabulary) && s.explanation.vocabulary.length > 0 && (
                            <div>
                              <strong className="text-slate-700 block mb-0.5">📚 Từ vựng chính:</strong>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {s.explanation.vocabulary.map((v: any, i: number) => (
                                  <li key={i}>
                                    {typeof v === 'string'
                                      ? v
                                      : v && typeof v === 'object'
                                      ? `${v.word || v.term || ''} ${v.meaning || v.definition ? `: ${v.meaning || v.definition}` : ''}`
                                      : JSON.stringify(v)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer action buttons */}
      <div className="pt-2 border-t border-slate-200/80">
        {!checked ? (
          <button
            onClick={handleBatchCheck}
            disabled={!allAnswered || checking}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
              !allAnswered || checking
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> AI đang chấm điểm tất cả bản dịch...
              </>
            ) : (
              "Nộp bài & AI Chấm điểm"
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-6 bg-[#F7F8F2] border border-[#E9EFE0] p-4 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Kết quả dịch câu</p>
              <h4 className="text-lg font-black text-[#5D6B2D] mt-1">Đạt {correctCount} / {sentences.length} câu</h4>
            </div>
            <button
              onClick={handleDone}
              className="px-8 py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Hoàn thành
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
