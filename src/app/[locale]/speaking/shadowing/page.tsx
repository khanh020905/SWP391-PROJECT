"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Play, ArrowLeft, Headphones } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function ShadowingMockupPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center pt-28 pb-20 px-6">
        <div className="w-full max-w-[1000px] mb-8">
          <Link href="/speaking" className="inline-flex items-center gap-2 text-sm font-bold text-[#667064] hover:text-[#3B5C37] transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Quay lại Speaking
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1738] text-white shadow-sm">
              <Headphones className="h-5 w-5" />
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#1b3d1e] tracking-tight">
              Shadowing: How are influencers affecting politics?
            </h1>
          </div>
          <p className="text-[#4e5c4c] font-medium text-lg mt-2">
            Bài tập Shadowing & Dictation giúp bạn luyện tập kỹ năng nghe và phát âm qua video thực tế.
          </p>
        </div>

        {/* Video Mockup Container */}
        <div className="w-full max-w-[1000px]">
          <a 
            href="/shadowing.html" 
            className="group relative block w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
          >
            {/* Background image / placeholder */}
            <div 
              className="absolute inset-0 bg-[#1f2937] bg-cover bg-center opacity-70 group-hover:opacity-50 transition-opacity duration-300"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop')" }}
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <Play className="h-10 w-10 text-white ml-2 drop-shadow-md" fill="currentColor" />
                
                {/* Ping animation rings */}
                <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center gap-3 text-white mb-3">
                <span className="px-3 py-1 rounded-full bg-[#e11d48] text-[10px] font-black uppercase tracking-wider">
                  Mockup Video
                </span>
                <span className="text-sm font-bold opacity-90">14:20</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg group-hover:text-blue-100 transition-colors">
                How are influencers affecting politics?
              </h3>
              <p className="text-white/80 mt-3 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
                Bấm vào video này để bắt đầu bài tập nghe chép chính tả (dictation) và luyện nói nhại lại (shadowing) với giao diện tương tác.
              </p>
            </div>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
