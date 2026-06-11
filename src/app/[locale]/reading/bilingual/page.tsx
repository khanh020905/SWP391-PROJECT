"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

interface Publisher {
  id: string;
  name: string;
  logoText: string;
  logoFont: string;
  image: string;
  customStyle?: React.CSSProperties;
  logoPrefix?: React.ReactNode;
  badge?: string;
}

const PUBLISHERS: Publisher[] = [
  {
    id: "the-atlantic",
    name: "The Atlantic",
    logoText: "The Atlantic",
    logoFont: "font-serif italic text-3xl",
    image: "/assets/bilingual/atlantic.png",
  },
  {
    id: "the-new-york-times",
    name: "The New York Times",
    logoText: "The New York Times",
    logoFont: "text-[26px]",
    image: "/assets/bilingual/nytimes.png",
    customStyle: { fontFamily: "'Chomsky', 'Old English Text MT', serif" },
  },
  {
    id: "reuters",
    name: "Reuters",
    logoText: "REUTERS",
    logoFont: "font-sans font-black tracking-widest text-[#404040] text-xl",
    image: "/assets/bilingual/reuters.png",
    logoPrefix: (
      <svg width="28" height="28" viewBox="0 0 40 40" className="mr-2.5 shrink-0">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f26522" strokeWidth="4" strokeDasharray="3.5 5" />
      </svg>
    ),
  },
  {
    id: "substack",
    name: "Substack",
    logoText: "Substack",
    logoFont: "font-serif font-bold text-2xl tracking-tight text-black",
    image: "/assets/bilingual/substack.png",
    logoPrefix: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2 shrink-0" fill="#FF6719">
        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.086H1.46v2.836h21.08v-2.836zM22.539 15.93H1.46v6.59l10.54-5.885 10.54 5.885v-6.59zM1.46 1.564h21.08v2.836H1.46V1.564z" />
      </svg>
    ),
  },
  {
    id: "economist",
    name: "The Economist",
    logoText: "The Economist",
    logoFont: "font-serif font-black text-white bg-[#e3120b] px-3 py-1.5 tracking-tight text-[22px]",
    image: "/assets/bilingual/economist.png",
  },
  {
    id: "guardian",
    name: "The Guardian",
    logoText: "The Guardian",
    logoFont: "font-serif font-black tracking-tighter leading-none text-3xl text-[#052962]",
    image: "/assets/bilingual/guardian.png",
    customStyle: { letterSpacing: '-0.05em' },
  },
];

export default function BilingualPressPortal() {
  return (
    <div className="min-h-screen bg-[#617c46] relative overflow-hidden font-sans">
      {/* CSS Grid Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12">
        <Link 
          href="/reading" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Reading
        </Link>

        <div className="mb-14 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white/90 text-xs font-bold tracking-widest uppercase mb-6 bg-white/5 backdrop-blur-sm">
            📰 BILINGUAL PRESS PORTAL
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Đọc Báo Song Ngữ
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-xl font-medium">
            Tuyển tập các bài viết song ngữ Anh - Việt từ những đầu báo uy tín nhất thế giới, giúp bạn nâng cao từ vựng học thuật và phản xạ đọc hiểu tự nhiên.
          </p>
        </div>

        {/* Grid of Publishers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {PUBLISHERS.map((pub) => (
            <Link 
              key={pub.id}
              href={`/reading/bilingual/${pub.id}`}
              className="group block relative bg-white rounded-3xl border-[6px] border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_rgba(0,0,0,1)] transition-all duration-300"
            >
              {pub.badge && (
                <div className="absolute top-4 right-4 z-20 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-full border-2 border-black rotate-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase">
                  {pub.badge}
                </div>
              )}
              <div className="p-5 flex items-center min-h-[76px]">
                {pub.logoPrefix}
                <h3 className={pub.logoFont} style={pub.customStyle as React.CSSProperties}>
                  {pub.logoText}
                </h3>
              </div>
              <div className="w-full aspect-[4/5] relative bg-gray-100 border-t-4 border-black">
                <Image 
                  src={pub.image}
                  alt={pub.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-w-768px) 100vw, (max-w-1024px) 50vw, 33vw"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
