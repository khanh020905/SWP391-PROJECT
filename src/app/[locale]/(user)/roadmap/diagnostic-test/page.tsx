"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Sparkles,
  Volume2,
  BookOpen,
  BrainCircuit,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Award,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  HelpCircle,
  Undo2,
  TrendingUp,
  Lightbulb
} from "lucide-react";

// Standard Types
interface Question {
  id: number;
  text: string;
  type: "input" | "radio" | "tfng";
  options?: string[];
  placeholder?: string;
}

export default function DiagnosticTestPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || "vi";

  // Test state wizard
  // 0: Intro, 1: Listening, 2: Reading, 3: Grammar/Vocab, 4: AI Scanner, 5: Results
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Simulated AI scanner animation states
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);

  // Result metrics
  const [score, setScore] = useState<number>(0);
  const [calculatedBand, setCalculatedBand] = useState<number>(5.0);

  // Form states for final roadmap generation on result page
  const [targetBand, setTargetBand] = useState<number>(6.5);
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [focusSkills, setFocusSkills] = useState<string[]>([
    "Listening",
    "Reading",
    "Writing",
    "Speaking"
  ]);

  // Audio Player states for Listening Section
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sample MP3 url representing a conversation (public audio file)
  const audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  // Sync audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [step]);

  // Handle Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error("Error playing audio:", err));
      setIsPlaying(true);
    }
  };

  const seekAudio = (percentage: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const newTime = (percentage / 100) * audio.duration;
    audio.currentTime = newTime;
    setAudioCurrentTime(newTime);
    setAudioProgress(percentage);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Questions Database
  const listeningQuestions: Question[] = [
    { id: 1, text: "Customer Name: John ______", type: "input", placeholder: "Ví dụ: Smith" },
    { id: 2, text: "Room Type Selected: ______ Room", type: "input", placeholder: "Ví dụ: Double, Single, Deluxe..." },
    { id: 3, text: "Length of stay: ______ nights", type: "input", placeholder: "Ví dụ: 3" }
  ];

  const readingQuestions: Question[] = [
    {
      id: 4,
      text: "Urban agriculture can help reduce the carbon footprint of food production.",
      type: "tfng",
      options: ["TRUE", "FALSE", "NOT GIVEN"]
    },
    {
      id: 5,
      text: "Most urban farms are funded entirely by government subsidies.",
      type: "tfng",
      options: ["TRUE", "FALSE", "NOT GIVEN"]
    },
    {
      id: 6,
      text: "What is the primary benefit of rooftop gardens mentioned in the text?",
      type: "radio",
      options: [
        "A) They are cheaper to construct than rural farms.",
        "B) They absorb heat to lower city temperatures and reduce stormwater runoff.",
        "C) They are funded entirely by municipal governments.",
        "D) They can produce enough food to feed an entire city."
      ]
    }
  ];

  const grammarQuestions: Question[] = [
    {
      id: 7,
      text: "The new environmental policy was designed to _______ the negative impacts of industrial waste.",
      type: "radio",
      options: [
        "A) mitigate",
        "B) exacerbate",
        "C) initiate",
        "D) validate"
      ]
    },
    {
      id: 8,
      text: "Had we known about the schedule change, we _______ our plans accordingly.",
      type: "radio",
      options: [
        "A) would alter",
        "B) will have altered",
        "C) would have altered",
        "D) altered"
      ]
    },
    {
      id: 9,
      text: "Due to the economic recession, several start-ups have been on the brink of ________.",
      type: "radio",
      options: [
        "A) prosperity",
        "B) bankruptcy",
        "C) transition",
        "D) expansion"
      ]
    },
    {
      id: 10,
      text: "Not only _______ the match, but they also broke the tournament record.",
      type: "radio",
      options: [
        "A) they won",
        "B) did they win",
        "C) they did win",
        "D) won they"
      ]
    }
  ];

  // Answer Key mapping
  const answerKey: Record<number, string | string[]> = {
    1: "smith",
    2: "double",
    3: ["3", "three"],
    4: "TRUE",
    5: "FALSE",
    6: "B",
    7: "A",
    8: "C",
    9: "B",
    10: "B"
  };

  const handleInputChange = (id: number, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  // Submit test and launch AI scanner
  const submitTest = () => {
    // Pause audio if playing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    setStep(4); // Go to scanner screen
    setScanProgress(0);
    setScanStepIndex(0);

    // Calculate score
    let scoreCount = 0;
    Object.keys(answerKey).forEach(keyStr => {
      const key = Number(keyStr);
      const studentAns = (answers[key] || "").trim().toLowerCase();
      const correctAns = answerKey[key];

      if (Array.isArray(correctAns)) {
        if (correctAns.some(ans => studentAns === ans.toLowerCase())) {
          scoreCount++;
        }
      } else {
        if (studentAns === correctAns.toLowerCase() || 
            (correctAns.length === 1 && studentAns.startsWith(correctAns.toLowerCase()))) {
          scoreCount++;
        }
      }
    });

    setScore(scoreCount);

    // Map 10 questions to IELTS bands:
    // 0-2 correct -> Band 4.0
    // 3-4 correct -> Band 4.5
    // 5-6 correct -> Band 5.0
    // 7 correct -> Band 5.5
    // 8 correct -> Band 6.0
    // 9 correct -> Band 6.5
    // 10 correct -> Band 7.0
    let band = 5.0;
    if (scoreCount <= 2) band = 4.0;
    else if (scoreCount <= 4) band = 4.5;
    else if (scoreCount <= 6) band = 5.0;
    else if (scoreCount === 7) band = 5.5;
    else if (scoreCount === 8) band = 6.0;
    else if (scoreCount === 9) band = 6.5;
    else if (scoreCount === 10) band = 7.0;

    setCalculatedBand(band);
    // Pre-populate target band
    setTargetBand(Math.min(9.0, band + 1.5));
  };

  // Run the simulated AI scanner progress
  useEffect(() => {
    if (step !== 4) return;

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setStep(5); // Go to results page
          }, 400);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    const stepInterval = setInterval(() => {
      setScanStepIndex(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return 3;
        }
        return prev + 1;
      });
    }, 700);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [step]);

  // Call the roadmap API to save the roadmap and redirect
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
          focusSkills
        })
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối với API tạo lộ trình");
      }

      // Redirect back to main roadmap page
      router.push(`/${locale}/roadmap`);
    } catch (err: any) {
      setSubmitError(err.message || "Đã xảy ra lỗi không xác định");
      setIsSubmitting(false);
    }
  };

  const handleSkillsChange = (skill: string) => {
    if (focusSkills.includes(skill)) {
      setFocusSkills(focusSkills.filter(s => s !== skill));
    } else {
      setFocusSkills([...focusSkills, skill]);
    }
  };

  // Content render helpers
  const renderIntro = () => {
    return (
      <div className="space-y-8 text-left max-w-3xl mx-auto py-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center text-white shadow-lg animate-pulse">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#0d153a] tracking-tight">
              Kiểm Tra Năng Lực Đầu Vào
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              IELTS Placement Diagnostic Test
            </p>
          </div>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl font-medium leading-relaxed">
            Hệ thống AI sẽ đánh giá 3 kỹ năng cốt lõi trong vòng 10 phút. Kết quả kiểm tra được sử dụng trực tiếp để thiết lập lộ trình học tối ưu riêng biệt cho bạn.
          </p>
        </div>

        {/* Info grid */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[#3B5C37]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">1. Listening</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Nghe đoạn hội thoại đặt phòng và điền thông tin chi tiết vào chỗ trống. (3 câu)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">2. Reading</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Đọc đoạn văn ngắn về Nông nghiệp Đô thị và trả lời câu hỏi ĐÚNG/SAI/KHÔNG ĐỀ CẬP. (3 câu)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">3. Grammar & Vocab</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Làm bài trắc nghiệm nhanh đánh giá ngữ pháp học thuật nâng cao và từ vựng C1/C2. (4 câu)
              </p>
            </div>
          </div>
        </div>

        {/* Tip section */}
        <div className="bg-[#3B5C37]/5 border border-[#3B5C37]/20 rounded-2xl p-4 flex gap-3.5 items-start">
          <AlertCircle className="w-5 h-5 text-[#3B5C37] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-black text-[#3B5C37]">Lưu ý quan trọng:</h5>
            <p className="text-[11px] text-[#3B5C37]/80 font-medium leading-relaxed">
              Vui lòng làm bài nghiêm túc, không tra từ điển hay sử dụng công cụ dịch trong quá trình làm test để AI thu thập đúng điểm xuất phát của bạn. Bạn có thể bỏ trống nếu không biết câu trả lời.
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
  };

  const renderListening = () => {
    return (
      <div className="space-y-6 text-left max-w-2xl mx-auto py-2">
        {/* Progress header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#3B5C37] uppercase tracking-wider">PHẦN 1 / 3</span>
            <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
              <Volume2 className="w-5 h-5 text-[#3B5C37]" /> Listening Practice
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Q1 - Q3</span>
        </div>

        {/* Custom Audio Player */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotel Inquiry Call</span>
            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-100 rounded">IELTS Practice Audio</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#3B5C37] hover:bg-[#3B5C37]/90 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
            </button>

            <div className="flex-1 space-y-1.5">
              {/* Progress slider track */}
              <div 
                className="w-full bg-slate-200 h-2 rounded-full cursor-pointer relative overflow-hidden group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = (clickX / rect.width) * 100;
                  seekAudio(percentage);
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] rounded-full" 
                  style={{ width: `${audioProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>{formatTime(audioCurrentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
          </div>

          {/* HTML5 audio element hidden */}
          <audio ref={audioRef} src={audioUrl} />

          <p className="text-[10px] text-slate-400 font-semibold bg-white/70 border border-slate-100 rounded-xl p-3 leading-relaxed">
            💡 <strong>Hướng dẫn:</strong> Bấm nút phát âm thanh ở trên, nghe đoạn ghi âm và trả lời các thông tin còn thiếu bên dưới. Đoạn băng chỉ phát 1 lần duy nhất trong kỳ thi thật.
          </p>
        </div>

        {/* Questions form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-[#0d153a] uppercase tracking-wider border-b border-slate-50 pb-2.5">
            Questions 1-3: Fill in the missing information
          </h3>

          <div className="space-y-4">
            {listeningQuestions.map(q => (
              <div key={q.id} className="space-y-2">
                <label className="text-xs font-extrabold text-[#0d153a]">
                  {q.text}
                </label>
                <input
                  type="text"
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions navigation */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setStep(0)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          
          <button
            onClick={() => setStep(2)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-xs font-black hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tiếp tục Reading</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderReading = () => {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto py-2">
        {/* Progress header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#3B5C37] uppercase tracking-wider">PHẦN 2 / 3</span>
            <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-orange-500" /> Reading Practice
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Q4 - Q6</span>
        </div>

        {/* 2 Column reading pane */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Passage */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 max-h-[480px] overflow-y-auto">
            <h3 className="text-sm font-black text-[#0d153a] border-b border-slate-50 pb-2">
              Reading Passage
            </h3>
            
            <h4 className="text-xs font-black text-[#3B5C37] uppercase tracking-wider">
              Urban Agriculture: The Green Revolution in Cities
            </h4>

            <div className="text-[11.5px] text-slate-500 font-medium leading-relaxed space-y-3">
              <p>
                Urban agriculture, the practice of cultivating, processing, and distributing food in or around metropolitan areas, is rapidly gaining popularity. As cities expand, the reliance on rural farming for sustenance creates significant environmental and economic challenges, particularly in transportation. Food transported over long distances contributes heavily to carbon emissions, a phenomenon known as "food miles." By producing food locally within urban boundaries, cities can drastically reduce their carbon footprint and ensure fresher produce for residents.
              </p>
              <p>
                However, critics point out that urban farming is not a complete solution. Most urban agricultural initiatives are small-scale, community-driven projects that rely on volunteers and private donations, rather than government subsidies or commercial sales. Rooftop gardens, a popular form of urban farming, provide crucial ecological benefits such as lowering urban temperatures by absorbing heat and reducing stormwater runoff. Nonetheless, the high cost of urban land and structural limitations of older buildings prevent these projects from scaling to meet the full nutritional demands of cities.
              </p>
            </div>
          </div>

          {/* Right Column: Questions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-[#0d153a] uppercase tracking-wider border-b border-slate-50 pb-2">
                Questions 4-5: True, False, Not Given
              </h3>

              <div className="space-y-4">
                {readingQuestions.slice(0, 2).map(q => (
                  <div key={q.id} className="space-y-2.5">
                    <p className="text-xs font-bold text-[#0d153a] leading-tight">
                      Q{q.id}. {q.text}
                    </p>
                    <div className="flex gap-2">
                      {q.options?.map(opt => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleInputChange(q.id, opt)}
                            className={`flex-1 py-2 rounded-xl border text-[10px] font-bold text-center transition-all select-none cursor-pointer ${
                              isSelected
                                ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37]"
                                : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
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
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-[#0d153a] uppercase tracking-wider border-b border-slate-50 pb-2">
                Question 6: Multiple Choice
              </h3>
              
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#0d153a] leading-tight">
                  Q6. {readingQuestions[2].text}
                </p>
                <div className="space-y-2">
                  {readingQuestions[2].options?.map(opt => {
                    const optionLetter = opt.charAt(0);
                    const isSelected = answers[6] === optionLetter;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInputChange(6, optionLetter)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium leading-snug transition-all flex items-start gap-2.5 select-none cursor-pointer ${
                          isSelected
                            ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37] font-bold"
                            : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "border-[#3B5C37] bg-[#3B5C37] text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions navigation */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setStep(1)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          
          <button
            onClick={() => setStep(3)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-xs font-black hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tiếp tục Grammar & Vocab</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderGrammar = () => {
    return (
      <div className="space-y-6 text-left max-w-2xl mx-auto py-2">
        {/* Progress header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#3B5C37] uppercase tracking-wider">PHẦN 3 / 3</span>
            <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-purple-500" /> Grammar & Vocabulary
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">Q7 - Q10</span>
        </div>

        {/* Grammar Questions Form */}
        <div className="space-y-5">
          {grammarQuestions.map((q, qIndex) => {
            const currentQNum = q.id;
            return (
              <div key={q.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3.5">
                <p className="text-xs font-black text-[#0d153a] leading-tight">
                  Q{currentQNum}. {q.text}
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {q.options?.map(opt => {
                    const optionLetter = opt.charAt(0);
                    const isSelected = answers[currentQNum] === optionLetter;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInputChange(currentQNum, optionLetter)}
                        className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 select-none cursor-pointer ${
                          isSelected
                            ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37]"
                            : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#3B5C37] bg-[#3B5C37] text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions navigation */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setStep(2)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          
          <button
            onClick={submitTest}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-xs font-black hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Nộp Bài & AI Phân Tích</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderScanner = () => {
    const scanSteps = [
      "Đang quét câu trả lời của bạn...",
      "Đang phân tích điểm mạnh & yếu qua 3 kỹ năng...",
      "Đối chiếu năng lực hiện tại với chuẩn IELTS...",
      "Hoàn tất đánh giá. Trình bày kết quả..."
    ];

    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col items-center justify-center min-h-[450px] text-center relative overflow-hidden max-w-xl mx-auto py-12">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3B5C37]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B38F4D]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Scanner Ring */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B5C37]/40 animate-spin" style={{ animationDuration: "10s" }} />
          <div className="absolute inset-2 rounded-full border border-double border-[#B38F4D]/50 animate-spin animate-pulse" style={{ animationDuration: "4s", animationDirection: "reverse" }} />
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center shadow-lg relative group overflow-hidden">
            <BrainCircuit className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-black text-[#0d153a] mb-2">Trợ Lý AI Đang Phân Tích</h3>
        
        {/* Progress Bar */}
        <div className="w-full max-w-sm bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-200/50">
          <div 
            className="h-full bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] transition-all duration-200 rounded-full" 
            style={{ width: `${scanProgress}%` }}
          />
        </div>

        {/* Scanning step log */}
        <div className="w-full max-w-xs text-left space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
          {scanSteps.map((stepMsg, idx) => {
            const isDone = scanStepIndex > idx;
            const isActive = scanStepIndex === idx;
            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                  isDone || isActive ? "opacity-100" : "opacity-30"
                }`}
              >
                {isDone ? (
                  <div className="w-4.5 h-4.5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-4.5 h-4.5 border-2 border-[#3B5C37] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={`font-bold ${isActive ? "text-[#3B5C37]" : "text-[#5e6792]"}`}>
                  {stepMsg}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    // Determine user descriptions based on band
    const getBandBadge = (band: number) => {
      if (band >= 6.5) return "bg-orange-50 text-orange-600 border-orange-100";
      if (band >= 5.5) return "bg-emerald-50 text-emerald-600 border-emerald-100";
      return "bg-blue-50 text-blue-600 border-blue-100";
    };

    const getBandTitle = (band: number) => {
      if (band >= 7.0) return "Good User (Trình độ Khá)";
      if (band >= 6.0) return "Competent User (Trình độ Trung Khá)";
      if (band >= 5.0) return "Modest User (Trình độ Trung Bình)";
      return "Limited User (Trình độ Yếu)";
    };

    // Calculate dates & duration
    const durationWeeks = Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const durationMonths = Math.max(1, Math.round(durationWeeks / 4.3));

    return (
      <div className="space-y-8 text-left max-w-4xl mx-auto py-2">
        {/* Success header card */}
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
              AI đã phân tích kỹ năng nghe, đọc hiểu và ngữ pháp của bạn để xây dựng đề xuất phân bổ giáo trình IELTS.
            </p>
          </div>

          <div className="bg-white/10 px-6 py-5 rounded-2xl border border-white/20 text-center z-10 shrink-0 self-center min-w-[160px]">
            <Award className="w-8 h-8 text-[#B38F4D] mx-auto mb-1 animate-bounce" />
            <span className="text-[10px] text-white/70 font-bold block uppercase tracking-wider">Số câu đúng</span>
            <span className="text-3xl font-black text-white">{score} / 10</span>
          </div>
        </div>

        {/* Detailed performance analysis */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Band Result Card */}
          <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider">Trình Độ Ước Tính</h3>
            
            <div className="w-28 h-28 rounded-full border-4 border-[#3B5C37]/20 flex items-center justify-center bg-emerald-50/50 shadow-inner">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">IELTS Band</span>
                <span className="text-3xl font-black text-[#3B5C37]">{calculatedBand.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-[#0d153a] block leading-none">
                {getBandTitle(calculatedBand)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Dựa trên 10 câu hỏi kiểm thử đầu vào
              </span>
            </div>
          </div>

          {/* AI Analysis Cards */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-[#3B5C37]" /> Phân Tích Kỹ Năng từ Trợ Lý AI
            </h3>

            <div className="space-y-3.5">
              {/* Strength */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Điểm mạnh nhận diện:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {calculatedBand >= 5.5 
                      ? "Khả năng phân tích cấu trúc phức và từ vựng học thuật ở mức ổn. Nhận biết và loại trừ các bẫy thông tin gây nhiễu tốt." 
                      : "Có khả năng nhận diện các từ vựng căn bản và thông tin trực tiếp từ bài nghe ngắn."}
                  </p>
                </div>
              </div>

              {/* Weakness */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Điểm yếu cần cải thiện:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {calculatedBand >= 6.5
                      ? "Cần tinh chỉnh các cấu trúc đảo ngữ nâng cao trong Writing và từ vựng đặc thù C2 ở các chủ đề trừu tượng."
                      : "Kỹ năng chắt lọc từ khóa (keywords) trong bài Reading còn yếu. Phát âm IPA chưa vững dẫn đến nghe sai các thông tin ngắn."}
                  </p>
                </div>
              </div>

              {/* Suggestion */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0d153a]">Đề xuất giáo trình từ AI:</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Phân bổ giáo trình tập trung học {calculatedBand >= 5.5 ? "Collocations học thuật nâng cao + Luyện các dạng Matching Info khó" : "Bảng phiên âm IPA + Từ vựng theo 10 chủ đề IELTS cơ bản + Các dạng bài điền khuyết"}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Setup Input Form for active saving */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5">
            Cấu Hình Lộ Trình Học Cá Nhân Hóa AI Đề Xuất
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Target Band Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" /> Band Mục Tiêu
              </label>
              <select
                value={targetBand}
                onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              >
                <option value={5.0}>Band 5.0 (Cơ bản)</option>
                <option value={5.5}>Band 5.5</option>
                <option value={6.0}>Band 6.0 (Khá)</option>
                <option value={6.5}>Band 6.5 (Khuyên dùng)</option>
                <option value={7.0}>Band 7.0 (Mục tiêu cao)</option>
                <option value={7.5}>Band 7.5</option>
                <option value={8.0}>Band 8.0</option>
                <option value={8.5}>Band 8.5</option>
                <option value={9.0}>Band 9.0 (Thủ khoa)</option>
              </select>
            </div>

            {/* Daily Study Hours */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Thời gian học mỗi ngày
              </label>
              <select
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              >
                <option value={1.0}>1.0 giờ / ngày</option>
                <option value={1.5}>1.5 giờ / ngày</option>
                <option value={2.0}>2.0 giờ / ngày (Khuyên dùng)</option>
                <option value={3.0}>3.0 giờ / ngày (Cường độ cao)</option>
                <option value={4.0}>4.0 giờ / ngày (Cấp tốc)</option>
              </select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày Thi Dự Kiến
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              />
            </div>
          </div>

          {/* Focus Skills */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400" /> Kỹ Năng Cần Tập Trung Luyện Tập
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Listening", "Reading", "Writing", "Speaking"].map((skill) => {
                const isChecked = focusSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillsChange(skill)}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                      isChecked
                        ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37]"
                        : "border-slate-100 bg-white hover:border-slate-200 text-slate-500"
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

          {/* CTA Submit Button to Save Roadmap */}
          <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-[#0d153a]">Tổng quỹ thời gian dự kiến: {Math.round(durationWeeks * 7 * dailyHours)} giờ thực hành</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Lộ trình học AI sẽ chia làm 3 giai đoạn ôn luyện chi tiết dựa trên thông số trên.</p>
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
        {/* Back navigation header for non-final stages */}
        {step > 0 && step < 4 && (
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

            {/* Sections step tracker */}
            <div className="flex gap-2 items-center">
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 1 ? "bg-[#3B5C37] scale-110" : step > 1 ? "bg-[#3B5C37]/40" : "bg-slate-200"}`} />
              <div className="w-4 h-0.5 bg-slate-200" />
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 2 ? "bg-orange-500 scale-110" : step > 2 ? "bg-orange-500/40" : "bg-slate-200"}`} />
              <div className="w-4 h-0.5 bg-slate-200" />
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 3 ? "bg-purple-600 scale-110" : "bg-slate-200"}`} />
            </div>
          </div>
        )}

        {/* Wizard render blocks */}
        {step === 0 && renderIntro()}
        {step === 1 && renderListening()}
        {step === 2 && renderReading()}
        {step === 3 && renderGrammar()}
        {step === 4 && renderScanner()}
        {step === 5 && renderResults()}
      </div>
    </div>
  );
}
