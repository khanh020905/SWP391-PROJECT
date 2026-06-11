export type WritingTaskType = "task1" | "task2";

export type WritingUserRole = "GUEST" | "STUDENT" | "ADMIN" | "UNKNOWN";

export interface WritingTask {
  id: WritingTaskType;
  label: string;
  title: string;
  subtitle: string;
  recommendedMinutes: number;
  minimumWords: number;
  prompt: string;
  bullets?: string[];
  visualTitle?: string;
  visualDescription?: string;
  dataPoints?: {
    label: string;
    values: {
      name: string;
      value: number;
      suffix?: string;
    }[];
  }[];
  assessmentFocus: string[];
}

export interface WritingTestMeta {
  id: string;
  testTitle: string;
  module: "Academic" | "General Training";
  durationMinutes: number;
  totalTasks: number;
}

export interface WritingPersistedState {
  answers: Record<WritingTaskType, string>;
  activeTaskId: WritingTaskType;
  timeRemaining: number;
  savedAt: string;
}

export interface WritingAttemptPayload {
  id: string;
  testId: string;
  answers: Record<WritingTaskType, string>;
  wordCounts: Record<WritingTaskType, number>;
  timeRemaining: number;
  submittedAt: string;
  userName?: string | null;
  feedback?: WritingFeedbackResult;
}

export interface WritingTaskFeedback {
  taskId: WritingTaskType;
  wordCount: number;
  estimatedBand: number;
  strengths: string[];
  improvements: string[];
  criteria?: {
    ta_tr: { score: number; explanationVi: string };
    cc: { score: number; explanationVi: string };
    lr: { score: number; explanationVi: string };
    gra: { score: number; explanationVi: string };
  };
  grammarCorrections?: {
    original: string;
    correction: string;
    reasonVi: string;
    context?: string;
  }[];
  modelAnswer?: string;
}


export interface WritingFeedbackResult {
  attemptId: string;
  estimatedBand: number;
  taskFeedback: WritingTaskFeedback[];
  overallFeedbackVi: string;
  gradedAt: string;
}
