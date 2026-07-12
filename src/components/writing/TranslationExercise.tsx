"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Lightbulb, ChevronLeft, Flame, CheckCircle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddToNotebookButton from "@/components/writing/AddToNotebookButtonTID";
import confetti from "canvas-confetti";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DichCauSentence {
  vi: string;
  answer: string;
  hint?: string;
}

export interface DichCauExerciseData {
  id: string;
  exercise_id: string;
  title: string;
  band_target: string;
  topic: { taskType?: string; en?: string; question?: string };
  sentences: DichCauSentence[];
}

interface TranslationExerciseProps {
  exercise: DichCauExerciseData;
  onBack: () => void;
  // Unique id for local storage saving (e.g. exerciseId or custom_generate_xxx)
  storageKeyId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isPunct = (t: string) => !/[a-zA-Z0-9]/.test(t);
const tokenize = (s: string) => s.split(" ").filter(Boolean);
const normalizeWord = (w: string) => w.replace(/[^a-zA-Z0-9'-]/g, "").toLowerCase();

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playTone = (freq: number, type: OscillatorType, time: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    };
    
    // Play a bright success arpeggio (C5, E5, G5, C6)
    playTone(523.25, 'sine', 0, 0.4, 0.1);
    playTone(659.25, 'sine', 0.1, 0.4, 0.1);
    playTone(783.99, 'sine', 0.2, 0.6, 0.1);
    playTone(1046.50, 'sine', 0.2, 0.6, 0.1);
  } catch (e) {
    console.error(e);
  }
};

export default function TranslationExercise({ exercise, onBack, storageKeyId }: TranslationExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealedMap, setRevealedMap] = useState<Record<number, Set<number>>>({});
  const [manualRevealedMap, setManualRevealedMap] = useState<Record<number, Set<number>>>({});
  const [allRevealedSet, setAllRevealedSet] = useState<Set<number>>(new Set());
  const [userInput, setUserInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [recentlyRevealed, setRecentlyRevealed] = useState<Set<number>>(new Set());
  const [submittedSet, setSubmittedSet] = useState<Set<number>>(new Set());
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const savedHistoryRef = useRef(false);
  const [hintCount, setHintCount] = useState(3);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [hasCheckedProgress, setHasCheckedProgress] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [vocabPopupPos, setVocabPopupPos] = useState<{ ti: number; x: number; y: number; alignRight: boolean } | null>(null);
  const [collocationIndices, setCollocationIndices] = useState<Set<number>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const vocabPopupRef = useRef<HTMLDivElement>(null);
  const collocationBarRef = useRef<HTMLDivElement>(null);

  const openVocabPopup = useCallback((ti: number, buttonEl: HTMLElement) => {
    const rect = buttonEl.getBoundingClientRect();
    const alignRight = rect.left > window.innerWidth / 2;
    setVocabPopupPos({
      ti,
      x: alignRight ? window.innerWidth - rect.right : rect.left,
      y: rect.top,
      alignRight,
    });
  }, []);

  const closeVocabPopup = useCallback(() => setVocabPopupPos(null), []);

  // Close vocab popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vocabPopupRef.current && !vocabPopupRef.current.contains(e.target as Node)) {
        closeVocabPopup();
      }
    };
    if (vocabPopupPos !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [vocabPopupPos, closeVocabPopup]);

  // Close collocation bar on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collocationBarRef.current && !collocationBarRef.current.contains(e.target as Node)) {
        // Check if click is on a pill button (don't close if Ctrl-clicking more pills)
        const target = e.target as HTMLElement;
        if (!target.closest('[data-pill]')) {
          setCollocationIndices(new Set());
        }
      }
    };
    if (collocationIndices.size > 0) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collocationIndices]);


  // Load progress from localStorage
  useEffect(() => {
    if (!exercise) return;
    const raw = localStorage.getItem(`dich_cau_progress_${storageKeyId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.completed) {
          // Silently restore completed state — no popup, just show ticks
          setCurrentIdx(parsed.currentIdx || 0);
          const revMap: Record<number, Set<number>> = {};
          if (parsed.revealedMap) Object.entries(parsed.revealedMap).forEach(([k, v]) => revMap[Number(k)] = new Set(v as number[]));
          setRevealedMap(revMap);
          const manMap: Record<number, Set<number>> = {};
          if (parsed.manualRevealedMap) Object.entries(parsed.manualRevealedMap).forEach(([k, v]) => manMap[Number(k)] = new Set(v as number[]));
          setManualRevealedMap(manMap);
          if (parsed.allRevealedSet) setAllRevealedSet(new Set(parsed.allRevealedSet));
          if (parsed.submittedSet) setSubmittedSet(new Set(parsed.submittedSet as number[]));
          setAlreadyCompleted(true);
          setHasCheckedProgress(true);
        } else if (parsed.currentIdx > 0 || parsed.userInput) {
          setSavedProgress(parsed);
          setShowResumePopup(true);
        } else {
          setHasCheckedProgress(true);
        }
      } catch (e) {
        setHasCheckedProgress(true);
      }
    } else {
      setHasCheckedProgress(true);
    }
  }, [exercise, storageKeyId]);

  // Save progress to localStorage automatically
  useEffect(() => {
    if (!exercise || isCompleted || !hasCheckedProgress || alreadyCompleted) return;
    if (currentIdx === 0 && !userInput && Object.keys(revealedMap).length === 0 && allRevealedSet.size === 0 && submittedSet.size === 0) return;
    const toSave = {
      currentIdx,
      userInput,
      revealedMap: Object.fromEntries(Object.entries(revealedMap).map(([k, v]) => [k, Array.from(v)])),
      manualRevealedMap: Object.fromEntries(Object.entries(manualRevealedMap).map(([k, v]) => [k, Array.from(v)])),
      allRevealedSet: Array.from(allRevealedSet),
      submittedSet: Array.from(submittedSet),
    };
    localStorage.setItem(`dich_cau_progress_${storageKeyId}`, JSON.stringify(toSave));
  }, [exercise, storageKeyId, currentIdx, userInput, revealedMap, manualRevealedMap, allRevealedSet, submittedSet, isCompleted, alreadyCompleted, hasCheckedProgress]);

  const handleResume = (resume: boolean) => {
    setShowResumePopup(false);
    if (resume && savedProgress) {
      setCurrentIdx(savedProgress.currentIdx || 0);
      setUserInput(savedProgress.userInput || "");
      
      const revMap: Record<number, Set<number>> = {};
      if (savedProgress.revealedMap) {
        Object.entries(savedProgress.revealedMap).forEach(([k, v]) => revMap[Number(k)] = new Set(v as number[]));
      }
      setRevealedMap(revMap);

      const manMap: Record<number, Set<number>> = {};
      if (savedProgress.manualRevealedMap) {
        Object.entries(savedProgress.manualRevealedMap).forEach(([k, v]) => manMap[Number(k)] = new Set(v as number[]));
      }
      setManualRevealedMap(manMap);

      if (savedProgress.allRevealedSet) {
        setAllRevealedSet(new Set(savedProgress.allRevealedSet));
      }
      if (savedProgress.submittedSet) {
        setSubmittedSet(new Set(savedProgress.submittedSet as number[]));
      }
    } else {
      localStorage.removeItem(`dich_cau_progress_${storageKeyId}`);
    }
    setHasCheckedProgress(true);
  };

  const sentences = exercise?.sentences ?? [];
  const current = sentences[currentIdx];

  const tokens = useMemo(
    () => (current ? tokenize(current.answer) : []),
    [current]
  );

  // Build collocation phrase from selected indices
  const collocationPhrase = useMemo(() => {
    if (collocationIndices.size === 0) return "";
    const sorted = Array.from(collocationIndices).sort((a, b) => a - b);
    return sorted.map(i => tokens[i]?.replace(/[^a-zA-Z0-9'-]/g, "").toLowerCase()).filter(Boolean).join(" ");
  }, [collocationIndices, tokens]);

  const revealed = revealedMap[currentIdx] ?? new Set<number>();
  const allRevealed = allRevealedSet.has(currentIdx);
  const manualReveals = manualRevealedMap[currentIdx]?.size ?? 0;

  const wordTokenIndices = useMemo(
    () => tokens.reduce<number[]>((acc, t, i) => { if (!isPunct(t)) acc.push(i); return acc; }, []),
    [tokens]
  );

  const isSubmitted = submittedSet.has(currentIdx);

  const typedCorrectly = Math.max(0, (revealedMap[currentIdx]?.size ?? 0) - manualReveals);
  const totalWords = Math.max(1, wordTokenIndices.length);
  const accuracy = Math.round((typedCorrectly / totalWords) * 100);
  const allRevealPenalty = allRevealedSet.has(currentIdx) ? 30 : 0;
  const score = Math.max(0, accuracy - manualReveals * 5 - allRevealPenalty);
  const matchPct = accuracy;

  const typedWords = userInput.split(/\s+/).filter(Boolean);
  const endsWithSpace = userInput.length > 0 && userInput[userInput.length - 1] === " ";
  const completedCount = endsWithSpace ? typedWords.length : Math.max(0, typedWords.length - 1);
  const partialWord = !endsWithSpace && typedWords.length > 0 ? typedWords[typedWords.length - 1] : "";
  const partialTokenIdx = completedCount < wordTokenIndices.length ? wordTokenIndices[completedCount] : -1;

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    setUserInput("");
    setShowError(false);
    setShowHint(false);
    setRecentlyRevealed(new Set());
    setHintCount(3);
    closeVocabPopup();
    setCollocationIndices(new Set());
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleComplete = () => {
    // Save completed snapshot so returning users see all ticks
    const completedSnapshot = {
      currentIdx: sentences.length - 1,
      userInput: "",
      revealedMap: Object.fromEntries(Object.entries(revealedMap).map(([k, v]) => [k, Array.from(v)])),
      manualRevealedMap: Object.fromEntries(Object.entries(manualRevealedMap).map(([k, v]) => [k, Array.from(v)])),
      allRevealedSet: Array.from(allRevealedSet),
      submittedSet: Array.from(submittedSet),
      completed: true,
    };
    localStorage.setItem(`dich_cau_progress_${storageKeyId}`, JSON.stringify(completedSnapshot));
    setIsCompleted(true);
    
  };

  const handleRestart = () => {
    localStorage.removeItem(`dich_cau_progress_${storageKeyId}`);
    setCurrentIdx(0);
    setRevealedMap({});
    setManualRevealedMap({});
    setAllRevealedSet(new Set());
    setUserInput("");
    setShowHint(false);
    setRecentlyRevealed(new Set());
    setSubmittedSet(new Set());
    setAlreadyCompleted(false);
    setIsCompleted(false);
    setHintCount(3);
    savedHistoryRef.current = false;
    setHasCheckedProgress(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const revealOne = (ti: number) => {
    setRevealedMap((prev) => {
      const next = { ...prev };
      const s = new Set(next[currentIdx] ?? []);
      s.add(ti);
      next[currentIdx] = s;
      return next;
    });
  };

  const manualRevealOne = (ti: number) => {
    revealOne(ti);
    setManualRevealedMap((prev) => {
      const next = { ...prev };
      const s = new Set(next[currentIdx] ?? []);
      s.add(ti);
      next[currentIdx] = s;
      return next;
    });
    setRecentlyRevealed(new Set([ti]));
    setTimeout(() => setRecentlyRevealed(new Set()), 700);
  };

  const revealFirstUnrevealed = () => {
    const ti = tokens.findIndex((t, i) => !isPunct(t) && !revealed.has(i) && !allRevealed);
    if (ti !== -1) manualRevealOne(ti);
  };

  const toggleAllRevealed = () => {
    setAllRevealedSet((prev) => {
      const next = new Set(prev);
      next.has(currentIdx) ? next.delete(currentIdx) : next.add(currentIdx);
      return next;
    });
  };

  // The correct answer as an ordered list of normalized words (punctuation stripped),
  // matching how the auto-reveal logic compares typed words to the answer tokens.
  const answerWords = useMemo(
    () => wordTokenIndices.map((i) => normalizeWord(tokens[i])).filter(Boolean),
    [wordTokenIndices, tokens]
  );

  const isAnswerCorrect = (input: string) => {
    const typed = input.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (typed.length !== answerWords.length) return false;
    return typed.every((w, i) => w === answerWords[i]);
  };

  const handleSubmit = () => {
    if (!userInput.trim() || isSubmitted) return;

    // Only accept a submission that actually matches the answer.
    if (!isAnswerCorrect(userInput)) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setSubmittedSet(prev => new Set([...prev, currentIdx]));

    // Congrats effects
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4d6228', '#6A8042', '#fbbf24', '#f59e0b', '#10b981']
    });
    playSuccessSound();
  };

  // Auto-reveal pills as user types
  useEffect(() => {
    if (isSubmitted || !current) return;
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);
    const currentRevealed = revealedMap[currentIdx] ?? new Set<number>();
    const newlyRevealed: number[] = [];

    typedWords.forEach((typedWord, pos) => {
      if (pos >= wordTokenIndices.length) return;
      const tokenIdx = wordTokenIndices[pos];
      if (currentRevealed.has(tokenIdx)) return;
      if (normalizeWord(tokens[tokenIdx]) === normalizeWord(typedWord)) {
        newlyRevealed.push(tokenIdx);
      }
    });

    if (newlyRevealed.length > 0) {
      setRevealedMap((prev) => {
        const next = { ...prev };
        const s = new Set(next[currentIdx] ?? []);
        newlyRevealed.forEach((i) => s.add(i));
        next[currentIdx] = s;
        return next;
      });
      setRecentlyRevealed(new Set(newlyRevealed));
      setTimeout(() => setRecentlyRevealed(new Set()), 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        if (!isSubmitted) revealFirstUnrevealed();
      }
      if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
        if (isSubmitted) {
          e.preventDefault();
          if (currentIdx < sentences.length - 1) goTo(currentIdx + 1);
          else handleComplete();
        } else if (document.activeElement === textareaRef.current) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (!isSubmitted) textareaRef.current?.focus();
  }, [currentIdx, isSubmitted]);


  if (!current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#6A8042" }}>
        <p className="text-white font-black text-xl">Không có dữ liệu câu hỏi.</p>
        <button onClick={onBack} className="text-white/70 underline text-sm font-bold hover:text-white transition-colors">
          ← Quay lại
        </button>
      </div>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen font-sans overflow-hidden" style={{ backgroundColor: "#6A8042" }}>
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <div>
            <span className="text-white font-black italic text-lg tracking-tight">dịch câu</span>
            <span className="ml-2 text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">THE IELTS DICTIONARY</span>
          </div>
        </div>

        {/* Dot navigation */}
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {sentences.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === currentIdx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs font-medium hidden sm:inline">{exercise.title}</span>
          <span className="bg-white/10 border border-white/20 text-white text-xs font-black px-3 py-1 rounded-full">
            Câu {currentIdx + 1}/{sentences.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex gap-4 p-4 h-[calc(100vh-52px)] max-w-5xl mx-auto w-full">

        {/* Left column */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Essay prompt & Instructions */}
          <div className="bg-white rounded-2xl border border-black/10 p-5 shadow-lg shrink-0">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Đề bài</span>
              <div className="flex items-center gap-2">
                {exercise.topic?.taskType && (
                  <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {exercise.topic.taskType}
                  </span>
                )}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  title="Làm lại bài này từ đầu"
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 hover:border-red-300 hover:text-red-500 transition-all"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              </div>
            </div>
            
            {(exercise.topic?.en || exercise.topic?.question) && (
              <div className="mb-4">
                {exercise.topic.en && (
                  <p className="text-sm font-medium text-slate-700 leading-relaxed mb-3">{exercise.topic.en}</p>
                )}
                {exercise.topic.question && (
                  <p className="text-xs font-medium italic text-slate-500 leading-relaxed">{exercise.topic.question}</p>
                )}
              </div>
            )}

            <div className="mt-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-medium text-slate-600">Mở từ gợi ý</span>
                <div className="flex items-center gap-1">
                  <kbd className="font-sans font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                  <span className="text-slate-300">+</span>
                  <kbd className="font-sans font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">Space</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-medium text-slate-600">Nộp / Sang câu tiếp</span>
                <kbd className="font-sans font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">Enter</kbd>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-medium text-slate-600">Lưu collocation</span>
                <div className="flex items-center gap-1">
                  <kbd className="font-sans font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                  <span className="text-slate-300">+</span>
                  <kbd className="font-sans font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">Click</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Sentence list */}
          <div className="bg-white rounded-2xl border border-black/10 p-4 shadow-lg flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Các câu trong bài</span>
              <span className="text-[9px] font-black text-slate-400">{currentIdx + 1}/{sentences.length}</span>
            </div>
            <div className="space-y-1.5">
              {sentences.map((s, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs leading-relaxed transition-all ${
                    i === currentIdx
                      ? "bg-herb/10 border border-herb/30 text-slate-800 font-semibold"
                      : submittedSet.has(i)
                      ? "text-emerald-700 hover:bg-emerald-50 font-normal"
                      : "text-slate-500 hover:bg-slate-50 font-normal"
                  }`}
                >
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5 ${
                    submittedSet.has(i) ? "bg-emerald-500 text-white" : i === currentIdx ? "bg-herb text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    {submittedSet.has(i) ? <CheckCircle size={11} /> : i + 1}
                  </span>
                  <span className="line-clamp-2">{s.vi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">

          {/* Exercise card */}
          <div className="bg-white rounded-2xl border border-black/10 shadow-lg flex flex-col p-6 flex-1">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🇻🇳</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Tiếng Việt → English</span>
              </div>
            </div>

            {alreadyCompleted && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                  Bạn đã hoàn thành bài này — bấm câu bất kỳ ở bên trái để ôn lại.
                </div>
                <button
                  onClick={handleRestart}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-500 hover:border-red-300 hover:text-red-500 transition-all whitespace-nowrap shadow-sm"
                >
                  <RotateCcw size={11} />
                  Làm lại từ đầu
                </button>
              </div>
            )}

            {/* Vietnamese sentence */}
            <p className="text-lg font-bold text-slate-800 leading-relaxed mb-5">{current.vi}</p>

            {/* Word pills */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Câu mẫu – Nhớ đúng để mở từ:
                </span>
                <div className="flex items-center gap-3">

                  {!isSubmitted && (
                    <button
                      onClick={toggleAllRevealed}
                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {allRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                      {allRevealed ? "Ẩn lại" : "Hiện tất cả"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tokens.map((token, ti) => {
                  if (isPunct(token)) {
                    return <span key={ti} className="text-slate-400 text-sm font-serif self-center">{token}</span>;
                  }
                  const alpha = token.replace(/[^a-zA-Z0-9]/g, "");
                  const punct = token.slice(alpha.length);
                  const isRevealed = isSubmitted || allRevealed || revealed.has(ti);
                  const isNew = recentlyRevealed.has(ti);
                  const isPartial = !isSubmitted && !isRevealed && ti === partialTokenIdx && partialWord.length > 0;

                  if (isRevealed) {
                    const isVocabSelected = vocabPopupPos?.ti === ti;
                    const isCollocationSelected = collocationIndices.has(ti);

                    const handlePillClick = (e: React.MouseEvent) => {
                      if (e.ctrlKey || e.metaKey) {
                        // Ctrl/Cmd+Click: toggle this word in collocation set
                        e.preventDefault();
                        closeVocabPopup(); // close single-word popup
                        setCollocationIndices(prev => {
                          const next = new Set(prev);
                          if (next.has(ti)) next.delete(ti);
                          else next.add(ti);
                          return next;
                        });
                      } else {
                        // Normal click: single word vocab popup (clear collocation)
                        setCollocationIndices(new Set());
                        if (isVocabSelected) {
                          closeVocabPopup();
                        } else {
                          openVocabPopup(ti, e.currentTarget as HTMLElement);
                        }
                      }
                    };

                    return (
                      <div key={ti} className="relative inline-block">
                        <button
                          data-pill="true"
                          onClick={handlePillClick}
                          className={`rounded-full px-3 py-1 text-sm font-mono select-none border font-bold transition-all duration-200 ${
                            isNew
                              ? "border-2 border-herb bg-herb text-white scale-110 shadow-md"
                              : isCollocationSelected
                              ? "border-2 border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200 shadow-md"
                              : isVocabSelected
                              ? "border-herb bg-herb text-white"
                              : "border-herb/40 bg-herb/10 text-herb hover:bg-herb hover:text-white"
                          }`}
                        >
                          {token}
                        </button>
                      </div>
                    );
                  }

                  if (isPartial) {
                    const typed = partialWord.slice(0, alpha.length);
                    const remaining = Math.max(0, alpha.length - typed.length);
                    const isCorrect = normalizeWord(alpha).startsWith(normalizeWord(partialWord));
                    return (
                      <span
                        key={ti}
                        className={`rounded-full px-3 py-1 text-sm font-mono select-none border-2 font-bold transition-colors duration-100 ${
                          isCorrect ? "border-herb/60 bg-herb/5" : "border-red-400 bg-red-50"
                        }`}
                      >
                        <span className={isCorrect ? "text-herb" : "text-red-500"}>{typed}</span>
                        <span className="text-slate-300">{"*".repeat(remaining)}</span>
                        {punct}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={ti}
                      onClick={() => manualRevealOne(ti)}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-mono select-none border border-slate-200 bg-slate-50 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-400 transition-all duration-150 group"
                    >
                      <Eye size={11} className="text-slate-300 group-hover:text-red-400 shrink-0 transition-colors" />
                      {alpha.length > 1 ? alpha[0] + "*".repeat(alpha.length - 1) : "*"}{punct}
                    </button>
                  );
                })}
              </div>

              {/* Collocation floating bar */}
              {collocationIndices.size >= 2 && (
                <div ref={collocationBarRef} className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Collocation đã chọn</span>
                    <span className="text-[9px] text-amber-400 font-medium">(Ctrl+Click để thêm/bớt từ)</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {Array.from(collocationIndices).sort((a, b) => a - b).map(idx => (
                      <span key={idx} className="rounded-full px-3 py-1 text-sm font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {tokens[idx]?.replace(/[^a-zA-Z0-9'-]/g, "")}
                      </span>
                    ))}
                    <button
                      onClick={() => setCollocationIndices(new Set())}
                      className="text-amber-400 hover:text-amber-600 text-xs font-black transition-colors ml-1"
                      title="Xóa hết"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-amber-800">"{collocationPhrase}"</span>
                    <AddToNotebookButton
                      word={collocationPhrase}
                      definition={current.vi}
                      example={current.answer}
                      source="dich-cau"
                      variant="full"
                      dropdownPosition="down"
                      dropdownAlign="left"
                      className="justify-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hint */}
            {(() => {
              const nextPos = wordTokenIndices.findIndex((ti) => !revealed.has(ti) && !allRevealed);
              const hasUnrevealed = nextPos !== -1;
              const hintSlice = hasUnrevealed
                ? wordTokenIndices.slice(nextPos, nextPos + hintCount).map((ti) => tokens[ti])
                : [];
              const canShowMore = hasUnrevealed && nextPos + hintCount < wordTokenIndices.length;

              return (
                <div className="mb-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1.5 text-[11px] font-black text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <Lightbulb size={12} />
                    {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                  </button>

                  {showHint && (
                    <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                      {/* Custom hint from admin if provided */}
                      {current.hint && (
                        <p className="text-xs font-medium italic text-amber-700 mb-2 pb-2 border-b border-amber-200">
                          💡 {current.hint}
                        </p>
                      )}
                      {!hasUnrevealed ? (
                        <p className="text-xs font-bold text-emerald-600">✓ Bạn đã gõ đúng tất cả các từ!</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                              Từ thứ {nextPos + 1} trở đi:
                            </span>
                            <span className="text-[10px] text-amber-400">chữ cái đầu mỗi từ</span>
                          </div>
                          <div className="flex flex-wrap gap-3 items-end">
                            {hintSlice.map((word, i) => {
                              const alpha = word.replace(/[^a-zA-Z0-9]/g, "");
                              const punct = word.slice(alpha.length);
                              return (
                                <div key={i} className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Từ {nextPos + i + 1}</span>
                                  <div className="flex items-end gap-[3px]">
                                    {alpha.split("").map((_, li) => (
                                      <span key={li} className="w-3 h-[2px] bg-amber-500 block rounded-full" />
                                    ))}
                                    {punct && <span className="text-amber-600 font-bold text-sm leading-none ml-0.5">{punct}</span>}
                                  </div>
                                  <span className="text-[9px] text-amber-400">{alpha.length} chữ</span>
                                </div>
                              );
                            })}
                            {canShowMore && (
                              <button
                                onClick={() => setHintCount((n) => n + 3)}
                                className="text-[10px] font-black text-amber-500 underline hover:text-amber-700 transition-colors mb-3"
                              >
                                + Xem thêm
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Textarea */}
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bài dịch của em:</span>
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => { if (!isSubmitted) { setUserInput(e.target.value); setShowError(false); } }}
                readOnly={isSubmitted}
                placeholder="Gõ bản dịch của bạn tại đây..."
                className={`flex-1 min-h-[100px] w-full resize-none rounded-2xl border-2 px-5 py-4 text-base font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 ${
                  isSubmitted
                    ? "border-slate-100 bg-slate-50 text-slate-600 cursor-default"
                    : showError
                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50 focus:border-herb focus:bg-white"
                }`}
              />
            </div>

            {/* Action buttons */}
            {!isSubmitted ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!userInput.trim()}
                    className="flex-1 rounded-2xl bg-herb py-3 text-sm font-black uppercase tracking-widest text-white shadow-[3px_3px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40"
                  >
                    Nộp (Enter)
                  </button>
                </div>
                {showError && (
                  <p className="mt-3 text-center text-sm font-bold text-red-500 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    Chưa chính xác — kiểm tra lại bản dịch của bạn (gõ đúng từng từ). Dùng 💡 Xem gợi ý nếu cần.
                  </p>
                )}

              </>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl animate-bounce">🎉</span>
                  <span className="text-2xl font-black text-emerald-600 uppercase tracking-widest">Tuyệt vời!</span>
                  <span className="text-4xl animate-bounce" style={{ animationDelay: "0.2s" }}>🎉</span>
                </div>
                <p className="text-emerald-700 font-bold mb-5 text-center">Bạn đã hoàn thành câu này xuất sắc.</p>
                
                <div className="bg-white rounded-xl p-5 w-full border border-emerald-100 shadow-sm mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Câu trả lời hoàn chỉnh:</p>
                  <p className="text-lg font-medium text-slate-800">{current.answer}</p>
                </div>

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => currentIdx > 0 && goTo(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="px-6 py-4 rounded-xl border-2 border-emerald-200 text-sm font-black text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-30"
                  >
                    ← Câu trước
                  </button>
                  <button
                    onClick={() => {
                      if (currentIdx < sentences.length - 1) goTo(currentIdx + 1);
                      else handleComplete();
                    }}
                    autoFocus
                    className="flex-1 rounded-xl bg-emerald-500 py-4 text-base font-black text-white hover:bg-emerald-600 transition-all shadow-[0_4px_0_rgba(16,185,129,0.4)] hover:shadow-[0_0px_0_rgba(16,185,129,0.4)] hover:translate-y-[4px]"
                  >
                    {currentIdx < sentences.length - 1 ? "Câu tiếp theo (Enter) →" : "Hoàn thành bài tập (Enter) ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Vocab popup portal — rendered outside overflow containers */}
      {vocabPopupPos !== null && collocationIndices.size === 0 && typeof document !== 'undefined' && createPortal(
        <div
          ref={vocabPopupRef}
          className="fixed z-[9999]"
          style={{
            top: vocabPopupPos.y - 8,
            ...(vocabPopupPos.alignRight
              ? { right: vocabPopupPos.x }
              : { left: vocabPopupPos.x }),
            transform: 'translateY(-100%)',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex flex-col gap-2 min-w-[200px] items-center">
            <span className="text-sm font-black text-slate-700">"{normalizeWord(tokens[vocabPopupPos.ti] || "")}"</span>
            <AddToNotebookButton
              word={normalizeWord(tokens[vocabPopupPos.ti] || "")}
              definition={current.vi}
              example={current.answer}
              source="dich-cau"
              variant="full"
              dropdownPosition="down"
              dropdownAlign={vocabPopupPos.alignRight ? "right" : "left"}
              className="w-full justify-center"
            />
            <div className="border-t border-slate-100 pt-2 mt-1 w-full">
              <p className="text-[10px] text-slate-400 text-center leading-snug">
                💡 <kbd className="font-black text-slate-500 bg-slate-100 px-1 rounded">Ctrl/⌘</kbd>+<kbd className="font-black text-slate-500 bg-slate-100 px-1 rounded">Click</kbd> nhiều từ để lưu collocation
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Summary Report Modal */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-2 border-gray-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-herb-500 to-emerald-600"></div>
              
              <div className="w-20 h-20 bg-herb-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Flame className="w-10 h-10 text-herb-600" />
              </div>
              
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase">Cực kỳ ấn tượng!</h2>
              <p className="text-slate-500 mb-10 font-medium">Bạn vừa hoàn thành xuất sắc bài tập <span className="text-herb-600 font-black">{exercise.title}</span>. Tiến độ của bạn đã được lưu lại!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-gray-50">
                  <div className="text-4xl font-black text-herb-600 mb-1">{sentences.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Tổng số câu</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-gray-50">
                  <div className="text-4xl font-black text-amber-500 mb-1">
                    {(() => {
                      let totalManualReveals = 0;
                      sentences.forEach((_, i) => {
                        totalManualReveals += manualRevealedMap[i]?.size ?? 0;
                      });
                      return totalManualReveals;
                    })()}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Từ đã mở gợi ý</div>
                </div>
              </div>
              
              <button 
                onClick={onBack}
                className="block w-full bg-herb hover:bg-herb/90 text-white font-black py-5 rounded-3xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-[2px]"
              >
                Quay lại thư viện
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Resume Progress Modal */}
      <AnimatePresence>
        {showResumePopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Tiếp tục bài làm?</h2>
              <p className="text-slate-500 mb-8 font-medium">Bạn có một bài luyện dịch đang làm dở. Bạn có muốn tiếp tục từ nơi bạn đã dừng lại không?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleResume(true)}
                  className="w-full bg-herb hover:bg-herb/90 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                >
                  Tiếp tục bài cũ
                </button>
                <button 
                  onClick={() => handleResume(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  Làm lại từ đầu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <RotateCcw className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Làm lại bài này?</h2>
              <p className="text-slate-500 mb-8 font-medium">
                Toàn bộ tiến độ của bài <span className="font-black text-slate-700">{exercise.title}</span> sẽ bị xoá và bạn sẽ bắt đầu lại từ câu đầu tiên. Bạn có chắc không?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { handleRestart(); setShowResetConfirm(false); }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                >
                  Xoá và làm lại
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  Huỷ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
