"use client";

import { useEffect, useState, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, ArrowLeft, Loader2, RotateCcw, BookOpen, MessageCircle, ChevronRight } from "lucide-react";
import { ResultSunMascot } from "@/components/sunMascot";
import { matchesAnswerKey } from "@/utils/answerMatch";
import { formatExplanationText } from "@/utils/formatExplanation";

import { scoreToIeltsBand } from "@/utils/ieltsBand";

const SUN_MESSAGES: Record<string, string[]> = {
  low: [
    "Cố lên, bạn đang trên hành trình nâng cấp tiếng Anh đó",
    'Không sao đâu, ai giỏi IELTS cũng từng "lụm" điểm như này',
    "Mới khởi động thôi, còn nhiều tiềm năng lắm 👀",
  ],
  midLow: [
    "Khá hơn rất nhiều rồi đó, tiếp tục giữ phong độ nha 🔥",
    "Bạn đang dần hiểu cách IELTS vận hành rồi đó.",
    "Tiến bộ rõ luôn á, chỉ cần ổn định hơn chút nữa thôi.",
  ],
  mid: [
    "Ui khá dữ à nha 👏",
    "Kỹ năng đọc của bạn đang vào form cực mạnh.",
    "Không phải dạng vừa đâu 😌",
  ],
  high: [
    "Quá xịn rồi 😭🔥",
    "Band điểm này thuộc dạng rất cạnh tranh rồi đó.",
    "Bạn đang ở level mà nhiều người mơ tới 👏",
  ],
  top: [
    "Thôi khỏi khiêm tốn nữa, bạn gánh team được rồi 🫡",
    "Quái vật IELTS xuất hiện 🚨",
    "Không còn là làm bài nữa, đây là trình độ hủy diệt 💀",
  ],
};

function getSunMessage(band: number): string {
  const tier = band < 4.0 ? "low" : band < 5.5 ? "midLow" : band < 7.0 ? "mid" : band < 8.0 ? "high" : "top";
  const arr = SUN_MESSAGES[tier];
  return arr[Math.floor(Math.random() * arr.length)];
}

function StatItem({ bg, icon, value, label, sub, subColor }: {
  bg: string; icon: React.ReactNode; value: React.ReactNode;
  label: string; sub: string; subColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-white text-xl shadow-md`}>
        {icon}
      </div>
      <span className="text-white font-black text-2xl leading-tight">{value}</span>
      <span className="text-white/80 text-xs font-semibold leading-tight">{label}</span>
      <span className={`text-xs font-bold ${subColor}`}>{sub}</span>
    </div>
  );
}

export default function ReadingReviewPage() {
  const { testId } = useParams() as { testId: string };
  const searchParams = useSearchParams();

  const [submission, setSubmission] = useState<any>(null);
  const [readingTestData, setReadingTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sunMessage, setSunMessage] = useState("Hoàn thành rồi! Xem kết quả nào ✨");
  const [activeTab, setActiveTab] = useState<"review" | "discuss">(
    searchParams.get("tab") === "discuss" ? "discuss" : "review"
  );
  const tabBarRef = useRef<HTMLDivElement>(null);

  const passageParam = searchParams.get("passage") || submission?.passage || null;

  useEffect(() => {
    const data = localStorage.getItem("ielts_mock_submission");
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.testId === testId && parsed.category === "reading") {
        setSubmission(parsed);
      }
    }
  }, [testId]);

  // Newer submissions carry a `results` snapshot scored at submit time with the exact
  // same marking logic the test used — so the review numbers always match the summary
  // screen. Older submissions (or shared links) fall back to re-fetching the passage
  // from Supabase and re-scoring.
  const hasSnapshot = Array.isArray(submission?.results) && submission.results.length > 0;

  useEffect(() => {
    if (!submission || hasSnapshot) return;
    async function load() {
      try {
        console.log('Current URL param (testId):', testId);

        // Fetch from API route to bypass client RLS issues
        const res = await fetch(`/api/reading/practice/${testId}`);
        if (!res.ok) throw new Error("Failed to fetch practice exam data");
        const { exam, questions, targetSectionNo } = await res.json();

        // Map sections and questions into the structure expected by the review page
        const loadedSections = (exam.exam_sections || [])
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

            return {
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
          });

        let sortedSections = loadedSections;
        if (targetSectionNo !== null) {
          sortedSections = loadedSections.filter(p => {
            const match = p.youpass_id.match(/-(\d+)$/);
            return match && parseInt(match[1]) === targetSectionNo;
          });
        } else if (passageParam) {
          const passageNum = parseInt(passageParam);
          sortedSections = loadedSections.filter(p => {
            const match = p.youpass_id.match(/-(\d+)$/);
            return match && parseInt(match[1]) === passageNum;
          });
        }

        if (sortedSections.length > 0) {
          setReadingTestData({
            ...sortedSections[0],
            questions: sortedSections.flatMap((p) => p.questions || [])
          });
        } else {
          setError("Không tìm thấy dữ liệu bài đọc cho passage này.");
        }
      } catch (err: any) {
        setError("Lỗi khi tải dữ liệu bài giải: " + (err.message || "Unknown error"));
      }
    }
    load();
  }, [testId, passageParam, submission, hasSnapshot]);

  // Per-question results: prefer the submit-time snapshot, else derive from the
  // re-fetched passage.
  const results: any[] = (() => {
    if (hasSnapshot) return submission.results;
    const questions: any[] = readingTestData?.questions || [];
    const keyOf = (v: any) => String(v || "").trim().toLowerCase();

    // History rows saved before the full snapshot existed carry `questionResults`
    // (userAnswer + marking, no question text). Recover text/explanations from the
    // re-fetched questions: partial attempts are a contiguous block of the full
    // test, so scan for the offset where the answer keys line up.
    const qr = submission?.questionResults;
    if (Array.isArray(qr) && qr.length > 0) {
      let offset = -1;
      for (let o = 0; o + qr.length <= questions.length; o++) {
        let ok = true;
        for (let i = 0; i < qr.length; i++) {
          const q = questions[o + i];
          if (keyOf(q.correct_answer || q.correctAnswer || q.answer) !== keyOf(qr[i].correctAnswer)) {
            ok = false;
            break;
          }
        }
        if (ok) { offset = o; break; }
      }
      return qr.map((r: any, i: number) => {
        const q = offset >= 0 ? questions[offset + i] : null;
        return {
          number: r.number ?? i + 1,
          question: q?.text || q?.question || q?.question_text || "",
          answer: r.correctAnswer || "",
          explanation: q?.explanation || "",
          userAnswer: r.userAnswer || "",
          isCorrect: !!r.isCorrect,
        };
      });
    }

    return questions.map((q: any, i: number) => {
      const userAnswer = submission?.answers?.[q.id] || "";
      const correctAnswer = q.correct_answer || q.correctAnswer || q.answer || "";
      return {
        number: i + 1,
        question: q.text || q.question || q.question_text || "",
        answer: correctAnswer,
        explanation: q.explanation || "",
        userAnswer,
        isCorrect: matchesAnswerKey(userAnswer, correctAnswer),
      };
    });
  })();

  useEffect(() => {
    if (!submission) return;
    if (!hasSnapshot && !readingTestData) return; // wait for the fallback fetch
    const score = results.filter((r) => r.isCorrect).length;
    const total = results.length;
    setSunMessage(getSunMessage(scoreToIeltsBand(total >= 40 ? score : Math.round((score / Math.max(total, 1)) * 40))));
    // NOTE: this page used to POST /api/history here, but the test page already
    // saves the attempt at submit time — posting again created a duplicate row
    // on every visit to this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission, readingTestData, hasSnapshot]);

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className={error ? "text-red-500" : "text-slate-500"}>
          {error || "Không tìm thấy dữ liệu bài làm hoặc đang tải..."}
        </p>
      </div>
    );
  }

  const dataReady = hasSnapshot || !!readingTestData;
  const score = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const skipped = results.filter((r) => !String(r.userAnswer || "").trim()).length;
  const wrong = Math.max(0, total - score - skipped);
  const band = total > 0 ? scoreToIeltsBand(total >= 40 ? score : Math.round((score / total) * 40)) : 0;
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;

  return (
    <>
      <div className="relative bg-herb overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 px-6 pt-6 pb-8 md:px-10 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link
              href={submission?.fromHistory ? "/dashboard?tab=history" : "/reading"}
              className="inline-flex items-center text-white/70 hover:text-white text-sm font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay về
            </Link>

            <div className="inline-flex items-center bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full">
              Báo Cáo Kết Quả
            </div>
          </div>

          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <p className="text-white/75 font-semibold text-lg mb-1">Kết quả bài</p>
              <div className="bg-herb-900 text-white font-black text-4xl md:text-5xl px-4 py-1.5 rounded-xl inline-block tracking-tight">
                Reading
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0 mt-[17px] relative z-0">
              <div className="relative bg-white text-herb-900 text-xs font-bold px-3 py-2 rounded-2xl shadow-lg mb-2 max-w-[200px] text-center leading-snug">
                {sunMessage}
                <div className="absolute -bottom-2 right-16 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white" />
              </div>
              <ResultSunMascot size={225} />
            </div>
          </div>

          {!dataReady ? (
            <div className="bg-[#5b6e4e]/60 rounded-2xl p-6 flex items-center justify-center mb-6">
              <Loader2 className="w-6 h-6 animate-spin text-white/60" />
            </div>
          ) : (
            <div className="relative z-20 -mt-32">
              <div className="bg-[#5b6e4e]/90 backdrop-blur-md rounded-2xl p-6 grid grid-cols-4 gap-4 mb-8 shadow-xl border border-white/10">
                <StatItem bg="bg-emerald-400" icon={<span className="font-black text-lg">✓</span>} value={score} label="câu đúng" sub={`${pct(score)}%`} subColor="text-emerald-300" />
                <StatItem bg="bg-amber-400" icon={<span className="font-black text-xl leading-none">−</span>} value={skipped} label="câu bỏ qua" sub={`${pct(skipped)}%`} subColor="text-amber-300" />
                <StatItem bg="bg-rose-400" icon={<span className="font-black text-lg">✕</span>} value={wrong} label="câu sai" sub={`${pct(wrong)}%`} subColor="text-rose-300" />
                <StatItem bg="bg-blue-400" icon={<span className="text-lg">★</span>} value={band.toFixed(1)} label="Band IELTS" sub="Điểm số" subColor="text-blue-300" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap pb-2">
            <Link
              href={`/reading/cam/${testId}?mode=${submission?.mode === "exam" ? "exam" : "practice"}${passageParam ? `&passage=${passageParam}` : ""}`}
              className="inline-flex items-center gap-2 bg-white text-herb-900 font-bold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors text-sm shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại bài
            </Link>
            <Link
              href={`/reading/cam/${testId}?mode=${submission?.mode === "exam" ? "review_exam" : "review"}${passageParam ? `&passage=${passageParam}` : ""}`}
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

      {/* Tab bar — sticky to the very top (these result pages have no site navbar) */}
      <div ref={tabBarRef} className="sticky top-0 z-[90] bg-white border-y-2 border-black shadow-[0_3px_0_rgba(0,0,0,1)]">
        <div className="max-w-5xl mx-auto flex">
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

      {/* Tab content */}
      {activeTab === "review" && (
        <div className="bg-slate-50 py-10 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {error && <p className="text-red-500">{error}</p>}
            {!dataReady && !error && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}
            {(() => {
              const groupedResults: any[] = [];
              for (let i = 0; i < results.length; i++) {
                const r = results[i];
                if (
                  i > 0 &&
                  r.question && 
                  r.question === results[i-1].question &&
                  r.answer === results[i-1].answer &&
                  (r.question.toLowerCase().includes("choose two") || r.question.toLowerCase().includes("choose three") || r.question.toLowerCase().includes("letters"))
                ) {
                  const prev = groupedResults[groupedResults.length - 1];
                  prev.numbers.push(r.number ?? i + 1);
                  prev.userAnswers.push(r.userAnswer || "");
                  prev.correctCount += !!r.isCorrect ? 1 : 0;
                  prev.results.push(r);
                } else {
                  groupedResults.push({
                    id: i,
                    question: r.question,
                    answer: r.answer,
                    explanation: r.explanation,
                    numbers: [r.number ?? i + 1],
                    userAnswers: [r.userAnswer || ""],
                    correctCount: !!r.isCorrect ? 1 : 0,
                    results: [r]
                  });
                }
              }
              
              return groupedResults.map((g: any, i: number) => {
                const isAllCorrect = g.correctCount === g.numbers.length;
                const isPartiallyCorrect = g.correctCount > 0 && g.correctCount < g.numbers.length;
                const isWrong = g.correctCount === 0;
                
                const combinedUserAnswer = g.userAnswers.filter(Boolean).sort().join(", ");
                const hasAnswer = g.userAnswers.some(Boolean);
                
                return (
                  <div key={i} className={`bg-white rounded-2xl p-6 border-2 ${isAllCorrect ? "border-emerald-100" : isPartiallyCorrect ? "border-amber-100" : "border-red-100"} shadow-sm`}>
                    <div className="flex items-start justify-between mb-4">
                      <p className="font-bold text-slate-800 text-lg">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-3 h-7 rounded-full text-sm mr-3 whitespace-nowrap">
                          {g.numbers.length > 1 ? `${g.numbers[0]}-${g.numbers[g.numbers.length-1]}` : g.numbers[0]}
                        </span>
                        {g.question}
                      </p>
                      {isAllCorrect ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      ) : isPartiallyCorrect ? (
                        <CheckCircle className="w-6 h-6 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Câu Trả Lời Của Bạn</span>
                        <span className={`font-medium ${isAllCorrect ? "text-emerald-700" : isPartiallyCorrect ? "text-amber-600" : "text-red-600"}`}>
                          {hasAnswer ? combinedUserAnswer : <em className="text-slate-400">Không có câu trả lời</em>}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">Đáp Án Đúng</span>
                        <span className="font-bold text-emerald-800">{g.answer}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Giải Thích</span>
                      <p className="text-blue-900 text-sm font-medium whitespace-pre-line">{g.explanation ? formatExplanationText(g.explanation) : "No explanation available."}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {activeTab === "discuss" && (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400 font-bold">
          Thảo luận sắp ra mắt ✨
        </div>
      )}

      {/* Floating Thảo Luận button — always visible */}
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
