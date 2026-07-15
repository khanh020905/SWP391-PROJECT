'use client';
import React, { useState, useRef } from 'react';
import { Volume2, Play, Pause, Check, Loader2 } from 'lucide-react';

interface DictationActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

export default function DictationActivity({ activity, onComplete }: DictationActivityProps) {
  const lesson = activity.data || {};
  const challenges = lesson.challenges || [];

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  
  // Array of results from Gemini: { id, correct, score, feedback }
  const [feedbackResults, setFeedbackResults] = useState<Record<string, { correct: boolean; feedback: string }>>({});

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handleInputChange = (cId: string, val: string) => {
    if (checked) return;
    setInputs(prev => ({ ...prev, [cId]: val }));
  };

  const togglePlay = (cId: string, audioSrc: string) => {
    const currentAudio = audioRefs.current[cId];
    if (!currentAudio) return;

    if (playingId === cId) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing audio
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]?.pause();
      }
      currentAudio.play();
      setPlayingId(cId);
    }
  };

  const handleAudioEnded = (cId: string) => {
    if (playingId === cId) {
      setPlayingId(null);
    }
  };

  const handleBatchCheck = async () => {
    if (checking || checked) return;
    setChecking(true);

    const payloadItems = challenges.map((c: any) => ({
      id: String(c.id),
      input: inputs[c.id] || "",
      expected: c.content || c.text || ""
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/student/daily/check-dictation", {
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
        throw new Error("Batch API failed");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn("AI dictation grading timed out (15s). Falling back to local grading.");
      } else {
        console.error("Batch check error:", err);
      }
      // Fallback
      const resultsMap: Record<string, { correct: boolean; feedback: string }> = {};
      challenges.forEach((c: any) => {
        const cleanExpected = (c.content || c.text || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const cleanInput = (inputs[c.id] || "").trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const correct = cleanExpected === cleanInput;
        resultsMap[c.id] = {
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
    const finalResults = challenges.map((c: any) => ({
      id: String(c.id),
      correct: feedbackResults[c.id]?.correct || false,
      input: inputs[c.id] || "",
      expected: c.content || c.text || ""
    }));

    onComplete({
      itemIds: challenges.map((c: any) => String(c.id)),
      results: finalResults,
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

  const allAnswered = challenges.every((c: any) => (inputs[c.id] || "").trim().length > 0);
  const correctCount = challenges.filter((c: any) => feedbackResults[c.id]?.correct).length;

  return (
    <div className="flex flex-col space-y-6">
      {/* Scrollable List of dictations */}
      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {challenges.map((c: any, idx: number) => {
          const isCurrentPlaying = playingId === c.id;
          const result = feedbackResults[c.id];

          return (
            <div key={c.id} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Audio controller */}
              {c.audioSrc && (
                <audio 
                  ref={el => { audioRefs.current[c.id] = el; }} 
                  src={c.audioSrc} 
                  onEnded={() => handleAudioEnded(c.id)}
                  className="hidden"
                />
              )}

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Câu {idx + 1} / {challenges.length}
                </span>
                
                <button
                  onClick={() => togglePlay(c.id, c.audioSrc)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                    isCurrentPlaying
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-[#E9EFE0] text-[#5D6B2D] border border-[#D5DFC6]'
                  }`}
                >
                  {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isCurrentPlaying ? "Tạm dừng" : "Nghe Audio"}
                </button>
              </div>

              {/* Input field */}
              <div>
                <textarea
                  rows={2}
                  value={inputs[c.id] || ""}
                  onChange={(e) => handleInputChange(c.id, e.target.value)}
                  disabled={checked}
                  placeholder="Gõ lại câu bạn nghe được..."
                  className="w-full border-2 border-slate-200/80 rounded-xl p-3 text-sm font-bold focus:border-[#5D6B2D] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                />
              </div>

              {/* Grading Result */}
              {checked && result && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="text-slate-500 font-semibold">
                    <strong className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Đáp án đúng:</strong>
                    {c.content || c.text}
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                    <div>
                      {result.correct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Chính xác ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          Chưa chính xác ✗
                        </span>
                      )}
                    </div>
                    {result.feedback && (
                      <p className="text-slate-500 mt-1 pl-1 border-l-2 border-[#B38F4D]">
                        💡 <span className="font-bold text-slate-700">AI:</span> {result.feedback}
                      </p>
                    )}
                  </div>
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
                <Loader2 className="w-4 h-4 animate-spin" /> AI đang chấm điểm tất cả các câu...
              </>
            ) : (
              "Nộp bài & AI Chấm điểm"
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-6 bg-[#F7F8F2] border border-[#E9EFE0] p-4 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Kết quả ôn tập</p>
              <h4 className="text-lg font-black text-[#5D6B2D] mt-1">Đúng {correctCount} / {challenges.length} câu</h4>
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
