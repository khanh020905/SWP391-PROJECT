"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  normalizeListeningTest,
  NormalizedSection,
  NormalizedListeningQuestion
} from "@/utils/questionHelpers";

function findQuestionTextForSection(content: string | null, qNo: number): string {
  if (!content) return `(${qNo})`;

  // Replace ellipses or dots or underscores with a standard blank
  const normalizedContent = content.replace(/(?:…+|\.{3,}|_{2,})/g, "________");
  const lines = normalizedContent.split("\n");

  // Find a line that contains the exact pattern (qNo)
  const targetPattern = new RegExp(`\\(${qNo}\\)`);
  let targetLine = lines.find(line => targetPattern.test(line));

  if (!targetLine) {
    // Fallback: try to find just the number with word boundary or attached to text
    const fallbackPattern = new RegExp(`(?:\\b|\\d)${qNo}(?:\\b|\\s|_)`);
    targetLine = lines.find(line => fallbackPattern.test(line));
  }

  if (!targetLine) {
    return `(${qNo})`;
  }

  const line = targetLine.trim();

  // Regex to match any digit followed by optional currency symbol and underscores
  const qPattern = /(\d+)\s*[$£€¥]?\s*(?:_{2,})/g;
  let matches: { qNo: number; index: number; length: number }[] = [];
  let match;
  while ((match = qPattern.exec(line)) !== null) {
    matches.push({
      qNo: parseInt(match[1]),
      index: match.index,
      length: match[0].length
    });
  }

  const targetIndex = matches.findIndex(m => m.qNo === qNo);
  if (targetIndex === -1) {
    // If it's not a fill-in-the-blank on a shared line, do some basic cleanup
    let cleanedLine = line;
    const otherQPattern = /\((\d+)\)\s*_{2,}/g;
    cleanedLine = cleanedLine.replace(otherQPattern, (m, otherQStr) => {
      const otherQ = parseInt(otherQStr);
      return otherQ === qNo ? m : `(${otherQ})`;
    });
    return cleanedLine;
  }

  const startPos = targetIndex === 0 ? 0 : matches[targetIndex - 1].index + matches[targetIndex - 1].length;
  const endPos = targetIndex === matches.length - 1 ? line.length : matches[targetIndex + 1].index;

  let untrimmedSegment = line.substring(startPos, endPos);
  
  if (targetIndex === 0) {
    // Keep the prefix context for the first question in the line
    return untrimmedSegment.trim();
  }

  let relativeIndex = matches[targetIndex].index - startPos;
  let mainPart = untrimmedSegment.substring(relativeIndex);

  return mainPart.trim();
}

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
    if (!src || src === "null" || src === "undefined") return;
    
    let fullSrc = src;
    const lowerSrc = src.toLowerCase();
    if (lowerSrc.startsWith("/audio/tasks/")) {
      const projectRef = "kaoybbpezkkmufzbhxru";
      const fileName = src.substring("/audio/tasks/".length);
      fullSrc = `https://${projectRef}.supabase.co/storage/v1/object/public/audio/Tasks/${fileName}`;
    }

    // Reuse audio element if it's already playing the same source
    if (audioRef.current && (audioRef.current.src === fullSrc || audioRef.current.src === window.location.origin + fullSrc)) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
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
      if (testId === "a1b2c3d4-0002-0002-0002-000000000002") {
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
      } else {
        // Load real listening test from database
        const { data: exam, error: examErr } = await supabase
          .from("exams")
          .select("*")
          .eq("id", testId)
          .single();

        if (examErr || !exam) {
          throw new Error(examErr?.message || "Exam not found");
        }

        const { data: dbSections, error: sectionsErr } = await supabase
          .from("exam_sections")
          .select("*")
          .eq("exam_id", testId)
          .order("section_no", { ascending: true });

        if (sectionsErr) {
          throw new Error(sectionsErr.message);
        }

        if (dbSections && dbSections.length > 0) {
          const sectionsData = dbSections.map((row: any) => {
            const answersObj = row.answers || {};
            // Filter out non-numeric keys (like audio_url and image_url) to avoid mapping them as questions
            const questionKeys = Object.keys(answersObj).filter((key) => !isNaN(Number(key)));
            const sortedKeys = questionKeys.sort((a, b) => parseInt(a) - parseInt(b));
            const questions = sortedKeys.map((key) => {
              const correctAns = answersObj[key];
              const qNo = parseInt(key);
              const qText = findQuestionTextForSection(row.content, qNo);
              return {
                id: `q_${testId}_${row.section_no}_${key}`,
                type: "fill",
                text: qText,
                options: [],
                correct_answer: correctAns,
                answers: [correctAns],
              };
            });

            const rawAudioSrc = answersObj.audio_url || exam.audio_url || "";
            const audioSrc = (rawAudioSrc === "null" || rawAudioSrc === "undefined" || !rawAudioSrc) ? "" : rawAudioSrc;

            return {
              section: row.section_no,
              title: row.title || `Section ${row.section_no}`,
              audio_src: audioSrc || exam.audio_url || "",
              audio_description: row.content || "",
              questions: questions,
              image_url: answersObj.image_url || "",
            };
          });

          const hasAudio = !!exam.audio_url || sectionsData.some(s => s.audio_src);
          const realTest = {
            id: exam.id,
            test_id: exam.id,
            test_name: exam.title,
            volume: exam.cambridge_no ? `Cambridge ${exam.cambridge_no}` : "Standard",
            test_number: exam.test_no || 1,
            has_audio: hasAudio,
            is_visible: true,
            sections: sectionsData
          };

          setSelectedTest(realTest);
          const normalized = normalizeListeningTest(realTest);
          setSections(normalized);
          setCurrentSectionIndex(0);

          const firstAudio = exam.audio_url || sectionsData.find(s => s.audio_src)?.audio_src;
          if (firstAudio && firstAudio !== "null" && firstAudio !== "undefined") {
            initAudio(firstAudio);
          }
        } else {
          throw new Error("No sections found for this listening exam");
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

      let session = null;
      try {
        const sessionRes = await supabase.auth.getSession();
        session = sessionRes.data.session;
      } catch (e) {
        console.warn("[Listening Submit] Failed to retrieve Supabase session:", e);
      }
      
      if (session?.user) {
        try {
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
      } catch (dbErr) {
        console.error("Error saving listening progress to database:", dbErr);
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
