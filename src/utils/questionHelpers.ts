export interface NormalizedListeningQuestion {
  id: string;
  globalOrder: number;        // số thứ tự liên tục toàn bài (1–40)
  sectionOrder: number;       // số thứ tự trong section
  type: "fill" | "mcq";
  text: string;
  options: { key: string; text: string }[];   // [] nếu fill
  correctAnswer: string;      // "B" cho MCQ
  acceptedAnswers: string[];  // ["answer1", "answer2"] cho fill (lowercase)
}

export const parseOptions = (options: any): { key: string; text: string }[] => {
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt: any, index: number) => {
    if (typeof opt === "string") {
      const dotIndex = opt.indexOf(".");
      if (dotIndex !== -1) {
        const key = opt.substring(0, dotIndex).trim();
        const text = opt.substring(dotIndex + 1).trim();
        return { key, text };
      }
      const key = String.fromCharCode(65 + index); // A, B, C...
      return { key, text: opt };
    }
    return opt;
  });
};

export const normalizeQuestionType = (type: string): "fill" | "mcq" => {
  const t = (type || "").toLowerCase();
  if (t === "fill_in_blank" || t === "fill") return "fill";
  return "mcq";
};

export const normalizeListeningQuestion = (
  q: any,
  globalOrder: number,
  sectionOrder: number
): NormalizedListeningQuestion => ({
  id: q.id ?? `lq_${globalOrder}`,
  globalOrder,
  sectionOrder,
  type: normalizeQuestionType(q.type),
  text: q.text ?? q.question_text ?? q.statement ?? "",
  options: parseOptions(q.options),
  correctAnswer: q.correct_answer ?? "",
  acceptedAnswers: Array.isArray(q.answers)
    ? q.answers.map((a: string) => a.toLowerCase().trim())
    : [q.correct_answer?.toLowerCase().trim() ?? ""],
});

export interface NormalizedSection {
  sectionNumber: number;
  title: string;
  audioDescription: string;     // transcript giả
  questions: NormalizedListeningQuestion[];
  questionRange: { from: number; to: number };  // VD: { from: 1, to: 5 }
  imageUrl?: string;
}

export const normalizeListeningTest = (test: any): NormalizedSection[] => {
  let globalOrder = 1;
  return (test.sections || [])
    .filter((s: any) => s.questions?.length > 0)
    .map((s: any) => {
      const from = globalOrder;
      const questions = s.questions.map((q: any, i: number) =>
        normalizeListeningQuestion(q, globalOrder++, i + 1)
      );
      return {
        sectionNumber: s.section,
        title: s.title,
        audioDescription: s.audio_description ?? "",
        questions,
        questionRange: { from, to: globalOrder - 1 },
        imageUrl: s.image_url ?? "",
      };
    });
};
