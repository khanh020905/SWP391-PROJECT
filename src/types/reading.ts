export type QuestionType = "mcq" | "tfng" | "matching" | "fill";

export type TfngOption = "TRUE" | "FALSE" | "NOT GIVEN";

export interface PassageParagraph {
  id: string;
  label: string;
  text: string;
}

export interface McqOption {
  key: string;
  text: string;
}

export interface BaseQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
  instruction?: string;
}

export interface McqQuestion extends BaseQuestion {
  type: "mcq";
  options: McqOption[];
}

export interface TfngQuestion extends BaseQuestion {
  type: "tfng";
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  paragraphRef: string;
  headings: string[];
}

export interface FillQuestion extends BaseQuestion {
  type: "fill";
  placeholder?: string;
  maxWords?: number;
}

export type ReadingQuestion =
  | McqQuestion
  | TfngQuestion
  | MatchingQuestion
  | FillQuestion;

export interface ReadingPassage {
  id: string;
  sectionLabel: string;
  title: string;
  subtitle: string;
  paragraphs: PassageParagraph[];
  questions: ReadingQuestion[];
}

export interface ReadingTestMeta {
  id: string;
  testTitle: string;
  cambridge: string;
  durationMinutes: number;
}

export type UserRole = "GUEST" | "STUDENT" | "ADMIN" | "UNKNOWN";

export type MobileTab = "passage" | "questions";

export interface ReadingPersistedState {
  answers: Record<string, string>;
  flagged: number[];
  currentQuestionId: number;
  timeRemaining: number;
  savedAt: string;
}
