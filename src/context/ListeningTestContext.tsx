"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  normalizeListeningTest,
  NormalizedSection,
  NormalizedListeningQuestion
} from "@/utils/questionHelpers";

export interface ListeningResult {
  totalQuestions: number;
  correctCount: number;
  score: number;               // 0–40 (raw score)
  bandScore: number;           // 0–9
  sectionResults: {
    sectionNumber: number;
    correct: number;
    total: number;
  }[];
  answers: Record<string, string>;
  correctAnswers: Record<string, string>;
}

interface ListeningTestContextValue {
  testList: any[];
  selectedTest: any | null;
  sections: NormalizedSection[];
  currentSectionIndex: number;
  currentSection: NormalizedSection | null;
  answers: Record<string, string>;
  isPlaying: boolean;
  mockProgress: number;
  mockDuration: number;
  mockCurrentTime: number;
  isLoading: boolean;
  isSubmitting: boolean;
  showResult: boolean;
  result: ListeningResult | null;
  error: string | null;

  loadTestList: () => Promise<void>;
  selectTest: (testId: string) => Promise<void>;
  goToSection: (index: number) => void;
  goToNextSection: () => void;
  goToPrevSection: () => void;
  setAnswer: (questionId: string, value: string) => void;
  togglePlay: () => void;
  seekTo: (percent: number) => number;
  submitTest: () => Promise<void>;
  resetTest: () => void;
}

const ListeningTestContext = createContext<ListeningTestContextValue | null>(null);

export const rawScoreToBand = (raw: number): number => {
  if (raw >= 39) return 9.0;
  if (raw >= 37) return 8.5;
  if (raw >= 35) return 8.0;
  if (raw >= 33) return 7.5;
  if (raw >= 30) return 7.0;
  if (raw >= 27) return 6.5;
  if (raw >= 23) return 6.0;
  if (raw >= 20) return 5.5;
  if (raw >= 16) return 5.0;
  if (raw >= 13) return 4.5;
  if (raw >= 10) return 4.0;
  return 3.5;
};

export const gradeListeningTest = (
  sections: NormalizedSection[],
  answers: Record<string, string>
): ListeningResult => {
  let correctCount = 0;
  const correctAnswers: Record<string, string> = {};
  const sectionResults: { sectionNumber: number; correct: number; total: number }[] = [];

  sections.forEach((section) => {
    let sectionCorrect = 0;
    section.questions.forEach((q) => {
      const userAnswer = (answers[q.id] ?? "").toLowerCase().trim();
      let isCorrect = false;

      if (q.type === "mcq") {
        isCorrect = userAnswer === q.correctAnswer.toLowerCase();
        correctAnswers[q.id] = q.correctAnswer;
      } else {
        isCorrect = q.acceptedAnswers.some((a) => userAnswer === a);
        correctAnswers[q.id] = q.acceptedAnswers[0] || "";
      }

      if (isCorrect) {
        correctCount++;
        sectionCorrect++;
      }
    });
    
    sectionResults.push({
      sectionNumber: section.sectionNumber,
      correct: sectionCorrect,
      total: section.questions.length,
    });
  });

  const bandScore = rawScoreToBand(correctCount);

  return {
    totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
    correctCount,
    score: correctCount,
    bandScore,
    sectionResults,
    answers,
    correctAnswers,
  };
};

export function ListeningTestProvider({ children }: { children: React.ReactNode }) {
  const [testList, setTestList] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [sections, setSections] = useState<NormalizedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Real audio state (mapped to mock UI variables for backward compatibility)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mockProgress, setMockProgress] = useState<number>(0);
  const [mockDuration, setMockDuration] = useState<number>(0);
  const [mockCurrentTime, setMockCurrentTime] = useState<number>(0);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [result, setResult] = useState<ListeningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<Date>(new Date());

  const currentSection = sections[currentSectionIndex] || null;

  const initAudio = (src: string) => {
    if (typeof window === "undefined") return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    let fullSrc = src;
    const lowerSrc = src.toLowerCase();
    if (lowerSrc.startsWith("/audio/tasks/") || lowerSrc.startsWith("/audio/tasks/")) {
      const projectRef = "kaoybbpezkkmufzbhxru";
      const fileName = src.substring("/audio/tasks/".length);
      fullSrc = `https://${projectRef}.supabase.co/storage/v1/object/public/audio/Tasks/${fileName}`;
    }

    const audio = new Audio(fullSrc);
    audioRef.current = audio;

    setIsPlaying(false);
    setMockProgress(0);
    setMockCurrentTime(0);

    audio.addEventListener("loadedmetadata", () => {
      setMockDuration(audio.duration || 0);
    });

    audio.addEventListener("timeupdate", () => {
      setMockCurrentTime(audio.currentTime);
      if (audio.duration) {
        setMockProgress((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
    });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Load list of tests from listening_tasks
  const loadTestList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("listening_tasks")
        .select("*")
        .order("lesson_id", { ascending: true });

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        const sectionsData = data.map((row: any) => {
          const questions = (row.challenges || []).map((q: any, i: number) => ({
            id: q.id || `lq_${row.lesson_id}_${i}`,
            type: q.type || "fill",
            text: q.text || "",
            options: q.options || [],
            correct_answer: q.answer || "",
            answers: q.answers || (q.answer ? [q.answer] : []),
          }));

          return {
            section: row.lesson_id,
            title: row.lesson_name,
            audio_src: row.audio_src,
            audio_description: row.metadata?.topic || "",
            questions: questions
          };
        });

        const singleTest = {
          id: "a1b2c3d4-0002-0002-0002-000000000002",
          test_id: "a1b2c3d4-0002-0002-0002-000000000002",
          test_name: "IELTS Listening Practice Test",
          volume: "Standard",
          test_number: 1,
          has_audio: true,
          is_visible: true,
          sections: sectionsData
        };

        setTestList([singleTest]);
      } else {
        setTestList([]);
      }
    } catch (err: any) {
      console.error("Error loading test list:", err);
      setError(err.message || "Failed to load test list");
    } finally {
      setIsLoading(false);
    }
  };

  // Select test
  const selectTest = async (testId: string) => {
    setIsLoading(true);
    setError(null);
    setShowResult(false);
    setResult(null);
    setAnswers({});
    setIsPlaying(false);
    setMockProgress(0);
    setMockCurrentTime(0);
    startedAtRef.current = new Date();
    
    try {
      const { data, error: fetchErr } = await supabase
        .from("listening_tasks")
        .select("*")
        .order("lesson_id", { ascending: true });

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        const sectionsData = data.map((row: any) => {
          const questions = (row.challenges || []).map((q: any, i: number) => ({
            id: q.id || `lq_${row.lesson_id}_${i}`,
            type: q.type || "fill",
            text: q.text || "",
            options: q.options || [],
            correct_answer: q.answer || "",
            answers: q.answers || (q.answer ? [q.answer] : []),
          }));

          return {
            section: row.lesson_id,
            title: row.lesson_name,
            audio_src: row.audio_src,
            audio_description: row.metadata?.topic || "",
            questions: questions
          };
        });

        const singleTest = {
          id: "a1b2c3d4-0002-0002-0002-000000000002",
          test_id: "a1b2c3d4-0002-0002-0002-000000000002",
          test_name: "IELTS Listening Practice Test",
          volume: "Standard",
          test_number: 1,
          has_audio: true,
          is_visible: true,
          sections: sectionsData
        };

        setSelectedTest(singleTest);
        const normalized = normalizeListeningTest(singleTest);
        setSections(normalized);
        setCurrentSectionIndex(0);

        if (sectionsData[0]?.audio_src) {
          initAudio(sectionsData[0].audio_src);
        }
      }
    } catch (err: any) {
      console.error("Error selecting listening test:", err);
      setError(err.message || "Failed to load test data");
    } finally {
      setIsLoading(false);
    }
  };

  // Seek
  const seekTo = (percent: number): number => {
    if (!audioRef.current || !audioRef.current.duration) return 0;
    const time = (percent / 100) * audioRef.current.duration;
    audioRef.current.currentTime = time;
    setMockCurrentTime(time);
    setMockProgress(percent);
    return time;
  };

  // Audio Play controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  // Section Navigation
  const goToSection = (index: number) => {
    if (index >= 0 && index < sections.length) {
      setCurrentSectionIndex(index);
      const targetSection = selectedTest?.sections?.[index];
      if (targetSection && targetSection.audio_src) {
        initAudio(targetSection.audio_src);
      }
    }
  };

  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIdx);
      const targetSection = selectedTest?.sections?.[nextIdx];
      if (targetSection && targetSection.audio_src) {
        initAudio(targetSection.audio_src);
      }
    }
  };

  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevIdx = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIdx);
      const targetSection = selectedTest?.sections?.[prevIdx];
      if (targetSection && targetSection.audio_src) {
        initAudio(targetSection.audio_src);
      }
    }
  };

  // Set answers
  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit
  const submitTest = async () => {
    if (!selectedTest) return;
    setIsSubmitting(true);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    try {
      const graded = gradeListeningTest(sections, answers);
      setResult(graded);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userId = session.user.id;
        const submissionId = typeof window !== "undefined" && window.crypto?.randomUUID 
          ? window.crypto.randomUUID() 
          : "00000000-0000-0000-0000-" + Math.random().toString(16).substring(2, 14).padEnd(12, '0');

        const res = await fetch("/api/listening/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token || ""}`
          },
          body: JSON.stringify({
            submissionId,
            examId: selectedTest.id,
            score: graded.bandScore,
            answers: {
              userAnswers: graded.answers,
              correctAnswers: graded.correctAnswers,
              rawScore: graded.score,
              totalQuestions: graded.totalQuestions,
              sectionResults: graded.sectionResults,
            },
            startedAt: startedAtRef.current.toISOString(),
            completedAt: new Date().toISOString(),
            testId: selectedTest.test_id,
            testName: selectedTest.test_name,
            totalQuestions: graded.totalQuestions,
            rawScore: graded.score,
            sectionResults: graded.sectionResults
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Không thể lưu kết quả bài làm vào hệ thống.");
        }
      } else {
        console.log("Guest session: skipping database submission save.");
      }

      setShowResult(true);
    } catch (err: any) {
      console.error("Error during listening test submission process:", err);
      alert(err.message || "An error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setShowResult(false);
    setResult(null);
    setMockCurrentTime(0);
    setMockProgress(0);
    setIsPlaying(false);
    setCurrentSectionIndex(0);
    startedAtRef.current = new Date();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };


  return (
    <ListeningTestContext.Provider
      value={{
        testList,
        selectedTest,
        sections,
        currentSectionIndex,
        currentSection,
        answers,
        isPlaying,
        mockProgress,
        mockDuration,
        mockCurrentTime,
        isLoading,
        isSubmitting,
        showResult,
        result,
        error,
        loadTestList,
        selectTest,
        goToSection,
        goToNextSection,
        goToPrevSection,
        setAnswer,
        togglePlay,
        seekTo,
        submitTest,
        resetTest
      }}
    >
      {children}
    </ListeningTestContext.Provider>
  );
}

export function useListeningTest() {
  const context = useContext(ListeningTestContext);
  if (!context) {
    throw new Error("useListeningTest must be used within a ListeningTestProvider");
  }
  return context;
}
