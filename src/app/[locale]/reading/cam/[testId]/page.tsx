"use client";

import React, { Suspense, useState, useEffect, useRef, use, useCallback, memo } from "react";
import { X, Clock, CheckCircle2, AlertCircle, Sparkles, BookOpen, ArrowLeft, ArrowRight, Maximize2, Minimize2, Type, Plus, Minus, Highlighter, Eraser, Sun, Bookmark, FolderPlus, Folder, Loader2, BookMarked, Wifi, Bell, Menu, Volume2, RotateCcw, ChevronRight, MessageCircle } from "lucide-react";
import { ResultSunMascot } from "@/components/sunMascot";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { repairPassageHtml } from "@/utils/repairPassageHtml";
import { matchesAnswerKey } from "@/utils/answerMatch";
import { scoreToIeltsBand } from "@/utils/ieltsBand";
import { formatExplanationText } from "@/utils/formatExplanation";

// ── Reader font preferences (mirrors đọc song ngữ) ───────────────────────────
// activeFont stores the full CSS font-family stack. First entry = no override.
const READING_FONTS = [
  { name: "Mặc định", stack: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" },
  { name: "Lora", stack: "'Lora', Georgia, serif" },
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  { name: "EB Garamond", stack: "'EB Garamond', Georgia, serif" },
  { name: "Newsreader", stack: "'Newsreader', Georgia, serif" },
  { name: "Spectral", stack: "'Spectral', Georgia, serif" },
  { name: "IBM Plex Serif", stack: "'IBM Plex Serif', Georgia, serif" },
  { name: "Bitter", stack: "'Bitter', Georgia, serif" },
  { name: "Inter (sans)", stack: "'Inter', system-ui, sans-serif" },
  { name: "Source Sans (sans)", stack: "'Source Sans 3', system-ui, sans-serif" },
];

const READING_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,wght@0,400;1,400&family=Spectral:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Serif:ital,wght@0,400;0,700;1,400&family=Bitter:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,400;0,700;1,400&display=swap";

const READING_FONT_PREF_KEY = "tid_reading_font_pref";

// ── Result card helpers ──────────────────────────────────────────────────────

const SUN_MESSAGES: Record<string, string[]> = {
  low: [
    "Cố lên, bạn đang trên hành trình nâng cấp tiếng Anh đó 💪",
    'Không sao đâu, ai giỏi IELTS cũng từng "lụm" điểm như này',
    "Vẫn còn hơi lạc trôi, nhưng luyện thêm là ổn áp nha.",
    "Mới khởi động thôi, còn nhiều tiềm năng lắm 👀",
    "Chưa cao lắm, nhưng ít nhất bạn đã bắt đầu rồi.",
  ],
  midLow: [
    "Khá hơn rất nhiều rồi đó, tiếp tục giữ phong độ nha 🔥",
    "Bạn đang dần hiểu cách IELTS vận hành rồi đó.",
    'Không còn là "newbie" nữa đâu 😎',
    "Tiến bộ rõ luôn á, chỉ cần ổn định hơn chút nữa thôi.",
    "Band này là bắt đầu có nền rồi đó nha.",
  ],
  mid: [
    "Ui khá dữ à nha 👏",
    "Bạn đang tiến rất gần tới level học thuật thực thụ rồi đó.",
    "Kỹ năng đọc của bạn đang vào form cực mạnh.",
    "Nếu giữ nhịp này thì target cao hơn hoàn toàn khả thi.",
    "Không phải dạng vừa đâu 😌",
  ],
  high: [
    "Quá xịn rồi 😭🔥",
    "Bạn đọc kiểu này giám khảo cũng rén á.",
    "Band điểm này thuộc dạng rất cạnh tranh rồi đó.",
    "Tư duy xử lý bài đọc của bạn cực ổn luôn.",
    "Bạn đang ở level mà nhiều người mơ tới 👏",
  ],
  top: [
    "Thôi khỏi khiêm tốn nữa, bạn gánh team được rồi 🫡",
    "Quái vật IELTS xuất hiện 🚨",
    "Bạn đọc đề như đọc menu vậy á 😭",
    'Điểm này là đủ khiến người khác "xin vía" rồi đó.',
    "Không còn là làm bài nữa, đây là trình độ hủy diệt 💀",
  ],
};

function pickSunMessage(band: number): string {
  const tier = band < 4.0 ? "low" : band < 5.5 ? "midLow" : band < 7.0 ? "mid" : band < 8.0 ? "high" : "top";
  const arr = SUN_MESSAGES[tier];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── End result card helpers ──────────────────────────────────────────────────

// ============================================================
// MEMOIZED PASSAGE COMPONENT
// This prevents the passage from re-rendering when the timer updates,
// which would otherwise wipe out the manual DOM highlights.
// ============================================================
const ReadingPassage = memo(({
  content,
  fontSize,
  fontFamily,
  onMouseUp,
  onMouseMove,
  textRef
}: {
  content: string;
  fontSize: number;
  fontFamily: string;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  textRef: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-thin bg-white select-none"
      onMouseDown={(e) => {
        if ((e.target as Element).tagName?.toLowerCase() === 'div') e.preventDefault();
      }}
    >
      <article ref={textRef} onMouseUp={onMouseUp} onMouseMove={onMouseMove} className="max-w-3xl mx-auto">
        <div
          className="prose prose-slate max-w-none prose-p:text-slate-800 prose-p:leading-[1.6] prose-p:my-3 prose-p:text-justify prose-h3:text-[#007e64] prose-h3:font-black prose-ul:my-2 prose-li:my-0 prose-strong:text-slate-900 select-text"
          style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </div>
  );
}, (prev, next) => {
  // Only re-render if content, fontSize or fontFamily changes. 
  // Specifically NOT on timer/answers/selection changes.
  return prev.content === next.content && prev.fontSize === next.fontSize && prev.fontFamily === next.fontFamily;
});

ReadingPassage.displayName = "ReadingPassage";

const ExamReadingPanel = memo(({
  content,
  id,
  textRef,
  onMouseUp,
  onMouseMove,
  fontSize,
  fontFamily,
}: {
  content: string;
  id: string;
  textRef: React.RefObject<HTMLDivElement | null>;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  fontSize: number;
  fontFamily: string;
}) => {
  return (
    <div
      className="overflow-y-auto min-h-0 absolute top-0 left-0 w-full h-full md:pr-3 select-none"
      id={id}
      style={{ scrollbarGutter: "stable" }}
      onMouseDown={(e) => {
        if ((e.target as Element).tagName?.toLowerCase() === 'div') e.preventDefault();
      }}
    >
      <article
        ref={textRef}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="cursor-note pt-4 pb-20"
      >
        <div
          className="prose prose-slate max-w-none prose-p:leading-[1.6] prose-p:my-3 prose-p:text-justify prose-h1:text-center prose-h1:font-black prose-h2:text-center prose-h2:font-black prose-h3:font-bold prose-strong:text-slate-900 select-text"
          style={{ fontSize: `${fontSize}px`, fontFamily }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </div>
  );
}, (prev, next) => prev.content === next.content && prev.fontSize === next.fontSize && prev.fontFamily === next.fontFamily);

ExamReadingPanel.displayName = "ExamReadingPanel";

interface NotebookFolder {
  id: string;
  name: string;
  user_notebook?: { count: number }[];
  created_at: string;
}

export default function ReadingPracticePage({ params }: { params: Promise<{ testId: string }> }) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black text-[#007e64] animate-pulse">LOADING PASSAGE...</div>}>
      <ReadingPracticeContent params={params} />
    </Suspense>
  );
}

function normalizeQuestionType(raw: string): string {
  // Strip spaces, underscores, hyphens, slashes so "true/false", "yes-no", "fill_blank" all normalize cleanly
  const t = raw.toLowerCase().replace(/[\s_\-\/]+/g, "");
  if (t === "multiplechoice" || t === "mc" || t === "singlechoice" || t === "multiplecoice") return "multiple-choice";
  if (t.includes("yesno")) return "ynng";
  if (t === "tfng" || t.includes("truefals") || t.includes("truefalse")) return "tfng";
  if (t.includes("fill") || t.includes("blank") || t === "completion" || t.includes("sentence") || t.includes("summary")) return "fill-blank";
  if (t === "matchinginfo") return "matching-info";
  if (t === "matchingfeature") return "matching-feature";
  if (t.includes("match")) return "fill-blank";
  return t;
}

function normalizeQuestionLabel(rawQuestion: string): string {
  if (/^Paragraph [A-H]$/i.test(rawQuestion)) {
    return `Choose the correct heading for ${rawQuestion}. Write the heading number.`;
  }

  return rawQuestion;
}

function getQuestionChoiceLabels(q: any) {
  if (q.type === "ynng") return ["YES", "NO", "NOT GIVEN"];
  if (q.type === "tfng") return ["TRUE", "FALSE", "NOT GIVEN"];
  return [];
}

function normalizeAnswerValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isAnswerCorrect(userAnswer: string | undefined, expectedAnswer: string | undefined) {
  const actual = normalizeAnswerValue(userAnswer || "");
  const expected = normalizeAnswerValue(expectedAnswer || "");

  if (!actual || !expected) {
    return false;
  }

  if (expected.includes("|")) {
    return expected
      .split("|")
      .some((part) => matchesAnswerKey(actual, normalizeAnswerValue(part)));
  }

  if (expected.includes(",") && actual.includes(",")) {
    const normalizedActual = actual
      .split(",")
      .map((part) => normalizeAnswerValue(part))
      .filter(Boolean)
      .sort()
      .join(",");
    const normalizedExpected = expected
      .split(",")
      .map((part) => normalizeAnswerValue(part))
      .filter(Boolean)
      .sort()
      .join(",");

    return normalizedActual === normalizedExpected;
  }

  // Handles answer-key notation: "(...)" optional parts, "/" and "[or]" alternatives
  return matchesAnswerKey(actual, expected);
}


// Extracts choice letters from an MC-2 answer key: ['D','E'], "C,D", "B|C" → ["D","E"] / ["C","D"] / ["B","C"].
// Returns the raw string as a single item when it isn't a letter list (e.g. "NOT GIVEN").
function mc2Letters(answer: any): string[] {
  if (Array.isArray(answer)) return answer.map((a) => String(a).trim().toUpperCase()).filter(Boolean);
  if (typeof answer !== "string") return [];
  const trimmed = answer.trim();
  if (!trimmed) return [];
  if (!/^[A-Ha-h](\s*[,|]\s*[A-Ha-h])*$/.test(trimmed)) return [trimmed];
  return trimmed.split(/[,|]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
}

// Multiple-choice-2 ("Choose TWO") blocks were saved in several shapes over time.
// This normalizes them all to the shape the exam renderer expects:
// one question object per question number, sharing a groupId, each keyed "C|D"
// (pipe = either letter accepted, so the pair is graded as a set, any order).
function normalizeMc2Groups(questions: any[]): any[] {
  let activeGroupId: string | undefined = undefined;
  let activeDisplayType: string | undefined = undefined;
  const normalizedQuestions = questions.map(q => {
    if (q.groupId) {
      if (q.groupId !== activeGroupId) {
        activeGroupId = q.groupId;
        activeDisplayType = q.displayType;
      } else if (!q.displayType && activeDisplayType === "multiple-choice-2") {
        return { ...q, displayType: "multiple-choice-2" };
      }
    }
    return q;
  });

  const isMc2First = (q: any) =>
    q.displayType === "multiple-choice-2" || q._blockConfig?.type === "multiple-choice-2";

  // Pass 1: split self-contained pairs — one object carrying the whole block
  // (e.g. q10 with answer ['D','E'] for Questions 10–11 and no sibling q11).
  const result: any[] = [];
  for (const q of normalizedQuestions) {
    const bc = q._blockConfig;
    const span = (bc && typeof bc.qStart === "number" && typeof bc.qEnd === "number")
      ? bc.qEnd - bc.qStart + 1 : 1;
    const letters = mc2Letters(q.answer).filter((l) => /^[A-H]$/.test(l));
    const hasSiblings = !!q.groupId && normalizedQuestions.some((o) => o !== q && o.groupId === q.groupId);
    if (isMc2First(q) && !hasSiblings && span > 1 && letters.length > 1 && typeof q.id === "number") {
      const joined = [...new Set(letters)].sort().join("|");
      for (let i = 0; i < span; i++) result.push({ ...q, id: q.id + i, answer: joined });
      continue;
    }
    result.push(q);
  }

  // Pass 2: rewrite answer keys set-wise for genuine choose-N groups.
  // Applies only when the group is unambiguously one set: every member holds the
  // same multi-letter key ("C,D" on both questions), or each member holds a single
  // letter (one per slot). Groups of independent choose-2 questions (different keys
  // per member, e.g. TID workbook blocks) are left untouched.
  const byGroup = new Map<string, any[]>();
  for (const q of result) {
    if (!q.groupId) continue;
    if (!byGroup.has(q.groupId)) byGroup.set(q.groupId, []);
    byGroup.get(q.groupId)!.push(q);
  }
  for (const members of byGroup.values()) {
    if (members.length < 2 || !isMc2First(members[0])) continue;
    const letterSets = members.map((m) => mc2Letters(m.answer).filter((l) => /^[A-H]$/.test(l)));
    const keys = members.map((m) => (typeof m.answer === "string" ? m.answer : "").replace(/\s+/g, "").toUpperCase());
    const allSingle = letterSets.every((ls) => ls.length === 1);
    const allIdenticalMulti = letterSets.every((ls) => ls.length > 1) && new Set(keys).size === 1;
    if (!allSingle && !allIdenticalMulti) continue;
    const set = [...new Set(letterSets.flat())].sort();
    if (set.length !== members.length) continue; // one expected letter per slot, else not a single set
    const joined = set.join("|");
    members.forEach((m) => { m.answer = joined; });
  }
  return result;
}

// Drops questionHtml whose numbered placeholders all belong to a different exercise
// (e.g. the admin editor's sample template saved unedited). Rendering it would show a
// phantom exercise whose inputs collide with the passage's real questions.
function stripStaleBlockHtml(questions: any[]): any[] {
  const byBlock = new Map<string, any[]>();
  for (const q of questions) {
    if (!q.blockId) continue;
    if (!byBlock.has(q.blockId)) byBlock.set(q.blockId, []);
    byBlock.get(q.blockId)!.push(q);
  }
  for (const members of byBlock.values()) {
    const first = members[0];
    const offset = (first._blockConfig?.qStart != null && typeof first.id === "number" && first._blockConfig.qStart !== first.id)
      ? (first._blockConfig.qStart as number) - first.id
      : 0;
    const blockIds = new Set<number>();
    for (const q of members) {
      if (typeof q.id !== "number") continue;
      blockIds.add(q.id);
      if (offset !== 0) blockIds.add(q.id + offset);
    }
    for (const q of members) {
      if (!q.questionHtml) continue;
      const nums = Array.from(q.questionHtml.matchAll(/\b(\d+)\s*[.…_]{5,}/g), (m: RegExpMatchArray) => parseInt(m[1]));
      if (nums.length && !nums.some((n) => blockIds.has(n))) {
        q.questionHtml = "";
      }
    }
  }
  return questions;
}

function normalizeReadingPayload(data: any) {
  const normalizedQuestions = (data?.questions || []).map((q: any, idx: number) => ({
    id: q.id || q.number || idx + 1,
    question: normalizeQuestionLabel((q.text || q.question || q.question_text || (q.paragraph ? `Match the correct heading for Paragraph ${q.paragraph}` : "")).replace(/^\d+[\.\)]\s*/, '').replace(/^\d+\s+(?=[A-Z])/, '')),
    questionHtml: q.questionHtml || q.question_html || "",
    groupId: q.groupId || q.group_id || "",
    groupHtml: q.groupHtml || q.group_html || "",
    blockId: q.blockId || q.block_id || "",
    blockTitle: q.blockTitle || q.block_title || "",
    displayMode: q.displayMode || q.display_mode || "",
    displayType: q.displayType || q.display_type || "",
    type: normalizeQuestionType(q.type || ""),
    options: q.options || [],
    sectionOptions: q.sectionOptions || [],
    phraseOptions: q.phraseOptions || [],
    answer: q.correct_answer || q.answer || "",
    explanation: q.explanation || "",
    _blockConfig: q._blockConfig || undefined,
  }));

  let passageNumber = 1;
  if (data?.youpass_id) {
    const match = data.youpass_id.match(/-(\d+)$/);
    if (match) {
      passageNumber = parseInt(match[1], 10);
    }
  }

  return {
    id: data?.id || "",
    youpass_id: data?.youpass_id || "",
    passageNumber,
    title: data?.title,
    topic: data?.topic || "",
    content_html: repairPassageHtml(
      (data?.content_html && (data.content_html.includes("<p>") || data.content_html.includes("<br/>") || data.content_html.includes("<h1>") || data.content_html.includes("<h3>")))
        ? data.content_html 
        : (data?.content_html || data?.content || "").replace(/\n/g, "<br/>")
    ),
    questions: stripStaleBlockHtml(normalizeMc2Groups(normalizedQuestions)),
    vocabulary: data?.vocabulary || []
  };
}

function parseInlineStyle(styleStr: string | null): React.CSSProperties {
  if (!styleStr) return {};
  const out: Record<string, string> = {};
  styleStr.split(";").forEach(rule => {
    const colon = rule.indexOf(":");
    if (colon < 0) return;
    const prop = rule.slice(0, colon).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = rule.slice(colon + 1).trim();
    if (prop && val) out[prop] = val;
  });
  return out as React.CSSProperties;
}

function renderExplanation(text: string) {
  const lines = formatExplanationText(text).split("\n");
  return (
    <span className="block space-y-0.5 mt-1">
      {lines.map((line, i) => {
        const isBullet = line.startsWith("- ");
        const raw = isBullet ? line.slice(2) : line;
        const parts = raw.split(/\*\*(.+?)\*\*/g);
        const content = parts.map((p, j) =>
          j % 2 === 1
            ? <strong key={j} className="font-bold text-slate-800">{p}</strong>
            : <React.Fragment key={j}>{p}</React.Fragment>
        );
        return (
          <span key={i} className="block text-slate-600 leading-relaxed text-[11px]">
            {isBullet && <span className="mr-1 text-slate-400">•</span>}
            {content}
          </span>
        );
      })}
    </span>
  );
}

function StructuredInlineQuestion({
  html,
  question,
  answer,
  setAnswer,
  showResults,
  answers = {},
  setAnswers,
}: {
  html: string;
  question: any;
  answer: string;
  setAnswer: (value: string) => void;
  showResults: boolean;
  answers?: Record<string | number, string>;
  setAnswers?: React.Dispatch<React.SetStateAction<Record<string | number, string>>>;
}) {
  const [openTooltip, setOpenTooltip] = useState(false);

  useEffect(() => {
    if (!openTooltip) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tooltip-anchor]")) setOpenTooltip(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openTooltip]);

  if (typeof window === "undefined") {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const placeholderPattern = new RegExp(`\\b${question.id}\\s*[.\\u2026_]{5,}`);
  // Sentence-style questions ("The air is filled with ______.") carry no numbered
  // placeholder — bind the first bare blank to this question's own answer slot.
  const htmlHasOwnNumber = placeholderPattern.test(html);
  const bareSlot = { used: false };

  const renderSlot = (targetQuestion: any, currentAnswer: string, onChange: (value: string) => void, key: string): React.ReactNode => {
    const qId = targetQuestion.id;

    if (showResults) {
      const isCorrect = isAnswerCorrect(currentAnswer, targetQuestion.answer);
      return (
        <span className="inline-flex align-middle items-center gap-1 mx-1" key={key} id={`question-${qId}`} style={{ scrollMarginTop: "80px" }}>
          <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 shrink-0 leading-5">{qId}</span>
          <span className={`border-b-2 px-1 font-semibold text-[15px] leading-6 ${isCorrect ? "border-emerald-400 text-emerald-800" : "border-red-400 text-red-700"}${!currentAnswer ? " italic text-slate-400" : ""}`}>
            {currentAnswer || "—"}
          </span>
          <span className="relative shrink-0" data-tooltip-anchor>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenTooltip(!openTooltip); }}
              className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-colors ${isCorrect ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            >
              {isCorrect ? "✓" : "✗"}
            </button>
            {openTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl px-3.5 py-3 text-[12px]" onClick={e => e.stopPropagation()}>
                <div className={`font-black text-[13px] mb-1 ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "✓ Correct!" : `✗ Answer: ${targetQuestion.answer}`}
                </div>
                {targetQuestion.explanation && renderExplanation(targetQuestion.explanation)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-200" />
              </div>
            )}
          </span>
        </span>
      );
    }

    return (
      <span className="inline-flex align-middle items-center gap-0.5 mx-1" key={key} id={`question-${qId}`} style={{ scrollMarginTop: "80px" }}>
        <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 leading-5 shrink-0">{qId}</span>
        <input
          type="text"
          value={currentAnswer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="________"
          aria-label={`Question ${qId}`}
          className="min-w-[110px] border-b-2 border-slate-400 bg-transparent pb-0.5 px-1 text-center text-[15px] font-semibold text-slate-900 outline-none transition focus:border-[#007e64] placeholder:text-slate-300 placeholder:font-normal"
        />
      </span>
    );
  };

  const renderTextWithPlaceholders = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let guard = 0;
    while (remaining && guard < 100) {
      guard += 1;
      placeholderPattern.lastIndex = 0;
      const match = placeholderPattern.exec(remaining);
      if (!match) {
        // No primary match — check for any other N_____ placeholder (shared-HTML orphan)
        const orphanMatch = /\b(\d+)\s*[.…_]{5,}/.exec(remaining);
        if (orphanMatch) {
          const orphanId = parseInt(orphanMatch[1]);
          if (orphanMatch.index > 0) parts.push(remaining.slice(0, orphanMatch.index));
          parts.push(
            <span className="inline-flex align-middle items-center gap-0.5 mx-1" key={`${keyPrefix}-orphan-${orphanId}`} id={`question-${orphanId}`} style={{ scrollMarginTop: "80px" }}>
              <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 leading-5 shrink-0">{orphanId}</span>
              <input
                type="text"
                value={answers[orphanId] || ""}
                onChange={(e) => setAnswers?.((prev) => ({ ...prev, [orphanId]: e.target.value }))}
                placeholder="________"
                aria-label={`Question ${orphanId}`}
                className="min-w-[110px] border-b-2 border-slate-400 bg-transparent pb-0.5 px-1 text-center text-[15px] font-semibold text-slate-900 outline-none transition focus:border-[#007e64] placeholder:text-slate-300 placeholder:font-normal"
              />
            </span>
          );
          remaining = remaining.slice(orphanMatch.index + orphanMatch[0].length);
          continue;
        }
        if (!htmlHasOwnNumber && !bareSlot.used) {
          const bareMatch = /_{4,}/.exec(remaining);
          if (bareMatch) {
            bareSlot.used = true;
            if (bareMatch.index > 0) parts.push(remaining.slice(0, bareMatch.index));
            parts.push(renderSlot(question, answer, setAnswer, `${keyPrefix}-bare-${question.id}`));
            remaining = remaining.slice(bareMatch.index + bareMatch[0].length);
            continue;
          }
        }
        parts.push(remaining);
        break;
      }
      if (match.index > 0) parts.push(remaining.slice(0, match.index));
      parts.push(renderSlot(question, answer, setAnswer, `${keyPrefix}-${question.id}-${parts.length}`));
      remaining = remaining.slice(match.index + match[0].length);
    }
    return parts;
  };

  const renderNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      placeholderPattern.lastIndex = 0;
      // Safety net: also trigger for any N_____ pattern (handles multi-question shared HTML like summary blocks)
      const hasPlaceholder = placeholderPattern.test(text) || /\b\d+\s*[.…_]{5,}/.test(text)
        || (!htmlHasOwnNumber && !bareSlot.used && /_{4,}/.test(text));
      if (!hasPlaceholder) return text;
      return <React.Fragment key={key}>{renderTextWithPlaceholders(text, key)}</React.Fragment>;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const children = Array.from(element.childNodes).map((child, idx) => renderNode(child, `${key}-${idx}`));
    const tag = element.tagName.toLowerCase();
    const props: Record<string, unknown> = { key };
    if (tag === "ul") props.className = "my-2 list-disc pl-6 space-y-2";
    if (tag === "ol") props.className = "my-2 list-decimal pl-6 space-y-2";
    if (tag === "p") props.className = "my-2";
    if (tag === "strong") props.className = "font-bold";
    if (tag === "em") props.className = "italic";
    if (tag === "td" || tag === "th") {
      const rs = element.getAttribute("rowspan"); if (rs) props.rowSpan = Number(rs);
      const cs = element.getAttribute("colspan"); if (cs) props.colSpan = Number(cs);
    }
    if (tag === "img") {
      const src = element.getAttribute("src"); if (src) props.src = src;
      const alt = element.getAttribute("alt"); props.alt = alt ?? "";
    }
    if (tag === "a") { const href = element.getAttribute("href"); if (href) props.href = href; }
    return React.createElement(tag, props, ...children);
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  return <>{Array.from(root?.childNodes || []).map((node, idx) => renderNode(node, `structured-${question.id}-${idx}`))}</>;
}

function StructuredBlock({
  html,
  questions,
  answers,
  setAnswers,
  showResults,
  blockOffset = 0,
}: {
  html: string;
  questions: any[];
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showResults: boolean;
  blockOffset?: number;
}) {
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);

  useEffect(() => {
    if (openTooltipId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tooltip-anchor]")) setOpenTooltipId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openTooltipId]);

  if (typeof window === "undefined") {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const placeholderPatterns = questions.map((question) => {
    const matchId = (blockOffset !== 0 && typeof question.id === "number")
      ? question.id + blockOffset
      : question.id;
    return {
      id: question.id,
      pattern: new RegExp(`\\b${matchId}\\s*[.\\u2026_]{5,}`),
      question,
    };
  });

  const renderSlot = (targetQuestion: any, key: string): React.ReactNode => {
    const qId = targetQuestion.id;
    const displayId = (blockOffset !== 0 && typeof qId === "number") ? qId + blockOffset : qId;
    const value = answers[qId] || "";

    if (showResults) {
      const isCorrect = isAnswerCorrect(value, targetQuestion.answer);
      const isOpen = openTooltipId === qId;
      return (
        <span className="inline-flex align-middle items-center gap-1 mx-1" key={key} id={`question-${displayId}`} style={{ scrollMarginTop: "80px" }}>
          <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 shrink-0 leading-5">{displayId}</span>
          <span className={`border-b-2 px-1 font-semibold text-[15px] leading-6 ${isCorrect ? "border-emerald-400 text-emerald-800" : "border-red-400 text-red-700"}${!value ? " italic text-slate-400" : ""}`}>
            {value || "—"}
          </span>
          <span className="relative shrink-0" data-tooltip-anchor>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenTooltipId(isOpen ? null : qId); }}
              className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-colors ${isCorrect ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            >
              {isCorrect ? "✓" : "✗"}
            </button>
            {isOpen && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl px-3.5 py-3 text-[12px]" onClick={e => e.stopPropagation()}>
                <div className={`font-black text-[13px] mb-1 ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "✓ Correct!" : `✗ Answer: ${targetQuestion.answer}`}
                </div>
                {targetQuestion.explanation && renderExplanation(targetQuestion.explanation)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-200" />
              </div>
            )}
          </span>
        </span>
      );
    }

    return (
      <span className="inline-flex align-middle items-center gap-0.5 mx-1" key={key} id={`question-${displayId}`} style={{ scrollMarginTop: "80px" }}>
        <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 leading-5 shrink-0">{displayId}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [qId]: e.target.value }))}
          placeholder="________"
          aria-label={`Question ${displayId}`}
          className="min-w-[110px] border-b-2 border-slate-400 bg-transparent pb-0.5 px-1 text-center text-[15px] font-semibold text-slate-900 outline-none transition focus:border-[#007e64] placeholder:text-slate-300 placeholder:font-normal"
        />
      </span>
    );
  };

  const renderTextWithPlaceholders = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let guard = 0;
    while (remaining && guard < 100) {
      guard += 1;
      let earliest: { index: number; length: number; id: string | number; question: any } | null = null;
      for (const matcher of placeholderPatterns) {
        matcher.pattern.lastIndex = 0;
        const match = matcher.pattern.exec(remaining);
        if (!match || match.index === undefined) continue;
        if (!earliest || match.index < earliest.index) {
          earliest = { index: match.index, length: match[0].length, id: matcher.id, question: matcher.question };
        }
      }
      if (!earliest) {
        const orphanMatch = /\b(\d+)\s*[.…_]{5,}/.exec(remaining);
        if (orphanMatch) {
          const orphanId = parseInt(orphanMatch[1]);
          if (orphanMatch.index > 0) parts.push(remaining.slice(0, orphanMatch.index));
          parts.push(
            <span className="inline-flex align-middle items-center gap-0.5 mx-1" key={`${keyPrefix}-orphan-${orphanId}`} id={`question-${orphanId}`} style={{ scrollMarginTop: "80px" }}>
              <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 leading-5 shrink-0">{orphanId}</span>
              <input
                type="text"
                value={answers[orphanId] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [orphanId]: e.target.value }))}
                placeholder="________"
                aria-label={`Question ${orphanId}`}
                className="min-w-[110px] border-b-2 border-slate-400 bg-transparent pb-0.5 px-1 text-center text-[15px] font-semibold text-slate-900 outline-none transition focus:border-[#007e64] placeholder:text-slate-300 placeholder:font-normal"
              />
            </span>
          );
          remaining = remaining.slice(orphanMatch.index + orphanMatch[0].length);
          continue;
        }
        parts.push(remaining);
        break;
      }
      if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index));
      parts.push(renderSlot(earliest.question, `${keyPrefix}-${earliest.id}-${parts.length}`));
      remaining = remaining.slice(earliest.index + earliest.length);
    }
    return parts;
  };

  const renderNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      // Safety net: also trigger for any number+underscores pattern not in placeholderPatterns (stale blockId orphan)
      const hasPlaceholder = placeholderPatterns.some(({ pattern }) => { pattern.lastIndex = 0; return pattern.test(text); })
        || /\b\d+\s*[.…_]{5,}/.test(text);
      if (!hasPlaceholder) return text;
      return <React.Fragment key={key}>{renderTextWithPlaceholders(text, key)}</React.Fragment>;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const children = Array.from(element.childNodes).map((child, idx) => renderNode(child, `${key}-${idx}`));
    const tag = element.tagName.toLowerCase();
    const props: Record<string, unknown> = { key };
    const inlineStyle = parseInlineStyle(element.getAttribute("style"));
    if (Object.keys(inlineStyle).length) props.style = inlineStyle;
    if (tag === "ul") props.className = "my-2 list-disc pl-5 space-y-1.5";
    if (tag === "ol") props.className = "my-2 list-decimal pl-5 space-y-1.5";
    if (tag === "li") props.className = "leading-relaxed";
    if (tag === "p") props.className = "my-2";
    if (tag === "strong") props.className = "font-bold";
    if (tag === "em") props.className = "italic";
    if (tag === "table" && !Object.keys(inlineStyle).length) props.className = "w-full border-collapse text-[14px] my-2";
    if (tag === "td" || tag === "th") {
      const rs = element.getAttribute("rowspan"); if (rs) props.rowSpan = Number(rs);
      const cs = element.getAttribute("colspan"); if (cs) props.colSpan = Number(cs);
      if (!Object.keys(inlineStyle).length) props.className = tag === "th" ? "border border-slate-500 px-3 py-2 font-bold bg-slate-50 text-center align-middle" : "border border-slate-500 px-3 py-2 align-middle";
    }
    if (tag === "img") {
      const src = element.getAttribute("src"); if (src) props.src = src;
      const alt = element.getAttribute("alt"); props.alt = alt ?? "";
    }
    if (tag === "a") { const href = element.getAttribute("href"); if (href) props.href = href; }
    return React.createElement(tag, props, ...children);
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  return <>{Array.from(root?.childNodes || []).map((node, idx) => renderNode(node, `structured-block-${idx}`))}</>;
}

function SummaryBlock({
  html,
  questions,
  answers,
  setAnswers,
  activeSlotId,
  setActiveSlotId,
  showResults,
}: {
  html: string;
  questions: any[];
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeSlotId: number | null;
  setActiveSlotId: (id: number | null) => void;
  showResults: boolean;
}) {
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);

  useEffect(() => {
    if (openTooltipId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tooltip-anchor]")) setOpenTooltipId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openTooltipId]);

  if (typeof window === "undefined") {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const placeholderPatterns = questions.map((question) => ({
    id: question.id,
    pattern: new RegExp(`\\b${question.id}\\s*[.\\u2026_]{5,}`),
    question,
  }));

  const renderSlot = (targetQuestion: any, key: string): React.ReactNode => {
    const qId = targetQuestion.id;
    const value = answers[qId] || "";
    const isActive = activeSlotId === qId;

    if (showResults) {
      const isCorrect = isAnswerCorrect(value, targetQuestion.answer);
      const isOpen = openTooltipId === qId;
      return (
        <span
          className="inline-flex align-middle items-center gap-1 mx-1"
          key={key}
          id={`question-${qId}`}
          style={{ scrollMarginTop: "80px" }}
        >
          <span className="text-[11px] font-black bg-slate-100 text-slate-500 rounded px-1 shrink-0 leading-5">{qId}</span>
          <span
            className={`border-b-2 px-1 font-semibold text-[15px] leading-6 ${
              isCorrect ? "border-emerald-400 text-emerald-800" : "border-red-400 text-red-700"
            }${!value ? " italic text-slate-400" : ""}`}
          >
            {value || "—"}
          </span>
          <span className="relative shrink-0" data-tooltip-anchor>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenTooltipId(isOpen ? null : qId);
              }}
              className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-colors ${
                isCorrect
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              {isCorrect ? "✓" : "✗"}
            </button>
            {isOpen && (
              <span
                className="block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl px-3.5 py-3 text-[12px]"
                onClick={(e) => e.stopPropagation()}
              >
                <span className={`block font-black text-[13px] mb-1 ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "✓ Correct!" : `✗ Answer: ${targetQuestion.answer}`}
                </span>
                {targetQuestion.explanation && renderExplanation(targetQuestion.explanation)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-200" />
              </span>
            )}
          </span>
        </span>
      );
    }

    if (value) {
      return (
        <span
          className="inline-flex align-middle items-center gap-0.5 mx-1"
          key={key}
          id={`question-${qId}`}
          style={{ scrollMarginTop: "80px" }}
        >
          <span className="text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 rounded px-1 leading-5 shrink-0">{qId}</span>
          <span
            className="border-b-2 border-emerald-400 px-1 text-emerald-800 font-semibold text-[15px] leading-6 cursor-pointer hover:text-red-600 hover:border-red-400 transition-colors group"
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [qId]: "" }));
              setActiveSlotId(qId);
            }}
            title="Click to remove"
          >
            {value}
            <span className="ml-0.5 text-emerald-300 group-hover:text-red-400 text-[11px]">×</span>
          </span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex align-middle items-center gap-0.5 mx-1 cursor-pointer select-none"
        key={key}
        id={`question-${qId}`}
        style={{ scrollMarginTop: "80px" }}
        onClick={() => setActiveSlotId(qId)}
      >
        <span
          className={`text-[11px] font-black rounded px-1 leading-5 shrink-0 ${
            isActive ? "bg-[#007e64] text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {qId}
        </span>
        <span
          className={`border-b-2 px-2 text-[13px] font-medium leading-6 ${
            isActive ? "border-[#007e64] text-[#007e64]/30" : "border-slate-300 text-slate-300"
          }`}
        >
          ________
        </span>
      </span>
    );
  };

  const renderTextWithPlaceholders = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let guard = 0;
    while (remaining && guard < 100) {
      guard += 1;
      let earliest: { index: number; length: number; id: string | number; question: any } | null = null;
      for (const matcher of placeholderPatterns) {
        matcher.pattern.lastIndex = 0;
        const match = matcher.pattern.exec(remaining);
        if (!match || match.index === undefined) continue;
        if (!earliest || match.index < earliest.index) {
          earliest = { index: match.index, length: match[0].length, id: matcher.id, question: matcher.question };
        }
      }
      if (!earliest) { parts.push(remaining); break; }
      if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index));
      parts.push(renderSlot(earliest.question, `${keyPrefix}-${earliest.id}-${parts.length}`));
      remaining = remaining.slice(earliest.index + earliest.length);
    }
    return parts;
  };

  const renderNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const hasPlaceholder = placeholderPatterns.some(({ pattern }) => { pattern.lastIndex = 0; return pattern.test(text); });
      if (!hasPlaceholder) return text;
      return <React.Fragment key={key}>{renderTextWithPlaceholders(text, key)}</React.Fragment>;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const children = Array.from(element.childNodes).map((child, idx) => renderNode(child, `${key}-${idx}`));
    const tag = element.tagName.toLowerCase();
    const props: Record<string, unknown> = { key };
    const inlineStyle = parseInlineStyle(element.getAttribute("style"));
    if (Object.keys(inlineStyle).length) props.style = inlineStyle;
    if (tag === "p") props.className = "my-2 leading-relaxed";
    if (tag === "strong") props.className = "font-bold";
    if (tag === "em") props.className = "italic";
    if (tag === "td" || tag === "th") {
      const rs = element.getAttribute("rowspan"); if (rs) props.rowSpan = Number(rs);
      const cs = element.getAttribute("colspan"); if (cs) props.colSpan = Number(cs);
    }
    if (tag === "img") {
      const src = element.getAttribute("src"); if (src) props.src = src;
      const alt = element.getAttribute("alt"); props.alt = alt ?? "";
    }
    if (tag === "a") { const href = element.getAttribute("href"); if (href) props.href = href; }
    return React.createElement(tag, props, ...children);
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;

  return <>{Array.from(root?.childNodes || []).map((node, idx) => renderNode(node, `summary-block-${idx}`))}</>;
}

/**
 * Strips "Questions X–Y" heading from groupHtml wherever it appears.
 * Works both SSR (regex) and client (DOMParser).
 * Returns { instructionsHtml, headingHtml } — instructions always come first.
 *
 * Handles these cases:
 * 1. Heading is the first <p> — extract it, everything else is instructions
 * 2. Heading is NOT the first <p> — extract it from wherever it is
 * 3. Heading appears at the start of rawHtml (SSR) — regex match
 * 4. Heading appears mid-HTML with instructions before it — scan all <p>s
 */
function stripGroupHeading(rawHtml: string): { instructionsHtml: string; headingHtml: string | null } {
  const formatInstructions = (html: string) => {
    if (!html) return html;
    return html.replace(/([.!?])\s+(?=[A-Z])/g, "$1<br/><br/>");
  };

  if (!rawHtml) return { instructionsHtml: rawHtml, headingHtml: null };

  const headingTextPattern = /^Questions?\s+\d+(?:\s*[\u2013\u2014\u2212-]\s*\d+)?$/i;
  const headingHtmlPattern = /(<(?:p|h[1-6]|div|span)(?:\s[^>]*)?>\s*(?:<(?:strong|b)(?:\s[^>]*)?>\s*)?Questions?\s+\d+(?:\s*[\u2013\u2014\u2212-]\s*\d+)?\s*(?:<\/(?:strong|b)>\s*)?<\/(?:p|h[1-6]|div|span)>)/i;

  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(rawHtml, "text/html");
      const candidates = doc.body.querySelectorAll("p,h1,h2,h3,h4,h5,h6,div,span,strong,b");
      for (const element of candidates) {
        const text = element.textContent?.trim() || "";
        if (headingTextPattern.test(text)) {
          const closestBlock = element.closest("p,h1,h2,h3,h4,h5,h6,div") || element;
          const headingHtml = closestBlock.outerHTML;
          closestBlock.remove();
          return { headingHtml, instructionsHtml: formatInstructions(doc.body.innerHTML.trim()) };
        }
      }
      return { instructionsHtml: formatInstructions(rawHtml), headingHtml: null };
    } catch {
      // Fall through to regex.
    }
  }

  const match = headingHtmlPattern.exec(rawHtml);
  if (match) {
    const headingHtml = match[1];
    const instructionsHtml = rawHtml.replace(headingHtmlPattern, "").trim();
    return { headingHtml, instructionsHtml: formatInstructions(instructionsHtml || "") };
  }

  return { instructionsHtml: formatInstructions(rawHtml), headingHtml: null };
}
const ROMAN_NUMERALS = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv'];

function tableHtmlFromBlockConfig(cfg: any): string {
  if (!cfg || cfg.type !== "table-completion") return "";
  const toCell = (text: string) =>
    text.replace(/\[(\d+)\]/g, (_, n) => `${n}_______`).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const colCount = (cfg.tableHeaders?.length) || 1;
  let html = "";
  if (cfg.tableTitle) html += `<p style="text-align:center;font-weight:bold;margin-bottom:10px">${cfg.tableTitle}</p>`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:14px">`;
  if (cfg.tableShowHeaders !== false) {
    html += `<thead>`;
    if (cfg.tableInlineTitle) {
      html += `<tr><th colspan="${colCount}" style="border:1px solid #555;padding:8px 12px;background:#e8e8e8;font-weight:bold;text-align:center;vertical-align:middle;font-size:15px">${cfg.tableInlineTitle}</th></tr>`;
    }
    html += `<tr>`;
    for (const h of (cfg.tableHeaders || [])) {
      html += `<th style="border:1px solid #555;padding:8px 12px;background:#f5f5f5;font-weight:bold;text-align:center;vertical-align:middle">${h}</th>`;
    }
    html += `</tr></thead>`;
  } else if (cfg.tableInlineTitle) {
    html += `<thead><tr><th colspan="${colCount}" style="border:1px solid #555;padding:8px 12px;background:#e8e8e8;font-weight:bold;text-align:center;vertical-align:middle;font-size:15px">${cfg.tableInlineTitle}</th></tr></thead>`;
  }
  const rows: string[][] = cfg.tableRows || [];
  const col0Span = rows.map(() => 1);
  let spanAnchor = -1;
  for (let ri = 0; ri < rows.length; ri++) {
    const c0 = (rows[ri][0] ?? "").trim();
    if (c0 === "^") { col0Span[ri] = 0; if (spanAnchor >= 0) col0Span[spanAnchor]++; }
    else { spanAnchor = ri; col0Span[ri] = 1; }
  }
  html += `<tbody>`;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    html += `<tr>`;
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci] ?? "";
      if (ci === 0 && col0Span[ri] === 0) continue;
      const cellHtml = cell.trim().split(/\r?\n/).map((l: string) => toCell(l)).join("<br/>");
      const spanAttr = (ci === 0 && col0Span[ri] > 1) ? ` rowspan="${col0Span[ri]}"` : "";
      const style = ci === 0
        ? "border:1px solid #555;padding:8px 12px;vertical-align:middle;font-weight:bold;text-align:center;white-space:nowrap;background:#fafafa"
        : "border:1px solid #555;padding:8px 12px;vertical-align:middle";
      html += `<td${spanAttr} style="${style}">${cellHtml}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

function StructuredQuestionBlock({
  questions,
  answers,
  setAnswers,
  showResults,
}: {
  questions: any[];
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showResults: boolean;
}) {
  const first = questions[0];
  const last = questions[questions.length - 1];
  // When questions have local IDs (e.g. 1-6) but the saved HTML uses global question numbers
  // (e.g. 7-12), we compute an offset from _blockConfig.qStart so the carrier check succeeds.
  const blockOffset: number = (first._blockConfig?.qStart != null && typeof first.id === "number" && first._blockConfig.qStart !== first.id)
    ? (first._blockConfig.qStart as number) - first.id
    : 0;
  const sharedHtmlCarrier = questions.find((candidate) => {
    if (!candidate.questionHtml) return false;
    return questions.every((question) => {
      const localPat = new RegExp(`\\b${question.id}\\s*[.\\u2026_]{5,}`);
      if (localPat.test(candidate.questionHtml)) return true;
      if (blockOffset === 0 || typeof question.id !== "number") return false;
      const globalPat = new RegExp(`\\b${question.id + blockOffset}\\s*[.\\u2026_]{5,}`);
      return globalPat.test(candidate.questionHtml);
    });
  });
  // If no carrier was found and the block has _blockConfig (table-completion), regenerate the HTML
  const effectiveCarrier = sharedHtmlCarrier ?? (() => {
    if (!sharedHtmlCarrier && first._blockConfig?.type === "table-completion") {
      const regenerated = tableHtmlFromBlockConfig(first._blockConfig);
      if (regenerated) return { ...first, questionHtml: regenerated };
    }
    return null;
  })();

  const isGroupedMultipleChoice = first.type === "multiple-choice";
  const isMatchingFeature = first.type === "matching-feature";
  const isSummaryCompletion = first.type === "fill-blank" && (first.phraseOptions?.length > 0);
  const isMatchingHeading = first.displayType === "matching-heading" ||
    first._blockConfig?.type === "matching-heading" ||
    (first.type === "fill-blank" && !isSummaryCompletion && typeof first.questionHtml === "string" && first.questionHtml.includes("lower-roman"));

  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [activeMatchingQId, setActiveMatchingQId] = useState<number | null>(null);

  const matchingHeadings: string[] = React.useMemo(() => {
    if (!isMatchingHeading) return [];
    // Primary source: the <ol> list saved in a question's HTML
    if (typeof window !== "undefined") {
      for (const q of questions) {
        if (!q.questionHtml) continue;
        try {
          const doc = new DOMParser().parseFromString(`<div>${q.questionHtml}</div>`, "text/html");
          const items = Array.from(doc.querySelector("ol")?.querySelectorAll("li") ?? [])
            .map(li => li.textContent?.trim() || "")
            .filter(Boolean);
          if (items.length) return items;
        } catch { /* try next question */ }
      }
    }
    // Tests saved before questionHtml existed for matching-heading only carry
    // the headings inside _blockConfig — same source the admin preview uses.
    const config = questions.find(q => q._blockConfig?.type === "matching-heading")?._blockConfig;
    return (config?.headings ?? []).map((h: string) => (h || "").trim()).filter(Boolean);
  }, [isMatchingHeading, questions]);

  const handleHeadingSelect = (numeral: string) => {
    const targetId = activeMatchingQId ?? questions.find((q: any) => !answers[q.id])?.id ?? null;
    if (targetId === null) return;
    setAnswers(prev => ({ ...prev, [targetId]: numeral }));
    const nextEmpty = questions.find((q: any) => q.id !== targetId && !answers[q.id]);
    setActiveMatchingQId(nextEmpty?.id ?? null);
  };

  const handlePhraseSelect = (phrase: string) => {
    const targetId = activeSlotId ?? questions.find((q: any) => !answers[q.id])?.id ?? null;
    if (targetId === null) return;
    setAnswers(prev => ({ ...prev, [targetId]: phrase }));
    const nextEmpty = questions.find((q: any) => q.id !== targetId && !answers[q.id]);
    setActiveSlotId(nextEmpty?.id ?? null);
  };
  const groupedChoiceAnswer = answers[first.id] || "";
  const groupedChoiceSelections = groupedChoiceAnswer.split(",").filter(Boolean);

  const toggleGroupedChoice = (choiceLabel: string) => {
    const current = groupedChoiceSelections;
    const isSelected = current.includes(choiceLabel);
    let next = current;

    if (isSelected) {
      next = current.filter((item) => item !== choiceLabel);
    } else if (current.length < questions.length) {
      next = [...current, choiceLabel];
    } else {
      next = [...current.slice(1), choiceLabel];
    }

    const normalized = next.sort().join(",");
    setAnswers((prev) => {
      const updated = { ...prev };
      questions.forEach((question) => {
        updated[question.id] = normalized;
      });
      return updated;
    });
  };

  const { instructionsHtml, headingHtml } = stripGroupHeading(first.groupHtml || "");

  return (
    <div className="rounded-3xl bg-white p-6 relative">
      {/* Anchor targets (non-MC types) */}
      {!isGroupedMultipleChoice && questions.map((q) => (
        <span key={`anchor-${q.id}`} id={`question-${q.id}`} className="absolute -top-4 left-0" style={{ scrollMarginTop: '80px' }} />
      ))}
      {/* HEADING FIRST: "Questions X-Y" (extracted from groupHtml or fallback) —
          must sit at the very top, matching real IELTS / YouPass layout. */}
      <div className="mb-4">
        {headingHtml ? (
          <div className="text-2xl font-black text-slate-900 [&_*]:!text-2xl [&_*]:!font-black [&_*]:!leading-tight [&_*]:!my-0" dangerouslySetInnerHTML={{ __html: headingHtml }} />
        ) : (
          <h4 className="text-2xl font-black text-slate-900">
            Questions {first.id}-{last.id}
          </h4>
        )}
      </div>

      {/* INSTRUCTIONS SECOND: e.g. "Complete the notes below..." */}
      {instructionsHtml && (
        <div
          className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-900 mb-4 [&_p]:!my-2"
          dangerouslySetInnerHTML={{ __html: instructionsHtml }}
        />
      )}

      {isGroupedMultipleChoice ? (
        <div className="space-y-8">
          {questions.map((q) => {
            const opts = (q.options || []).filter((opt: string) => {
              if (opt == null) return false;
              const stripped = String(opt).trim().replace(/^[A-E][\.\)]\s*/i, "").trim();
              return stripped !== "";
            });
            const currentAnswer = answers[q.id] || "";
            return (
              <div key={q.id} id={`question-${q.id}`} style={{ scrollMarginTop: "80px" }}>
                <div className="flex gap-2 mb-3">
                  <span className="shrink-0 border border-gray-400 rounded px-1.5 text-[13px] font-bold self-start mt-[3px]">{q.id}</span>
                  {q.questionHtml ? (
                    <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-900" dangerouslySetInnerHTML={{ __html: q.questionHtml }} />
                  ) : (
                    <p className="text-[15px] leading-relaxed text-slate-900">{q.question}</p>
                  )}
                </div>
                <div className="space-y-2 ml-9">
                  {opts.map((opt: string, optIdx: number) => {
                    const choiceLabel = String.fromCharCode(65 + optIdx);
                    const isSelected = currentAnswer === choiceLabel;
                    return (
                      <div
                        key={`${q.id}-${optIdx}`}
                        onClick={() => {
                          if (window.getSelection()?.toString().trim()) return;
                          if (!showResults) setAnswers(prev => ({ ...prev, [q.id]: isSelected ? "" : choiceLabel }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all select-text ${showResults ? "cursor-default" : "cursor-pointer"} ${
                          isSelected ? "bg-[#f0f9f7] border-[#007e64] ring-1 ring-[#007e64]/20 shadow-sm" : "bg-slate-50 border-transparent hover:border-slate-200"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 pointer-events-none ${isSelected ? "border-[#007e64] bg-[#007e64]" : "border-slate-300 bg-white"}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-[13px] font-bold text-slate-400 w-5">{choiceLabel}</span>
                        <span className="text-[13px] font-medium text-slate-700">{opt.replace(/^[A-Z][\.\)]\s*/, "")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : isMatchingFeature ? (
        /* Matching Feature: [answer box] [statement] + options list at bottom */
        <div className="space-y-1">
          {questions.map((q) => {
            const isAnswered = !!answers[q.id];
            return (
              <div key={q.id} id={`question-${q.id}`} style={{ scrollMarginTop: '80px' }} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value.toUpperCase() }))}
                  placeholder={String(q.id)}
                  maxLength={2}
                  className={`shrink-0 w-16 h-8 rounded border text-center text-sm font-bold outline-none transition ${
                    isAnswered ? "border-[#418ec8] ring-1 ring-[#418ec8]/30 text-slate-900" : "border-slate-400 text-slate-400"
                  }`}
                />
                <span className="text-[14px] leading-relaxed text-slate-900 pt-0.5">{q.question}</span>
              </div>
            );
          })}
          {/* Options list from questionHtml */}
          {first.questionHtml && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="font-bold text-[13px] text-slate-700 mb-2">List of options</p>
              <div
                className="prose prose-sm max-w-none text-[14px]"
                dangerouslySetInnerHTML={{ __html: first.questionHtml }}
              />
            </div>
          )}
          {showResults && questions.map((q) => (
            <div key={`res-${q.id}`} className={`px-3 py-1.5 rounded text-[12px] font-medium border ${
              isAnswerCorrect(answers[q.id], q.answer)
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              Q{q.id}: {isAnswerCorrect(answers[q.id], q.answer) ? "✓ Correct" : `Answer: ${q.answer}`}
            </div>
          ))}
        </div>
      ) : isMatchingHeading ? (
        /* Matching Heading: paragraph slot rows + interactive headings list */
        <div className="space-y-1.5">
          {questions.map((q, qIdx) => {
            const paraMatch = q.question.match(/Paragraph\s+([A-H])/i);
            const paraLabel = paraMatch ? paraMatch[1].toUpperCase() : String.fromCharCode(65 + qIdx);
            const selectedValue = answers[q.id] || "";
            const selectedIdx = ROMAN_NUMERALS.indexOf(selectedValue.toLowerCase());
            const isActive = activeMatchingQId === q.id;

            return (
              <div key={q.id} id={`question-${q.id}`} style={{ scrollMarginTop: '80px' }} className="flex items-center gap-2 py-1">
                <span className="shrink-0 text-[12px] font-black text-slate-400 w-5 text-right">{q.id}</span>
                <div className="flex-1 min-w-0">
                  {selectedValue ? (
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg border-2 border-blue-400 bg-blue-50 text-blue-900 text-[13px] font-semibold flex items-center justify-between gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors group"
                      onClick={() => { setAnswers(prev => ({ ...prev, [q.id]: "" })); setActiveMatchingQId(q.id); }}
                      title="Click to remove"
                    >
                      <span className="truncate">
                        <span className="font-black italic mr-1">{selectedValue}</span>
                        {selectedIdx >= 0 ? matchingHeadings[selectedIdx] : selectedValue}
                      </span>
                      <span className="shrink-0 text-blue-300 group-hover:text-red-400 font-bold text-base">×</span>
                    </button>
                  ) : (
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border-2 text-[13px] font-medium flex items-center gap-2 transition-all ${
                        isActive
                          ? "border-[#007e64] bg-[#f0f9f6] text-[#007e64] shadow-sm"
                          : "border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                      onClick={() => setActiveMatchingQId(q.id)}
                    >
                      {isActive ? "Select a heading below..." : "Click to assign heading"}
                    </button>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-black text-blue-700 bg-blue-50 rounded px-2 py-0.5 border border-blue-200 tracking-wide">Para {paraLabel}</span>
              </div>
            );
          })}

          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="font-black text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              List of Headings
              {activeMatchingQId !== null && (
                <span className="ml-2 text-[#007e64] normal-case font-normal text-[12px]">— selecting for Q{activeMatchingQId}</span>
              )}
            </p>
            <div className="space-y-1">
              {matchingHeadings.map((heading, i) => {
                const numeral = ROMAN_NUMERALS[i] || String(i + 1);
                const isUsed = Object.values(answers).some(v => v.toLowerCase() === numeral);
                return (
                  <button
                    key={i}
                    disabled={isUsed}
                    onClick={() => { if (!isUsed) handleHeadingSelect(numeral); }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-[13px] transition-all flex items-start gap-2 ${
                      isUsed
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-default line-through"
                        : activeMatchingQId !== null
                          ? "border-[#007e64] bg-[#f0f9f6] text-[#007e64] hover:bg-emerald-100 cursor-pointer font-medium shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer font-medium"
                    }`}
                  >
                    <span className="shrink-0 font-black italic text-[12px] w-6 pt-px">{numeral}</span>
                    <span>{heading}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="prose prose-slate max-w-none text-[15px] leading-8 text-slate-900">
          {isSummaryCompletion && effectiveCarrier ? (
            <SummaryBlock
              html={effectiveCarrier.questionHtml}
              questions={questions}
              answers={answers}
              setAnswers={setAnswers}
              activeSlotId={activeSlotId}
              setActiveSlotId={setActiveSlotId}
              showResults={showResults}
            />
          ) : effectiveCarrier ? (
            /* Table-completion must escape the prose wrapper to preserve inline border/bg styles */
            (first.displayType === "table-completion" || first._blockConfig?.type === "table-completion") ? (
              <div className="not-prose overflow-x-auto">
                <StructuredBlock
                  html={effectiveCarrier.questionHtml}
                  questions={questions}
                  answers={answers}
                  setAnswers={setAnswers}
                  showResults={showResults}
                  blockOffset={blockOffset}
                />
              </div>
            ) : (
            <StructuredBlock
              html={effectiveCarrier.questionHtml}
              questions={questions}
              answers={answers}
              setAnswers={setAnswers}
              showResults={showResults}
              blockOffset={blockOffset}
            />
            )
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} id={`question-${q.id}`} style={{ scrollMarginTop: '80px' }} className={idx === 0 ? "" : "mt-1"}>
                <StructuredInlineQuestion
                  html={q.questionHtml || `<p>${q.question}</p>`}
                  question={q}
                  answer={answers[q.id] || ""}
                  setAnswer={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                  showResults={showResults}
                  answers={answers}
                  setAnswers={setAnswers}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary completion: interactive phrase list (hidden after submit) */}
      {isSummaryCompletion && !showResults && (first.phraseOptions?.length ?? 0) > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <p className="font-black text-[13px] uppercase tracking-wide text-slate-500 mb-3">
            List of options
            {activeSlotId !== null && (
              <span className="ml-2 text-[#007e64] normal-case font-medium">— click a phrase to fill slot {activeSlotId}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {(first.phraseOptions as string[]).map((phrase: string, i: number) => {
              const blockQNums = questions.map((q) => q.id);
              const isUsed = blockQNums.some((qId) => answers[qId] === phrase);
              return (
                <button
                  key={i}
                  onClick={() => { if (!isUsed) handlePhraseSelect(phrase); }}
                  disabled={isUsed}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-all ${
                    isUsed
                      ? "border-slate-200 bg-slate-50 text-slate-300 cursor-default line-through"
                      : activeSlotId !== null
                        ? "border-[#007e64] bg-[#f0f9f6] text-[#007e64] hover:bg-emerald-100 cursor-pointer shadow-sm"
                        : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer"
                  }`}
                >
                  <span className="font-black text-[12px]">{String.fromCharCode(65 + i)}</span>
                  <span>{phrase}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showResults && (isGroupedMultipleChoice || isMatchingHeading) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {questions.map((q) => {
            const isCorrect = isAnswerCorrect(answers[q.id], q.answer);
            return (
              <div
                key={q.id}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <div className="font-black uppercase tracking-wide">
                  {isCorrect ? `Question ${q.id}: Correct` : `Question ${q.id}: ${q.answer}`}
                </div>
                {q.explanation && (
                  <div className="mt-1 opacity-80">
                    {renderExplanation(q.explanation)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReadingPracticeContent({ params }: { params: Promise<{ testId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "practice";

  // ─── Multi-passage state ───
  const [passages, setPassages] = useState<any[]>([]);
  const [activePassageIndex, setActivePassageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [dictionaryData, setDictionaryData] = useState<any>(null);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [sunMessage, setSunMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(mode === "exam" ? 3600 : 0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<"passage" | "questions">("passage");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState(READING_FONTS[0].stack);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPos, setHighlightPos] = useState({ x: 0, y: 0 });
  const [toolbarView, setToolbarView] = useState<"main" | "colors">("main");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputText, setNoteInputText] = useState("");
  const [noteInputPos, setNoteInputPos] = useState({ x: 0, y: 0 });
  const [pendingRange, setPendingRange] = useState<Range | null>(null);
  const [hoveredNote, setHoveredNote] = useState<{ text: string; x: number; y: number } | null>(null);

  // ─── Notebook state ───
  const [addingToNotebook, setAddingToNotebook] = useState(false);
  const [notebookFeedback, setNotebookFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [notebookDuplicate, setNotebookDuplicate] = useState<string | null>(null); // pending folderId when duplicate detected
  const [notebookFolders, setNotebookFolders] = useState<NotebookFolder[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const textRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const clickedHighlightRef = useRef<HTMLElement | null>(null);
  const [leftPanelPct, setLeftPanelPct] = useState(50);
  const [activeMatchingQId, setActiveMatchingQId] = useState<number | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = leftPanelPct;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const containerW = splitContainerRef.current.offsetWidth;
      const delta = ((ev.clientX - startX) / containerW) * 100;
      setLeftPanelPct(Math.min(75, Math.max(25, startPct + delta)));
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [leftPanelPct]);

  // ─── Derived data across all passages ───
  const currentPassage = passages[activePassageIndex] || null;
  const allQuestions = React.useMemo(() => passages.flatMap((p) => p.questions || []), [passages]);
  const totalQuestions = allQuestions.length;

  const questionBlocks = React.useMemo(() => {
    const blocks: Array<{ type: "structured" | "single"; questions: any[] }> = [];
    const absorbedIds = new Set<string | number>();

    for (let i = 0; i < allQuestions.length; i += 1) {
      const current = allQuestions[i];

      // Skip questions already absorbed into a structured block
      if (absorbedIds.has(current.id)) continue;

      if (current.blockId) {
        const grouped = [current];
        while (i + 1 < allQuestions.length && allQuestions[i + 1].blockId === current.blockId) {
          grouped.push(allQuestions[i + 1]);
          i += 1;
        }

        // Absorb orphan questions whose IDs appear as placeholders in questionHtml
        // (stale blockId from a previous save, or admin entered wrong range)
        const qHtml = current.questionHtml || "";
        if (qHtml) {
          // HTML uses global question numbers; DB may store local IDs — compute offset
          const blockOff = (current._blockConfig?.qStart != null && typeof current.id === "number" && current._blockConfig.qStart !== current.id)
            ? (current._blockConfig.qStart as number) - current.id
            : 0;
          // Seed inBlockIds with both local and global IDs of questions already in the block
          const inBlockIds = new Set<number>([
            ...grouped.map(q => q.id as number),
            ...(blockOff !== 0 ? grouped.filter(q => typeof q.id === "number").map(q => (q.id as number) + blockOff) : []),
          ]);
          const orphanRe = /\b(\d+)\s*[.…_]{5,}/g;
          let m;
          while ((m = orphanRe.exec(qHtml)) !== null) {
            const oid = parseInt(m[1]); // global placeholder number from HTML
            if (!inBlockIds.has(oid)) {
              // Match by direct id (global==global) OR by local id + offset (local+blockOff==global)
              const orphanQ = allQuestions.find(q => {
                if (absorbedIds.has(q.id)) return false;
                if (q.blockId === current.blockId) return false;
                const qGlobalId = (blockOff !== 0 && typeof q.id === "number") ? q.id + blockOff : q.id;
                return qGlobalId === oid;
              });
              if (orphanQ) {
                grouped.push(orphanQ);
                inBlockIds.add(oid); // prevent re-processing this global number in the loop
                absorbedIds.add(orphanQ.id); // use LOCAL id so the main-loop skip check works
              }
            }
          }
        }

        blocks.push({ type: "structured", questions: grouped });
        continue;
      }

      blocks.push({ type: "single", questions: [current] });
    }

    return blocks;
  }, [allQuestions]);

  const passageTitles = ["Passage 1", "Passage 2", "Passage 3"];

  const closePopup = useCallback(() => {
    setSelectedWord(null);
    setDictionaryData(null);
    setDictionaryError(null);
    setShowFolderPicker(false);
    setNotebookFeedback(null);
    setNewFolderName("");
  }, []);

  // Close the dictionary popup when clicking anywhere outside it
  useEffect(() => {
    if (!selectedWord) return;
    const onDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selectedWord, closePopup]);

  // ─── Load all 3 passages (PARALLEL) ───
  useEffect(() => {
    let cancelled = false;

    async function loadReadingData() {
      setLoading(true);
      try {
        const targetId = resolvedParams.testId;
        console.log('Current URL param (testId):', targetId);

        // Fetch from API route to bypass client RLS issues
        const res = await fetch(`/api/reading/practice/${targetId}`);
        if (!res.ok) throw new Error("Failed to fetch practice exam data");
        const { exam, questions, targetSectionNo } = await res.json();

        // Map/Filter sections and questions into frontend passages format
        const loadedPassages = (exam.exam_sections || [])
          .sort((a: any, b: any) => a.section_no - b.section_no)
          .map((sec: any) => {
            const secQuestions = (questions || []).filter((q: any) => q.section === sec.section_no);

            let youpassId = sec.id;
            if (exam.cambridge_no) {
              youpassId = `cam-${exam.cambridge_no}-${exam.test_no}-${sec.section_no}`;
            } else if (exam.title.startsWith("Essential Words")) {
              youpassId = `ew-${exam.test_no}-${sec.section_no}`;
            } else if (exam.title.startsWith("TID")) {
              youpassId = `tid-${exam.test_no}-${sec.section_no}`;
            }

            const rawSectionData = {
              id: sec.id,
              youpass_id: youpassId,
              title: sec.title,
              topic: sec.title,
              content_html: sec.content,
              questions: secQuestions.map((q: any) => ({
                id: q.order_index,
                text: q.text,
                type: q.question_type,
                options: q.options || [],
                correct_answer: q.correct_answer,
                explanation: ""
              }))
            };

            return normalizeReadingPayload(rawSectionData);
          });

        if (cancelled) return;

        // Filter by passage if specified or derived from targetId
        let filteredPassages = loadedPassages;
        if (targetSectionNo !== null) {
          filteredPassages = loadedPassages.filter(p => p.passageNumber === targetSectionNo);
        } else {
          const passageParam = searchParams.get("passage");
          if (passageParam) {
            const passageNum = parseInt(passageParam);
            filteredPassages = loadedPassages.filter(p => p.passageNumber === passageNum);
          }
        }

        if (filteredPassages.length > 0) {
          setPassages(filteredPassages);
          setActivePassageIndex(0);
        } else {
          setPassages([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading reading data from API:", err);
          setPassages([]);
        }
      }
      if (!cancelled) setLoading(false);
    }

    loadReadingData();
    return () => { cancelled = true; };
  }, [resolvedParams.testId, searchParams]);

  useEffect(() => {
    if (mode === "review" || mode === "review_exam") {
      setShowResults(true);
      const data = localStorage.getItem("ielts_mock_submission");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.testId === resolvedParams.testId && parsed.category === "reading") {
            setAnswers(parsed.answers || {});
          }
        } catch (e) {
          console.error("Failed to parse submission", e);
        }
      }
    }
  }, [mode, resolvedParams.testId]);

  useEffect(() => {
    if (mode === "review" || mode === "review_exam") return;
    const timer = setInterval(() => {
      if (mode === "exam") {
        setTimeLeft(prev => Math.max(0, prev - 1));
      } else {
        setTimeLeft(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === "exam" && timeLeft === 0 && !showResults && passages.length > 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Lazy-load reader fonts + restore saved font preference
  useEffect(() => {
    const id = "reading-reader-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = READING_FONTS_URL;
      document.head.appendChild(link);
    }
    try {
      const saved = JSON.parse(localStorage.getItem(READING_FONT_PREF_KEY) || "null");
      if (saved?.fontFamily) setFontFamily(saved.fontFamily);
      if (typeof saved?.fontSize === "number") setFontSize(saved.fontSize);
    } catch { /* ignore corrupt pref */ }
  }, []);

  // Persist font preference
  useEffect(() => {
    try {
      localStorage.setItem(READING_FONT_PREF_KEY, JSON.stringify({ fontFamily, fontSize }));
    } catch { /* storage may be unavailable */ }
  }, [fontFamily, fontSize]);

  // Close the font menu on outside click / Escape
  useEffect(() => {
    if (!showFontMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.(".reading-font-menu")) setShowFontMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowFontMenu(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showFontMenu]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest?.(".highlight-toolbar")) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 1) {
      const isSingleWord = text.split(" ").length === 1;

      if (isSingleWord && mode !== "exam") {
        // Single word in practice mode: open dictionary
        savedRangeRef.current = null;
        clickedHighlightRef.current = null;
        setShowHighlightMenu(false);
        setSelectedWord(text);
        setPopupPos({ x: e.clientX, y: e.clientY });
        fetchDictionary(text);
        selection?.removeAllRanges();
      } else {
        // Multiple words (any mode) OR single word in exam mode: show highlight toolbar
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          savedRangeRef.current = range?.cloneRange() ?? null;
          clickedHighlightRef.current = null;
          setHighlightPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
          setToolbarView(mode === "exam" ? "main" : "colors");
          setShowHighlightMenu(true);
        }
      }
    } else {
      // Plain click (no selection) on an existing highlight: re-open the
      // toolbar anchored on it so it can be restyled, annotated or erased.
      const hl = (e.target as HTMLElement).closest?.(".highlight-item") as HTMLElement | null;
      if (hl && splitContainerRef.current?.contains(hl)) {
        const range = document.createRange();
        range.selectNodeContents(hl);
        savedRangeRef.current = range;
        clickedHighlightRef.current = hl;
        const rect = hl.getBoundingClientRect();
        setHighlightPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
        setToolbarView(mode === "exam" ? "main" : "colors");
        setShowHighlightMenu(true);
        return;
      }
      setTimeout(() => {
        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.toString().trim().length === 0) {
          savedRangeRef.current = null;
          clickedHighlightRef.current = null;
          setShowHighlightMenu(false);
        }
      }, 200);
    }
  };

  const HIGHLIGHT_COLORS = [
    { label: "blue",   bg: "#93c5fd" },
    { label: "pink",   bg: "#f9a8d4" },
    { label: "green",  bg: "#86efac" },
    { label: "yellow", bg: "#fde047" },
  ];

  const applyHighlight = (e: React.MouseEvent, styles: React.CSSProperties) => {
    e.preventDefault();
    e.stopPropagation();

    // Re-styling an existing highlight: swap its style in place, no new span.
    const existing = clickedHighlightRef.current;
    if (existing) {
      existing.style.backgroundColor = "";
      existing.style.textDecoration = "";
      Object.keys(styles).forEach(k => {
        (existing.style as any)[k] = (styles as any)[k];
      });
      clickedHighlightRef.current = null;
      savedRangeRef.current = null;
      window.getSelection()?.removeAllRanges();
      setShowHighlightMenu(false);
      return;
    }

    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0);
    if (!range) return;

    wrapRangeTextNodes(range, (span) => {
      Object.keys(styles).forEach(k => {
        (span.style as any)[k] = (styles as any)[k];
      });
    });

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowHighlightMenu(false);
  };

  // Wrap every text node inside the range with its own inline span. Never
  // extracts/moves nodes, so selections spanning paragraph boundaries keep
  // the block structure intact (no mid-word line breaks).
  const wrapRangeTextNodes = (range: Range, decorate: (span: HTMLSpanElement) => void) => {
    // Split partially-selected text nodes at the boundaries so only the
    // selected part gets wrapped.
    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
      const rest = (range.startContainer as Text).splitText(range.startOffset);
      range.setStart(rest, 0);
    }
    if (range.endContainer.nodeType === Node.TEXT_NODE && range.endOffset < (range.endContainer as Text).length) {
      (range.endContainer as Text).splitText(range.endOffset);
    }

    const ancestor = range.commonAncestorContainer;
    const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent || node.textContent.trim().length === 0) continue;
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);
      const startsInside = range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0;
      const endsInside = range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;
      if (startsInside && endsInside) targets.push(node as Text);
    }

    targets.forEach(t => {
      const span = document.createElement("span");
      span.className = "highlight-item";
      decorate(span);
      t.parentNode?.insertBefore(span, t);
      span.appendChild(t);
    });
  };

  const eraseHighlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0);
    const scope = splitContainerRef.current;
    if (range && scope) {
      const highlights = scope.querySelectorAll(".highlight-item");
      highlights.forEach(h => {
        if (range.intersectsNode(h)) {
          const parent = h.parentNode;
          while (h.firstChild) parent?.insertBefore(h.firstChild, h);
          parent?.removeChild(h);
        }
      });
      scope.normalize();
    }
    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    clickedHighlightRef.current = null;
    setShowHighlightMenu(false);
  };

  const clearHighlights = () => {
    const scope = splitContainerRef.current;
    if (!scope) return;
    const highlights = scope.querySelectorAll(".highlight-item");
    highlights.forEach(h => {
      const parent = h.parentNode;
      while(h.firstChild) parent?.insertBefore(h.firstChild, h);
      parent?.removeChild(h);
    });
    scope.normalize();
  };

  const handleNoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0);
    if (!range) return;
    const cloned = range.cloneRange ? range.cloneRange() : range;
    const rect = cloned.getBoundingClientRect();
    setPendingRange(cloned);
    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    clickedHighlightRef.current = null;
    setShowHighlightMenu(false);
    setNoteInputPos({ x: Math.min(rect.left, window.innerWidth - 288), y: rect.bottom + 8 });
    setNoteInputText("");
    setShowNoteInput(true);
  };

  const saveNote = () => {
    if (!pendingRange) { setShowNoteInput(false); return; }
    wrapRangeTextNodes(pendingRange, (span) => {
      span.className = "note-item highlight-item cursor-pointer";
      span.style.borderBottom = "2px solid #3b82f6";
      span.style.backgroundColor = "#eff6ff";
      span.setAttribute("data-note", noteInputText);
    });
    setShowNoteInput(false);
    setNoteInputText("");
    setPendingRange(null);
  };

  const handleNoteMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 0) { setHoveredNote(null); return; }
    const noteSpan = (e.target as HTMLElement).closest?.(".note-item[data-note]") as HTMLElement | null;
    const noteText = noteSpan?.getAttribute("data-note") ?? null;
    if (noteText) {
      setHoveredNote({ text: noteText, x: e.clientX + 14, y: e.clientY - 44 });
    } else {
      setHoveredNote(null);
    }
  };

  // ─── Notebook helpers ───
  const fetchNotebookFolders = async () => {
    try {
      const res = await fetch("/api/notebook/folders");
      if (res.ok) {
        const data = await res.json();
        setNotebookFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  };

  const handleAddToNotebook = async (folderId: string | null, force = false) => {
    if (!selectedWord || addingToNotebook) return;
    setAddingToNotebook(true);
    setNotebookFeedback(null);
    setNotebookDuplicate(null);
    try {
      const firstMeaning = dictionaryData?.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];
      // Save the Vietnamese meaning so the notebook always has a tiếng Việt definition.
      // Prefer the translated definition, then the word's VI gloss; if neither has
      // arrived yet, translate the English definition on the fly before saving.
      let definition = firstDef?.definitionVi || dictionaryData?.wordVi || "";
      if (!definition) {
        const englishDef = firstDef?.definition || "";
        definition = englishDef ? await gtTranslate(englishDef).catch(() => "") : "";
        if (!definition) definition = englishDef;
      }
      const example = firstDef?.example || "";
      const pos = firstMeaning?.partOfSpeech || "";

      const res = await fetch("/api/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: selectedWord,
          definition,
          example,
          source: "reading",
          pos,
          category: dictionaryData?.type || dictionaryData?.category || "reading",
          folder_id: folderId,
          force,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotebookFeedback({ type: 'success', message: 'Đã thêm vào sổ từ vựng!' });
        setShowFolderPicker(false);
      } else if (res.status === 409 || data.error?.includes("already")) {
        setNotebookDuplicate(folderId);
      } else {
        setNotebookFeedback({ type: 'error', message: data.error || 'Không thể thêm từ.' });
      }
    } catch (err) {
      setNotebookFeedback({ type: 'error', message: 'Lỗi kết nối.' });
    } finally {
      setAddingToNotebook(false);
    }
  };

  const handleCreateFolderAndAdd = async () => {
    if (!newFolderName.trim() || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/notebook/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotebookFolders(prev => [data.folder, ...prev]);
        setNewFolderName("");
        await handleAddToNotebook(data.folder.id);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setCreatingFolder(false);
    }
  };

  const openFolderPicker = () => {
    setShowFolderPicker(true);
    setNotebookFeedback(null);
    fetchNotebookFolders();
  };

  // Render the notebook folder picker inside the dictionary popup
  const renderFolderPicker = () => (
    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chọn thư mục</span>
        <button
          onClick={handleCreateFolderAndAdd}
          disabled={creatingFolder || !newFolderName.trim()}
          className="ml-auto px-2 py-1 bg-herb-600 text-white rounded-lg text-[8px] font-black uppercase tracking-wider hover:bg-herb-700 transition-all disabled:opacity-50 flex items-center gap-1"
          title="Tạo thư mục mới và thêm từ"
        >
          {creatingFolder ? <Loader2 size={10} className="animate-spin" /> : <><FolderPlus size={10} /> Tạo & Thêm</>}
        </button>
      </div>
      <input
        type="text"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreateFolderAndAdd()}
        placeholder="Tên thư mục mới..."
        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-herb-400 font-medium"
      />
      <div className="border-t border-slate-100 pt-1">
        {/* Quick add: no folder */}
        <button
          onClick={() => handleAddToNotebook(null)}
          disabled={addingToNotebook}
          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <BookMarked size={14} className="text-herb-500" />
          Không phân loại
        </button>
        {notebookFolders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleAddToNotebook(folder.id)}
            disabled={addingToNotebook}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Folder size={14} className="text-amber-500" />
            {folder.name}
            <span className="ml-auto text-[9px] text-slate-400">{folder.user_notebook?.[0]?.count ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      alert("Hãy trả lời ít nhất một câu trước khi nộp bài.");
      return;
    }
    setEvaluating(true);

    // Compute per-question results using the SAME marker the test used (isAnswerCorrect),
    // so the summary and the detailed review screens never disagree.
    const results = allQuestions.map((q: any, i: number) => {
      const userAnswer = answers[q.id] || "";
      const correctAnswer = q.answer || "";
      return {
        number: i + 1,
        question: q.question || "",
        answer: correctAnswer,
        explanation: q.explanation || "",
        userAnswer,
        isCorrect: isAnswerCorrect(userAnswer, correctAnswer),
      };
    });

    const correctCount = results.filter((r) => r.isCorrect).length;
    const total = allQuestions.length;
    const skipped = results.filter((r) => !String(r.userAnswer).trim()).length;
    const wrong = Math.max(0, total - correctCount - skipped);
    // Always show a band — scale partial tests to a /40 equivalent, same as the
    // review screen, so both screens display the same score.
    const isFullTest = passages.length >= 3;
    const band = total > 0
      ? scoreToIeltsBand(total >= 40 ? correctCount : Math.round((correctCount / total) * 40))
      : 0;
    const testId = resolvedParams.testId;
    const timeSpent = mode === "exam" ? 3600 - timeLeft : timeLeft;

    // Store in localStorage
    const resultData = {
      correctCount,
      skipped,
      wrong,
      total,
      band,
      isFullTest,
      testId,
      passage: searchParams.get("passage"),
      mode,
      timeSpent
    };
    localStorage.setItem("reading_result", JSON.stringify(resultData));

    const testName = passages.map((p: any) => p.title).filter(Boolean).join(" / ") || testId;

    // Also store in the standard format for the review page. The `results` snapshot
    // carries the exact marking + question text/explanation, so the review page does
    // not need to re-fetch and re-score (which was mismatching the question IDs).
    const submissionData = {
      testId,
      category: "reading",
      answers,
      results,
      testName,
      timeSpent,
      passage: searchParams.get("passage"),
      mode
    };
    localStorage.setItem("ielts_mock_submission", JSON.stringify(submissionData));

    router.push(`/reading/cam/${resolvedParams.testId}/result${searchParams.get("passage") ? `?passage=${searchParams.get("passage")}` : ""}`);
  };

  const gtTranslate = async (text: string): Promise<string> => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    const d = await r.json();
    return (d?.[0] as any[])?.map((c: any) => c?.[0] ?? "").join("") ?? "";
  };

  const fetchDictionary = async (word: string) => {
    setDictionaryData(null);
    setDictionaryError(null);
    try {
      const [dictRes, wordVi] = await Promise.all([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`),
        gtTranslate(word).catch(() => ""),
      ]);

      if (!dictRes.ok) { setDictionaryError("Not found"); return; }
      const data = await dictRes.json();
      if (!Array.isArray(data) || data.length === 0) { setDictionaryError("Not found"); return; }

      const entry = data[0];
      if (!entry.phonetic && entry.phonetics?.length > 0) {
        entry.phonetic = entry.phonetics.find((p: any) => p.text)?.text || "";
      }
      const audioEntry = entry.phonetics?.find((p: any) => p.audio && p.audio.includes("-us"))
        || entry.phonetics?.find((p: any) => p.audio);
      entry.audioUrl = audioEntry?.audio || "";
      entry.wordVi = wordVi;
      setDictionaryData(entry);

      // Translate each definition in the background, update as they arrive
      const meanings: any[] = entry.meanings || [];
      meanings.slice(0, 3).forEach((m: any, mi: number) => {
        (m.definitions || []).slice(0, 2).forEach((d: any, di: number) => {
          if (!d.definition) return;
          gtTranslate(d.definition)
            .then(vi => {
              if (!vi) return;
              setDictionaryData((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  meanings: prev.meanings.map((mm: any, mmi: number) =>
                    mmi !== mi ? mm : {
                      ...mm,
                      definitions: mm.definitions.map((dd: any, ddi: number) =>
                        ddi !== di ? dd : { ...dd, definitionVi: vi }
                      )
                    }
                  ),
                };
              });
            })
            .catch(() => {});
        });
      });
    } catch (err) {
      console.error("Dictionary fetch error", err);
      setDictionaryError("Failed to load");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getPassageQuestionRange = (passageIndex: number) => {
    let start = 1;
    for (let i = 0; i < passageIndex; i++) {
      start += (passages[i]?.questions?.length || 0);
    }
    const end = start + (passages[passageIndex]?.questions?.length || 0) - 1;
    return { start, end };
  };

  // ─── Loading state ───
  if (loading) return (
    <div className="h-screen h-[100dvh] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-emerald-50 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#007e64] rounded-full border-t-transparent animate-spin" />
        </div>
        <span className="font-black text-[#007e64] text-sm uppercase tracking-[0.2em] animate-pulse">Loading Passages</span>
      </div>
    </div>
  );

  // ─── No data state ───
  if (passages.length === 0 || !currentPassage) return (
    <div className="h-screen h-[100dvh] flex flex-col items-center justify-center gap-6 bg-slate-50">
      <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-[#007e64]" />
      </div>
      <h2 className="text-2xl font-black text-slate-800">Bài chưa có nội dung</h2>
      <Link href="/reading" className="inline-flex items-center gap-2 bg-[#007e64] text-white px-6 py-3 rounded-2xl font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>
    </div>
  );

  // ─── UNIFIED LAYOUT — All modes use the IELTS Computer-Based Test interface ────
  const { start: pStart, end: pEnd } = getPassageQuestionRange(activePassageIndex);

    // Pre-group questionBlocks into display groups.
    // Rules (in priority order):
    //  1. Same explicit groupId → merge (existing behaviour)
    //  2. Consecutive TFNG or YNNG questions without an explicit groupId → auto-merge so
    //     the instruction block ("Do the following statements agree...") shows once per run.
    //  3. Everything else → solo group
    type ExamDG =
      | { type: "structured"; block: { type: "structured" | "single"; questions: any[] } }
      | { type: "group"; groupId: string; questions: any[]; groupHtml: string; isSplitSolo?: boolean };
    // Only show questions for the currently active passage
    const currentPassageQIds = new Set((currentPassage?.questions || []).map((q: any) => q.id));
    const currentPassageBlocks = questionBlocks.filter(block =>
      block.questions.some(q => currentPassageQIds.has(q.id))
    );
    const examDisplayGroups: ExamDG[] = [];
    const groupFirstText = new Map<string, string>();

    for (const block of currentPassageBlocks) {
      if (block.type === "structured") {
        examDisplayGroups.push({ type: "structured", block });
        continue;
      }
      const q = block.questions[0];
      const explicitGroupId = q.groupId as string | undefined;

      if (explicitGroupId && !groupFirstText.has(explicitGroupId)) {
        groupFirstText.set(explicitGroupId, q.question);
      }

      const prev = examDisplayGroups[examDisplayGroups.length - 1];
      const prevGroup = prev?.type === "group" ? prev as { type: "group"; groupId: string; questions: any[]; groupHtml: string; isSplitSolo?: boolean } : null;

      let effectiveGroupId = explicitGroupId;
      let isSplitSolo = false;
      if (explicitGroupId && q.displayType === "multiple-choice-2") {
         // A "Choose TWO" widget can span multiple question numbers (e.g. Q1–2). The first
         // question of that span carries _blockConfig.qStart/qEnd. If the current question
         // falls inside the previous group's block range, it belongs to the same widget —
         // keep them together even when the per-slot prompt text differs (which happens when
         // an admin types "…Choose two answers…" on slot 1 only). Only genuinely independent
         // MC-2 questions (outside the range, different text) become solo groups.
         const firstBC = prevGroup?.questions?.[0]?._blockConfig;
         const num = typeof q.number === "number" ? q.number : q.id;
         const withinSameBlock = !!prevGroup && prevGroup.groupId === explicitGroupId && !!firstBC
            && typeof firstBC.qStart === "number" && typeof firstBC.qEnd === "number"
            && typeof num === "number" && num >= firstBC.qStart && num <= firstBC.qEnd;
         if (!withinSameBlock && q.question !== groupFirstText.get(explicitGroupId)) {
            effectiveGroupId = undefined; // Force independent MC-2 questions to be solo groups
            isSplitSolo = true;
         }
      }

      // Rule 1: same explicit groupId
      if (effectiveGroupId && prevGroup && prevGroup.groupId === effectiveGroupId) {
        prevGroup.questions.push(q);
        continue;
      }

      // Rule 1b: merge consecutive matching-info / matching-heading questions into one group
      if (q.type === "matching-info" && prevGroup && prevGroup.questions[0]?.type === "matching-info") {
        prevGroup.questions.push(q);
        // inherit groupHtml from first question if current group still lacks it
        if (!prevGroup.groupHtml && q.groupHtml) prevGroup.groupHtml = q.groupHtml;
        continue;
      }

      // Rule 1c: merge consecutive solo multiple-choice questions that share the same groupHtml
      // (happens when admin saves MC block but questions don't get an explicit groupId)
      if (q.type === "multiple-choice" && !effectiveGroupId && prevGroup &&
          prevGroup.questions[0]?.type === "multiple-choice" && !prevGroup.questions[0].groupId &&
          q.groupHtml && q.groupHtml === prevGroup.groupHtml) {
        prevGroup.questions.push(q);
        continue;
      }

      // Rule 1d: auto-pair consecutive MC-2 (Choose TWO) questions that landed in separate blocks.
      // Happens when admin saved each question in its own MC-2 block → different groupIds → Rule 1 misses them.
      // Each "Choose TWO" slot needs exactly 2 questions; cap at 2 so Q12 starts a fresh pair.
      if (q.type === "multiple-choice" && q.displayType === "multiple-choice-2" && prevGroup &&
          prevGroup.questions.length < 2 &&
          // a block spanning 2+ question numbers is already a complete "Choose TWO" set — never merge it into the previous pair
          !(q._blockConfig && q._blockConfig.qEnd > q._blockConfig.qStart) &&
          prevGroup.questions[0]?.type === "multiple-choice" &&
          prevGroup.questions[0]?.displayType === "multiple-choice-2" &&
          q.question === prevGroup.questions[0].question) {
        prevGroup.questions.push(q);
        continue;
      }

      // Rule 2: auto-merge consecutive TFNG / YNNG that have no explicit groupId
      const isAutoMergeable = (q.type === "tfng" || q.type === "ynng") && !effectiveGroupId;
      if (isAutoMergeable && prevGroup && prevGroup.groupId.startsWith(`auto-${q.type}-`) && !prevGroup.questions[0].groupId) {
        prevGroup.questions.push(q);
        continue;
      }

      // Rule 3: new group
      const gId = isAutoMergeable
        ? `auto-${q.type}-${examDisplayGroups.length}`
        : (effectiveGroupId || `solo-${q.id}`);
      examDisplayGroups.push({ type: "group", groupId: gId, questions: [q], groupHtml: q.groupHtml || "", isSplitSolo });
    }

    return (
      <div className="ielts-exam-root flex flex-col h-screen h-[100dvh] overflow-hidden bg-white text-[#000] leading-[1.5em] select-none">

        {/* ── Header ── */}
        <header className="border-b border-[#c1c1c1] bg-white flex items-center shrink-0 z-30">
          <Link href="/reading" className="p-4 py-3.5 shrink-0 flex items-center">
            <div className="relative w-[36px] h-[36px] rounded-lg overflow-hidden shadow-sm border border-slate-100">
              <Image 
                src="/assets/logo-finall.webp"
                alt="The IELTS Dictionary Logo" 
                fill
                priority
                unoptimized
                className="object-cover" 
              />
            </div>
          </Link>
          <div className="px-4 flex-1 min-w-0">
            <div className="font-bold truncate">
              {currentPassage?.title || resolvedParams.testId}
            </div>
            <div className="flex items-center gap-2">
              {mode === "review_exam" ? (
                <span className="text-sm font-bold text-[#007e64]">
                  Báo cáo kết quả
                </span>
              ) : mode === "practice" ? (
                <span className="text-sm">
                  {formatTime(timeLeft)} <span className="opacity-50 text-xs">đã qua</span>
                </span>
              ) : (
                <span className={`text-sm ${timeLeft < 300 ? "text-red-500 font-bold" : ""}`}>
                  {Math.floor(timeLeft / 60)} minutes remaining
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto h-full flex items-center gap-0 mr-1 shrink-0">
            {mode === "review_exam" ? (
              <button
                onClick={() => router.push(`/reading/cam/${resolvedParams.testId}/review${searchParams.get("passage") ? `?passage=${searchParams.get("passage")}` : ""}`)}
                className="hidden sm:block bg-[#418ec8] hover:bg-[#3578b0] text-white px-5 py-2 font-bold text-sm transition-all mr-2 rounded"
              >
                Quay lại báo cáo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={evaluating || totalQuestions === 0}
                className="hidden sm:block bg-[#418ec8] hover:bg-[#3578b0] text-white px-5 py-2 font-bold text-sm transition-all mr-2 rounded disabled:opacity-50"
              >
                {evaluating ? "..." : mode === "practice" ? "Kiểm Tra" : "Submit Test"}
              </button>
            )}
            <div className="relative reading-font-menu h-full">
              <div
                onClick={() => setShowFontMenu((v) => !v)}
                className={`h-full aspect-square p-2.5 flex items-center justify-center duration-200 cursor-pointer ${showFontMenu ? "bg-black/10" : "hover:bg-black/5"}`}
                title="Phông chữ"
              >
                <Type className="w-6 h-6" />
              </div>
              {showFontMenu && (
                <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-[#d5d5d5] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 p-3 cursor-auto">
                  {/* Font size */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Cỡ chữ</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                        className="w-7 h-7 rounded-md border border-[#d5d5d5] hover:bg-black/5 flex items-center justify-center"
                        aria-label="Giảm cỡ chữ"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm w-6 text-center tabular-nums">{fontSize}</span>
                      <button
                        onClick={() => setFontSize((s) => Math.min(28, s + 1))}
                        className="w-7 h-7 rounded-md border border-[#d5d5d5] hover:bg-black/5 flex items-center justify-center"
                        aria-label="Tăng cỡ chữ"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Font family */}
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Kiểu chữ</span>
                  <div className="max-h-64 overflow-y-auto -mx-1 px-1 flex flex-col gap-0.5">
                    {READING_FONTS.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setFontFamily(f.stack)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[15px] flex items-center justify-between transition-colors ${fontFamily === f.stack ? "bg-[#418ec8] text-white" : "hover:bg-black/5 text-slate-800"}`}
                        style={{ fontFamily: f.stack }}
                      >
                        <span>{f.name}</span>
                        {fontFamily === f.stack && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div
              onClick={toggleFullscreen}
              className="h-full aspect-square p-2.5 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </div>
            <div className="h-full aspect-square p-2.5 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Wifi className="w-6 h-6" />
            </div>
            <div className="h-full aspect-square p-2.5 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Bell className="w-6 h-6" />
            </div>
            <div className="h-full aspect-square p-2.5 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Menu className="w-6 h-6" />
            </div>
          </div>
        </header>

        {/* ── Instruction Banner ── */}
        <div className="m-4 mb-0 p-4 bg-[#f1f2ec] border border-[#d5d5d5] rounded-[4px] shrink-0">
          <div className="font-black">Part {currentPassage?.passageNumber ?? 1}</div>
          <div className="">Read the text and answer questions {pStart}–{pEnd}</div>
        </div>

        {/* ── Main Content: Split Passage + Questions ── */}
        <div ref={splitContainerRef} className="px-4 md:px-8 flex-1 pb-4 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* LEFT/TOP: Passage panel */}
          <div className="flex flex-col overflow-hidden min-w-0 md:pb-0 pb-2"
            style={{ flex: `${leftPanelPct} 1 0px` }}>
            <div className="flex-1 w-full relative">
              <ExamReadingPanel
                content={currentPassage.content_html}
                id={`reading-container-${resolvedParams.testId}`}
                textRef={textRef}
                onMouseUp={handleTextSelection}
                onMouseMove={handleNoteMouseMove}
                fontSize={fontSize}
                fontFamily={fontFamily}
              />
            </div>
          </div>

          {/* Resize handle — exact real IELTS: w-4 border-l-2 + icon box with rotate-90 */}
          <div
            className="hidden md:flex w-4 shrink-0 border-l-2 group border-[rgba(0,0,0,.5)] hover:bg-[#d6d6d6] items-center relative cursor-col-resize hover:border-[#418ec8] transition-colors"
            onMouseDown={handleResizeStart}
          >
            <div
              className="w-9 h-9 bg-white group-hover:border-[#418ec8] absolute left-0 -translate-x-[18px] top-1/2 -translate-y-1/2 z-10 aspect-square flex items-center justify-center border-2 border-[rgba(0,0,0,.5)]"
              style={{ stroke: "rgba(0,0,0,0.5)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="rgba(0,0,0,0.5)">
                <g fillRule="evenodd" clipRule="evenodd">
                  <path d="M6.53 7.47a.75.75 0 0 1 0 1.06l-3.47 3.473 3.464 3.467a.75.75 0 1 1-1.06 1.06l-3.995-3.997a.75.75 0 0 1 0-1.06l4-4.003a.75.75 0 0 1 1.061 0zM17.476 7.47a.75.75 0 0 1 1.06 0l3.994 3.997a.75.75 0 0 1 0 1.06l-4 4.003a.75.75 0 1 1-1.06-1.06l3.47-3.473-3.464-3.467a.75.75 0 0 1 0-1.06z" />
                  <path d="M1.25 12a.75.75 0 0 1 .75-.75h20a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75z" />
                </g>
              </svg>
            </div>
          </div>

          {/* RIGHT/BOTTOM: Questions panel — real IELTS uses absolute inner scroll */}
          <div className="flex flex-col overflow-hidden min-w-0 relative md:pt-0 pt-2"
            style={{ flex: `${100 - leftPanelPct} 1 0px` }}>
            <div className="flex-1 w-full relative">
              <div
                id={`list_question_${resolvedParams.testId}`}
                className="overflow-y-auto min-h-0 absolute top-0 left-0 w-full h-full interactive-question md:pt-0 pt-2"
                style={{ scrollbarGutter: "stable", zoom: fontSize / 16, fontFamily }}
                onMouseUp={handleTextSelection}
                onMouseMove={handleNoteMouseMove}
              >
                <div className="relative cursor-note select-text">
                <div className="flex flex-col gap-10 ml-0.5">
                {examDisplayGroups.map((dg, dgIdx) => {
                  if (dg.type === "structured") {
                    return (
                      <div key={`eb-${dgIdx}`} className="anchor-hl-note">
                        <StructuredQuestionBlock questions={dg.block.questions} answers={answers} setAnswers={setAnswers} showResults={showResults} />
                      </div>
                    );
                  }

                  // Matching Heading groups also render via StructuredQuestionBlock (roman numeral heading picker)
                  if (dg.type === "group" && (dg.questions[0]?.displayType === "matching-heading" || dg.questions[0]?._blockConfig?.type === "matching-heading")) {
                    return (
                      <div key={`eb-${dgIdx}`} className="anchor-hl-note">
                        <StructuredQuestionBlock questions={dg.questions} answers={answers} setAnswers={setAnswers} showResults={showResults} />
                      </div>
                    );
                  }

                  const { groupId, questions, groupHtml, isSplitSolo } = dg;
                  const firstQ = questions[0];
                  const lastQ = questions[questions.length - 1];
                  const firstGlobalIdx = allQuestions.findIndex((item: any) => item.id === firstQ.id);
                  const lastGlobalIdx = allQuestions.findIndex((item: any) => item.id === lastQ.id);
                  const isSolo = groupId.startsWith("solo-");
                  const qRangeStart = firstGlobalIdx + 1;
                  const qRangeEnd = lastGlobalIdx + 1;
                  const isSingleQ = qRangeStart === qRangeEnd;
                  const qRangeText = isSingleQ ? `${qRangeStart}` : `${qRangeStart}–${qRangeEnd}`;
                  const boxText = isSingleQ ? `box ${qRangeStart}` : `boxes ${qRangeText}`;
                  const questionHeadingText = isSingleQ ? `Question ${qRangeStart}` : `Questions ${qRangeText}`;

                  const stripped = groupHtml ? stripGroupHeading(groupHtml) : { instructionsHtml: "", headingHtml: null };
                  const groupInstructionsHtml = stripped.instructionsHtml;
                  const groupHeadingHtml = stripped.headingHtml;

                  // Auto-generate standard IELTS instructions for known types when groupHtml is absent
                  const autoInstructionHtml = (!groupInstructionsHtml && !isSolo)
                    ? firstQ.type === "tfng"
                      ? `<p><strong>Do the following statements agree with the information given in the Reading Passage?</strong></p><p>In ${boxText} on your answer sheet, write</p><p><strong>TRUE</strong>&nbsp;&nbsp;if the statement agrees with the information<br/><strong>FALSE</strong>&nbsp;&nbsp;if the statement contradicts the information<br/><strong>NOT GIVEN</strong>&nbsp;&nbsp;if there is no information on this</p>`
                      : firstQ.type === "ynng"
                        ? `<p><strong>Do the following statements agree with the claims of the writer in the Reading Passage?</strong></p><p>In ${boxText} on your answer sheet, write</p><p><strong>YES</strong>&nbsp;&nbsp;if the statement agrees with the claims of the writer<br/><strong>NO</strong>&nbsp;&nbsp;if the statement contradicts the claims of the writer<br/><strong>NOT GIVEN</strong>&nbsp;&nbsp;if it is impossible to say what the writer thinks about this</p>`
                        : ""
                    : "";

                  return (
                    <div key={`dg-${dgIdx}-${groupId}`} className={`anchor-hl-note ${isSplitSolo ? "-mt-6" : ""}`} id={`question-set-${groupId}`}>
                      {/* "Questions X-Y" heading FIRST (on top) — matches real IELTS / YouPass layout.
                          The heading must sit above the instructions ("Do the following statements…"). */}
                      {!isSolo && (
                        groupHeadingHtml
                          ? <div className="text-2xl font-black text-slate-900 mb-3 [&_*]:!text-2xl [&_*]:!font-black [&_*]:!leading-tight [&_*]:!my-0" dangerouslySetInnerHTML={{ __html: groupHeadingHtml }} />
                          : !autoInstructionHtml && <p className="text-2xl font-black text-slate-900 mb-3">{questionHeadingText}</p>
                      )}
                      {/* Instructions from groupHtml OR auto-generated for TFNG/YNNG — rendered below the heading */}
                      {(groupInstructionsHtml || autoInstructionHtml) && (
                        <div className="mb-3 text-[14px] leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: groupInstructionsHtml || autoInstructionHtml }} />
                      )}
                      {/* Matching Information: radio-button grid table */}
                      {firstQ.type === "matching-info" && (() => {
                        const letters: string[] = firstQ.sectionOptions?.length
                          ? firstQ.sectionOptions
                          : ["A","B","C","D","E","F","G"];
                        return (
                          <div className="flex flex-col gap-1">
                            {/* Question rows */}
                            {questions.map((q: any) => {
                              const isAnswered = !!answers[q.id];
                              const isActive = !showResults && activeMatchingQId === q.id;
                              const isCorrect = showResults && isAnswerCorrect(answers[q.id], q.answer);
                              return (
                                <div
                                  key={q.id}
                                  id={`question-${q.id}`}
                                  style={{ scrollMarginTop: '80px' }}
                                  className={`flex flex-col py-2 px-2 rounded-lg transition-colors ${showResults ? "" : isActive ? "bg-blue-50 ring-1 ring-blue-300 cursor-pointer" : "hover:bg-slate-50 cursor-pointer"}`}
                                  onClick={() => { if (!showResults) setActiveMatchingQId(q.id); }}
                                >
                                  <div className="flex gap-3 items-start">
                                    <div className={`shrink-0 mt-0.5 font-bold border whitespace-nowrap rounded-[4px] min-w-7 px-1 flex items-center justify-center text-sm select-none ${showResults ? (isCorrect ? "border-emerald-500 text-emerald-700" : "border-red-400 text-red-600") : isAnswered ? "border-[#418ec8] shadow-[0_0_0_1px_#418ec8] text-[#418ec8]" : isActive ? "border-blue-400 text-blue-600" : "border-gray-400"}`}>
                                      {q.id}
                                    </div>
                                    <div className="flex-1 flex gap-2 items-start min-w-0">
                                      <div className={`shrink-0 min-w-[2.5rem] text-center font-semibold text-sm border-b-2 px-2 pb-0.5 ${showResults ? (isCorrect ? "border-emerald-400 text-emerald-700" : "border-red-400 text-red-600") : isAnswered ? "border-[#418ec8] text-[#418ec8]" : isActive ? "border-blue-400 text-blue-500" : "border-gray-400 text-gray-400"}`}>
                                        {answers[q.id] || (showResults ? "—" : "")}
                                      </div>
                                      <span className="text-[14px] leading-relaxed text-gray-900">{q.question}</span>
                                    </div>
                                  </div>
                                  {showResults && (
                                    <div className={`mt-2 ml-10 px-3 py-2 rounded text-[12px] font-medium border ${
                                      isCorrect
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-red-50 text-red-800 border-red-200"
                                    }`}>
                                      <div>
                                        {isCorrect
                                          ? <><CheckCircle2 size={14} className="inline mr-1 -mt-0.5" /> Correct</>
                                          : <>Answer: {q.answer}</>
                                        }
                                      </div>
                                      {q.explanation && (
                                        <div className="mt-1 opacity-70">
                                          {renderExplanation(q.explanation)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Paragraph letter buttons (input control — hidden once results are shown) */}
                            {!showResults && (
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
                                {letters.map(l => {
                                  const usedBy = questions.find((q: any) => answers[q.id] === l);
                                  return (
                                    <button
                                      key={l}
                                      onClick={() => {
                                        if (activeMatchingQId !== null) {
                                          setAnswers((prev: any) => ({ ...prev, [activeMatchingQId]: l }));
                                          // Advance to next unanswered question
                                          const idx = questions.findIndex((q: any) => q.id === activeMatchingQId);
                                          const next = questions.slice(idx + 1).find((q: any) => !answers[q.id]);
                                          setActiveMatchingQId(next ? next.id : null);
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${
                                        usedBy
                                          ? "bg-blue-100 border-[#418ec8] text-[#418ec8]"
                                          : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      Paragraph {l}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {!showResults && activeMatchingQId === null && (
                              <p className="text-xs text-slate-400 mt-1">Click a question row to select it, then click a paragraph button.</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Multiple-choice-2: ONE combined checkbox block for Q23-24 style */}
                      {firstQ.type !== "matching-info" && firstQ.displayType === "multiple-choice-2" && (() => {
                        const opts: string[] = (firstQ.options || []).filter((o: any) => o != null && String(o).trim() !== "");
                        // Collect currently selected answers across all questions in the group
                        const selected: string[] = questions
                          .map((q: any) => answers[q.id])
                          .filter(Boolean)
                          .flatMap((a: string) => a.split(/[,|]/).filter(Boolean));
                        const allAnswered = questions.every((q: any) => answers[q.id]);

                        const maxSelections = Math.max(
                          questions.length,
                          typeof firstQ.answer === "string" ? firstQ.answer.split(/[|,]/).filter(Boolean).length : 1
                        );

                        const toggleOption = (label: string) => {
                          const isOn = selected.includes(label);
                          const next = isOn
                            ? selected.filter(a => a !== label)
                            : selected.length < maxSelections
                              ? [...selected, label]
                              : [...selected.slice(1), label];
                          const sorted = next.sort();
                          // Distribute sorted answers across questions in order
                          const newAnswers: Record<string, string> = {};
                          if (questions.length === 1 && maxSelections > 1) {
                            newAnswers[firstQ.id] = sorted.join(",");
                          } else {
                            questions.forEach((q: any, i: number) => { newAnswers[q.id] = sorted[i] ?? ""; });
                          }
                          setAnswers((prev: any) => ({ ...prev, ...newAnswers }));
                        };

                        return (
                          <div id={`question-${firstQ.id}`} style={{ scrollMarginTop: '80px' }}>
                            <div className="flex gap-2 mb-2">
                              <div className={`shrink-0 font-bold border whitespace-nowrap rounded-[4px] min-w-7 px-1 flex items-center justify-center text-sm select-none ${allAnswered ? "border-[#418ec8] shadow-[0_0_0_1px_#418ec8]" : "border-gray-400"}`}>
                                {firstQ.id}{questions.length > 1 ? `–${questions[questions.length - 1].id}` : ""}
                              </div>
                              <div className="text-[14px] leading-relaxed text-gray-900 flex-1">
                                {firstQ.questionHtml
                                  ? <span dangerouslySetInnerHTML={{ __html: firstQ.questionHtml }} />
                                  : firstQ.question || <span className="italic text-slate-400 text-[13px]">[Chưa nhập nội dung câu hỏi]</span>}
                              </div>
                            </div>
                            <ul className="ml-0 flex flex-col gap-0.5 list-none">
                              {opts.map((opt: string, oi: number) => {
                                const choiceLabel = String.fromCharCode(65 + oi);
                                const isOn = selected.includes(choiceLabel);
                                return (
                                  <li key={oi} className="relative">
                                    <label className={`py-2.5 px-3 flex gap-2 rounded-[4px] duration-200 cursor-pointer select-text ${isOn ? "bg-[#dbeafe]" : "hover:bg-[#e4e4e4]"}`}
                                      onClick={e => { e.preventDefault(); if (window.getSelection()?.toString().trim()) return; toggleOption(choiceLabel); }}>
                                      <input type="checkbox" checked={isOn} onChange={() => {}}
                                        className="absolute top-1/2 -translate-y-1/2 left-2 w-3.5 h-3.5 accent-[#418ec8]" />
                                      <span className="ml-5">{choiceLabel}. {String(opt).replace(/^[A-Z][\.\)]\s*/, "")}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                            {showResults && (
                              <div className="mt-2 ml-8 flex flex-col gap-1">
                                {questions.map((q: any) => (
                                  <div key={q.id} className={`px-3 py-2 rounded text-[12px] font-medium border ${isAnswerCorrect(answers[q.id], q.answer) ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                                    <div>
                                      Q{q.id}: {isAnswerCorrect(answers[q.id], q.answer) ? "✓" : "✗"} Correct: {q.answer}
                                    </div>
                                    {q.explanation && (
                                      <div className="mt-1 opacity-70">
                                        {renderExplanation(q.explanation)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Standard question list (non matching-info, non mc-2) — handles MC solo and grouped */}
                      {firstQ.type !== "matching-info" && firstQ.displayType !== "multiple-choice-2" && <div className="flex flex-col gap-4">
                        {questions.map((q: any) => {
                          const qIdx = allQuestions.findIndex((item: any) => item.id === q.id);
                          const choiceLabels = getQuestionChoiceLabels(q);
                          const isTfng = q.type === "tfng";
                          const isYnng = q.type === "ynng";
                          const isMc = q.type === "multiple-choice";
                          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";

                          return (
                            <div className="group" id={`question-${q.id}`} key={q.id} style={{ scrollMarginTop: '80px' }}>
                              <div className="flex gap-2 mb-2">
                                <div className="shrink-0">
                                  <div className={`font-bold border whitespace-nowrap rounded-[4px] min-w-7 px-1 flex items-center justify-center text-sm select-none ${
                                    isAnswered
                                      ? "border-[#418ec8] shadow-[0_0_0_1px_#418ec8]"
                                      : "border-gray-400"
                                  }`}>
                                    {q.id}
                                  </div>
                                </div>
                                <div className="text-[14px] leading-relaxed text-gray-900 flex-1">
                                  {q.questionHtml
                                    ? <span dangerouslySetInnerHTML={{ __html: q.questionHtml }} />
                                    : q.question || <span className="italic text-slate-400 text-[13px]">[Chưa nhập nội dung câu hỏi]</span>}
                                </div>
                                <button className="ml-auto h-fit opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Bookmark className="w-4 h-4" />
                                </button>
                              </div>

                              <div>
                                {(isTfng || isYnng) && (
                                  <ul className="ml-0 flex flex-col gap-0.5 list-none">
                                    {choiceLabels.map((val) => {
                                      const isSelected = answers[q.id] === val;
                                      return (
                                        <li key={val} className="relative">
                                          <label
                                            className={`py-2.5 px-3 flex gap-2 rounded-t-[4px] duration-200 cursor-pointer select-text ${isSelected ? "bg-[#dbeafe]" : "hover:bg-[#e4e4e4]"}`}
                                            onClick={(e) => {
                                              // Drag-selecting text must not toggle the answer
                                              if (window.getSelection()?.toString().trim()) e.preventDefault();
                                            }}
                                          >
                                            <input
                                              type="radio"
                                              name={`q-exam-${q.id}`}
                                              checked={isSelected}
                                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                                              className="absolute top-1/2 -translate-y-1/2 left-2 w-3.5 h-3.5 accent-[#418ec8]"
                                            />
                                            <span className="ml-5">{val}</span>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}

                                {isMc && (
                                  <ul className="ml-0 flex flex-col gap-0.5 list-none">
                                    {(q.options || []).filter((opt: string) => {
                                      if (opt == null) return false;
                                      return String(opt).trim().replace(/^[A-E][\.\)]\s*/i, "").trim() !== "";
                                    }).map((opt: string, optIdx: number) => {
                                      const choiceLabel = String.fromCharCode(65 + optIdx);
                                      const currentAnswers = answers[q.id]?.split(",").filter(Boolean) || [];
                                      const isSelected = currentAnswers.includes(choiceLabel);
                                      const isMultiSelect = q.question.toLowerCase().includes("two") || q.question.toLowerCase().includes("three") || q.question.toLowerCase().includes("letters");
                                      return (
                                        <li key={`${optIdx}-${opt}`} className="relative">
                                          <label
                                            className={`py-2.5 px-3 flex gap-2 rounded-t-[4px] duration-200 cursor-pointer select-text ${isSelected ? "bg-[#dbeafe]" : "hover:bg-[#e4e4e4]"}`}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              // Drag-selecting text must not toggle the answer
                                              if (window.getSelection()?.toString().trim()) return;
                                              const maxChoices = isMultiSelect ? (q.question.toLowerCase().includes("three") ? 3 : 2) : 1;
                                              const newAnswers = isSelected
                                                ? currentAnswers.filter((a: string) => a !== choiceLabel)
                                                : currentAnswers.length < maxChoices
                                                  ? [...currentAnswers, choiceLabel]
                                                  : [...currentAnswers.slice(1), choiceLabel];
                                              setAnswers(prev => ({ ...prev, [q.id]: newAnswers.sort().join(",") }));
                                            }}
                                          >
                                            <input
                                              type={isMultiSelect ? "checkbox" : "radio"}
                                              name={`q-exam-${q.id}`}
                                              checked={isSelected}
                                              onChange={() => {}}
                                              className="absolute top-1/2 -translate-y-1/2 left-2 w-3.5 h-3.5 accent-[#418ec8]"
                                            />
                                            <span className="ml-5">{choiceLabel}. {opt.replace(/^[A-Z][\.\)]\s*/, "")}</span>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}

                                {!isTfng && !isYnng && !isMc && (
                                  <div className="ml-8 mt-2">
                                    {!q.displayMode?.includes("inline") && (
                                      <input
                                        type="text"
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                        placeholder={String(q.id)}
                                        aria-label={`Question ${q.id}`}
                                        className="w-32 h-8 rounded-[4px] border border-gray-400 bg-white px-2 text-center text-sm font-medium text-gray-900 outline-none transition focus:border-[#418ec8] focus:ring-1 focus:ring-[#418ec8]/30"
                                      />
                                    )}
                                  </div>
                                )}

                                {showResults && (
                                  <div className={`mt-2 ml-8 px-3 py-2 rounded text-[12px] font-medium border ${
                                    isAnswerCorrect(answers[q.id], q.answer)
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-red-50 text-red-800 border-red-200"
                                  }`}>
                                    <div>
                                      {isAnswerCorrect(answers[q.id], q.answer)
                                        ? <><CheckCircle2 size={14} className="inline mr-1 -mt-0.5" /> Correct</>
                                        : <>Answer: {q.answer}</>
                                      }
                                    </div>
                                    {q.explanation && (
                                      <div className="mt-1 opacity-70">
                                        {renderExplanation(q.explanation)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>}
                    </div>
                  );
                })}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Navigation: Real IELTS style ── */}
        <div className="bg-slate-50 border-t border-[#c1c1c1] w-full relative shrink-0">
          {/* Floating prev / next passage buttons */}
          <div className="absolute z-20 bottom-full mb-4 right-6 flex items-center gap-2">
            <button
              onClick={() => setActivePassageIndex(Math.max(0, activePassageIndex - 1))}
              disabled={activePassageIndex === 0}
              className="cursor-pointer md:h-14 md:w-14 h-8 w-8 rounded-[4px] bg-[#4c4c4c] flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <ArrowLeft className="w-6 h-6 stroke-white" />
            </button>
            <button
              onClick={() => setActivePassageIndex(Math.min(passages.length - 1, activePassageIndex + 1))}
              disabled={activePassageIndex >= passages.length - 1}
              className="cursor-pointer md:h-14 md:w-14 h-8 w-8 rounded-[4px] bg-[#000] flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <ArrowRight className="w-6 h-6 stroke-white" />
            </button>
          </div>

          {/* Question tracker + submit */}
          <div className="flex overflow-auto">
            {passages.map((passage, pIdx) => {
              const { start } = getPassageQuestionRange(pIdx);
              const qStart = passages.slice(0, pIdx).reduce((s, p) => s + (p.questions?.length || 0), 0);
              const passageQs = allQuestions.filter((_, i) => i >= qStart && i < qStart + (passage.questions?.length || 0));
              return (
                <div
                  key={pIdx}
                  className={`relative flex gap-1 border-2 border-b-0 items-stretch ${activePassageIndex === pIdx ? "border-[#418ec8]" : "border-transparent"}`}
                >
                  <div
                    className="whitespace-nowrap p-4 flex items-center justify-center gap-2 relative max-w-[6rem] cursor-pointer"
                    onClick={() => setActivePassageIndex(pIdx)}
                  >
                    <span className="font-bold">Part {passage.passageNumber}</span>
                  </div>
                  {activePassageIndex === pIdx ? (
                    <div className="flex items-stretch gap-0.5">
                      {passageQs.map((q: any) => {
                        const globalIdx = allQuestions.indexOf(q);
                        const hasAns = answers[q.id] !== undefined && answers[q.id] !== "";
                        return (
                          <div key={q.id} className="relative pt-2 flex items-center">
                            <div 
                              onClick={() => {
                                const el = document.getElementById(`question-${q.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                                  const originalBg = el.style.backgroundColor;
                                  el.style.transition = "background-color 0.3s ease";
                                  el.style.backgroundColor = "rgba(65, 142, 200, 0.2)";
                                  setTimeout(() => {
                                    el.style.backgroundColor = originalBg;
                                  }, 1200);
                                }
                              }}
                              className={`border cursor-pointer whitespace-nowrap w-fit hover:border-[#418FC6] hover:shadow-[0_0_0_1px_#418ec8] rounded-[4px] px-1 flex items-center justify-center text-sm select-none ${
                                hasAns ? "border-[#418FC6] shadow-[0_0_0_1px_#418FC6]" : "border-transparent"
                              }`}
                            >
                              {globalIdx + 1}
                              <span className={`absolute bottom-full -mb-0.5 w-full h-[3px] ${hasAns ? "bg-[#418ec8]" : "bg-[#D7D7D7]"}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center pr-4 text-sm text-gray-500">
                      {passageQs.filter((q: any) => answers[q.id] !== undefined && answers[q.id] !== "").length} of {passageQs.length}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Submit section */}
            <div className="flex items-center px-4 py-3 gap-2 border-l border-[#c1c1c1] shrink-0 ml-auto">
              <button
                onClick={handleSubmit}
                disabled={evaluating || totalQuestions === 0}
                className="bg-[#418ec8] hover:bg-[#3578b0] text-white px-6 py-2 rounded font-bold text-sm transition-all disabled:opacity-50"
              >
                {evaluating ? "..." : mode === "practice" ? "Kiểm Tra" : "Submit Test"}
              </button>
            </div>
          </div>
        </div>

        {/* Dictionary popup */}
        {selectedWord && (
          <div ref={popupRef} className="fixed z-[90] bg-white shadow-2xl rounded-2xl p-5 border border-slate-100 w-80" style={{ left: `${Math.min(popupPos.x, window.innerWidth - 340)}px`, top: `${Math.max(popupPos.y - 180, 20)}px` }}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#418ec8] text-lg capitalize">{selectedWord}</h4>
                <button
                  onClick={() => {
                    if (dictionaryData?.audioUrl) {
                      new Audio(dictionaryData.audioUrl).play();
                    } else {
                      const u = new SpeechSynthesisUtterance(selectedWord ?? "");
                      u.lang = "en-US";
                      window.speechSynthesis.speak(u);
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#418ec8]/10 hover:bg-[#418ec8]/25 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 size={13} className="text-[#418ec8]" />
                </button>
              </div>
              <button onClick={closePopup} className="text-slate-300 hover:text-red-400"><X size={16} /></button>
            </div>
            {dictionaryData ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {dictionaryData.phonetic && (
                  <p className="text-[11px] text-slate-400 font-mono">/{dictionaryData.phonetic}/</p>
                )}
                {dictionaryData.wordVi && (
                  <p className="text-[14px] font-bold text-[#418ec8]">{dictionaryData.wordVi}</p>
                )}
                {(dictionaryData.meanings || []).map((m: any, mi: number) => (
                  <div key={mi} className="space-y-2">
                    <span className="inline-block bg-[#418ec8]/10 text-[#418ec8] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      {m.partOfSpeech}
                    </span>
                    {(m.definitions || []).map((d: any, di: number) => (
                      <div key={di} className="space-y-1.5">
                        <p className="text-[13px] text-slate-700 font-bold leading-snug">{d.definition}</p>
                        {d.definitionVi && (
                          <p className="text-[12px] text-[#418ec8]/80 italic">→ {d.definitionVi}</p>
                        )}
                        {d.example && (
                          <div className="p-2 bg-[#f0f6fc] rounded-lg space-y-1">
                            <p className="text-[10px] text-[#418ec8] italic">"{d.example}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2">
                  {notebookFeedback && (
                    <div className={`mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold ${notebookFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {notebookFeedback.message}
                    </div>
                  )}
                  {notebookDuplicate !== null ? (
                    <div className="space-y-1.5">
                      <p className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700">Từ này đã có trong sổ. Thêm lại không?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToNotebook(notebookDuplicate, true)}
                          disabled={addingToNotebook}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                        >
                          {addingToNotebook ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}
                          Thêm lại
                        </button>
                        <button
                          onClick={() => setNotebookDuplicate(null)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-all"
                        >
                          Thôi
                        </button>
                      </div>
                    </div>
                  ) : !showFolderPicker ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToNotebook(null)}
                        disabled={addingToNotebook}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        {addingToNotebook ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}
                        Lưu nhanh
                      </button>
                      <button
                        onClick={openFolderPicker}
                        disabled={addingToNotebook}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50"
                      >
                        <Folder size={12} />
                        Chọn thư mục
                      </button>
                    </div>
                  ) : renderFolderPicker()}
                </div>
              </div>
            ) : dictionaryError ? (
              <p className="text-[12px] text-slate-400 text-center py-4 italic">{dictionaryError}</p>
            ) : (
              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-slate-100 border-t-[#418ec8] rounded-full animate-spin" /></div>
            )}
          </div>
        )}


        {/* Evaluation Modal */}
        {evaluationResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-10 bg-[#1a2a3a] text-white relative">
                <button onClick={() => setEvaluationResult(null)} className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={18} /></button>
                <h2 className="text-3xl font-black mb-7 tracking-tight">Kết Quả Bài Thi</h2>
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Điểm Số</div>
                    <div className="text-5xl font-black">{evaluationResult.rawScore} <span className="text-xl opacity-30">/ {totalQuestions}</span></div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Band Score</div>
                    <div className="text-5xl font-black">Band {evaluationResult.bandScore}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: evaluationResult.detailedFeedback || "" }} />
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={() => setEvaluationResult(null)} className="w-full bg-[#418ec8] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#3578b0] transition-all">Xem Lại Bài Thi</button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .ielts-exam-root ::-webkit-scrollbar {
            -webkit-appearance: none;
            width: 17px !important;
            height: 17px !important;
          }
          @media (max-width: 768px) {
            .ielts-exam-root ::-webkit-scrollbar {
              width: 8px !important;
              height: 8px !important;
            }
          }
          .ielts-exam-root ::-webkit-scrollbar-corner { background: transparent !important; }
          .ielts-exam-root ::-webkit-scrollbar-thumb {
            border-radius: 0px !important;
            background: #888888 !important;
          }
          .ielts-exam-root ::-webkit-scrollbar-thumb:hover {
            background: #888888 !important;
          }
          .ielts-exam-root ::-webkit-scrollbar-track {
            background: #e8e8e8 !important;
            border: none;
            box-shadow: none;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .highlight-item { cursor: pointer; display: inline; }
          .highlight-item:hover { filter: brightness(0.95); }
        `}</style>

      {/* Floating Toolbar — exam mode */}
      {showHighlightMenu && (
        <div
          className="highlight-toolbar fixed z-[80] -translate-x-1/2 -translate-y-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ left: highlightPos.x, top: highlightPos.y }}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
        >
          {toolbarView === "main" ? (
            <div className="flex items-stretch">
              <button
                onMouseDown={handleNoteClick}
                className="flex flex-col items-center gap-1 px-5 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <MessageCircle size={16} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Note</span>
              </button>
              <div className="w-px bg-slate-200 my-1.5" />
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setToolbarView("colors"); }}
                className="flex flex-col items-center gap-1 px-5 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <Highlighter size={16} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Highlight</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              {HIGHLIGHT_COLORS.map(({ bg, label }) => (
                <button
                  key={label}
                  onMouseDown={(e) => applyHighlight(e, { backgroundColor: bg })}
                  className="w-6 h-6 rounded-md border-2 border-white shadow-sm hover:scale-125 transition-transform ring-1 ring-black/10"
                  style={{ backgroundColor: bg }}
                  title={label}
                />
              ))}
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                onMouseDown={(e) => applyHighlight(e, { textDecoration: "underline", textDecorationColor: "#ef4444", textDecorationThickness: "2px" })}
                className="h-6 px-1.5 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                title="Gạch dưới đỏ"
              >
                <span className="text-[12px] font-bold leading-none" style={{ textDecoration: "underline", textDecorationColor: "#ef4444", textDecorationThickness: "2px" }}>U</span>
              </button>
              <button
                onMouseDown={(e) => applyHighlight(e, { textDecoration: "line-through", textDecorationColor: "#374151", textDecorationThickness: "2px" })}
                className="h-6 px-1.5 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                title="Gạch ngang"
              >
                <span className="text-[11px] font-bold leading-none text-slate-600" style={{ textDecoration: "line-through", textDecorationThickness: "2px" }}>abc</span>
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                onMouseDown={eraseHighlight}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-red-500"
                title="Xóa định dạng"
              >
                <Eraser size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note Input — exam mode */}
      {showNoteInput && (
        <div
          className="fixed z-[90] w-72 bg-[#fefce8] border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
          style={{ left: noteInputPos.x, top: Math.min(noteInputPos.y, window.innerHeight - 200) }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-[#fde047] border-b-2 border-black">
            <div className="flex items-center gap-2">
              <MessageCircle size={13} className="text-black" />
              <span className="text-[11px] font-black uppercase tracking-wider text-black">Ghi Chú</span>
            </div>
            <button
              onMouseDown={(e) => { e.preventDefault(); setShowNoteInput(false); setNoteInputText(""); setPendingRange(null); }}
              className="text-black/60 hover:text-red-600 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
          <div className="p-3">
            <textarea
              autoFocus
              value={noteInputText}
              onChange={(e) => setNoteInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); }
                if (e.key === "Escape") { setShowNoteInput(false); setNoteInputText(""); setPendingRange(null); }
              }}
              placeholder="Nhập ghi chú..."
              className="w-full text-sm border border-black/20 bg-white/70 rounded p-2 resize-none outline-none focus:border-black/50 text-slate-800 font-medium placeholder:text-slate-400"
              rows={3}
            />
            <div className="text-[9px] text-amber-700/70 mt-1 mb-2.5 font-semibold">Enter để lưu · Esc để hủy · Shift+Enter xuống dòng</div>
            <div className="flex gap-2">
              <button
                onClick={saveNote}
                className="flex-1 bg-black text-white text-[11px] font-black py-1.5 rounded hover:bg-slate-800 transition-colors"
              >
                Lưu
              </button>
              <button
                onClick={() => { setShowNoteInput(false); setNoteInputText(""); setPendingRange(null); }}
                className="flex-1 border-2 border-black/30 text-[11px] font-black py-1.5 rounded hover:bg-black hover:text-white transition-colors text-black/70"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Hover Tooltip — exam mode */}
      {hoveredNote && hoveredNote.text && (
        <div
          className="fixed z-[95] bg-[#fef3c7] border-2 border-amber-400 rounded shadow-[3px_3px_0px_rgba(0,0,0,0.15)] max-w-[240px] pointer-events-none overflow-hidden"
          style={{ left: hoveredNote.x, top: hoveredNote.y }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fde68a] border-b border-amber-300">
            <MessageCircle size={10} className="text-amber-700 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800">Ghi chú</span>
          </div>
          <div className="px-2.5 py-2 text-xs text-slate-700 leading-relaxed font-medium">{hoveredNote.text}</div>
        </div>
      )}

      </div>
    );
}
