'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, ChevronRight } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSentences() {
      try {
        setLoading(true);
        if (Array.isArray(activity.data)) {
          setSentences(activity.data);
          return;
        }

        const { data, error } = await supabase
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
    if (activity.data) {
      loadSentences();
    }
  }, [activity.data]);

  const currentSentence = sentences[currentIndex];

  const handleSelfEvaluate = (correct: boolean) => {
    if (!currentSentence) return;
    setResults(prev => [
      ...prev,
      {
        id: String(currentSentence.id),
        correct,
        input: input,
        expected: currentSentence.en_content
      }
    ]);

    setInput('');
    setShowAnswer(false);
    
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Done
      onComplete({
        itemIds: sentences.map(s => String(s.id)),
        results: [...results, { id: String(currentSentence.id), correct, input, expected: currentSentence.en_content }],
        xpEarned: activity.xp
      });
    }
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

  const isLast = currentIndex === sentences.length - 1;

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 mb-6">
        <span>Câu {currentIndex + 1} / {sentences.length}</span>
        <span>Hoàn thành: {results.length}</span>
      </div>

      {/* Vietnamese Prompt Card */}
      <div className="w-full bg-[#F7F8F2] border border-[#E9EFE0] p-6 rounded-2xl mb-6">
        <span className="text-[10px] font-black text-[#5D6B2D] uppercase tracking-widest block mb-2">Câu Tiếng Việt Cần Dịch:</span>
        <h4 className="text-base font-black text-slate-800 leading-relaxed">
          {currentSentence?.vi_content}
        </h4>
      </div>

      {/* Input */}
      <div className="w-full mb-6">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Bản dịch tiếng Anh của bạn:</label>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={showAnswer}
          placeholder="Nhập bản dịch tiếng Anh ở đây..."
          className="w-full border-2 border-slate-200/80 rounded-xl p-4 text-sm font-bold focus:border-[#5D6B2D] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
        />
      </div>

      {/* Revealed Answer & Explanation */}
      {showAnswer && currentSentence && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-3 animate-[fadeIn_0.2s_ease_both]">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Đáp án gợi ý:</span>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">{currentSentence.en_content}</p>
          </div>
          {currentSentence.explanation && (
            <div>
              <span className="text-[10px] text-[#B38F4D] font-black uppercase tracking-wider block mb-0.5">Giải thích chi tiết:</span>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">{currentSentence.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="w-full">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            disabled={!input.trim()}
            className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm ${
              !input.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            Xem đáp án gợi ý
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleSelfEvaluate(false)}
              className="flex-1 py-3.5 border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-500 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Chưa giống ✗
            </button>
            <button
              onClick={() => handleSelfEvaluate(true)}
              className="flex-1 py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4" /> Hoàn thành
                </>
              ) : (
                <>
                  Đúng rồi ✓ <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
