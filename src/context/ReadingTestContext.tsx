"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { fetchReadingPassages } from "@/services/readingService";
import {
  ALL_PASSAGES,
  READING_TEST_META,
  STORAGE_KEY,
} from "@/lib/readingMockData";
import { saveReadingAttempt } from "@/lib/readingStorage";
import type { ReadingAttemptPayload } from "@/types/readingGrade";
import type {
  MobileTab,
  ReadingPassage,
  ReadingPersistedState,
  ReadingTestMeta,
  UserRole,
} from "@/types/reading";

const INITIAL_SECONDS = READING_TEST_META.durationMinutes * 60;

interface ReadingTestContextValue {
  meta: ReadingTestMeta;
  passages: ReadingPassage[];
  passage: ReadingPassage;
  activePassageIndex: number;
  setActivePassageIndex: (index: number) => void;
  answers: Record<string, string>;
  flagged: Set<number>;
  currentQuestionId: number;
  timeRemaining: number;
  mobileTab: MobileTab;
  isReviewOpen: boolean;
  isLoading: boolean;
  userRole: UserRole;
  userName: string | null;
  isTimerLow: boolean;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  passageProgress: { answered: number; total: number }[];
  setAnswer: (questionId: number, value: string) => void;
  toggleFlag: (questionId: number) => void;
  setCurrentQuestionId: (id: number) => void;
  setMobileTab: (tab: MobileTab) => void;
  setReviewOpen: (open: boolean) => void;
  goToQuestion: (id: number) => void;
  goPrevious: () => void;
  goNext: () => void;
  submitTest: () => void;
  isSubmitting: boolean;
  registerQuestionRef: (id: number, el: HTMLElement | null) => void;
}

const ReadingTestContext = createContext<ReadingTestContextValue | null>(null);

function loadPersisted(): Partial<ReadingPersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingPersistedState;
  } catch {
    return null;
  }
}

function resolveRole(metadata: Record<string, unknown> | undefined): UserRole {
  const role = metadata?.role;
  if (role === "ADMIN" || role === "STUDENT" || role === "GUEST") return role;
  return "GUEST";
}

export function ReadingTestProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string | undefined;
  
  const [passages, setPassages] = useState<any[]>([]);
  const [meta, setMeta] = useState<ReadingTestMeta>(READING_TEST_META);
  const [activePassageIndex, setActivePassageIndexState] = useState(0);
  const passage = passages[activePassageIndex] || { title: "", sectionLabel: "", paragraphs: [], questions: [] };

  const allQuestionIds = useMemo(
    () => passages.flatMap((p) => p.questions?.map((q: any) => q.id) || []),
    [passages]
  );

  const questionIds = useMemo(
    () => passage?.questions?.map((q: any) => q.id) || [],
    [passage]
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_SECONDS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("passage");
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("UNKNOWN");
  const [userName, setUserName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const timerStarted = useRef(false);

  const setActivePassageIndex = useCallback((index: number) => {
    setActivePassageIndexState(index);
    const firstQId = passages[index]?.questions?.[0]?.id;
    if (firstQId !== undefined) {
      setCurrentQuestionId(firstQId);
    }
    setMobileTab("passage");
  }, [passages]);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      if (persisted.answers) setAnswers(persisted.answers);
      if (persisted.flagged) setFlagged(new Set(persisted.flagged));
      if (persisted.currentQuestionId) setCurrentQuestionId(persisted.currentQuestionId);
      if (typeof persisted.timeRemaining === "number") {
        setTimeRemaining(persisted.timeRemaining);
      }
    }

    const loadExamData = async () => {
      try {
        if (examId) {
          const res = await fetch(`/api/reading/exams/${examId}`);
          if (!res.ok) {
            throw new Error("Failed to fetch exam data");
          }
          const { meta: examData, sections: sectionsData, questions: questionsData } = await res.json();

          setMeta({
            id: examData.id,
            testTitle: examData.title,
            cambridge: `Test ${examData.test_no || 1}`,
            durationMinutes: examData.duration_minutes || 60,
          });

          setTimeRemaining((examData.duration_minutes || 60) * 60);

          if (sectionsData && sectionsData.length > 0) {
            let runningQId = 1;
            const mappedPassages = sectionsData.map((sec: any) => {
              const secQuestions = (questionsData || [])
                .filter((q: any) => q.section === sec.section_no)
                .map((q: any) => {
                  const rawType = (q.question_type || "").toLowerCase();
                  let type = "tfng";
                  let defaultInstruction = "Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE, or NOT GIVEN.";
                  
                  if (rawType.includes("true_false") || rawType.includes("tfng") || rawType.includes("y_n_ng") || rawType.includes("yes_no")) {
                    type = "tfng";
                    defaultInstruction = "Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE, or NOT GIVEN.";
                  } else if (rawType.includes("multiple_choice") || rawType.includes("mcq")) {
                    type = "mcq";
                    defaultInstruction = "Choose the correct letter, A, B, C or D.";
                  } else if (rawType.includes("short_answer") || rawType.includes("fill") || rawType.includes("blank")) {
                    type = "fill";
                    defaultInstruction = "Answer the question with NO MORE THAN TWO WORDS.";
                  } else if (rawType.includes("matching")) {
                    type = "matching";
                    defaultInstruction = "Choose the correct heading/option for each question.";
                  }

                  let options = q.options || [];
                  if (type === "mcq") {
                    options = (q.options || []).map((opt: any) => {
                      if (typeof opt === "string") {
                        const dotIndex = opt.indexOf(".");
                        if (dotIndex !== -1) {
                          return { key: opt.substring(0, dotIndex).trim(), text: opt.substring(dotIndex + 1).trim() };
                        }
                        return { key: opt.trim().charAt(0), text: opt };
                      }
                      return opt;
                    });
                  }

                  return {
                    id: runningQId++,
                    dbQuestionId: q.id,
                    type,
                    instruction: q.instruction || defaultInstruction,
                    prompt: q.text || "",
                    options,
                    placeholder: "Type your answer...",
                    maxWords: 2,
                    headings: type === "matching" ? (q.options || []) : []
                  };
                });

              // Split passage content into paragraphs properly
              const paragraphs = (sec.content || "")
                .split(/\n\s*\n/)
                .filter((txt: string) => txt.trim().length > 0)
                .map((txt: string, pIdx: number) => {
                  let label = "";
                  let cleanedText = txt.trim();
                  const match = cleanedText.match(/^([A-I])\s+/);
                  if (match) {
                    label = `Paragraph ${match[1]}`;
                    cleanedText = cleanedText.substring(match[0].length);
                  }
                  return {
                    id: `p-${sec.id}-${pIdx}`,
                    label,
                    text: cleanedText
                  };
                });

              return {
                id: sec.id,
                sectionLabel: `Reading Passage ${sec.section_no}`,
                title: sec.title || `Passage ${sec.section_no}`,
                subtitle: `You should spend about 20 minutes on Questions, which are based on Reading Passage ${sec.section_no} below.`,
                paragraphs,
                questions: secQuestions
              };
            });

            setPassages(mappedPassages);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: load default passages
        const data = await fetchReadingPassages();
        const validData = data ? data.filter(p => p.questions && p.questions.length > 0) : [];
        if (validData.length > 0) {
          // Rule 1: Always filter test questions/passages to only match the target exam prefix (e.g., bc-passage- for British Council Test 1)
          // and sort them alphabetically (e.g., bc-passage-1, bc-passage-2, bc-passage-3) to maintain the exact sequence of the PDF.
          const filteredData = validData.filter((p: any) => p.youpass_id && p.youpass_id.startsWith("bc-passage-"));
          filteredData.sort((a: any, b: any) => a.youpass_id.localeCompare(b.youpass_id));
          
          let runningQId = 1;
          const mappedPassages = filteredData.map((p, pIdx) => {
            const sectionLabel = p.sectionLabel || `Reading Passage ${pIdx + 1}`;
            const paragraphs = p.paragraphs || (p.content_html ? [{ id: `p-${pIdx}-1`, label: "", text: p.content_html.replace(/<[^>]*>/g, '') }] : []);
            
            const questions = (p.questions || []).map((q: any) => {
              const rawType = q.type || "";
              let type = "tfng";
              let defaultInstruction = "Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE, or NOT GIVEN.";
              
              if (rawType === "true_false_not_given" || rawType === "tfng") {
                type = "tfng";
                defaultInstruction = "Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE, or NOT GIVEN.";
              } else if (rawType === "multiple_choice" || rawType === "mcq") {
                type = "mcq";
                defaultInstruction = "Choose the correct letter, A, B, C or D.";
              } else if (rawType === "short_answer" || rawType === "fill") {
                type = "fill";
                defaultInstruction = "Answer the question with NO MORE THAN TWO WORDS.";
              } else if (rawType === "matching") {
                type = "matching";
                defaultInstruction = "Choose the correct heading for each section.";
              }

              const prompt = q.statement || q.text || q.prompt || q.question_text || "";
              
              let options = q.options || [];
              if (type === "mcq") {
                options = (q.options || []).map((opt: any) => {
                  if (typeof opt === "string") {
                    const dotIndex = opt.indexOf(".");
                    if (dotIndex !== -1) {
                      const key = opt.substring(0, dotIndex).trim();
                      const text = opt.substring(dotIndex + 1).trim();
                      return { key, text };
                    }
                    return { key: opt.trim().charAt(0), text: opt };
                  }
                  return opt;
                });
              }

              return {
                id: runningQId++,
                type,
                instruction: q.instruction || defaultInstruction,
                prompt,
                options,
                placeholder: q.placeholder || "Type your answer...",
                maxWords: q.maxWords || 2,
                headings: q.headings || []
              };
            });

            return {
              id: p.id,
              sectionLabel,
              title: p.title,
              subtitle: p.subtitle || `You should spend about 20 minutes on Questions, which are based on Reading Passage ${pIdx + 1} below.`,
              paragraphs,
              questions
            };
          });
          setPassages(mappedPassages);
        } else {
          setPassages(ALL_PASSAGES);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading reading test data:", err);
        setPassages(ALL_PASSAGES);
        setIsLoading(false);
      }
    };

    loadExamData();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserRole(resolveRole(session.user.user_metadata));
        setUserName(
          (session.user.user_metadata?.name as string) ||
            session.user.email?.split("@")[0] ||
            null
        );
      } else {
        setUserRole("GUEST");
        setUserName(null);
      }
    }).catch((err) => {
      console.warn("Failed to retrieve reading test user session:", err);
      setUserRole("GUEST");
      setUserName(null);
    });
  }, [examId]);

  useEffect(() => {
    if (isLoading || timerStarted.current) return;
    timerStarted.current = true;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const payload: ReadingPersistedState = {
      answers,
      flagged: Array.from(flagged),
      currentQuestionId,
      timeRemaining,
      savedAt: new Date().toISOString(),
    };
  }, [answers, flagged, currentQuestionId, timeRemaining, isLoading]);

  const setAnswer = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
  }, []);

  const toggleFlag = useCallback((questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const registerQuestionRef = useCallback((id: number, el: HTMLElement | null) => {
    if (el) questionRefs.current.set(id, el);
    else questionRefs.current.delete(id);
  }, []);

  const scrollToQuestion = useCallback((id: number) => {
    setCurrentQuestionId(id);
    setMobileTab("questions");
    requestAnimationFrame(() => {
      const el = questionRefs.current.get(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const goToQuestion = scrollToQuestion;

  const goPrevious = useCallback(() => {
    const idx = questionIds.indexOf(currentQuestionId);
    if (idx > 0) scrollToQuestion(questionIds[idx - 1]);
  }, [currentQuestionId, questionIds, scrollToQuestion]);

  const goNext = useCallback(() => {
    const idx = questionIds.indexOf(currentQuestionId);
    if (idx < questionIds.length - 1) scrollToQuestion(questionIds[idx + 1]);
  }, [currentQuestionId, questionIds, scrollToQuestion]);

  const submitTest = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const attemptId = `reading_${Date.now()}`;
    const attempt: ReadingAttemptPayload = {
      id: attemptId,
      testId: READING_TEST_META.id,
      answers: { ...answers },
      flagged: Array.from(flagged),
      timeRemaining,
      submittedAt: new Date().toISOString(),
      answeredCount: allQuestionIds.filter((id) => Boolean(answers[String(id)]?.trim())).length,
      totalQuestions: allQuestionIds.length,
      userName,
      status: "pending",
    };

    saveReadingAttempt(attempt);
    localStorage.removeItem(STORAGE_KEY);
    router.push(`/reading/result?id=${attemptId}`);
  }, [answers, flagged, timeRemaining, allQuestionIds, userName, isSubmitting, router]);

  const answeredCount = useMemo(
    () => allQuestionIds.filter((id) => Boolean(answers[String(id)]?.trim())).length,
    [answers, allQuestionIds]
  );

  const passageProgress = useMemo(
    () =>
      passages.map((p) => {
        const ids = (p.questions || []).map((q: any) => q.id);
        return {
          answered: ids.filter((id: any) => Boolean(answers[String(id)]?.trim())).length,
          total: ids.length,
        };
      }),
    [answers, passages]
  );

  const value: ReadingTestContextValue = {
    meta,
    passages,
    passage,
    activePassageIndex,
    setActivePassageIndex,
    answers,
    flagged,
    currentQuestionId,
    timeRemaining,
    mobileTab,
    isReviewOpen,
    isLoading,
    userRole,
    userName,
    isTimerLow: timeRemaining <= 300,
    answeredCount,
    totalQuestions: allQuestionIds.length,
    progressPercent: Math.round((answeredCount / allQuestionIds.length) * 100),
    passageProgress,
    setAnswer,
    toggleFlag,
    setCurrentQuestionId,
    setMobileTab,
    setReviewOpen,
    goToQuestion,
    goPrevious,
    goNext,
    submitTest,
    isSubmitting,
    registerQuestionRef,
  };

  return (
    <ReadingTestContext.Provider value={value}>{children}</ReadingTestContext.Provider>
  );
}

export function useReadingTest() {
  const ctx = useContext(ReadingTestContext);
  if (!ctx) {
    throw new Error("useReadingTest must be used within ReadingTestProvider");
  }
  return ctx;
}
