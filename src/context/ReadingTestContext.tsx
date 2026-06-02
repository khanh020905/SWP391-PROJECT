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
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
  const passages = ALL_PASSAGES;

  const [activePassageIndex, setActivePassageIndexState] = useState(0);
  const passage = passages[activePassageIndex];

  const allQuestionIds = useMemo(
    () => passages.flatMap((p) => p.questions.map((q) => q.id)),
    [passages]
  );

  const questionIds = useMemo(
    () => passage.questions.map((q) => q.id),
    [passage.questions]
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
    // Set currentQuestionId to first question of the new passage
    const firstQId = passages[index]?.questions[0]?.id;
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

    const skeletonTimer = setTimeout(() => setIsLoading(false), 700);

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
    });

    return () => clearTimeout(skeletonTimer);
  }, []);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
        const ids = p.questions.map((q) => q.id);
        return {
          answered: ids.filter((id) => Boolean(answers[String(id)]?.trim())).length,
          total: ids.length,
        };
      }),
    [answers, passages]
  );

  const value: ReadingTestContextValue = {
    meta: READING_TEST_META,
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
