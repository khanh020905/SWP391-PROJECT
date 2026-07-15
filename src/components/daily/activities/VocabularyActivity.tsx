'use client';
import React, { useState } from 'react';
import { Volume2, ChevronRight, Check } from 'lucide-react';

interface VocabularyActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

export default function VocabularyActivity({ activity, onComplete }: VocabularyActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rememberedIds, setRememberedIds] = useState<string[]>([]);
  
  const words = activity.data || [];
  const currentWord = words[currentIndex];

  const handlePronounce = (word: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = (remembered: boolean) => {
    if (remembered && currentWord) {
      setRememberedIds(prev => [...prev, currentWord.id]);
    }
    
    setFlipped(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleDone = () => {
    const finalRemembered = [...rememberedIds];
    if (currentWord) {
      finalRemembered.push(currentWord.id);
    }
    
    onComplete({
      itemIds: words.map((w: any) => w.id),
      results: words.map((w: any) => ({
        id: w.id,
        correct: finalRemembered.includes(w.id)
      })),
      xpEarned: activity.xp
    });
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 font-bold">Không có từ vựng nào hôm nay.</p>
        <button 
          onClick={() => onComplete({ itemIds: [], results: [], xpEarned: 0 })}
          className="mt-4 px-6 py-2 bg-[#5D6B2D] text-[#FFF8EB] rounded-xl font-bold"
        >
          Hoàn thành
        </button>
      </div>
    );
  }

  const isLast = currentIndex === words.length - 1;

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 mb-6">
        <span>Từ {currentIndex + 1} / {words.length}</span>
        <span>Đã nhớ: {rememberedIds.length}</span>
      </div>

      {/* Card Wrapper with Flip Animation */}
      <div className="perspective-1000 w-full max-w-sm h-64 mb-8">
        <div 
          onClick={() => setFlipped(!flipped)}
          className={`relative w-full h-full duration-500 transform-style-3d cursor-pointer rounded-2xl border-2 border-slate-200/80 shadow-md ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 bg-white rounded-2xl">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              {currentWord?.word}
            </h3>
            <span className="text-sm font-bold text-slate-400 italic mb-4">
              {currentWord?.phonetic || "/.../"}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePronounce(currentWord?.word);
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-[#5D6B2D] rounded-full transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-black text-[#B38F4D] uppercase tracking-wider mt-6">
              Nhấp vào thẻ để xem nghĩa
            </span>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-[#5D6B2D] uppercase tracking-widest px-2.5 py-1 bg-[#E9EFE0] rounded mb-3">
              {currentWord?.category || "Từ vựng"}
            </span>
            <h4 className="text-xl font-bold text-slate-800 text-center leading-tight mb-3">
              {currentWord?.meaning}
            </h4>
            {currentWord?.example && (
              <p className="text-xs font-semibold text-slate-500 text-center italic max-w-xs leading-relaxed">
                "{currentWord.example}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-sm flex gap-3">
        {flipped ? (
          <>
            <button
              onClick={() => (isLast ? handleDone() : handleNext(false))}
              className="flex-1 py-3.5 border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-500 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Cần ôn lại
            </button>
            <button
              onClick={() => (isLast ? handleDone() : handleNext(true))}
              className="flex-1 py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4" /> Hoàn thành
                </>
              ) : (
                <>
                  Đã nhớ ✓ <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Lật thẻ xem nghĩa
          </button>
        )}
      </div>
    </div>
  );
}
