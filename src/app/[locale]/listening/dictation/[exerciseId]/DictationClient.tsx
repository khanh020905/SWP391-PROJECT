"use client";

// Dictation practice client — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/app/practice/listening/[exerciseId]/DictationClient.tsx).

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Play, Pause,
  RotateCcw, Settings, Mic, MessageSquare, BookOpen, Snail, Flame, Headphones
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import confetti from "canvas-confetti";
import type { DictationLesson } from "@/lib/listening/dictationParser";

// A word is broken into "tokens": editable letter boxes + static punctuation glyphs
type BoxToken =
  | { type: "letter"; slot: number; correct: string }
  | { type: "static"; char: string };

export default function DictationClient({ data }: { data: DictationLesson }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showAnswerImmed, setShowAnswerImmed] = useState(true);
  const [showFullAnswer, setShowFullAnswer] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showReplayToast, setShowReplayToast] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const challenge = data.challenges[currentIndex];

  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Play prevented:", e));
      setIsPlaying(true);
      setShowReplayToast(true);
      setTimeout(() => setShowReplayToast(false), 2000);
    }
  };

  const [showTipToast, setShowTipToast] = useState(true);
  const [revealedHintIndex] = useState<number>(-1);

  // Letter-box input: one box per letter, makes word length + spelling errors obvious
  const [inputMode, setInputMode] = useState<"boxes" | "free">("boxes");
  const [boxValues, setBoxValues] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // SFX: synthesized success chime (no asset file) played once per finished sentence
  const audioCtxRef = useRef<AudioContext | null>(null);
  const completionSfxRef = useRef(false);

  const playSuccessSfx = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5 → E5 → G5 ascending chime
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.09;
        const dur = 0.18;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch {
      // Audio not available — fail silently
    }
  };

  useEffect(() => {
    const tipTimer = setTimeout(() => setShowTipToast(false), 5000);
    return () => clearTimeout(tipTimer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        replayAudio();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [comboCount, setComboCount] = useState(0);
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Text-to-Speech function
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.replace(/[^\w\s]/g, ''));
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  // Open Source Friendly Translation function (MyMemory API - More Stable)
  const translateText = async (text: string, forIndex: number) => {
    if (!text || isTranslating) return;
    setIsTranslating(true);
    try {
      // MyMemory is very stable and free for moderate usage
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`);
      const data = await res.json();

      if (currentIndexRef.current === forIndex && data.responseData?.translatedText) {
        setTranslatedContent(data.responseData.translatedText);
      }
    } catch (error) {
      if (currentIndexRef.current === forIndex) {
        console.error("Translation failed:", error);
        setTranslatedContent("Không thể tải bản dịch tự động lúc này.");
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Strip all non-alphanumeric characters, including apostrophes, to map "ive" to "I've" seamlessly
  const cleanWord = (w: string) => w.replace(/[^\w\s]/g, '').toLowerCase().trim();

  useEffect(() => {
    setUserInput("");
    setBoxValues({});
    setIsPlaying(false);
    setTranslatedContent("");
    completionSfxRef.current = false;

    setTimeout(() => {
      if (audioRef.current && challenge?.audioSrc) {
        audioRef.current.src = challenge.audioSrc;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          if (audioRef.current) audioRef.current.playbackRate = playbackRate;
        }).catch(e => console.log("Autoplay prevented:", e));
        setIsPlaying(true);
      }
      if (inputMode === "boxes") inputRefs.current["0-0"]?.focus();
    }, 100);
  }, [currentIndex, challenge?.audioSrc, playbackRate]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1.0 ? 0.6 : 1.0;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  // Build a per-word model: how many letter boxes each word needs, and which
  // characters are static punctuation (apostrophes, hyphens, commas...).
  const wordModels = useMemo(() => {
    return challenge.solution.map((sol, i) => {
      const primaryRaw = Array.isArray(challenge.jsonContent[i])
        ? challenge.jsonContent[i][0]
        : challenge.jsonContent[i];
      const primary = String(primaryRaw ?? "");
      const tokens: BoxToken[] = [];
      let slotCount = 0;
      for (const ch of primary) {
        if (/[\p{L}\p{N}]/u.test(ch)) {
          tokens.push({ type: "letter", slot: slotCount, correct: ch });
          slotCount++;
        } else {
          tokens.push({ type: "static", char: ch });
        }
      }
      return { primary, tokens, slotCount, accepted: sol };
    });
  }, [challenge]);

  // Flat ordered list of every letter slot in the sentence — used for focus navigation.
  const flatSlots = useMemo(() => {
    const arr: { wi: number; s: number; key: string }[] = [];
    wordModels.forEach((wm, wi) => {
      for (let s = 0; s < wm.slotCount; s++) arr.push({ wi, s, key: `${wi}-${s}` });
    });
    return arr;
  }, [wordModels]);

  // Reconstruct each typed word from its letter boxes (index-aligned to solution).
  const boxWords = useMemo(
    () =>
      wordModels.map((wm, wi) =>
        Array.from({ length: wm.slotCount }, (_, s) => boxValues[`${wi}-${s}`] || "").join("")
      ),
    [wordModels, boxValues]
  );

  const isWordAccepted = (wm: { accepted: string[] }, typed: string) =>
    wm.accepted.map(cleanWord).includes(cleanWord(typed));

  const focusSlot = (key: string | undefined) => {
    if (!key) return;
    const el = inputRefs.current[key];
    if (el) {
      el.focus();
      el.select();
    }
  };
  const focusAdjacent = (key: string, dir: 1 | -1, sameWordOnly = false) => {
    const idx = flatSlots.findIndex((f) => f.key === key);
    const nextSlot = flatSlots[idx + dir];
    if (sameWordOnly && nextSlot && nextSlot.wi !== flatSlots[idx].wi) {
      return;
    }
    focusSlot(nextSlot?.key);
  };
  const focusNextWord = (wi: number) => {
    focusSlot(flatSlots.find((f) => f.wi > wi)?.key);
  };

  // Carry typed letters over to the free-text box when switching modes, so progress isn't lost.
  const switchToFree = () => {
    setUserInput(boxWords.join(" ").trimEnd());
    setInputMode("free");
  };

  const evaluationResult = useMemo(() => {
    const userWords = inputMode === "boxes"
      ? boxWords
      : userInput.trim().split(/\s+/).filter(Boolean);
    const resultWords: { text: string; status: 'correct' | 'typo' | 'incorrect' | 'pending'; displayAsAsterisk: boolean; userText?: string }[] = [];

    let hasIncorrect = false;
    let firstErrorIndex = -1;
    let typoCountThisSentence = 0;
    let allFilled = true;

    for (let i = 0; i < challenge.solution.length; i++) {
        const allowedAnswers = challenge.solution[i].map(cleanWord);
        const userW = userWords[i] || "";
        const cleanUserW = cleanWord(userW);
        const primaryText = String(Array.isArray(challenge.jsonContent[i])
                              ? challenge.jsonContent[i][0]
                              : challenge.jsonContent[i]);

        const isHintRevealed = i <= revealedHintIndex;

        if (userW) {
            let isMatch = false;
            let isTypo = false;

            for (const ans of allowedAnswers) {
               if (cleanUserW === ans) {
                 isMatch = true; break;
               }
               if (ans.length >= 4 && getLevenshteinDistance(cleanUserW, ans) <= 1) {
                 isTypo = true;
               }
            }

            if (isMatch) {
                resultWords.push({ text: primaryText, status: 'correct', displayAsAsterisk: false });
            } else if (isTypo && !isHintRevealed) {
                resultWords.push({ text: primaryText, userText: userW, status: 'typo', displayAsAsterisk: false });
                hasIncorrect = true;
                if (firstErrorIndex === -1) firstErrorIndex = i;
                typoCountThisSentence++;
            } else {
                resultWords.push({ text: isHintRevealed ? primaryText : userW, status: isHintRevealed ? 'correct' : 'incorrect', displayAsAsterisk: false });
                hasIncorrect = true;
                if (firstErrorIndex === -1) firstErrorIndex = i;
            }
        } else {
            if (firstErrorIndex === -1) firstErrorIndex = i;
            if (!isHintRevealed) allFilled = false;
            resultWords.push({
                text: primaryText,
                status: isHintRevealed ? 'correct' : 'pending',
                displayAsAsterisk: !showFullAnswer && !isHintRevealed
            });
        }
    }

    const isAllCorrect = allFilled && !hasIncorrect;
    return { resultWords, isAllCorrect, hasIncorrect, firstErrorIndex, userWords, typoCountThisSentence };
  }, [userInput, challenge, showFullAnswer, revealedHintIndex, inputMode, boxWords]);

  const { resultWords, isAllCorrect, hasIncorrect, typoCountThisSentence } = evaluationResult;

  useEffect(() => {
    if (isAllCorrect) {
      if (!completionSfxRef.current) {
        completionSfxRef.current = true;
        playSuccessSfx();
      }
      if (revealedHintIndex === -1 && typoCountThisSentence === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6']
        });
        setComboCount(prev => prev + 1);
      } else {
        setComboCount(0);
      }
    }
  }, [isAllCorrect, revealedHintIndex, typoCountThisSentence]);

  // Trigger auto-translate when sentence is finished
  useEffect(() => {
    if (isAllCorrect && !challenge.translation && !translatedContent) {
      const fullText = resultWords.map(w => w.text).join(" ");
      translateText(fullText, currentIndex);
    }
  }, [isAllCorrect, challenge, translatedContent, resultWords, currentIndex]);

  const [totalTypos, setTotalTypos] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const [showWarningPulse, setShowWarningPulse] = useState(false);

  const handleNext = (force = false) => {
    if (!isAllCorrect && !force) {
      setShowWarningPulse(true);
      setTimeout(() => setShowWarningPulse(false), 500);
      return;
    }

    setTotalTypos(prev => prev + typoCountThisSentence);
    if (revealedHintIndex !== -1) {
      setHintsUsed(prev => prev + 1);
    }

    if (currentIndex < data.challenges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowReport(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#10B981', '#F59E0B', '#3B82F6']
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f3f0] text-slate-700 w-full relative">

      {/* Replay Audio Toast Notification */}
      <AnimatePresence>
        {showReplayToast && (
          <motion.div
            key="replay-toast"
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-herb-600 text-white px-6 py-3 rounded-full flex items-center shadow-xl font-bold text-sm"
          >
            <RotateCcw className="w-5 h-5 mr-2 animate-spin-slow" />
            Đang phát lại Audio...
          </motion.div>
        )}

        {/* Intro Tip Toast Notification */}
        {showTipToast && (
          <motion.div
            key="tip-toast"
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-40 bg-white text-slate-600 px-6 py-3 rounded-full flex items-center shadow-2xl font-medium text-sm border border-gray-100"
          >
            <span className="text-xl mr-2">💡</span>
            Mẹo: Nhấn phím <kbd className="mx-2 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-herb-600 font-mono text-xs">Ctrl</kbd> để phát lại Audio nhanh
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 max-w-6xl mx-auto px-4 py-6 md:py-10 w-full">

      {/* Header */}
      <header className="flex flex-col mb-8">
        <Link href="/listening/dictation" className="text-herb-600 hover:text-herb-700 font-black mb-6 inline-flex items-center text-[10px] uppercase tracking-[2px] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại thư viện
        </Link>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-herb-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-herb-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-moss tracking-tight">{data.lessonName}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Listening Dictation Practice</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-100 mb-8">
        <button className="pb-4 border-b-2 border-herb-600 text-herb-600 font-black text-xs uppercase tracking-widest transition-colors">
          Luyện tập
        </button>
        <button className="pb-4 border-b-2 border-transparent text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">
          Transcript
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Dictation Area (Left) */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">

          {/* Top Control Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4 text-slate-400 font-black text-xs bg-slate-50 px-4 py-2 rounded-xl border border-gray-50">
              <button onClick={handlePrev} disabled={currentIndex === 0} className="hover:text-herb-600 disabled:opacity-30 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="tracking-widest">{currentIndex + 1} / {data.challenges.length}</span>
              <button onClick={() => handleNext(true)} disabled={currentIndex === data.challenges.length - 1} className="hover:text-herb-600 disabled:opacity-30 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button className="flex items-center text-slate-400 hover:text-herb-600 text-xs font-black uppercase tracking-widest transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </button>
          </div>

          {/* Audio Player Component */}
          <div className="flex items-center space-x-6 mb-8 bg-slate-50 p-5 rounded-2xl border border-gray-50">
            <button onClick={togglePlay} className="w-12 h-12 bg-herb-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-herb-200 hover:bg-herb-700 transition-all active:scale-95">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <div className="text-xs text-herb-700 font-black w-24 text-center tracking-tighter">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-herb-600 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSpeed}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${playbackRate !== 1.0 ? 'bg-herb-600 text-white shadow-md' : 'bg-white text-slate-400 border border-gray-100 hover:text-herb-600'}`}
                title="Tốc độ chậm"
              >
                <Snail className="w-5 h-5" />
              </button>
              <div className="text-[10px] text-slate-500 font-black bg-white border border-gray-100 px-3 py-2 rounded-xl">{playbackRate}x</div>
            </div>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />

          {/* Combo Gamification UI */}
          <div className="flex justify-end min-h-[28px] relative z-10 w-full mb-[-10px] pr-4">
            <AnimatePresence>
              {comboCount >= 3 && (
                <motion.div
                  key="combo-badge"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-[10px] uppercase tracking-[2px] px-5 py-2 rounded-t-xl shadow-lg flex items-center"
                >
                  <Flame className="w-4 h-4 mr-2 text-yellow-300 animate-pulse" />
                  Combo x{comboCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Chế độ:</span>
            <button
              onClick={() => setInputMode("boxes")}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === "boxes" ? "bg-herb-600 text-white shadow-md shadow-herb-200" : "bg-white border border-gray-200 text-slate-400 hover:text-herb-600"}`}
            >
              Ô chữ
            </button>
            <button
              onClick={switchToFree}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === "free" ? "bg-herb-600 text-white shadow-md shadow-herb-200" : "bg-white border border-gray-200 text-slate-400 hover:text-herb-600"}`}
            >
              Tự gõ
            </button>
          </div>

          {/* Dictation Input Area */}
          {inputMode === "boxes" ? (
            <div className={`relative mb-6 transition-all duration-500 ${isAllCorrect ? 'ring-4 ring-herb-500/10 border-herb-500 bg-herb-50/20' : hasIncorrect ? 'ring-4 ring-amber-500/10 border-amber-400' : 'border-gray-200 shadow-sm'} rounded-3xl border-2 bg-white overflow-hidden p-6`}>
              <div className="flex flex-wrap gap-x-5 gap-y-4">
                {wordModels.map((wm, wi) => (
                  <div key={wi} className="flex items-end gap-[3px]">
                    {wm.tokens.map((tok, ti) => {
                      if (tok.type === "static") {
                        return (
                          <span key={ti} className="text-2xl font-black text-slate-400 px-[1px] pb-2 self-end">
                            {tok.char}
                          </span>
                        );
                      }
                      const key = `${wi}-${tok.slot}`;
                      const val = boxValues[key] || "";
                      const wordFilled =
                        wm.slotCount > 0 &&
                        Array.from({ length: wm.slotCount }).every(
                          (_, k) => (boxValues[`${wi}-${k}`] || "") !== ""
                        );
                      let state: "empty" | "filled" | "correct" | "wrong" = val ? "filled" : "empty";
                      if (showAnswerImmed && wordFilled) {
                        state =
                          isWordAccepted(wm, boxWords[wi]) ||
                          val.toLowerCase() === tok.correct.toLowerCase()
                            ? "correct"
                            : "wrong";
                      }
                      return (
                        <input
                          key={ti}
                          ref={(el) => { inputRefs.current[key] = el; }}
                          type="text"
                          inputMode="text"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          autoFocus={wi === 0 && tok.slot === 0}
                          value={val}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw.length > 1) {
                              // Support paste / fast typing by spreading chars across slots
                              const startIdx = flatSlots.findIndex((f) => f.key === key);
                              const chars = raw.replace(/\s/g, "").split("");
                              setBoxValues((prev) => {
                                const next = { ...prev };
                                let idx = startIdx;
                                for (const ch of chars) {
                                  if (idx >= flatSlots.length) break;
                                  next[flatSlots[idx].key] = ch.slice(0, 1);
                                  idx++;
                                }
                                return next;
                              });
                              focusSlot(flatSlots[Math.min(startIdx + chars.length, flatSlots.length - 1)]?.key);
                            } else {
                              setBoxValues((prev) => ({ ...prev, [key]: raw }));
                              if (raw) focusAdjacent(key, 1, true);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleNext(false);
                            } else if (e.key === "Backspace") {
                              if (!val) {
                                e.preventDefault();
                                const idx = flatSlots.findIndex((f) => f.key === key);
                                const prev = flatSlots[idx - 1];
                                if (prev) {
                                  setBoxValues((p) => ({ ...p, [prev.key]: "" }));
                                  focusSlot(prev.key);
                                }
                              } else {
                                setBoxValues((p) => ({ ...p, [key]: "" }));
                              }
                            } else if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              focusAdjacent(key, -1);
                            } else if (e.key === "ArrowRight") {
                              e.preventDefault();
                              focusAdjacent(key, 1);
                            } else if (e.key === " ") {
                              e.preventDefault();
                              focusNextWord(wi);
                            }
                          }}
                          className={`w-9 h-11 sm:w-10 sm:h-12 text-center text-xl font-black rounded-lg border-2 outline-none transition-all uppercase ${
                            state === "correct"
                              ? "border-herb-500 bg-herb-50 text-herb-700"
                              : state === "wrong"
                              ? "border-red-400 bg-red-50 text-red-600"
                              : state === "filled"
                              ? "border-slate-300 bg-white text-moss focus:border-herb-500 focus:ring-2 focus:ring-herb-500/20"
                              : "border-slate-200 bg-slate-50/50 text-moss focus:border-herb-500 focus:ring-2 focus:ring-herb-500/20"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Mỗi ô là một chữ cái — gõ để tự nhảy ô
                </span>
                <button
                  onClick={() => { setBoxValues({}); focusSlot(flatSlots[0]?.key); }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-herb-600 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Xóa hết
                </button>
              </div>
            </div>
          ) : (
            <div className={`relative mb-6 transition-all duration-500 ${isAllCorrect ? 'ring-4 ring-herb-500/10 border-herb-500 bg-herb-50/20' : hasIncorrect ? 'ring-4 ring-amber-500/10 border-amber-400' : 'border-gray-200 hover:border-herb-300 shadow-sm'} rounded-3xl border-2 bg-white overflow-hidden`}>
              <textarea
                className="w-full h-36 bg-transparent text-moss text-2xl font-black p-6 resize-none focus:outline-none placeholder-slate-300 leading-relaxed"
                placeholder="Nghe và gõ lại câu tại đây..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleNext(false);
                  }
                }}
                autoFocus
              />

              {/* Input Tools */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                <button
                  onClick={() => setUserInput("")}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-herb-600 rounded-xl transition-all"
                  title="Xóa hết"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-herb-600 rounded-xl transition-all">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Next Sentence Button below input */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleNext(false)}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isAllCorrect ? 'bg-herb-600 hover:bg-herb-700 text-white shadow-lg shadow-herb-200' : 'bg-white border-2 border-gray-200 text-slate-500 hover:border-herb-300 hover:text-herb-600'}`}
            >
              Câu tiếp theo →
            </button>
          </div>

          {/* Feedbacks */}
          <div className="flex items-center justify-between mb-8 min-h-[48px]">
            <AnimatePresence mode="wait">
              {isAllCorrect ? (
                <motion.div
                  key="correct"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center text-herb-600 font-black text-lg"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Bạn xuất sắc! (Perfect!)
                </motion.div>
              ) : hasIncorrect && showAnswerImmed ? (
                <motion.div
                  key="incorrect"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center text-amber-500 font-black text-lg transition-transform ${showWarningPulse ? 'scale-105 text-red-500' : ''}`}
                >
                  <AlertTriangle className="w-6 h-6 mr-3" />
                  Chưa chính xác (Try again)
                </motion.div>
              ) : (
                <div key="typing" className="text-slate-300 flex items-center text-xs font-black uppercase tracking-widest animate-pulse">
                  <div className="w-2 h-2 bg-herb-600 rounded-full mr-3"></div>
                  Đang phân tích bài làm...
                </div>
              )}
            </AnimatePresence>

            <div className="flex space-x-4">
              {isAllCorrect ? (
                <button
                  onClick={() => handleNext(false)}
                  className="bg-herb-600 hover:bg-herb-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-herb-200 transition-all active:scale-95"
                >
                  Câu tiếp theo
                </button>
              ) : (
                <button
                  onClick={() => handleNext(true)}
                  className="bg-white border-2 border-gray-100 text-slate-400 hover:text-herb-600 hover:border-herb-100 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Bỏ qua
                </button>
              )}
            </div>
          </div>

          {/* Smart Hint Bar */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 mb-8 font-black text-xl leading-loose tracking-tight min-h-[80px] flex flex-wrap content-start">
            {resultWords.map((wordObj, i) => {
              if (wordObj.displayAsAsterisk) {
                const len = wordObj.text.replace(/[^\w]/g, '').length;
                return <span key={i} className="text-slate-200 mr-2">{'•'.repeat(Math.max(len, 2))}</span>;
              }
              if (wordObj.status === 'correct' || showFullAnswer) {
                return <span key={i} className="text-herb-600 mr-2">{wordObj.text}</span>;
              }
              if (wordObj.status === 'incorrect' && showAnswerImmed) {
                return <span key={i} className="text-amber-400 mr-2 line-through opacity-50">{wordObj.text}</span>;
              }
              return null;
            })}
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 pl-2">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={showAnswerImmed}
                onChange={() => setShowAnswerImmed(!showAnswerImmed)}
                className="w-5 h-5 rounded-lg border-gray-200 text-herb-600 focus:ring-herb-600 transition-all"
              />
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors font-bold text-xs uppercase tracking-wider">Hiện kết quả ngay</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={showFullAnswer}
                onChange={() => setShowFullAnswer(!showFullAnswer)}
                className="w-5 h-5 rounded-lg border-gray-200 text-herb-600 focus:ring-herb-600 transition-all"
              />
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors font-bold text-xs uppercase tracking-wider">Hiện đáp án đầy đủ</span>
            </label>
          </div>
        </div>

        {/* Side Panels (Right) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Translation Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-moss font-black flex items-center text-sm uppercase tracking-widest">
                <MessageSquare className="w-4 h-4 mr-3 text-herb-600" />
                Dịch nghĩa
              </h3>
              <div className="bg-herb-50 text-herb-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Vietnamese
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-gray-50 min-h-[100px] flex items-center justify-center text-center">
              {challenge.translation || translatedContent ? (
                <p className="text-slate-600 font-bold leading-relaxed italic">
                  &ldquo;{challenge.translation || translatedContent}&rdquo;
                </p>
              ) : isTranslating ? (
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 border-2 border-herb-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-[10px] text-herb-600 font-black uppercase tracking-widest">Đang dịch...</p>
                </div>
              ) : (
                <p className="text-slate-300 italic text-xs font-bold uppercase tracking-widest leading-loose">
                  Hoàn thành câu để xem bản dịch...
                </p>
              )}
            </div>
          </div>

          {/* Pronunciation Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-moss font-black mb-4 flex items-center text-sm uppercase tracking-widest">
              <Headphones className="w-4 h-4 mr-3 text-herb-600" />
              Luyện phát âm
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Click vào từ để nghe đọc</p>
            <div className="flex flex-wrap text-lg leading-relaxed gap-x-2 font-black">
                {resultWords.map((wordObj, i) => {
                   const isRevealed = wordObj.status === 'correct' || showFullAnswer;
                   const displayWord = isRevealed ? wordObj.text : '••••';

                   return (
                     <button
                       key={i}
                       onClick={() => isRevealed && speakWord(wordObj.text)}
                       className={`${isRevealed ? 'text-slate-400 hover:text-herb-600 cursor-pointer border-b-2 border-slate-100 hover:border-herb-600 active:scale-95' : 'text-slate-100'} transition-all`}
                     >
                       {displayWord}
                     </button>
                   );
                })}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Summary Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-moss/20 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-2 border-gray-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-herb-500 to-moss"></div>

              <div className="w-20 h-20 bg-herb-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Flame className="w-10 h-10 text-herb-600" />
              </div>

              <h2 className="text-3xl font-black text-moss mb-4 tracking-tight uppercase">Cực kỳ ấn tượng!</h2>
              <p className="text-slate-500 mb-10 font-medium">Bạn vừa hoàn thành xuất sắc bài tập <span className="text-herb-600 font-black">{data.lessonName}</span>. Đây là kết quả của bạn:</p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-gray-50">
                  <div className="text-4xl font-black text-herb-600 mb-1">{data.challenges.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Câu đúng</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-gray-50">
                  <div className="text-4xl font-black text-amber-500 mb-1">{totalTypos}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Lỗi Typo</div>
                </div>
                <div className="col-span-2 bg-moss text-white p-6 rounded-3xl shadow-xl shadow-moss/20 flex items-center justify-between">
                  <div className="text-left font-black uppercase text-[10px] tracking-widest opacity-70">Gợi ý đã dùng</div>
                  <div className="text-2xl font-black">{hintsUsed} lần</div>
                </div>
              </div>

              <Link
                href="/listening/dictation"
                className="block w-full bg-herb-600 hover:bg-herb-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-herb-200 transition-all active:scale-95 text-sm uppercase tracking-[2px]"
              >
                Tiếp tục rèn luyện
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
