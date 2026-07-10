"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  History,
  PenLine,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { fetchWritingTasks } from "@/services/writingService";
import { WRITING_TASKS, WRITING_TEST_META } from "@/lib/writingMockData";
import { getWritingAttempts } from "@/lib/writingStorage";
import type { WritingAttemptPayload } from "@/types/writing";
import Navbar from "@/components/Navbar";

export default function WritingLobbyPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [attempts, setAttempts] = useState<WritingAttemptPayload[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "task1" | "task2">("all");

  useEffect(() => {
    setAttempts(getWritingAttempts().slice(0, 4));
    
    fetchWritingTasks()
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            id: t.id,
            taskType: t.task_type,
            label: t.task_type === "task1" ? "Writing Task 1" : "Writing Task 2",
            title: t.title,
            prompt: t.description || t.prompt || "",
            recommendedMinutes: t.task_type === "task1" ? 20 : 40,
            minimumWords: t.task_type === "task1" ? 150 : 250,
            imageUrl: t.cloudinary_url || t.thumbnail_url || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
            tags: t.tags || [t.task_type === "task1" ? "Task 1" : "Task 2"]
          }));
          setTasks(mapped);
        } else {
          // Map mock data
          const mappedMock = WRITING_TASKS.map(t => ({
            id: t.id,
            taskType: t.id,
            label: t.label,
            title: t.title,
            prompt: t.prompt,
            recommendedMinutes: t.recommendedMinutes,
            minimumWords: t.minimumWords,
            imageUrl: t.imageUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
            tags: t.assessmentFocus || []
          }));
          setTasks(mappedMock);
        }
      })
      .catch((err) => {
        console.error("Error loading writing tasks:", err);
        // Fallback mapping
        const mappedMock = WRITING_TASKS.map(t => ({
          id: t.id,
          taskType: t.id,
          label: t.label,
          title: t.title,
          prompt: t.prompt,
          recommendedMinutes: t.recommendedMinutes,
          minimumWords: t.minimumWords,
          imageUrl: t.imageUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
          tags: t.assessmentFocus || []
        }));
        setTasks(mappedMock);
      });
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.taskType === filter;
  });

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-[1160px] w-full px-6 pb-16 pt-28">
        {/* Back Link */}
        <div className="mb-6 flex">
          <Link href="/" className="text-sm font-bold text-[#3B5C37] hover:underline flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" /> Các Kỹ Năng Khác
          </Link>
        </div>

        {/* Hero Banner */}
        <section className="relative rounded-[32px] overflow-hidden mb-10 bg-[#e8ede6] p-8 md:p-12 shadow-[0_16px_40px_rgba(59,92,55,0.06)] border border-[#e2e7da]">
          <div className="relative z-10 max-w-[700px]">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-[#3B5C37] text-xs font-bold uppercase tracking-wider mb-5 border border-[#c9d6bf]/60">
              <PenLine className="w-3.5 h-3.5" />
              IELTS Academic Writing
            </span>

            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4 text-[#16351a]">
              Thư Viện{" "}
              <span className="bg-gradient-to-r from-[#16351a] to-[#3B5C37] bg-clip-text text-transparent">
                Writing-tests
              </span>
            </h1>

            <p className="text-sm md:text-base text-[#4e5c4c] font-medium leading-relaxed mb-8 max-w-[560px]">
              Phát triển kỹ năng Writing với bộ đề thi được mô phỏng bám sát định dạng thực tế. Luyện viết dưới áp lực thời gian và nhận phản hồi tức thì.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Clock, label: "60 phút tổng" },
                { icon: FileText, label: "Task 1 & Task 2" },
                { icon: CheckCircle2, label: "Tự động đếm từ" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs font-bold text-[#4e5c4c] bg-white/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#c9d6bf]/50">
                  <item.icon className="w-3.5 h-3.5 text-[#3B5C37]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sentence Translation Promotion Card */}
        <section className="relative rounded-[32px] overflow-hidden mb-10 bg-white p-6 md:p-8 border-2 border-[#1b3d1e] shadow-[6px_6px_0px_#1b3d1e] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1b3d1e] duration-200">
          <div className="flex gap-5 items-start">
            <div className="h-14 w-14 bg-[#edf3e8] text-[#3B5C37] rounded-2xl flex items-center justify-center shrink-0 border border-[#ccd6c5]">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <span className="inline-block bg-[#edf3e8] border border-[#d8e3d1] text-[#3B5C37] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-2">
                LUYỆN TẬP BỔ TRỢ
              </span>
              <h3 className="text-xl font-black text-[#1b3d1e]">
                Luyện dịch viết IELTS (Sentence Translation)
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-1 max-w-2xl leading-relaxed">
                Rèn luyện khả năng tư duy song ngữ bằng cách dịch câu tiếng Việt sang tiếng Anh học thuật. Có chấm câu chi tiết, phân tích lỗi sai và mở rộng cấu trúc ngữ pháp/từ vựng theo chủ đề viết.
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/writing/translation`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3B5C37] px-6 py-4 text-xs font-black text-white hover:bg-[#2c472a] shadow-md shadow-[#3B5C37]/10 hover:shadow-lg active:scale-[0.98] transition-all shrink-0 cursor-pointer select-none no-underline"
          >
            LUYỆN DỊCH NGAY
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </section>

        {/* Tab Controls and Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-black text-[#1b3d1e] tracking-tight">Danh sách đề thi Writing</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Chọn một Task bất kỳ dưới đây để bắt đầu bài thi viết đơn lẻ.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex rounded-xl bg-gray-150 p-1 self-start sm:self-auto border border-gray-200 shadow-sm">
            {(
              [
                { id: "all", label: "Tất cả" },
                { id: "task1", label: "Task 1" },
                { id: "task2", label: "Task 2" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${
                  filter === tab.id
                    ? "bg-[#3B5C37] text-white shadow-sm"
                    : "text-[#5c6488] hover:text-[#0f1738]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-12 text-center font-bold text-gray-500 bg-white rounded-3xl border border-gray-200">
              Không tìm thấy đề thi phù hợp.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-[32px] border border-gray-150 p-6 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300"
              >
                <div>
                  <div className="flex gap-6 items-start">
                    {/* Image */}
                    <div className="relative w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] shrink-0 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <img
                        src={task.imageUrl}
                        alt={task.title}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col gap-2 pt-1 min-w-0 flex-1">
                      <div>
                        <span className="inline-block bg-[#fefdf0] border border-[#f5e0aa] text-[#b07d0a] text-[10px] font-black uppercase px-3 py-1 rounded-full">
                          {task.label}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-[#0f1738] leading-tight line-clamp-2">
                        {task.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {task.tags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="bg-[#f0f4ed] text-[#3B5C37] px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.recommendedMinutes} phút
                        </span>
                        <span>•</span>
                        <span>Tối thiểu {task.minimumWords} từ</span>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  <p className="mt-5 text-sm font-semibold leading-relaxed text-gray-600 line-clamp-3 bg-[#fafbfe] p-4 rounded-2xl border border-gray-50">
                    {task.prompt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <Link
                    href={`/writing/test?taskId=${task.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3B5C37] px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-[#3B5C37]/10 hover:bg-[#2f4a2b] hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer select-none"
                  >
                    LUYỆN TẬP NGAY
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* History Section */}
        <section className="mt-12 rounded-[32px] border border-[#e8ebf3] bg-white p-8 shadow-[0_4px_32px_rgba(20,28,60,0.02)]">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
            <h2 className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-[#5c6488]">
              <History className="h-4 w-4 text-[#3B5C37]" />
              Lịch sử làm bài Writing
            </h2>
            <span className="text-xs font-bold text-[#8a91a8]">
              {attempts.length ? `${attempts.length} bài gần nhất` : "Chưa có bài làm"}
            </span>
          </div>

          {attempts.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/writing/result?id=${attempt.id}`}
                  className="rounded-2xl border border-[#edf0f5] bg-[#fafbfe] p-5 transition hover:border-[#3B5C37]/40 hover:bg-white flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-black text-[#0f1738]">
                      {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                    </p>
                    <p className="mt-2 text-xs font-bold text-gray-500">
                      {attempt.wordCounts.task1 > 0 ? `Task 1: ${attempt.wordCounts.task1} từ` : ""}
                      {attempt.wordCounts.task1 > 0 && attempt.wordCounts.task2 > 0 ? " • " : ""}
                      {attempt.wordCounts.task2 > 0 ? `Task 2: ${attempt.wordCounts.task2} từ` : ""}
                    </p>
                  </div>
                  {attempt.feedback && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Band ước tính: {attempt.feedback.estimatedBand}</span>
                      <span className="text-xs font-black text-[#3B5C37] flex items-center gap-0.5">Chi tiết <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-8 text-center text-xs font-semibold text-[#8a91a8]">
              Bài Writing đã nộp sẽ xuất hiện ở đây. Hãy chọn một đề thi ở trên để bắt đầu thử sức!
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
