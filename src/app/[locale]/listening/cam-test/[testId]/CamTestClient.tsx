"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import ListeningTest from "@/components/listening/ListeningTest";
import { matchesAnswerKey, expandAnswerKey } from "@/utils/answerMatch";
import { Headphones, BookOpen, ChevronRight } from "lucide-react";

// ─── Types (Input from API/JSON) ──────────────────────────────────────────────

interface Answer {
  number: number;
  answer: string;
}

interface BlockBase {
  heading?: string;
  instructions: string;
  answers: Answer[];
}

interface NoteCompletionBlock extends BlockBase {
  type: "note_completion" | "form_completion" | "sentence_completion";
  template: string;
}

interface TableCompletionBlock extends BlockBase {
  type: "table_completion";
  tableHeaders: string[];
  tableRows: string[][];
}

interface McQuestion {
  number: number;
  text: string;
  options: { label: string; text: string }[];
  answer: string;
}

interface MultipleChoiceBlock {
  type: "multiple_choice";
  heading?: string;
  instructions: string;
  questions: McQuestion[];
  answers?: never;
}

interface MultipleChoiceMultiBlock {
  type: "multiple_choice_multi";
  heading?: string;
  instructions: string;
  prompt: string;
  options: { label: string; text: string }[];
  questionNumbers: number[];
  answers: string[];
}

interface MatchingBlock {
  type: "matching";
  heading?: string;
  instructions: string;
  options: { label: string; text: string }[];
  questions: { number: number; text: string; answer: string }[];
  answers?: never;
}

interface TrueFalseBlock {
  type: "true_false_not_given" | "yes_no_not_given";
  heading?: string;
  instructions: string;
  questions: { number: number; text: string; answer: string }[];
  answers?: never;
}

interface SentenceCompletionOptionsBlock {
  type: "sentence_completion_options";
  heading?: string;
  instructions: string;
  options: { label: string; text: string }[];
  questions: { number: number; text: string; answer: string }[];
  answers?: never;
}

// Fallback for blocks already stored in normalised TidBlock format
interface NormalisedBlock {
  type: string;
  heading?: string;
  instructions?: string;
  content: any;
}

type QuestionBlock =
  | NoteCompletionBlock
  | TableCompletionBlock
  | MultipleChoiceBlock
  | MultipleChoiceMultiBlock
  | MatchingBlock
  | TrueFalseBlock
  | SentenceCompletionOptionsBlock
  | NormalisedBlock;

interface CamSection {
  sectionNumber: number;
  title: string;
  audioSrc: string;
  mapSrc?: string;
  questionRange: [number, number];
  blocks: QuestionBlock[];
  // Per-question review data managed in the admin editor (audio clip + transcript)
  questionSolutions?: Record<string, { audioStart: number; audioEnd: number; transcript?: string }>;
}

interface CamTestData {
  testId: string;
  testName: string;
  volume: number;
  testNumber: number;
  sections: CamSection[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const getIeltsListeningBand = (score: number): number => {
  if (score >= 37) return 9;
  if (score >= 35) return 8;
  if (score >= 30) return 7;
  if (score >= 23) return 6;
  if (score >= 16) return 5;
  if (score >= 10) return 4;
  if (score >= 6) return 3;
  if (score >= 2) return 2;
  return 1;
};

type PartSelection = "full" | 1 | 2 | 3 | 4;

export default function CamTestClient({ testData }: { testData: CamTestData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") as "practice" | "real_test") || "practice";
  // ?review=1 ("Xem Cùng Đề Bài" on the result page): open the paper with the
  // answer key pre-filled in every blank, submit disabled.
  const reviewMode = searchParams.get("review") === "1";
  // ?part=full|1..4 skips the part-picker
  const partParam = searchParams.get("part");
  const initialPart: PartSelection | null =
    mode === "real_test" || reviewMode || partParam === "full"
      ? "full"
      : partParam && ["1", "2", "3", "4"].includes(partParam)
      ? (Number(partParam) as 1 | 2 | 3 | 4)
      : null;
  const [selectedPart, setSelectedPart] = useState<PartSelection | null>(initialPart);

  const activeSections =
    !selectedPart || selectedPart === "full"
      ? testData.sections
      : testData.sections.filter((s) => s.sectionNumber === selectedPart);

  // Map the entire test data to the format expected by the new ListeningTest component
  const mappedTestData = {
    testId: testData.testId,
    testName: testData.testName,
    sections: activeSections.map(section => ({
      sectionNumber: section.sectionNumber,
      title: section.title,
      audioSrc: section.audioSrc,
      questionRange: section.questionRange,
      mapSrc: section.mapSrc,
      blocks: section.blocks.map((b: any, i: number) => {
        let content: any = {};

        // If already normalised (has a content wrapper), use as-is
        if (b.content !== undefined) {
          content = b.content;
        } else if (b.type === 'multiple_choice') {
          content = {
            questions: (b.questions || []).map((q: any) => ({
              qNum: q.number ?? q.qNum,
              text: q.text,
              options: (q.options || []).map((o: any) => typeof o === 'string' ? o : o.text),
              correctAnswer: q.answer ?? q.correctAnswer ?? ''
            }))
          };
        } else if (b.type === 'table_completion') {
          content = {
            tableHeaders: b.tableHeaders || [],
            tableRows: b.tableRows || [],
            correctAnswers: (b.answers || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.number]: curr.answer }), b.correctAnswers || {})
          };
        } else if (b.type === 'matching') {
          content = {
            items: (b.questions || []).map((q: any) => ({ qNum: q.number ?? q.qNum, text: q.text })),
            options: (b.options || []).map((o: any) => ({ id: o.label ?? o.id, text: o.text })),
            correctAnswers: (b.questions || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.number ?? curr.qNum]: curr.answer ?? curr.correctAnswer }), {})
          };
        } else if (b.type === 'multiple_choice_multi') {
          content = {
            qNum: (b.questionNumbers || [])[0] ?? b.qNum ?? 1,
            text: b.prompt ?? b.text ?? '',
            options: (b.options || []).map((o: any) => ({ id: o.label ?? o.id, text: o.text })),
            count: (b.questionNumbers || []).length || b.count || 2,
            correctAnswers: b.answers ?? b.correctAnswers ?? []
          };
        } else if (b.type === 'true_false_not_given' || b.type === 'yes_no_not_given' || b.type === 'sentence_completion_options') {
          content = {
            questions: (b.questions || []).map((q: any) => ({
              qNum: q.number ?? q.qNum,
              text: q.text,
              correctAnswer: q.answer ?? q.correctAnswer ?? ''
            })),
            options: b.options || []
          };
        } else {
          // note_completion, form_completion, sentence_completion, table_completion fallback
          content = {
            template: b.template ?? '',
            correctAnswers: (b.answers || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.number]: curr.answer }), b.correctAnswers || {})
          };
        }

        const rawInstruction = b.instruction ?? b.instructions ?? "";
        const lowerInstr = rawInstruction.toLowerCase();
        let prefix = "";
        if (!lowerInstr.includes("complete the")) {
          switch (b.type) {
            case 'note_completion': prefix = "Complete the notes below.\n"; break;
            case 'form_completion': prefix = "Complete the form below.\n"; break;
            case 'table_completion': prefix = "Complete the table below.\n"; break;
            case 'sentence_completion': prefix = "Complete the sentences below.\n"; break;
          }
        }
        
        return {
          id: `${section.sectionNumber}-${i}`,
          type: b.type === 'form_completion' || b.type === 'sentence_completion' ? 'note_completion' : b.type as any,
          heading: b.heading,
          instruction: prefix + rawInstruction,
          content
        };
      })
    }))
  };

  // A fill-in key is Cambridge notation ("after 11(:00)/eleven (o'clock)"), not a
  // literal answer — prefill the first accepted variant so review boxes grade green.
  // Letter answers (MC/matching/map) stay verbatim to keep option ids matching.
  const primaryAnswer = (key: string): string => {
    const k = String(key ?? "").trim();
    if (/^[A-Za-z]$/.test(k)) return k;
    const parts = k.split("+").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts.map((p) => expandAnswerKey(p)[0] ?? p).join(" + ");
    return expandAnswerKey(k)[0] ?? k;
  };

  // Answer key per question number, in the exact shape ListeningTest stores user
  // input: letters for MC/matching, "A,B" at the first qNum for choose-two,
  // primary key variant for fill-ins (multi-blank keys keep the " + " separator).
  const buildAnswerKeyMap = (): Record<number, string> => {
    const map: Record<number, string> = {};
    activeSections.forEach((section) => {
      section.blocks.forEach((block: any) => {
        const c = block.content;
        if (block.type === "multiple_choice") {
          const questions = block.questions || c?.questions || [];
          questions.forEach((q: any) => {
            const num = q.number ?? q.qNum;
            if (num) map[num] = String(q.answer ?? q.correctAnswer ?? "");
          });
        } else if (block.type === "multiple_choice_multi") {
          const questionNumbers: number[] =
            block.questionNumbers ||
            (c ? Array.from({ length: c.count || 2 }, (_, i) => (c.qNum ?? 1) + i) : []);
          const correctAnswers: string[] = block.answers ?? c?.correctAnswers ?? [];
          if (questionNumbers[0]) map[questionNumbers[0]] = correctAnswers.join(",");
        } else if (block.type === "matching") {
          const questions = block.questions || c?.items || [];
          const normalized: Record<string, string> = c?.correctAnswers || {};
          questions.forEach((q: any) => {
            const num = q.number ?? q.qNum;
            if (num) map[num] = String(q.answer ?? q.correctAnswer ?? normalized[num] ?? "");
          });
        } else if (block.answers) {
          block.answers.forEach((a: { number: number; answer: string }) => {
            map[a.number] = primaryAnswer(a.answer);
          });
        } else if (c?.correctAnswers) {
          Object.entries(c.correctAnswers as Record<string, string>).forEach(([numStr, ca]) => {
            map[Number(numStr)] = primaryAnswer(String(ca ?? ""));
          });
        }
      });
    });
    return map;
  };

  const handleSubmit = (userAnswers: Record<number, string>) => {
    let correct = 0;
    let skipped = 0;
    let total = 0;
    const questionResults: Array<{ number: number; userAnswer: string; correctAnswer: string; isCorrect: boolean }> = [];

    activeSections.forEach(section => {
      section.blocks.forEach((block: any) => {
        const c = block.content; // normalized format

        if (block.type === "multiple_choice") {
          // raw: block.questions[].{number, answer}  normalized: block.content.questions[].{qNum, correctAnswer}
          const questions = block.questions || c?.questions || [];
          questions.forEach((q: any) => {
            const num = q.number ?? q.qNum;
            total++;
            const ua = userAnswers[num]?.toUpperCase().trim() || "";
            const ca = (q.answer ?? q.correctAnswer ?? "").toUpperCase().trim();
            if (!ua) { skipped++; questionResults.push({ number: num, userAnswer: ua, correctAnswer: ca, isCorrect: false }); return; }
            const ok = ua === ca;
            if (ok) correct++;
            questionResults.push({ number: num, userAnswer: ua, correctAnswer: ca, isCorrect: ok });
          });
        } else if (block.type === "matching") {
          // raw: block.questions[].{number, answer}  normalized: block.content.items[].{qNum} + correctAnswers{}
          const questions = block.questions || c?.items || [];
          const normalizedAnswers: Record<string, string> = c?.correctAnswers || {};
          questions.forEach((q: any) => {
            const num = q.number ?? q.qNum;
            total++;
            const ua = userAnswers[num]?.toUpperCase().trim() || "";
            const ca = (q.answer ?? q.correctAnswer ?? normalizedAnswers[num] ?? "").toUpperCase().trim();
            if (!ua) { skipped++; questionResults.push({ number: num, userAnswer: ua, correctAnswer: ca, isCorrect: false }); return; }
            const ok = ua === ca;
            if (ok) correct++;
            questionResults.push({ number: num, userAnswer: ua, correctAnswer: ca, isCorrect: ok });
          });
        } else if (block.type === "multiple_choice_multi") {
          // raw: block.questionNumbers[], block.answers[]  normalized: block.content.{qNum, count, correctAnswers[]}
          const questionNumbers: number[] = block.questionNumbers || (c ? Array.from({ length: c.count || 2 }, (_, i) => (c.qNum ?? 1) + i) : []);
          const correctAnswers: string[] = block.answers ?? c?.correctAnswers ?? [];
          
          const firstQNum = questionNumbers[0];
          const rawUA = userAnswers[firstQNum] || "";
          // "Choose TWO" is graded as a SET (order-independent). Keep the user's picks in the
          // order they were stored — do NOT sort — so each slot shows the letter the user
          // actually chose. Sorting could display a correct pick under a different letter/slot.
          const userParts = rawUA ? rawUA.split(',').map((s: string) => s.toUpperCase().trim()).filter(Boolean) : [];
          const correctParts = correctAnswers.map((s: string) => s.toUpperCase().trim()).filter(Boolean);
          const correctSet = new Set(correctParts);
          const userSet = new Set(userParts);
          const hasAnswerKey = correctParts.length > 0;
          // Correct letters the user did NOT pick — surfaced as the "→ correct" hint on the
          // user's wrong/blank slots, so we never tell them the answer is a letter they already got.
          const missed = correctParts.filter((c2: string) => !userSet.has(c2));
          let missedIdx = 0;

          questionNumbers.forEach((num: number, i: number) => {
            total++;
            const thisUser = i < userParts.length ? userParts[i] : "";

            if (thisUser === "") {
              skipped++;
              const ca = missedIdx < missed.length ? missed[missedIdx++] : "";
              questionResults.push({ number: num, userAnswer: "", correctAnswer: ca, isCorrect: false });
              return;
            }

            const ok = hasAnswerKey && correctSet.has(thisUser);
            if (ok) {
              correct++;
              // Correct pick → keep the user's own letter as this slot's answer, so the result
              // shows e.g. "D ✓" instead of rewriting it to another correct letter.
              questionResults.push({ number: num, userAnswer: thisUser, correctAnswer: thisUser, isCorrect: true });
            } else {
              const ca = missedIdx < missed.length ? missed[missedIdx++] : "";
              questionResults.push({ number: num, userAnswer: thisUser, correctAnswer: ca, isCorrect: false });
            }
          });
        } else {
          // fill-in: raw: block.answers[].{number, answer}  normalized: block.content.correctAnswers{num: answer}
          if (block.answers) {
            block.answers.forEach((a: { number: number; answer: string }) => {
              total++;
              const ua = (userAnswers[a.number] || "").toLowerCase().trim();
              const ca = a.answer.toLowerCase().trim();
              if (!ua) { skipped++; questionResults.push({ number: a.number, userAnswer: ua, correctAnswer: ca, isCorrect: false }); return; }
              const ok = matchesAnswerKey(ua, ca);
              if (ok) correct++;
              questionResults.push({ number: a.number, userAnswer: ua, correctAnswer: ca, isCorrect: ok });
            });
          } else if (c?.correctAnswers) {
            Object.entries(c.correctAnswers as Record<string, string>).forEach(([numStr, ca]) => {
              const num = Number(numStr);
              total++;
              const ua = (userAnswers[num] || "").toLowerCase().trim();
              const caStr = (ca || "").toLowerCase().trim();
              if (!ua) { skipped++; questionResults.push({ number: num, userAnswer: ua, correctAnswer: caStr, isCorrect: false }); return; }
              const ok = matchesAnswerKey(ua, caStr);
              if (ok) correct++;
              questionResults.push({ number: num, userAnswer: ua, correctAnswer: caStr, isCorrect: ok });
            });
          }
        }
      });
    });

    questionResults.sort((a, b) => a.number - b.number);

    const wrong = total - correct - skipped;
    const band = getIeltsListeningBand(correct);

    localStorage.setItem("listening_cam_result", JSON.stringify({
      correctCount: correct,
      skipped,
      wrong,
      total,
      band,
      testId: testData.testId,
    }));
    localStorage.setItem("listening_cam_review", JSON.stringify(questionResults));


    router.push(`/listening/cam-test/${testData.testId}/result`);
  };

  if (!selectedPart) {
    const partLabels: Record<number, string> = { 1: "Q 1–10", 2: "Q 11–20", 3: "Q 21–30", 4: "Q 31–40" };
    const partColors = [
      { border: "border-amber-400", bg: "bg-amber-50", badge: "bg-amber-400", text: "text-amber-800", shadow: "shadow-[4px_4px_0_#f59e0b]" },
      { border: "border-sky-400",   bg: "bg-sky-50",   badge: "bg-sky-400",   text: "text-sky-800",   shadow: "shadow-[4px_4px_0_#38bdf8]" },
      { border: "border-rose-400",  bg: "bg-rose-50",  badge: "bg-rose-400",  text: "text-rose-800",  shadow: "shadow-[4px_4px_0_#fb7185]" },
      { border: "border-violet-400",bg: "bg-violet-50",badge: "bg-violet-400",text: "text-violet-800",shadow: "shadow-[4px_4px_0_#a78bfa]" },
    ];

    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Headphones className="w-4 h-4" />
              Luyện tập
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {testData.testName}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Chọn phần muốn luyện nghe
            </p>
          </div>

          {/* Part cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {testData.sections.map((section, idx) => {
              const c = partColors[idx % 4];
              return (
                <button
                  key={section.sectionNumber}
                  onClick={() => setSelectedPart(section.sectionNumber as 1 | 2 | 3 | 4)}
                  className={`group relative flex flex-col items-start p-5 rounded-2xl border-2 ${c.border} ${c.bg} ${c.shadow} hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,0.8)] transition-all duration-200 text-left cursor-pointer`}
                >
                  <span className={`${c.badge} text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3`}>
                    PART {section.sectionNumber}
                  </span>
                  <p className={`text-[13px] font-bold ${c.text} leading-snug mb-1 line-clamp-2`}>
                    {section.title || `Section ${section.sectionNumber}`}
                  </p>
                  <p className="text-slate-400 text-[11px] font-medium mt-auto pt-2">
                    {partLabels[section.sectionNumber]} · 10 câu
                  </p>
                  <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${c.text} opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all`} />
                </button>
              );
            })}
          </div>

          {/* Full test button */}
          <button
            onClick={() => setSelectedPart("full")}
            className="w-full flex items-center justify-between bg-slate-900 text-white rounded-2xl px-6 py-4 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-wider">Toàn bài (Full test)</p>
                <p className="text-slate-400 text-[11px] font-medium">Part 1 → 4 · 40 câu</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    );
  }

  // Per-question audio clip + transcript for the review panel
  const reviewSolutions: Record<number, { audioStart: number; audioEnd: number; transcript?: string }> = {};
  if (reviewMode) {
    activeSections.forEach((section) => {
      Object.entries(section.questionSolutions || {}).forEach(([num, sol]) => {
        reviewSolutions[Number(num)] = sol;
      });
    });
  }

  return (
    <ListeningTest
      mode={mode}
      testData={mappedTestData as any}
      onSubmit={handleSubmit}
      reviewMode={reviewMode}
      initialAnswers={reviewMode ? buildAnswerKeyMap() : undefined}
      reviewSolutions={reviewMode ? reviewSolutions : undefined}
    />
  );
}
