"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { getIeltsListeningBand } from "../CamTestClient";
import { motion } from "framer-motion";
import {
  RotateCcw, BookOpen, CheckCircle2, Minus, X, Star,
  ArrowLeft, MessageCircle, CheckCircle, XCircle, MinusCircle,
  Play, Pause, Volume2, FileText,
} from "lucide-react";
import { ResultSunMascot } from "@/components/sunMascot";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionResult = {
  number: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type ResultData = {
  correctCount: number;
  skipped: number;
  wrong: number;
  total: number;
  band: number;
  testId: string;
};

type QuestionSolution = {
  audioStart: number;
  audioEnd: number;
  transcript: string;
  correctAnswer?: string;    // admin override
};

type SectionData = {
  questionSolutions?: Record<string, QuestionSolution>;
  fullTranscript?: string;
};

// Đề bài của từng câu, dựng lại từ sections.blocks — để học viên xem lại câu hỏi
// ngay trong phần review thay vì chỉ thấy mỗi đáp án.
type QuestionContext = {
  kind: "mcq" | "multi" | "matching" | "gap" | "table";
  question?: string;
  options?: { label: string; text: string }[];
  imageSrc?: string;
};

// ─── Sun messages ─────────────────────────────────────────────────────────────

const SUN_MESSAGES: Record<string, string[]> = {
  low: [
    "Cố lên, bạn đang trên hành trình nâng cấp tiếng Anh đó",
    'Không sao đâu, ai giỏi IELTS cũng từng "lụm" điểm như này',
    "Listening khó ở chỗ phải nghe và xử lý cùng lúc — luyện thêm là ổn áp nha.",
    "Mới khởi động thôi, còn nhiều tiềm năng lắm 👀",
    "Chưa cao lắm, nhưng ít nhất bạn đã bắt đầu rồi.",
  ],
  midLow: [
    "Khá hơn rất nhiều rồi đó, tiếp tục giữ phong độ nha 🔥",
    "Bạn đang dần quen với tốc độ và accent của Cambridge rồi đó.",
    'Không còn là "newbie" nữa đâu 😎',
    "Tiến bộ rõ luôn á, chỉ cần ổn định hơn chút nữa thôi.",
    "Band này là bắt đầu có nền rồi đó nha.",
  ],
  mid: [
    "Ui khá dữ à nha 👏",
    "Bạn đang tiến rất gần tới level học thuật thực thụ rồi đó.",
    "Kỹ năng nghe của bạn đang vào form cực mạnh.",
    "Nếu giữ nhịp này thì target cao hơn hoàn toàn khả thi.",
    "Không phải dạng vừa đâu 😌",
  ],
  high: [
    "Quá xịn rồi 😭🔥",
    "Bạn nghe kiểu này giám khảo cũng rén á.",
    "Band điểm này thuộc dạng rất cạnh tranh rồi đó.",
    "Tư duy xử lý bài nghe của bạn cực ổn luôn.",
    "Bạn đang ở level mà nhiều người mơ tới 👏",
  ],
  top: [
    "Thôi khỏi khiêm tốn nữa, bạn gánh team được rồi 🫡",
    "Quái vật IELTS Listening xuất hiện 🚨",
    "Bạn nghe đề như nghe nhạc vậy á 😭",
    'Điểm này là đủ khiến người khác "xin vía" rồi đó.',
    "Không còn là làm bài nữa, đây là trình độ hủy diệt 💀",
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Strip a template/table line down to readable question text: the target blank
// becomes "______", other blanks in the same line become "___".
function cleanGapLine(line: string, target: number): string {
  return line
    .replace(new RegExp(`\\{${target}\\}`, "g"), "______")
    .replace(/\{\d+\}/g, "___")
    .replace(/\*\*/g, "")
    .replace(/^[-•●–]\s*/, "")
    .trim();
}

function buildQuestionContexts(sections: any[]): Record<number, QuestionContext> {
  const map: Record<number, QuestionContext> = {};
  for (const section of sections) {
    for (const block of section.blocks || []) {
      const c = block.content ?? block;
      const type = block.type;

      if (type === "multiple_choice") {
        for (const q of c.questions || []) {
          const num = q.qNum ?? q.number;
          if (!num) continue;
          const options = (q.options || []).map((o: any, i: number) => ({
            label: typeof o === "string" ? String.fromCharCode(65 + i) : (o.label ?? o.id ?? String.fromCharCode(65 + i)),
            text: typeof o === "string" ? o : (o.text ?? ""),
          }));
          map[num] = { kind: "mcq", question: q.text, options };
        }
      } else if (type === "multiple_choice_multi") {
        const qNums: number[] =
          block.questionNumbers ||
          Array.from({ length: c.count || 2 }, (_, i) => (c.qNum ?? 1) + i);
        const options = (c.options || block.options || []).map((o: any) => ({
          label: o.id ?? o.label ?? "",
          text: o.text ?? "",
        }));
        const question = c.text ?? block.prompt ?? "";
        for (const num of qNums) map[num] = { kind: "multi", question, options };
      } else if (type === "matching" || type === "map_labelling") {
        const items = c.items || block.questions || [];
        // Map-labelling options are bare letters (A…H) that only make sense on the
        // image — keep only options that carry real text.
        const options = (c.options || block.options || [])
          .filter((o: any) => o.text && o.text !== (o.id ?? o.label))
          .map((o: any) => ({ label: o.id ?? o.label ?? "", text: o.text }));
        for (const it of items) {
          const num = it.qNum ?? it.number;
          if (!num) continue;
          map[num] = {
            kind: "matching",
            question: it.text,
            options: options.length ? options : undefined,
            imageSrc: c.imageSrc,
          };
        }
      } else if (type === "table_completion") {
        const rows: string[][] = c.tableRows || block.tableRows || [];
        const nums = Object.keys(c.correctAnswers || {}).map(Number)
          .concat((block.answers || []).map((a: any) => a.number));
        for (const num of nums) {
          if (!num || map[num]) continue;
          let found: string | undefined;
          outer: for (const row of rows) {
            for (const cell of row) {
              for (const line of String(cell ?? "").split("\n")) {
                if (line.includes(`{${num}}`)) { found = cleanGapLine(line, num); break outer; }
              }
            }
          }
          if (found) map[num] = { kind: "table", question: found };
        }
      } else {
        // note / form / sentence completion — template string with {n} blanks
        const template: string = c.template ?? block.template ?? "";
        if (!template) continue;
        const nums = [...new Set([...template.matchAll(/\{(\d+)\}/g)].map((m) => parseInt(m[1], 10)))];
        const lines = template.split("\n");
        for (const num of nums) {
          const matched = lines
            .filter((l) => l.includes(`{${num}}`))
            .map((l) => cleanGapLine(l, num))
            .filter(Boolean);
          if (matched.length) map[num] = { kind: "gap", question: matched.join(" … ") };
        }
      }
    }
  }
  return map;
}

// ─── Transcript renderer (highlights **bold** with green underline) ───────────

function TranscriptHighlight({ text, active }: { text: string; active: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-[15px] leading-[1.9] text-slate-700 font-baloo">
      {parts.map((part, i) => {
        const m = part.match(/^\*\*(.+)\*\*$/);
        if (m) {
          return (
            <span
              key={i}
              className={`font-bold transition-all duration-300 ${
                active
                  ? "text-emerald-700 underline decoration-emerald-500 decoration-2 underline-offset-4 bg-emerald-50 rounded px-0.5"
                  : "text-slate-800"
              }`}
            >
              {m[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ─── Single question card for the review panel ────────────────────────────────

function QuestionReviewCard({
  result, solution, context, isActive, onClick, audioSrc,
}: {
  result: QuestionResult;
  solution: QuestionSolution | undefined;
  context: QuestionContext | undefined;
  isActive: boolean;
  onClick: () => void;
  audioSrc?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Client-side clipping: play the full section audio from audioStart and stop
  // at audioEnd. No server-side clip URLs are generated (R2 can't transform).
  const audioStart = solution?.audioStart ?? 0;
  const audioEnd = solution?.audioEnd ?? 0;
  const hasClip = Boolean(audioSrc && solution && audioEnd > audioStart);

  // The correct answer to display: admin override > original scoring answer
  const displayAnswer = solution?.correctAnswer || result.correctAnswer;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el || !hasClip) return;
    if (playing) { el.pause(); setPlaying(false); return; }
    const startPlayback = () => {
      el.currentTime = audioStart;
      el.play().catch(() => setPlaying(false));
    };
    if (el.readyState >= 1) startPlayback();
    else { el.addEventListener("loadedmetadata", startPlayback, { once: true }); el.load(); }
    setPlaying(true);
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (el && el.currentTime >= audioEnd) { el.pause(); setPlaying(false); }
  };

  useEffect(() => {
    if (!isActive && playing) { audioRef.current?.pause(); setPlaying(false); }
  }, [isActive, playing]);

  // For letter answers (A/B/C…) resolve the option text so "C" reads as "C. 1926."
  const findOptionText = (letter: string) =>
    context?.options?.find((o) => o.label.toUpperCase() === letter.toUpperCase())?.text || "";
  const correctOptionText = displayAnswer ? findOptionText(displayAnswer) : "";
  const userOptionText = result.userAnswer ? findOptionText(result.userAnswer) : "";

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
        isActive
          ? "border-emerald-400 bg-emerald-50 shadow-sm"
          : result.isCorrect
          ? "border-emerald-100 bg-white hover:border-emerald-200"
          : result.userAnswer
          ? "border-red-100 bg-white hover:border-red-200"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {result.isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500" />
            : result.userAnswer ? <XCircle className="w-5 h-5 text-red-500" />
            : <MinusCircle className="w-5 h-5 text-slate-400" />}
        </div>
        <span className="text-xs font-black text-slate-400 w-6 shrink-0">Q{result.number}</span>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          {!result.isCorrect && result.userAnswer && (
            <span className="text-xs text-red-500 line-through font-medium">
              {result.userAnswer}
              {userOptionText && <span className="font-normal">. {userOptionText}</span>}
            </span>
          )}
          {!result.userAnswer && <span className="text-xs text-slate-400 italic">bỏ qua</span>}
          {displayAnswer && (
            <>
              {!result.isCorrect && result.userAnswer && <span className="text-slate-300 text-xs">→</span>}
              <span className={`text-xs font-bold ${result.isCorrect ? "text-emerald-600" : "text-emerald-700"}`}>
                {displayAnswer}
                {correctOptionText && <span className="font-semibold">. {correctOptionText}</span>}
              </span>
            </>
          )}
        </div>
        {hasClip && (
          <button
            onClick={togglePlay}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              playing ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            }`}
            title="Nghe đoạn audio"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
        )}
        {hasClip && <audio ref={audioRef} src={audioSrc} preload="none" onTimeUpdate={handleTimeUpdate} onEnded={() => setPlaying(false)} className="hidden" />}
      </div>

      {/* Đề bài của câu — luôn hiển thị để học viên hiểu đáp án đang nói về gì */}
      {context?.question && (
        <p className="mt-1.5 pl-8 text-[13px] leading-snug text-slate-500">
          {context.question}
        </p>
      )}

      {/* Khi chọn câu: hiện đầy đủ các phương án / bản đồ của block */}
      {isActive && context?.options && context.options.length > 0 && (
        <div className="mt-2.5 pl-8 space-y-1">
          {context.options.map((o) => {
            const letter = o.label.toUpperCase();
            const isCorrectOpt = letter === (displayAnswer || "").toUpperCase();
            const isUserWrongOpt =
              !result.isCorrect && letter === (result.userAnswer || "").toUpperCase();
            return (
              <div
                key={o.label}
                className={`flex items-start gap-2 text-[13px] leading-snug rounded-lg px-2 py-1 ${
                  isCorrectOpt
                    ? "bg-emerald-100/80 text-emerald-800 font-semibold"
                    : isUserWrongOpt
                    ? "bg-red-50 text-red-600 line-through"
                    : "text-slate-600"
                }`}
              >
                <span className="font-bold shrink-0">{o.label}.</span>
                <span>{o.text}</span>
                {isCorrectOpt && <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />}
              </div>
            );
          })}
        </div>
      )}
      {isActive && context?.imageSrc && (
        <div className="mt-2.5 pl-8">
          <img
            src={context.imageSrc}
            alt="Map / Diagram"
            className="max-w-full max-h-[360px] object-contain border border-slate-200 rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  );
}

// ─── Two-panel review tab ──────────────────────────────────────────────────────

// Section audio sources (part number → audioSrc) — fetched separately
type SectionAudioMap = Record<number, string>;

function ReviewTwoPanel({
  results, solutions, questionContexts, sectionTranscripts, sectionAudioMap,
}: {
  results: QuestionResult[];
  solutions: Record<string, QuestionSolution>;
  questionContexts: Record<number, QuestionContext>;
  sectionTranscripts: Record<number, string>;
  sectionAudioMap: SectionAudioMap;
}) {
  const [activeQNum, setActiveQNum] = useState<number | null>(null);
  const [leftTab, setLeftTab] = useState<"transcript" | "full">("transcript");
  const transcriptItemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const hasSolutionTranscripts = Object.values(solutions).some(s => s.transcript);
  const hasFullTranscripts = Object.values(sectionTranscripts).some(t => t);

  const handleSelect = (qNum: number) => {
    setActiveQNum(prev => (prev === qNum ? null : qNum));
    setLeftTab("transcript");
    setTimeout(() => {
      const el = transcriptItemRefs.current[qNum];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const parts = [1, 2, 3, 4].map(pn => ({
    part: pn,
    questions: results.filter(r => r.number >= (pn - 1) * 10 + 1 && r.number <= pn * 10),
  })).filter(p => p.questions.length > 0);

  return (
    <div className="flex h-full min-h-[600px]">
      {/* ── Left panel ── */}
      <div className="w-[45%] shrink-0 border-r-2 border-slate-200 flex flex-col bg-[#fdfcf8]">
        {/* Sub-tab bar */}
        <div className="flex border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setLeftTab("transcript")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-widest border-r border-slate-200 transition-colors ${leftTab === "transcript" ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Volume2 size={12} /> Câu transcript
          </button>
          <button
            onClick={() => setLeftTab("full")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${leftTab === "full" ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            <FileText size={12} /> Toàn bộ script
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Per-question transcript snippets */}
          {leftTab === "transcript" && (
            <>
              {!hasSolutionTranscripts && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="font-bold text-slate-500 text-sm">Chưa có transcript</p>
                  <p className="text-xs mt-1 text-slate-400">Admin chưa thêm transcript cho bài này</p>
                </div>
              )}
              {parts.map(({ part, questions }) => (
                <div key={part} className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">
                    Part {part}
                  </div>
                  {questions.map(q => {
                    const sol = solutions[q.number];
                    if (!sol?.transcript) return null;
                    const isActive = activeQNum === q.number;
                    return (
                      <div
                        key={q.number}
                        ref={el => { transcriptItemRefs.current[q.number] = el; }}
                        onClick={() => handleSelect(q.number)}
                        className={`relative px-4 py-3 rounded-xl cursor-pointer transition-all border-2 ${
                          isActive ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`inline-block text-[10px] font-black rounded-full px-2 py-0.5 mb-1.5 ${isActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          Q{q.number}
                        </span>
                        <TranscriptHighlight text={sol.transcript} active={isActive} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* Full section audioscripts */}
          {leftTab === "full" && (
            <>
              {!hasFullTranscripts && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <p className="text-3xl mb-2">📜</p>
                  <p className="font-bold text-slate-500 text-sm">Chưa có audioscript</p>
                  <p className="text-xs mt-1">Admin chưa thêm toàn bộ transcript</p>
                </div>
              )}
              {parts.map(({ part }) => {
                const text = sectionTranscripts[part];
                if (!text) return null;
                return (
                  <div key={part} className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">
                      Part {part}
                    </div>
                    <p className="text-[13px] leading-[1.9] text-slate-700 font-baloo whitespace-pre-line">{text}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: question cards ── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8 space-y-8">
        {parts.map(({ part, questions }) => (
          <div key={part}>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-black text-white font-black text-xs px-4 py-1 rounded-full uppercase tracking-widest">
                Part {part}
              </div>
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-xs font-bold text-slate-500">
                {questions.filter(q => q.isCorrect).length}/{questions.length} đúng
              </span>
            </div>
            <div className="space-y-2">
              {questions.map(q => (
                <QuestionReviewCard
                  key={q.number}
                  result={q}
                  solution={solutions[q.number]}
                  context={questionContexts[q.number]}
                  isActive={activeQNum === q.number}
                  onClick={() => handleSelect(q.number)}
                  audioSrc={sectionAudioMap[part]}
                />
              ))}
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <p className="text-center text-slate-400 py-20 font-medium">Không có dữ liệu đáp án.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ListeningCamResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [solutions, setSolutions] = useState<Record<string, QuestionSolution>>({});
  const [questionContexts, setQuestionContexts] = useState<Record<number, QuestionContext>>({});
  const [sectionTranscripts, setSectionTranscripts] = useState<Record<number, string>>({});
  const [sectionAudioMap, setSectionAudioMap] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"review" | "discuss">("review");
  const tabBarRef = useRef<HTMLDivElement>(null);

  const pickSunMessage = (band: number) => {
    const tier =
      band < 4 ? "low"
      : band < 5.5 ? "midLow"
      : band < 7 ? "mid"
      : band < 8 ? "high"
      : "top";
    const arr = SUN_MESSAGES[tier];
    setMessage(arr[Math.floor(Math.random() * arr.length)]);
  };

  // Load score + answers — from the saved history row when reopened from the
  // dashboard, else from the submit-time localStorage snapshot.
  useEffect(() => {

    const storedResult = localStorage.getItem("listening_cam_result");
    const storedReview = localStorage.getItem("listening_cam_review");

    if (!storedResult) { router.push("/listening"); return; }

    try {
      const parsed: ResultData = JSON.parse(storedResult);
      if (!parsed.testId) parsed.testId = testId;
      setData(parsed);
      pickSunMessage(parsed.band);
    } catch {
      router.push("/listening");
      return;
    }

    if (storedReview) {
      try { setResults(JSON.parse(storedReview)); } catch { /* ignore */ }
    }
  }, [router, testId]);

  // Fetch solutions from Supabase (stored inside sections.questionSolutions)
  useEffect(() => {
    fetch(`/data/cam-tests/${testId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((testData) => {
        if (!testData?.sections) return;
        const merged: Record<string, QuestionSolution> = {};
        const transcripts: Record<number, string> = {};
        const audioMap: Record<number, string> = {};
        for (const section of testData.sections as any[]) {
          if (section.questionSolutions) Object.assign(merged, section.questionSolutions);
          if (section.fullTranscript) transcripts[section.sectionNumber] = section.fullTranscript;
          if (section.audioSrc) audioMap[section.sectionNumber] = section.audioSrc;
        }
        setSolutions(merged);
        setSectionTranscripts(transcripts);
        setSectionAudioMap(audioMap);
        setQuestionContexts(buildQuestionContexts(testData.sections as any[]));
      });
  }, [testId]);

  if (!data) return null;

  const percentage = (val: number) =>
    data.total > 0 ? ((val / data.total) * 100).toFixed(1) : "0.0";

  return (
    <>
      {/* ── Hero section ── */}
      <div className="relative bg-herb overflow-hidden">
        {/* Grid background — same treatment as the homepage hero */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 px-6 pt-6 pb-8 md:px-10 max-w-5xl mx-auto">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/listening")}
              className="inline-flex items-center text-white/70 hover:text-white text-sm font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay về
            </button>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full">
              Báo Cáo Kết Quả
            </div>
          </div>

          {/* Header + mascot */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <p className="text-white/75 font-semibold text-lg mb-1">Kết quả bài</p>
              <div className="bg-herb-700 text-white font-black text-4xl md:text-5xl px-4 py-1.5 rounded-xl inline-block tracking-tight">
                Listening
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0 mt-[17px] relative z-0">
              <div className="relative bg-white text-herb-900 text-xs font-bold px-3 py-2 rounded-2xl shadow-lg mb-2 max-w-[200px] text-center leading-snug">
                {message}
                <div className="absolute -bottom-2 right-16 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white" />
              </div>
              <ResultSunMascot size={225} />
            </div>
          </div>

          {/* Stats card — lifted 100px to overlay the sun */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-20 -mt-[100px] bg-herb-700/80 backdrop-blur-md rounded-2xl p-6 grid grid-cols-4 gap-4 mb-8 shadow-xl border border-white/10"
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center text-white shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-white font-black text-2xl leading-tight">{data.correctCount}</span>
              <span className="text-white/80 text-xs font-semibold">câu đúng</span>
              <span className="text-xs font-bold text-emerald-300">{percentage(data.correctCount)}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-white shadow-md">
                <Minus className="w-6 h-6" />
              </div>
              <span className="text-white font-black text-2xl leading-tight">{data.skipped}</span>
              <span className="text-white/80 text-xs font-semibold">câu bỏ qua</span>
              <span className="text-xs font-bold text-amber-300">{percentage(data.skipped)}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-400 flex items-center justify-center text-white shadow-md">
                <X className="w-6 h-6" />
              </div>
              <span className="text-white font-black text-2xl leading-tight">{data.wrong}</span>
              <span className="text-white/80 text-xs font-semibold">câu sai</span>
              <span className="text-xs font-bold text-rose-300">{percentage(data.wrong)}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white shadow-md">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-white font-black text-2xl leading-tight">{data.band.toFixed(1)}</span>
              <span className="text-white/80 text-xs font-semibold">Band IELTS</span>
              <span className="text-xs font-bold text-blue-300">Điểm số</span>
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap pb-2">
            <button
              onClick={() => router.push(`/listening/cam-test/${data.testId}`)}
              className="inline-flex items-center gap-2 bg-white text-herb font-bold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors text-sm shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại bài
            </button>
            <Link
              href={`/listening/cam-test/${data.testId}?review=1`}
              className="inline-flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-300/40 text-white font-bold px-5 py-2.5 rounded-full hover:bg-emerald-500/40 transition-colors text-sm shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Xem Cùng Đề Bài
            </Link>
            <button
              onClick={() => { setActiveTab("review"); tabBarRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 text-white font-bold px-5 py-2.5 rounded-full hover:bg-white/20 transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Bài giải chi tiết
            </button>
            <button
              onClick={() => { setActiveTab("discuss"); tabBarRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-300/40 text-white font-bold px-5 py-2.5 rounded-full hover:bg-emerald-400/30 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Thảo Luận
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky tab bar (no site navbar on this page → stick to the very top) ── */}
      <div ref={tabBarRef} className="sticky top-0 z-[90] bg-white border-y-2 border-black shadow-[0_3px_0_rgba(0,0,0,1)]">
        <div className="max-w-full flex">
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-wider border-r-2 border-black transition-colors flex-1 justify-center md:flex-none md:justify-start ${
              activeTab === "review"
                ? "bg-herb text-white"
                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài Giải Chi Tiết</span>
          </button>
          <button
            onClick={() => setActiveTab("discuss")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-wider transition-colors flex-1 justify-center md:flex-none md:justify-start ${
              activeTab === "discuss"
                ? "bg-herb text-white"
                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Thảo Luận</span>
          </button>
        </div>
      </div>

      {/* ── Review tab: two-panel layout ── */}
      {activeTab === "review" && (
        <div className="h-[calc(100vh-72px)] overflow-hidden">
          <ReviewTwoPanel
            results={results}
            solutions={solutions}
            questionContexts={questionContexts}
            sectionTranscripts={sectionTranscripts}
            sectionAudioMap={sectionAudioMap}
          />
        </div>
      )}

      {/* ── Discuss tab ── */}
      {activeTab === "discuss" && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 bg-[#fdfcf8]">
          <MessageCircle className="w-10 h-10 mb-3 text-slate-300" />
          <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Thảo luận sắp ra mắt</p>
          <p className="text-xs mt-1">Tính năng bình luận đang được phát triển</p>
        </div>
      )}

      {/* Floating Thảo Luận button */}
      {activeTab === "review" && (
        <button
          onClick={() => { setActiveTab("discuss"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 bg-herb text-white font-black text-sm px-5 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Thảo Luận
        </button>
      )}
    </>
  );
}
