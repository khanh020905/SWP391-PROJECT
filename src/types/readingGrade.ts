export interface ReadingQuestionGrade {
  questionId: number;
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  explanationVi: string;
  tipVi?: string;
}

export interface ReadingGradeResult {
  attemptId: string;
  rawScore: number;
  totalQuestions: number;
  bandScore: number;
  overallFeedbackVi: string;
  strengths: string[];
  improvements: string[];
  questionResults: ReadingQuestionGrade[];
  gradedAt: string;
}

export interface ReadingAttemptPayload {
  id: string;
  testId: string;
  answers: Record<string, string>;
  flagged: number[];
  timeRemaining: number;
  submittedAt: string;
  answeredCount: number;
  totalQuestions: number;
  userName?: string | null;
  grade?: ReadingGradeResult;
  status?: "pending" | "graded" | "error";
}
