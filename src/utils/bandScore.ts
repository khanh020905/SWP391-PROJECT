// Extracts the overall band score from an AI writing evaluation (markdown).
// Models decorate the heading unpredictably (bold marks, Vietnamese phrasing,
// "Band Score là 6.5"…), so matching must be lenient. If the heading can't be
// parsed at all, fall back to averaging the four criteria bands using official
// IELTS rounding (nearest 0.5, halves round up).
export function extractBandScore(markdown: string): number {
  if (!markdown) return 0;
  // Strip markdown emphasis so "**6.5**" or "_6.5_" still parses
  const text = markdown.replace(/[*_`~]/g, "");

  const direct = text.match(/Overall Band(?:\s*Score)?[^\d\n]{0,40}(\d(?:[.,]\d)?)/i);
  if (direct) {
    const band = parseFloat(direct[1].replace(",", "."));
    if (band >= 1 && band <= 9) return band;
  }

  const criteria = [
    /Task\s+(?:Achievement|Response)[^\n\d]{0,60}(\d(?:[.,]\d)?)/i,
    /Coherence[^\n\d]{0,60}(\d(?:[.,]\d)?)/i,
    /Lexical\s+Resource[^\n\d]{0,60}(\d(?:[.,]\d)?)/i,
    /Grammatical\s+Range[^\n\d]{0,60}(\d(?:[.,]\d)?)/i,
  ];
  const scores: number[] = [];
  for (const re of criteria) {
    const m = text.match(re);
    if (!m) continue;
    const v = parseFloat(m[1].replace(",", "."));
    if (v >= 1 && v <= 9) scores.push(v);
  }
  if (scores.length === criteria.length) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 2) / 2;
  }

  return 0;
}
