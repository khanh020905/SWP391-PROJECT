"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { BookOpen, GraduationCap, ArrowRight, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function VocabGrammarPage() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <div 
      className="min-h-screen bg-no-repeat bg-[#e5ebd8] text-[#0f1738] font-sans flex flex-col"
      style={{
        backgroundImage: "url('/assets/hero-background-new.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center top"
      }}
    >
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20">
        
        {/* Header Block */}
        <div className="text-center mb-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/85 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B5C37] mb-6">
            <Layers className="h-4 w-4" />
            TỪ VỰNG & NGỮ PHÁP
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1b3d1e] tracking-tight leading-[1.1]">
            Hôm nay bạn muốn học gì?
          </h1>
          <p className="mt-5 text-[#4e5c4c] font-medium max-w-lg mx-auto md:text-base leading-relaxed">
            Chọn học từ vựng IELTS theo từ điển chuyên sâu hoặc củng cố toàn diện cấu trúc ngữ pháp học thuật.
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-[800px]">
          
          {/* Card 1 - Vocabulary (White/Green Theme matching Reading standard mode card) */}
          <div 
            onClick={() => router.push(`/${locale}/vocabulary`)}
            className="group relative flex flex-col rounded-[32px] bg-white p-8 text-left border-2 border-[#e4e8dc] hover:border-[#3B5C37] shadow-sm hover:shadow-[0_24px_54px_rgba(59,92,55,0.12)] transition-all duration-300 active:scale-[0.98] cursor-pointer outline-none"
          >
            <div className="h-16 w-16 bg-[#edf3e8] text-[#3B5C37] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-[#1b3d1e] mb-3">Vocabulary</h2>
            <p className="text-sm font-medium text-[#4e5c4c] leading-relaxed mb-8 flex-1">
              Mở rộng vốn từ vựng theo chủ đề, học collocations, từ đồng nghĩa và ôn tập phản xạ ghi nhớ qua bộ thẻ Flashcard.
            </p>
            <div className="flex items-center gap-2 text-[#3B5C37] font-bold text-sm w-full mt-auto">
              <span>Vào học ngay</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 - Grammar (Purple/Colored Theme matching Reading bilingual card) */}
          <div 
            onClick={() => router.push(`/${locale}/grammar`)}
            className="group relative flex flex-col rounded-[32px] bg-[#6854a4] p-8 text-left border-2 border-[#58488c] hover:border-[#483c74] shadow-sm hover:shadow-[0_24px_54px_rgba(104,84,164,0.3)] transition-all duration-300 active:scale-[0.98] cursor-pointer outline-none overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
            
            <div className="relative h-16 w-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="relative text-2xl font-black text-white mb-3">Grammar</h2>
            <p className="relative text-sm font-medium text-white/80 leading-relaxed mb-8 flex-1">
              Hệ thống ngữ pháp IELTS bài bản từ B1–B6. Đầy đủ bài học lý thuyết học thuật chi tiết kèm bài tập thực hành.
            </p>
            <div className="relative flex items-center gap-2 text-white font-bold text-sm w-full mt-auto">
              <span>Vào học ngay</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
