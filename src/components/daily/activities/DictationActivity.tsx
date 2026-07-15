'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, ChevronRight, Check } from 'lucide-react';

interface DictationActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

export default function DictationActivity({ activity, onComplete }: DictationActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lesson = activity.data || {};
  const challenges = lesson.challenges || [];
  const challenge = challenges[currentIndex];

  useEffect(() => {
    setIsPlaying(false);
    setChecked(false);
    setInput('');
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const checkAnswer = () => {
    if (!challenge) return;
    const cleanExpected = (challenge.content || challenge.text || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const cleanInput = input.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const correct = cleanExpected === cleanInput;

    setResults(prev => [
      ...prev,
      {
        id: String(challenge.id),
        correct,
        input: input,
        expected: challenge.content || challenge.text || ""
      }
    ]);
    setChecked(true);
  };

  const handleNext = () => {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleDone = () => {
    onComplete({
      itemIds: challenges.map((c: any) => String(c.id)),
      results: results,
      xpEarned: activity.xp
    });
  };

  if (challenges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 font-bold">Không có bài nghe chép chính tả nào hôm nay.</p>
        <button 
          onClick={() => onComplete({ itemIds: [], results: [], xpEarned: 0 })}
          className="mt-4 px-6 py-2 bg-[#5D6B2D] text-[#FFF8EB] rounded-xl font-bold"
        >
          Hoàn thành
        </button>
      </div>
    );
  }

  const isLast = currentIndex === challenges.length - 1;
  const audioSrc = challenge?.audioSrc;

  return (
    <div className="flex flex-col items-center">
      {/* Audio Element */}
      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Progress */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 mb-6">
        <span>Câu {currentIndex + 1} / {challenges.length}</span>
        <span>Đúng: {results.filter(r => r.correct).length}</span>
      </div>

      {/* Audio Controller Card */}
      <div className="w-full bg-[#F7F8F2] border border-[#E9EFE0] p-6 rounded-2xl flex flex-col items-center justify-center mb-6">
        <button 
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] flex items-center justify-center shadow-md active:scale-95 transition-all mb-3"
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 translate-x-0.5" />}
        </button>
        <span className="text-xs font-bold text-slate-500">
          {isPlaying ? "Đang phát âm thanh..." : "Nhấp phát để nghe"}
        </span>
      </div>

      {/* Input */}
      <div className="w-full mb-6">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Bản dịch / Gõ lại câu bạn nghe được:</label>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={checked}
          placeholder="Nhập câu bạn nghe được..."
          className="w-full border-2 border-slate-200/80 rounded-xl p-4 text-sm font-bold focus:border-[#5D6B2D] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
        />
      </div>

      {/* Checked Result comparison */}
      {checked && challenge && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-xs font-semibold text-slate-500">
            <strong className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Đáp án đúng:</strong>
            {challenge.content || challenge.text}
          </p>
          {results[currentIndex]?.correct ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Chính xác ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Chưa chính xác ✗
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="w-full">
        {!checked ? (
          <button
            onClick={checkAnswer}
            disabled={!input.trim()}
            className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm ${
              !input.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            Kiểm tra kết quả
          </button>
        ) : (
          <button
            onClick={isLast ? handleDone : handleNext}
            className="w-full py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4" /> Hoàn thành
              </>
            ) : (
              <>
                Câu tiếp theo <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
