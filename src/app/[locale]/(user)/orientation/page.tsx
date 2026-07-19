"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnosticQuestions";
import { fetchDiagnosticQuestions } from "@/services/diagnosticService";
import VoiceRecorder from "@/components/VoiceRecorder";
import {
  Sparkles,
  Volume2,
  BookOpen,
  PenTool,
  Mic,
  BrainCircuit,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  Undo2,
  TrendingUp,
  Lightbulb,
  Award
} from "lucide-react";

export default function OrientationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetest = searchParams?.get('retest') === 'true';
  const retestPathId = searchParams?.get('pathId');
  const locale = params?.locale || "vi";

  // Wizard steps:
  // 0: Intro
  // 1: Listening
  // 2: Reading
  // 3: Writing
  // 4: Speaking
  // 5: AI Scanner animation
  // 6: Results + roadmap form
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI scanner animation states
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);

  // Band result from computed scoring
  const [calculatedBand, setCalculatedBand] = useState<number>(5.0);
  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  // Roadmap generation form states
  const [targetBand, setTargetBand] = useState<number>(6.5);
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [focusSkills, setFocusSkills] = useState<string[]>([
    "Listening", "Reading", "Writing", "Speaking"
  ]);

  const [questions, setQuestions] = useState<any>(DIAGNOSTIC_QUESTIONS);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await fetchDiagnosticQuestions();
        if (data && (data.listening?.length > 0 || data.reading?.length > 0 || data.writing?.length > 0 || data.speaking?.length > 0)) {
          const mappedQuestions: any = {
            listening: (data.listening || []).map((m: any, idx: number) => {
              const content = m.content;
              const extra = m.extra_data || {};
              return {
                id: `l${idx + 1}`,
                type: extra.type || "fill_in_blank",
                audioDescription: content?.test_name || extra.audioDescription || "Listening Section",
                transcript: content?.activeSection?.transcript || content?.transcript || extra.transcript || "",
                questionText: extra.questionText || "Answer the question based on the audio",
                options: extra.options || [],
                correctAnswer: extra.correctAnswer || "",
                answers: extra.answers || [],
                audioSrc: extra.audioSrc || "",
              };
            }),
            reading: (data.reading || []).map((m: any, idx: number) => {
              const content = m.content;
              const extra = m.extra_data || {};
              return {
                id: `r${idx + 1}`,
                type: extra.type || "true_false_not_given",
                passage: content?.content_html || extra.passage || "",
                items: extra.items || content?.questions || [],
                questionText: extra.questionText || "",
                options: extra.options || [],
                correctAnswer: extra.correctAnswer || "",
              };
            }),
            writing: (data.writing || []).map((m: any, idx: number) => {
              const content = m.content;
              const extra = m.extra_data || {};
              return {
                id: `w${idx + 1}`,
                type: content?.task_type || extra.type || `task${idx + 1}`,
                instruction: extra.instruction || (content?.task_type === "task2" ? "You should spend about 40 minutes on this task. Write at least 250 words." : "You should spend about 20 minutes on this task. Write at least 150 words."),
                prompt: content?.description || extra.prompt || "",
                chartDescription: extra.chartDescription || "",
                minimumWords: extra.minimumWords || (content?.task_type === "task2" ? 250 : 150),
              };
            }),
            speaking: (data.speaking || []).map((m: any, idx: number) => {
              const content = m.content;
              const extra = m.extra_data || {};
              return {
                id: `sp${idx + 1}`,
                type: extra.type || `part${idx + 1}`,
                instruction: extra.instruction || "",
                questions: content?.questions || extra.questions || [],
                cueCard: content?.cue_card || extra.cueCard || "",
                bulletPoints: content?.bullet_points || extra.bulletPoints || [],
              };
            }),
          };

          if (mappedQuestions.listening.length === 0) mappedQuestions.listening = DIAGNOSTIC_QUESTIONS.listening;
          if (mappedQuestions.reading.length === 0) mappedQuestions.reading = DIAGNOSTIC_QUESTIONS.reading;
          if (mappedQuestions.writing.length === 0) mappedQuestions.writing = DIAGNOSTIC_QUESTIONS.writing;
          if (mappedQuestions.speaking.length === 0) mappedQuestions.speaking = DIAGNOSTIC_QUESTIONS.speaking;

          setQuestions(mappedQuestions);
        }
      } catch (err) {
        console.error("Failed to load diagnostic questions from DB, using fallback local questions:", err);
      }
    }
    loadQuestions();
  }, []);

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const getWordCount = (text: string) => {
    return (text || "").trim().split(/\s+/).filter(Boolean).length;
  };

  // Compute band from objective answers when entering scanner step
  const computeBand = () => {
    let correct = 0;

    // Grade Listening dynamically using questions.listening
    if (questions.listening && Array.isArray(questions.listening)) {
      questions.listening.forEach((q: any) => {
        const userAns = (answers[q.id] || "").trim().toLowerCase();
        if (!userAns) return;

        if (q.type === "multiple_choice") {
          const correctAns = (q.correctAnswer || "").trim().toLowerCase();
          const normalizedAns = userAns.charAt(0);
          const normalizedCorrect = correctAns.charAt(0);
          if (normalizedAns && normalizedCorrect && normalizedAns === normalizedCorrect) {
            correct += 1;
          }
        } else {
          const possibleAnswers = (q.answers || [q.correctAnswer] || [])
            .map((a: any) => String(a).trim().toLowerCase())
            .filter(Boolean);
            
          if (q.id === "l1" && q.audioDescription?.includes("Accommodation")) {
            // Legacy / fallback question l1
            if (userAns.includes("monday")) correct += 1;
            if (userAns.includes("2") || userAns.includes("two")) correct += 1;
          } else {
            const isMatch = possibleAnswers.some((pa: string) => userAns.includes(pa) || pa.includes(userAns));
            if (isMatch) {
              correct += 1;
            }
          }
        }
      });
    }

    // Grade Reading dynamically using questions.reading
    if (questions.reading && Array.isArray(questions.reading)) {
      // r1 True/False/Not Given
      const r1 = questions.reading[0];
      if (r1 && r1.items) {
        r1.items.forEach((item: any, idx: number) => {
          const key = `r1_${idx}`;
          const userAns = (answers[key] || "").trim().toUpperCase();
          const correctAns = (item.correctAnswer || item.correct_answer || "").trim().toUpperCase();
          if (userAns && userAns === correctAns) {
            correct += 1;
          }
        });
      }

      // r2 Multiple Choice
      const r2 = questions.reading[1];
      if (r2) {
        const userAns = (answers.r2 || "").trim().toUpperCase();
        const correctAns = (r2.correctAnswer || r2.correct_answer || "").trim().toUpperCase();
        if (userAns && correctAns && userAns.charAt(0) === correctAns.charAt(0)) {
          correct += 1;
        }
      }
    }

    // Writing contribution
    const w1Len = getWordCount(answers.w1);
    const w2Len = getWordCount(answers.w2);
    if (w1Len > 150) correct += 1;
    else if (w1Len > 50) correct += 0.5;
    if (w2Len > 250) correct += 1;
    else if (w2Len > 100) correct += 0.5;

    // Band mapping (0–10 scale)
    let band = 4.0;
    if (correct <= 2) band = 4.0;
    else if (correct <= 4) band = 4.5;
    else if (correct <= 5) band = 5.0;
    else if (correct <= 6) band = 5.5;
    else if (correct <= 7) band = 6.0;
    else if (correct <= 8) band = 6.5;
    else if (correct <= 9) band = 7.0;
    else band = 7.5;

    setCalculatedBand(band);
    setTargetBand(Math.min(9.0, band + 1.5));
  };

  const handleSubmit = async () => {
    computeBand();
    setStep(5);
    setScanProgress(0);
    setScanStepIndex(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const submitRes = await fetch("/api/student/diagnostic/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ 
          answers,
          isRetest,
          retestPathId,
          answerKey: {
            listening: (questions.listening || []).map((q: any) => ({
              id: q.id,
              answers: q.answers || [q.correctAnswer],
              correctAnswer: q.correctAnswer
            })),
            reading: (questions.reading || []).map((q: any) => ({
              id: q.id,
              items: q.items || [],
              correctAnswer: q.correctAnswer
            }))
          }
        })
      });

      const submitData = await submitRes.json();
      if (submitData.success) {
        if (submitData.id) setDiagnosticId(submitData.id);
        if (submitData.comparison) setComparison(submitData.comparison);
      }
    } catch (err: any) {
      console.error("Failed to submit diagnostic answers:", err);
    }
  };

  const handleCompleteRoadmap = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/student/roadmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`
      },
      body: JSON.stringify({ 
        action: "COMPLETE", 
        pathId: retestPathId 
      })
    });
    router.push(`/${locale}/roadmap`);
  };

  // AI scanner progress animation
  useEffect(() => {
    if (step !== 5) return;

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setStep(6), 400);
          return 100;
        }
        return prev + 4;
      });
    }, 180);

    const stepInterval = setInterval(() => {
      setScanStepIndex(prev => {
        if (prev >= 4) { clearInterval(stepInterval); return 4; }
        return prev + 1;
      });
    }, 700);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [step]);

  // Navigate to roadmap after generating
  const handleGenerateRoadmap = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "GENERATE",
          currentBand: calculatedBand,
          targetBand,
          dailyHours,
          targetDate,
          focusSkills,
          diagnosticId
        })
      });

      if (!res.ok) throw new Error("Lỗi khi kết nối với API tạo lộ trình");
      router.push(`/${locale}/roadmap`);
    } catch (err: any) {
      setSubmitError(err.message || "Đã xảy ra lỗi không xác định");
      setIsSubmitting(false);
    }
  };

  const handleSkillsChange = (skill: string) => {
    setFocusSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Band description helpers (same as original)
  const getBandTitle = (band: number) => {
    if (band >= 7.0) return "Good User (Trình độ Khá)";
    if (band >= 6.0) return "Competent User (Trình độ Trung Khá)";
    if (band >= 5.0) return "Modest User (Trình độ Trung Bình)";
    return "Limited User (Trình độ Yếu)";
  };

  const scanSteps = [
    "Đang quét và đối chiếu câu trả lời Listening...",
    "Đang phân tích bài đọc Reading...",
    "Đang đánh giá bài viết Writing...",
    "Đang nhận xét phần Speaking...",
    "Hoàn tất đánh giá. Trình bày kết quả..."
  ];

  // ─── STEP 0: INTRO ─────────────────────────────────────────
  const renderIntro = () => (
    <div className="space-y-8 text-left max-w-3xl mx-auto py-4">
      {isRetest && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 md:p-6 flex gap-4 items-start shadow-sm">
          <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-black text-[#0d153a]">Bài Kiểm Tra Lại (Retest)</h4>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Đây là bài kiểm tra lại để đánh giá tiến bộ của bạn so với lộ trình đang theo.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center text-white shadow-lg animate-pulse">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-[#0d153a] tracking-tight">
            Kiểm Tra Năng Lực Đầu Vào
          </h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            IELTS Placement Diagnostic Test — 4 Kỹ Năng
          </p>
        </div>
        <p className="text-xs md:text-sm text-slate-500 max-w-xl font-medium leading-relaxed">
          Bài kiểm tra ~30 phút kiểm tra đủ 4 kỹ năng Listening, Reading, Writing, Speaking. Sau khi nộp bài, AI sẽ phân tích và đề xuất lộ trình học 12 tuần tối ưu cho bạn.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: Volume2, label: "Listening", color: "blue", detail: "Transcript + Điền từ & Trắc nghiệm (3 câu)" },
          { icon: BookOpen, label: "Reading", color: "emerald", detail: "Đọc hiểu + T/F/NG + MCQ (4 câu)" },
          { icon: PenTool, label: "Writing", color: "orange", detail: "Task 1 báo cáo + Task 2 luận điểm" },
          { icon: Mic, label: "Speaking", color: "pink", detail: "Part 1 câu ngắn + Part 2 Cue Card" }
        ].map(({ icon: Icon, label, color, detail }) => (
          <div key={label} className={`bg-white rounded-2xl border border-${color}-50 p-4 shadow-sm space-y-2`}>
            <div className={`w-9 h-9 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center text-${color}-500`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">{label}</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#3B5C37]/5 border border-[#3B5C37]/20 rounded-2xl p-4 flex gap-3.5 items-start">
        <AlertCircle className="w-5 h-5 text-[#3B5C37] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-black text-[#3B5C37]">Lưu ý quan trọng:</h5>
          <p className="text-[11px] text-[#3B5C37]/80 font-medium leading-relaxed">
            Vui lòng làm bài nghiêm túc, không tra từ điển hay dùng công cụ dịch để AI đo đúng trình độ thực tế của bạn.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={() => setStep(1)}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] hover:opacity-95 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 duration-200"
        >
          <span>Bắt Đầu Làm Bài</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  // ─── STEP 1: LISTENING ─────────────────────────────────────
  const renderListening = () => (
    <div className="space-y-6 text-left max-w-2xl mx-auto py-2">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">PHẦN 1 / 4</span>
          <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
            <Volume2 className="w-5 h-5 text-blue-500" /> Listening Practice
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Q1 - Q3</span>
      </div>

      {/* Audio Player */}
      {questions.listening[0]?.audioSrc && (
        <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-[#0d153a] uppercase tracking-wider">File âm thanh bài nghe</p>
              <p className="text-[10px] text-gray-500 font-semibold leading-tight">{questions.listening[0]?.audioDescription}</p>
            </div>
          </div>
          <audio 
            src={questions.listening[0].audioSrc} 
            controls 
            className="w-full sm:w-80 h-9 outline-none block"
          />
        </div>
      )}

      {questions.listening.map((q: any, idx: number) => (
        <div key={q.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Audio {idx + 1} — {q.audioDescription}
            </p>
          </div>

          <label className="text-xs font-extrabold text-[#0d153a] block">
            Q{idx + 1}. {q.questionText}
          </label>

          {q.type === "fill_in_blank" && (
            <input
              type="text"
              placeholder="Nhập câu trả lời..."
              value={answers[q.id] || ""}
              onChange={e => handleAnswerChange(q.id, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          )}

          {q.type === "multiple_choice" && (
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options?.map((opt: any) => {
                const isString = typeof opt === "string";
                const letter = isString ? opt.charAt(0) : (opt.key || opt.letter || opt.value || "");
                const text = isString ? opt : (opt.text || opt.label || opt.value || "");
                const isSelected = answers[q.id] === letter;
                const keyStr = isString ? opt : (opt.key || JSON.stringify(opt));
                return (
                  <button
                    key={keyStr}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, letter)}
                    className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected ? "border-blue-500 bg-blue-50/30 text-blue-700" : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
                    }`}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between items-center pt-2">
        <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl bg-blue-500 text-white text-xs font-black hover:opacity-95 shadow flex items-center gap-1.5 cursor-pointer">
          <span>Tiếp tục Reading</span> <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── STEP 2: READING ───────────────────────────────────────
  const renderReading = () => (
    <div className="space-y-6 text-left max-w-4xl mx-auto py-2">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">PHẦN 2 / 4</span>
          <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
            <BookOpen className="w-5 h-5 text-emerald-500" /> Reading Practice
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Q4 - Q7</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-h-[440px] overflow-y-auto space-y-3">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b border-slate-50 pb-2">
            Urban Agriculture: The Green Revolution in Cities
          </h3>
          <div className="text-[11.5px] text-slate-500 font-medium leading-relaxed whitespace-pre-line">
            {questions.reading[0]?.passage}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider border-b border-slate-50 pb-2">Q4-6: True / False / Not Given</h4>
            {questions.reading[0]?.items?.map((item: any, idx: number) => (
              <div key={idx} className="space-y-2 border-b border-slate-50 pb-3">
                <p className="text-xs font-bold text-[#0d153a] leading-tight">Q{4 + idx}. {item.statement}</p>
                <div className="flex gap-2">
                  {["TRUE", "FALSE", "NOT GIVEN"].map(opt => {
                    const key = `r1_${idx}`;
                    const isSelected = answers[key] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerChange(key, opt)}
                        className={`flex-1 py-1.5 rounded-xl border text-[10px] font-extrabold text-center transition-all cursor-pointer ${
                          isSelected ? "border-emerald-500 bg-emerald-50/30 text-emerald-700" : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
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

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider border-b border-slate-50 pb-2">Q7: Multiple Choice</h4>
            <p className="text-xs font-bold text-[#0d153a] leading-tight">{questions.reading[1]?.questionText}</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-2.5">
              {questions.reading[1]?.options?.map((opt: any) => {
                const isString = typeof opt === "string";
                const letter = isString ? opt.charAt(0) : (opt.key || opt.letter || opt.value || "");
                const text = isString ? opt : (opt.text || opt.label || opt.value || "");
                const isSelected = answers.r2 === letter;
                const keyStr = isString ? opt : (opt.key || JSON.stringify(opt));
                return (
                  <button
                    key={keyStr}
                    type="button"
                    onClick={() => handleAnswerChange("r2", letter)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected ? "border-emerald-500 bg-emerald-50/30 text-emerald-700 font-bold" : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl bg-emerald-500 text-white text-xs font-black hover:opacity-95 shadow flex items-center gap-1.5 cursor-pointer">
          <span>Tiếp tục Writing</span> <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── STEP 3: WRITING ───────────────────────────────────────
  const renderWriting = () => (
    <div className="space-y-6 text-left max-w-3xl mx-auto py-2">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">PHẦN 3 / 4</span>
          <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
            <PenTool className="w-5 h-5 text-orange-500" /> Writing Practice
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Task 1 + Task 2</span>
      </div>

      {/* Task 1 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-orange-600 uppercase tracking-widest">TASK 1 — Academic Report</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getWordCount(answers.w1) >= 150 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
            {getWordCount(answers.w1)} / 150 từ
          </span>
        </div>
        <p className="text-xs font-bold text-slate-700 italic">{questions.writing[0]?.prompt}</p>
        {questions.writing[0]?.chartDescription && (
          <pre className="text-[10px] font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line text-slate-600 leading-normal mt-2.5">
            {questions.writing[0]?.chartDescription}
          </pre>
        )}<textarea
          rows={6}
          placeholder="Nhập bài làm Task 1 của bạn (ít nhất 150 từ)..."
          value={answers.w1 || ""}
          onChange={e => handleAnswerChange("w1", e.target.value)}
          className={`w-full p-4 rounded-xl border text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all ${getWordCount(answers.w1) >= 150 ? "border-emerald-300" : "border-slate-200"}`}
        />
      </div>

      {/* Task 2 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-orange-600 uppercase tracking-widest">TASK 2 — Essay</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getWordCount(answers.w2) >= 250 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
            {getWordCount(answers.w2)} / 250 từ
          </span>
        </div>
        <p className="text-xs font-bold text-slate-700 italic">{questions.writing[1]?.prompt}</p>
        <textarea
          rows={8}
          placeholder="Nhập bài làm Task 2 của bạn (ít nhất 250 từ)..."
          value={answers.w2 || ""}
          onChange={e => handleAnswerChange("w2", e.target.value)}
          className={`w-full p-4 rounded-xl border text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all ${getWordCount(answers.w2) >= 250 ? "border-emerald-300" : "border-slate-200"}`}
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => setStep(4)} className="px-6 py-3 rounded-xl bg-orange-500 text-white text-xs font-black hover:opacity-95 shadow flex items-center gap-1.5 cursor-pointer">
          <span>Tiếp tục Speaking</span> <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── STEP 4: SPEAKING ──────────────────────────────────────
  const renderSpeaking = () => (
    <div className="space-y-6 text-left max-w-3xl mx-auto py-2">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider">PHẦN 4 / 4</span>
          <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
            <Mic className="w-5 h-5 text-pink-500" /> Speaking Practice
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Part 1 + Part 2</span>
      </div>

      {/* Part 1 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <span className="text-xs font-black text-pink-600 uppercase tracking-widest block">Part 1 — Short Answers</span>
        <p className="text-[11px] text-slate-400 font-bold italic">{questions.speaking[0]?.instruction}</p>
        {questions.speaking[0]?.questions?.map((q: string, idx: number) => (
          <div key={idx} className="space-y-2 border-b border-slate-50 pb-3">
            <label className="text-xs font-bold text-slate-700 block">Câu {idx + 1}: {q}</label>
            <VoiceRecorder
              onTranscription={(txt) => handleAnswerChange(`sp1_${idx}`, txt)}
              initialValue={answers[`sp1_${idx}`] || ""}
            />
          </div>
        ))}
      </div>

      {/* Part 2 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-pink-600 uppercase tracking-widest">Part 2 — Cue Card</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getWordCount(answers.sp2) >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-pink-50 text-pink-600"}`}>
            {getWordCount(answers.sp2)} / 80 từ
          </span>
        </div>
        <div className="border border-pink-100 bg-pink-50/10 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-black text-slate-800">Cue Card:</h4>
          <p className="text-sm font-black text-pink-600">{questions.speaking[1]?.cueCard}</p>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-pink-200 mt-2">
            {questions.speaking[1]?.bulletPoints?.map((pt: string, i: number) => (
              <li key={i}>{pt}</li>
            ))}
          </div>
        </div>
        <VoiceRecorder
          onTranscription={(txt) => handleAnswerChange("sp2", txt)}
          initialValue={answers.sp2 || ""}
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>
        <button
          onClick={handleSubmit}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-xs font-black hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span>Nộp Bài &amp; AI Phân Tích</span> <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── STEP 5: AI SCANNER ────────────────────────────────────
  const renderScanner = () => (
    <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col items-center justify-center min-h-[450px] text-center relative overflow-hidden max-w-xl mx-auto py-12">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3B5C37]/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B38F4D]/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B5C37]/40 animate-spin" style={{ animationDuration: "10s" }} />
        <div className="absolute inset-2 rounded-full border border-double border-[#B38F4D]/50 animate-spin animate-pulse" style={{ animationDuration: "4s", animationDirection: "reverse" }} />
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center shadow-lg">
          <BrainCircuit className="w-10 h-10 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="text-lg font-black text-[#0d153a] mb-2">Trợ Lý AI Đang Phân Tích</h3>

      <div className="w-full max-w-sm bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-200/50">
        <div
          className="h-full bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] transition-all duration-200 rounded-full"
          style={{ width: `${scanProgress}%` }}
        />
      </div>

      <div className="w-full max-w-xs text-left space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
        {scanSteps.map((msg, idx) => {
          const isDone = scanStepIndex > idx;
          const isActive = scanStepIndex === idx;
          return (
            <div key={idx} className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${isDone || isActive ? "opacity-100" : "opacity-30"}`}>
              {isDone ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              ) : isActive ? (
                <div className="w-4 h-4 border-2 border-[#3B5C37] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={`font-bold ${isActive ? "text-[#3B5C37]" : "text-[#5e6792]"}`}>{msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── STEP 6: RESULTS + ROADMAP FORM ────────────────────────
  const renderResults = () => {
    const durationWeeks = Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return (
      <div className="space-y-8 text-left max-w-4xl mx-auto py-2">
        {comparison && (
          <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            comparison.reachedTarget 
              ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-800" 
              : comparison.improved 
                ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-800" 
                : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-800"
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                comparison.reachedTarget ? "bg-emerald-500/20 text-emerald-700" : comparison.improved ? "bg-blue-500/20 text-blue-700" : "bg-amber-500/20 text-amber-700"
              }`}>
                {comparison.reachedTarget ? <Trophy className="w-5 h-5" /> : comparison.improved ? <TrendingUp className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold uppercase tracking-wider">
                  {comparison.reachedTarget ? "Đạt mục tiêu!" : comparison.improved ? "Tiến bộ ghi nhận!" : "Kết quả kiểm tra lại"}
                </h4>
                <p className="text-xs font-bold leading-relaxed">
                  {comparison.reachedTarget && (
                    <>
                      🎉 Chúc mừng! Bạn đã đạt mục tiêu Band {comparison.targetBand}. Band hiện tại: {comparison.newBand} (tăng {comparison.bandDiff} so với lần test trước).
                    </>
                  )}
                  {!comparison.reachedTarget && comparison.improved && (
                    <>
                      📈 Bạn đã tiến bộ! Band tăng từ {comparison.oldBand} lên {comparison.newBand} (+{comparison.bandDiff}). Mục tiêu {comparison.targetBand} — cố gắng thêm nhé!
                    </>
                  )}
                  {!comparison.improved && (
                    <>
                      Band hiện tại {comparison.newBand}, chưa thấy tiến bộ so với lần trước ({comparison.oldBand}). Hãy xem lại các phase trong lộ trình và tập trung vào kỹ năng còn yếu.
                    </>
                  )}
                </p>
              </div>
            </div>
            {comparison.reachedTarget && (
              <button
                onClick={handleCompleteRoadmap}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span>Đánh dấu hoàn thành lộ trình 🎉</span>
              </button>
            )}
          </div>
        )}
        {/* Success banner */}
        <div className="bg-gradient-to-r from-[#3B5C37] to-[#1f3e1b] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 blur-xl rounded-full" />
          <div className="space-y-2 z-10 text-center md:text-left">
            <span className="text-[10px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Kết Quả Đánh Giá Năng Lực AI
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Chúc Mừng Bạn Đã Hoàn Thành Bài Kiểm Tra!
            </h2>
            <p className="text-xs text-white/80 font-medium max-w-md">
              AI đã phân tích bài làm 4 kỹ năng của bạn và đề xuất lộ trình học IELTS cá nhân hóa phù hợp nhất.
            </p>
          </div>
          <div className="bg-white/10 px-6 py-5 rounded-2xl border border-white/20 text-center z-10 shrink-0 self-center min-w-[160px]">
            <Award className="w-8 h-8 text-[#B38F4D] mx-auto mb-1 animate-bounce" />
            <span className="text-[10px] text-white/70 font-bold block uppercase tracking-wider">Band Ước Tính</span>
            <span className="text-3xl font-black text-white">{calculatedBand.toFixed(1)}</span>
          </div>
        </div>

        {/* Band card + AI analysis */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider">Trình Độ Ước Tính</h3>
            <div className="w-28 h-28 rounded-full border-4 border-[#3B5C37]/20 flex items-center justify-center bg-emerald-50/50 shadow-inner">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">IELTS Band</span>
                <span className="text-3xl font-black text-[#3B5C37]">{calculatedBand.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black text-[#0d153a] block leading-none">{getBandTitle(calculatedBand)}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Dựa trên bài kiểm tra 4 kỹ năng</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-[#3B5C37]" /> Phân Tích Kỹ Năng từ Trợ Lý AI
            </h3>
            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Điểm mạnh nhận diện:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {calculatedBand >= 5.5
                      ? "Khả năng phân tích cấu trúc phức và từ vựng học thuật ở mức ổn. Nhận biết và loại trừ các bẫy thông tin gây nhiễu tốt."
                      : "Có khả năng nhận diện các từ vựng căn bản và thông tin trực tiếp từ bài nghe/đọc ngắn."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Điểm yếu cần cải thiện:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {calculatedBand >= 6.5
                      ? "Cần tinh chỉnh cấu trúc đảo ngữ nâng cao trong Writing và từ vựng C2 ở các chủ đề trừu tượng."
                      : "Kỹ năng chắt lọc từ khóa trong Reading còn yếu. Cần mở rộng ý và phát triển lập luận trong Writing."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Đề xuất giáo trình từ AI:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Tập trung học {calculatedBand >= 5.5 ? "Collocations học thuật nâng cao + Luyện Matching Info & Writing Task 2 nâng cao" : "Bảng phiên âm IPA + Từ vựng theo 10 chủ đề IELTS cơ bản + Cấu trúc câu cơ bản"}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap configuration form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5">
            Cấu Hình Lộ Trình Học Cá Nhân Hóa AI Đề Xuất
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" /> Band Mục Tiêu
              </label>
              <select
                value={targetBand}
                onChange={e => setTargetBand(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              >
                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                  <option key={b} value={b}>Band {b.toFixed(1)}{b === 6.5 ? " (Khuyên dùng)" : ""}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Thời gian học / ngày
              </label>
              <select
                value={dailyHours}
                onChange={e => setDailyHours(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              >
                {[1.0, 1.5, 2.0, 3.0, 4.0].map(h => (
                  <option key={h} value={h}>{h.toFixed(1)} giờ / ngày{h === 2.0 ? " (Khuyên dùng)" : ""}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày Thi Dự Kiến
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400" /> Kỹ Năng Cần Tập Trung Luyện Tập
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Listening", "Reading", "Writing", "Speaking"].map(skill => {
                const isChecked = focusSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillsChange(skill)}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                      isChecked ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37]" : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 text-[#3B5C37]" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-[#0d153a]">
                Tổng quỹ thời gian dự kiến: {Math.round(durationWeeks * 7 * dailyHours)} giờ thực hành
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Lộ trình AI sẽ chia làm 3 giai đoạn ôn luyện chi tiết dựa trên thông số trên.
              </p>
            </div>
            <button
              onClick={handleGenerateRoadmap}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Tạo Lộ Trình AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Xem Lộ Trình Học AI Đề Xuất</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/30 min-h-screen py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top navigation bar (only during quiz steps) */}
        {step > 0 && step < 5 && (
          <div className="flex justify-between items-center bg-white py-3 px-4 rounded-2xl border border-slate-100 shadow-sm">
            <button
              onClick={() => {
                if (confirm("Bạn có chắc muốn thoát? Kết quả bài test hiện tại sẽ không được lưu.")) {
                  router.push(`/${locale}/roadmap`);
                }
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 text-xs font-bold transition-all cursor-pointer"
            >
              <Undo2 className="w-4 h-4" /> Thoát test
            </button>

            {/* Step dots */}
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4].map((s, idx) => {
                const colors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];
                return (
                  <React.Fragment key={s}>
                    <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === s ? `${colors[idx]} scale-110` : step > s ? `${colors[idx]}/40` : "bg-slate-200"}`} />
                    {idx < 3 && <div className="w-4 h-0.5 bg-slate-200" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {step === 0 && renderIntro()}
        {step === 1 && renderListening()}
        {step === 2 && renderReading()}
        {step === 3 && renderWriting()}
        {step === 4 && renderSpeaking()}
        {step === 5 && renderScanner()}
        {step === 6 && renderResults()}
      </div>
    </div>
  );
}
