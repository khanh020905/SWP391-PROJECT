"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { RotateCcw, ChevronRight, CheckCircle2, Minus, X, Star } from "lucide-react";
import { ResultSunMascot } from "@/components/sunMascot";

type ResultData = {
  correctCount: number;
  skipped: number;
  wrong: number;
  total: number;
  band: number;
  isFullTest?: boolean;
  testId: string;
  passage?: string;
  mode?: string;
  timeSpent?: number;
};

export default function ReadingResultPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<ResultData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("reading_result");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.testId && params.testId) {
          parsed.testId = params.testId as string;
        }
        setData(parsed);
      } catch (e) {
        console.error("Failed to parse reading result", e);
        router.push("/reading");
      }
    } else {
      router.push("/reading");
    }
  }, [router, params.testId]);

  if (!data) return null;

  const SUN_MESSAGES: Record<string, string[]> = {
    low: [
      "Cố lên, bạn đang trên hành trình nâng cấp tiếng Anh đó",
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

  const getSunMessage = (band: number): string => {
    const tier = band < 4.0 ? "low" : band < 5.5 ? "midLow" : band < 7.0 ? "mid" : band < 8.0 ? "high" : "top";
    const arr = SUN_MESSAGES[tier];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const percentage = (val: number) => data.total > 0 ? ((val / data.total) * 100).toFixed(1) : "0.0";

  const formatTime = (seconds?: number) => {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  };

  return (
    <div className="min-h-screen bg-herb relative overflow-hidden font-sans selection:bg-herb selection:text-white">
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ 
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} 
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-[12vh] pb-20">
        <div className="relative space-y-10">
          {/* Header Section */}
          <div className="relative">
            <div className="max-w-xl relative z-20">
              <h1 className="text-white font-black text-3xl md:text-4xl uppercase tracking-tight mb-1">
                Kết quả bài
              </h1>
              <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                <span className="relative inline-block">
                  Reading
                  <span className="absolute inset-x-0 bottom-2 h-1/2 bg-white/20 -z-10 rounded-lg transform -skew-x-12" />
                </span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-md">
                Dưới đây là tổng kết kết quả làm bài của bạn. 
                Cố gắng hơn nữa ở những lần tiếp theo nha!
              </p>
              {data.timeSpent != null && (
                <div className="mt-5">
                  <p className="text-white font-medium text-lg md:text-xl">
                    Thời gian làm bài: <span className="font-black text-[#a6d189]">{formatTime(data.timeSpent)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Mascot - 15% Bigger (Size 368) */}
            <div className="absolute top-1/2 -right-12 md:-right-24 z-0 transform -translate-y-[150px] md:-translate-y-[86px]">
              <ResultSunMascot size={368} message={getSunMessage(data.band)} />
            </div>
          </div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 bg-[#5b6e4e]/90 backdrop-blur-md border border-white/20 p-8 md:p-12 shadow-2xl rounded-[40px]"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-white/10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-300" />
                </div>
                <div>
                  <div className="text-white font-black text-4xl">{data.correctCount}</div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">câu đúng</div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-green-300 font-bold text-xs">{percentage(data.correctCount)}%</div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Minus className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <div className="text-white font-black text-4xl">{data.skipped}</div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">câu bỏ qua</div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-amber-300 font-bold text-xs">{percentage(data.skipped)}%</div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-300" />
                </div>
                <div>
                  <div className="text-white font-black text-4xl">{data.wrong}</div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">câu sai</div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-red-300 font-bold text-xs">{percentage(data.wrong)}%</div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Star className="w-7 h-7 text-blue-300" />
                </div>
                <div>
                  <div className="text-white font-black text-4xl">{Number(data.band).toFixed(1)}</div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">Band IELTS</div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-blue-300 font-bold text-xs">Điểm số</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => router.push(`/reading/cam/${data.testId}?mode=${data.mode === "exam" ? "exam" : "practice"}${data.passage ? `&passage=${data.passage}` : ""}`)}
              className="flex-1 group bg-white text-herb-900 font-black uppercase tracking-tight py-4 px-8 rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Làm lại bài
            </button>
            <button
              onClick={() => router.push(`/reading/cam/${data.testId}/review${data.passage ? `?passage=${data.passage}` : ""}`)}
              className="flex-1 group bg-herb-900 text-white font-black uppercase tracking-tight py-4 px-8 rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              Xem bài giải chi tiết
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
