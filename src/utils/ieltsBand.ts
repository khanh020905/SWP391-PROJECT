export function scoreToIeltsBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 20) return 5.5;
  if (correct >= 16) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 7) return 3.5;
  if (correct >= 5) return 3.0;
  if (correct >= 3) return 2.5;
  if (correct >= 2) return 2.0;
  if (correct >= 1) return 1.5;
  return 1.0;
}
