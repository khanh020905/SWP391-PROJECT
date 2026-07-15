'use client';
import React, { useState } from 'react';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface GrammarActivityProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
}

const LESSON_EXERCISES: Record<string, any[]> = {
  gl_001: [
    {
      text: "I ________ London three times. (Choose the correct tense)",
      options: ["have visited", "visited", "visiting", "visit"],
      answer: 0,
      explanation: "Diễn tả trải nghiệm sống cho đến hiện tại, ta dùng thì Hiện tại hoàn thành."
    },
    {
      text: "She graduated from university ________ 2019.",
      options: ["in", "since", "for", "at"],
      answer: 0,
      explanation: "Với năm cụ thể trong quá khứ đã hoàn thành, ta dùng giới từ 'in'."
    },
    {
      text: "When ________ you start learning English?",
      options: ["did", "have", "do", "were"],
      answer: 0,
      explanation: "Hỏi về thời điểm bắt đầu trong quá khứ dùng trợ động từ 'did' trong quá khứ đơn."
    }
  ]
};

const FALLBACK_QUESTIONS = [
  {
    text: "Identify the correct academic sentence structure:",
    options: [
      "The results was analyzed by researchers.",
      "The results were analyzed by researchers.",
      "The results have analyzed by researchers.",
      "The results analyze by researchers."
    ],
    answer: 1,
    explanation: "Chủ ngữ số nhiều 'results' đi cùng to-be số nhiều 'were' trong thể bị động quá khứ đơn."
  },
  {
    text: "Choose the word that fits best in an academic context: 'The government aims to ________ poverty.'",
    options: ["kill", "eradicate", "stop", "end"],
    answer: 1,
    explanation: "'Eradicate' (xóa sổ, loại bỏ hoàn toàn) là từ vựng mang tính học thuật (academic word) phù hợp nhất cho ngữ cảnh viết luận IELTS Task 2."
  },
  {
    text: "Which linking word shows concession?",
    options: ["Therefore", "Furthermore", "Although", "Consequently"],
    answer: 2,
    explanation: "'Although' (Mặc dù) dùng để chỉ sự nhượng bộ (concession), nối hai mệnh đề trái ngược nhau về mặt ý nghĩa."
  }
];

export default function GrammarActivity({ activity, onComplete }: GrammarActivityProps) {
  const [step, setStep] = useState<'theory' | 'quiz' | 'result'>('theory');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  const lesson = activity.data || {};
  const sections = lesson.sections || [];
  const questions = LESSON_EXERCISES[lesson.lesson_id] || FALLBACK_QUESTIONS;

  const handleSubmitQuiz = () => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setStep('result');
  };

  const handleFinish = () => {
    onComplete({
      itemIds: [lesson.lesson_id],
      results: [{ correct: score >= 2, score }],
      xpEarned: activity.xp
    });
  };

  return (
    <div className="flex flex-col">
      {step === 'theory' && (
        <div className="space-y-6">
          <div className="border-l-4 border-[#5D6B2D] pl-4 py-1">
            <h3 className="text-lg font-black text-slate-800">{lesson.title}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Band {lesson.band} • Phần Lý thuyết</p>
          </div>

          <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2">
            {sections.map((sec: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#5D6B2D]" />
                  {sec.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{sec.explanation}</p>
                {sec.examples && (
                  <div className="bg-white border border-slate-200/40 rounded-lg p-3 space-y-1.5">
                    <span className="text-[10px] font-black text-[#B38F4D] uppercase tracking-wider block mb-1">Ví dụ:</span>
                    {sec.examples.map((ex: string, eIdx: number) => (
                      <p key={eIdx} className="text-xs font-bold text-slate-700 leading-snug">✓ {ex}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('quiz')}
            className="w-full py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            Bắt đầu làm bài tập →
          </button>
        </div>
      )}

      {step === 'quiz' && (
        <div className="space-y-6">
          <div className="border-l-4 border-[#5D6B2D] pl-4 py-1">
            <h3 className="text-lg font-black text-slate-800">Bài tập ôn tập</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Chọn đáp án đúng nhất</p>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-200/80 rounded-xl p-4 shadow-sm">
                <p className="font-bold text-slate-800 text-sm mb-3">
                  Câu {idx + 1}: {q.text}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isSelected = answers[idx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => setAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                        className={`w-full p-3 text-left text-xs font-bold border-2 rounded-xl transition-all ${
                          isSelected
                            ? 'border-[#5D6B2D] bg-[#F7F8F2] text-[#5D6B2D]'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={Object.keys(answers).length < questions.length}
            className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm ${
              Object.keys(answers).length < questions.length
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB]'
            }`}
          >
            Nộp bài kiểm tra
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          <div className="text-center py-6 bg-slate-50 border border-slate-200/60 rounded-2xl mb-4">
            <h3 className="text-xl font-black text-slate-800">Kết quả đạt được</h3>
            <p className="text-3xl font-black text-[#5D6B2D] mt-2">{score} / {questions.length}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Đúng {score} trên tổng số {questions.length} câu hỏi</p>
          </div>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {questions.map((q, idx) => {
              const selected = answers[idx];
              const isCorrect = selected === q.answer;
              return (
                <div key={idx} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-1">Câu {idx + 1}: {q.text}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        Bạn chọn: <strong className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{q.options[selected] || "Chưa chọn"}</strong>
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Đáp án đúng: <strong className="text-emerald-600">{q.options[q.answer]}</strong>
                      </p>
                      <p className="text-xs text-slate-400 italic mt-2">Giải thích: {q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3.5 bg-[#5D6B2D] hover:bg-[#46531F] text-[#FFF8EB] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            Hoàn thành
          </button>
        </div>
      )}
    </div>
  );
}
