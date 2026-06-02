/** Official answer key for mock Reading Passage 1 */
export const READING_ANSWER_KEY: Record<number, string> = {
  1: "TRUE",
  2: "FALSE",
  3: "TRUE",
  4: "NOT GIVEN",
  5: "B",
  6: "D",
  7: "B",
  8: "ii. Historical separation of farms and cities",
  9: "iii. Community benefits of shared growing spaces",
  10: "iv. Future technological developments",
  11: "LED lighting",
  12: "diseases",
  13: "zoning",
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

  // MCQ: accept just letter
  if (/^[a-d]$/i.test(u) && c.startsWith(u)) return true;

  // Matching: accept roman numeral prefix
  const romanUser = u.match(/^([ivx]+)/)?.[1];
  const romanCorrect = c.match(/^([ivx]+)/)?.[1];
  if (romanUser && romanCorrect && romanUser === romanCorrect) return true;

  // Fill: partial match
  if (questionId >= 11) {
    return c.includes(u) || u.includes(c);
  }

  return false;
}
