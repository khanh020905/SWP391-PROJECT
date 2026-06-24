export const READING_ANSWER_KEY: Record<number, string> = {
  1: "FALSE",
  2: "TRUE",
  3: "NOT GIVEN",
  4: "FALSE",
  5: "TRUE",
  6: "FALSE",
  7: "TRUE",
  8: "C",
  9: "C",
  10: "B",
  11: "A",
  12: "D",
  13: "C",
  14: "C",
  15: "A",
  16: "B",
  17: "B",
  18: "C",
  19: "A",
  20: "C",
  21: "B",
  22: "A",
  23: "brain dead",
  24: "sociopathic behaviour",
  25: "neocortex",
  26: "animal propensities",
  27: "C",
  28: "D",
  29: "B",
  30: "E",
  31: "A",
  32: "YES",
  33: "NOT GIVEN",
  34: "NOT GIVEN",
  35: "NO",
  36: "prudent practice",
  37: "privatisation policy",
  38: "incentives",
  39: "permit",
  40: "regulatory agency",
};

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkAnswer(questionId: number, userAnswer: string): boolean {
  const correct = READING_ANSWER_KEY[questionId];
  if (!correct || !userAnswer?.trim()) return false;

  const u = normalizeAnswer(userAnswer);
  const c = normalizeAnswer(correct);

  if (u === c) return true;

  // Single letter answers (like MCQs or matching paragraphs A-F)
  if (/^[a-f]$/i.test(c)) {
    return u === c || u.startsWith(c + " ") || u.startsWith(c + ".");
  }

  // Standarized Yes/No/True/False/Not Given
  const stdAnswers = ["true", "false", "not given", "yes", "no"];
  if (stdAnswers.includes(c)) {
    return u === c;
  }

  // Fill in the blanks: allow substring match to make typing issues more lenient
  return c.includes(u) || u.includes(c);
}
