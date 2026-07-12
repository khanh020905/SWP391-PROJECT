"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "@/i18n/navigation";

const PatternBlock = ({ c1, c2, c3, c4, c5 }: any) => (
  <div className="absolute top-0 right-0 h-full w-[70%] sm:w-[55%] md:w-[45%] grid grid-cols-4 grid-rows-3 opacity-[0.85] mix-blend-multiply pointer-events-none">
    {/* Row 1 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute bottom-0 right-0 w-[80%] h-[80%] rounded-tl-full ${c3}`} />
    </div>
    <div className={`relative overflow-hidden ${c2}`}>
      <div className={`absolute bottom-0 left-0 w-[120%] h-[120%] rounded-tr-full ${c1}`} />
    </div>
    <div className={`relative overflow-hidden ${c3}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c4}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-0 right-0 w-full h-full rounded-bl-full ${c2}`} />
    </div>

    {/* Row 2 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[60%] h-[100%] rounded-l-full ${c5}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full ${c1}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c1}`}>
      <div className={`absolute bottom-0 right-0 w-full h-full rounded-tl-full ${c3}`} />
    </div>
    <div className={`relative overflow-hidden ${c5}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c1}`} />
    </div>

    {/* Row 3 */}
    <div className={`relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-[90%] h-[90%] rounded-bl-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c1}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c2}`} />
    </div>
    <div className={`relative overflow-hidden ${c2}`}>
      <div className={`absolute bottom-0 right-0 w-full h-full rounded-tl-full ${c5}`} />
    </div>
    <div className={`relative overflow-hidden ${c4}`}>
      <div className={`absolute top-0 left-0 w-full h-full rounded-br-full ${c3}`} />
    </div>
  </div>
);

const GeometricPattern = ({ variant }: { variant: 'green' | 'orange' }) => {
  const colors = variant === 'green' 
    ? { c1: 'bg-[#C2E48A]', c2: 'bg-[#9BCF5E]', c3: 'bg-[#6CAE45]', c4: 'bg-[#3A8B3D]', c5: 'bg-[#21682B]' }
    : { c1: 'bg-[#FFDE8A]', c2: 'bg-[#FFB850]', c3: 'bg-[#F28C33]', c4: 'bg-[#D96126]', c5: 'bg-[#B33B12]' };

  return <PatternBlock {...colors} />;
};

export default function WritingLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fafaf7] font-sans w-full pb-20 pt-32 overflow-x-clip">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Các Kỹ Năng Khác
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-center mb-12">
            Thư Viện <span className="text-indigo-600">Writing</span>
          </h1>
        </div>

        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
          {/* Luyện dịch IELTS */}
          <div
            onClick={() => router.push("/writing/translation")}
            className="relative overflow-hidden bg-[#88B864] rounded-2xl p-10 min-h-[320px] flex flex-col justify-center cursor-pointer transition-transform hover:-translate-y-1 shadow-[4px_4px_0_rgba(0,0,0,0.1)] group"
          >
            <GeometricPattern variant="green" />
            
            <div className="relative z-10 w-[60%]">
              <h2 className="text-4xl lg:text-5xl font-black text-[#1F3316] mb-4 tracking-tight">Luyện dịch IELTS</h2>
              <p className="text-[#3A5C2B] font-medium text-lg leading-snug mb-10">
                Học idea, phương pháp viết bài,<br />
                collocation siêu xịnnnnnn một cách tối ưu nhấtt
              </p>
              <button className="bg-[#466C32] text-white px-6 py-2.5 rounded-full font-bold inline-flex items-center gap-2 hover:bg-[#3A5C2B] transition-colors shadow-sm">
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Luyện viết IELTS */}
          <div
            onClick={() => router.push("/writing/tests")}
            className="relative overflow-hidden bg-[#FFAC4B] rounded-2xl p-10 min-h-[320px] flex flex-col justify-center cursor-pointer transition-transform hover:-translate-y-1 shadow-[4px_4px_0_rgba(0,0,0,0.1)] group"
          >
            <GeometricPattern variant="orange" />
            
            <div className="relative z-10 w-[60%]">
              <h2 className="text-4xl lg:text-5xl font-black text-[#4A290B] mb-4 tracking-tight">Luyện viết IELTS</h2>
              <p className="text-[#6B3F14] font-medium text-lg leading-snug mb-10">
                Kho câu hỏi khổng lồ, được TID<br />
                sưu tầm từ các đề thi thật ở quá khứ<br />
                Các bạn viết để được AI chấm chữa nhaa
              </p>
              <button className="bg-[#D9631C] text-white px-6 py-2.5 rounded-full font-bold inline-flex items-center gap-2 hover:bg-[#B85012] transition-colors shadow-sm">
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
