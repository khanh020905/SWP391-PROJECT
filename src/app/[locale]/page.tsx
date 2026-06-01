"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";


const getSkillCards = (t: any) => [
  {
    src: "/assets/skill-choose-section/listening.jpeg",
    alt: t("skills.listening.title"),
    href: "/listening",
    title: "Listening",
    desc: t("skills.listening.desc"),
    badge: t("skills.listening.count"),
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#5b7a95]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 00-18 0v4a2 2 0 002 2h2v-6h-2M21 12v4a2 2 0 01-2 2h-2v-6h2" />
      </svg>
    )
  },
  {
    src: "/assets/skill-choose-section/reading.jpeg",
    alt: t("skills.reading.title"),
    href: "/reading",
    title: "Reading",
    desc: t("skills.reading.desc"),
    badge: "100+ Đề",
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#5c985c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    src: "/assets/skill-choose-section/speaking.jpeg",
    alt: t("skills.speaking.title"),
    href: "/speaking",
    title: "Speaking",
    desc: t("skills.speaking.desc"),
    badge: "100+ Đề",
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#c78b42]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    src: "/assets/skill-choose-section/writting.jpeg",
    alt: t("skills.writing.title"),
    href: "/writing",
    title: "Writing",
    desc: t("skills.writing.desc"),
    badge: "100+ Đề",
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#bd6470]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  },
  {
    src: "/assets/skill-choose-section/orientation.jpeg",
    alt: "Định Hướng Tự Học",
    href: "/orientation",
    title: t("skills.orientation.title"),
    desc: t("skills.orientation.desc"),
    badge: t("skills.orientation.count"),
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#8b6ba8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
      </svg>
    )
  },
  {
    src: "/assets/skill-choose-section/vocab-grammar.jpeg",
    alt: "Vocab & Grammar",
    href: "/vocab-grammar",
    title: t("skills.vocabGrammar.title"),
    desc: t("skills.vocabGrammar.desc"),
    badge: "100+ Đề",
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#4a8a7a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
];

export default function Home() {
  const t = useTranslations("home");
  const skillCards = getSkillCards(t);
  return (
    <div className="bg-[#f4f5f9] text-[#0f1738]">
      <Navbar />

      <section
        className="relative w-full h-screen min-h-[600px] bg-no-repeat overflow-hidden bg-[#e5ebd8]"
        style={{
          backgroundImage: "url('/assets/hero-background-new.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center top"
        }}
      >
        {/* Full Screen Overlay Container that matches the aspect ratio of the image */}
        <div className="absolute inset-0 mx-auto w-full max-w-[1160px] h-full pointer-events-none select-none">
          
          {/* Left Column Stack */}
          <div className="absolute left-[36px] top-[calc(18%+80px)] sm:top-[calc(20%+80px)] md:top-[calc(22%+80px)] max-w-[650px] pointer-events-auto text-left select-text flex flex-col gap-6 md:gap-8">
            
            {/* Headline Group */}
            <div>
              <h1 className="font-extrabold text-[#1b3d1e] leading-tight">
                <span className="block text-3xl sm:text-4xl md:text-5xl tracking-tight mb-1">
                  {t("hero.tagline")}
                </span>
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tight leading-[1.05]">
                  {t("hero.title")}
                </span>
              </h1>
              <p className="mt-4 text-xs sm:text-sm md:text-base lg:text-[17px] font-medium text-[#4e5c4c] leading-relaxed max-w-[500px]">
                {t("hero.subtitle")}
              </p>
            </div>

            {/* Follow Us On Links */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-wider text-[#4e5c4c] uppercase mr-1">{t("hero.followUs")}</span>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-[#1877f2] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-black flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.032 2.61-.005 3.91-.012.08 1.543.705 3.013 1.782 4.12 1.094 1.097 2.574 1.71 4.123 1.776v3.832c-1.637-.024-3.238-.54-4.59-1.455-.41-.284-.795-.61-1.144-.975v7.242c.04 3.738-2.61 7.158-6.31 7.787-3.79.69-7.55-1.71-8.525-5.46-.994-3.593 1.077-7.614 4.67-8.73 1.114-.363 2.296-.39 3.424-.132v3.916c-.846-.226-1.74-.183-2.553.18-1.282.535-2.096 1.942-1.93 3.325.178 1.637 1.63 2.916 3.28 2.766 1.488-.066 2.72-1.218 2.87-2.7.072-1.042.023-2.094.043-3.14V0h.07z"/>
                </svg>
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/speaking"
                className="inline-flex items-center justify-center rounded-full bg-[#3B5C37] hover:bg-[#1f3e1b] px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3.5 text-[10px] sm:text-xs md:text-sm font-black text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer select-none"
              >
                {t("blog.link")}
              </Link>
              <Link
                href="/exam/review"
                className="inline-flex items-center justify-center rounded-full bg-[#ebefe0] border-2 border-[#3B5C37] text-[#3B5C37] hover:bg-[#3B5C37] hover:text-white px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3.5 text-[10px] sm:text-xs md:text-sm font-black shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer select-none gap-1.5"
              >
                <span>{t("hero.ctaFree")}</span>
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

          </div>

        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-4 pt-6 md:px-8">
        {/* Skill Choose Section */}
        <div className="mb-4 w-full overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-4 md:gap-5 lg:grid lg:grid-cols-6 lg:gap-5 min-w-max lg:min-w-0 px-2 lg:px-2 py-3 pr-4">
            {skillCards.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="snap-start relative flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px] lg:w-full h-[400px] md:h-[420px] lg:h-[450px] transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden block border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] group"
              >
                <img src={item.src} alt={item.alt} className="absolute inset-0 w-full h-full object-cover object-bottom" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col p-4 md:p-5 pointer-events-none">
                  {/* Icon Box */}
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center mb-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-[#1f3e1b] text-[17px] md:text-[19px] leading-[1.15] mb-2 whitespace-pre-line group-hover:text-[#2d5727] transition-colors drop-shadow-sm">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] md:text-[12px] font-bold text-[#1f3e1b]/90 leading-[1.4] max-w-[90%] drop-shadow-sm">
                    {item.desc}
                  </p>
                </div>

                {/* Badge */}
                <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#2c4728] text-white px-4 md:px-5 py-1.5 rounded-full text-[11px] md:text-[12px] font-extrabold whitespace-nowrap tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {item.badge}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1160px] px-4 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4">
        <section className="mb-6 rounded-3xl bg-white p-8 md:p-12 shadow-[0_4px_32px_rgba(20,28,60,0.07)]">
          <h2 className="text-center text-3xl md:text-4xl font-extrabold text-[#141c41]">
            {t("cambridge.title")} <span className="text-[#3B5C37]">{t("cambridge.range")}</span>
          </h2>
          <p className="mt-3 text-center text-[15px] text-[#5a6282]">{t("cambridge.desc")}</p>

          {/* Book covers */}
          <div className="mt-10 flex items-center justify-center gap-3 md:gap-4 flex-wrap">
            {[
              { num: "9", color: "#a78bfa" },
              { num: "10", color: "#818cf8" },
              { num: "11", color: "#c084fc" },
              { num: "12", color: "#a78bfa" },
              { num: "13", color: "#818cf8" },
            ].map((book) => (
              <div
                key={book.num}
                className="group relative w-[90px] md:w-[115px] aspect-[3/4.2] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:-translate-y-1 shadow-[0_12px_28px_rgba(16,21,60,0.25)]"
                style={{
                  background: `linear-gradient(145deg, #111424 0%, #151932 60%, ${book.color}40 100%)`,
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                {/* Spine effect */}
                <div className="absolute left-0 top-0 h-full w-[6px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)" }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-start justify-start h-full pl-3 pr-2 py-3 w-full">
                  {/* Top: Logo and Shield */}
                  <div className="flex justify-between w-full items-start mb-1.5">
                    <div className="flex flex-col">
                      <span className="text-[5px] md:text-[6px] font-bold tracking-[0.05em] text-white/90 leading-none">CAMBRIDGE</span>
                      <span className="text-[4px] md:text-[5px] font-medium tracking-wide text-white/70 leading-none mt-0.5">UNIVERSITY PRESS</span>
                    </div>
                    {/* Gold Shield Placeholder */}
                    <div className="w-2.5 h-3 bg-gradient-to-br from-[#f2d06b] to-[#b8860b] rounded-b-sm shadow-sm" />
                  </div>

                  <div className="text-[6.5px] md:text-[7.5px] font-medium tracking-[0.1em] text-white/90 mt-1">CAMBRIDGE</div>
                  <div className="text-[22px] md:text-[26px] font-extrabold text-white leading-none mt-0.5 tracking-tight font-sans">IELTS</div>

                  {/* Number */}
                  <div className="text-[36px] md:text-[44px] font-normal mt-0.5 leading-none" style={{ color: book.color }}>
                    {book.num}
                  </div>

                  {/* Academic */}
                  <div className="text-[5px] md:text-[6px] font-semibold tracking-[0.1em] text-white/80 mt-auto mb-1">ACADEMIC</div>

                  {/* Bottom right graphic */}
                  <div className="absolute bottom-2 right-2 w-8 h-8 opacity-50 flex items-end justify-end">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full" style={{ color: book.color }}>
                      <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {/* Dots separator */}
            <div className="flex items-center justify-center w-[30px] md:w-[40px] self-center">
              <span className="text-xl md:text-2xl font-bold text-[#141c41] tracking-[0.15em]">...</span>
            </div>

            {/* Book 20 - Orange */}
            <div
              className="group relative w-[90px] md:w-[115px] aspect-[3/4.2] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:-translate-y-1 shadow-[0_12px_28px_rgba(230,90,16,0.25)]"
              style={{
                background: "linear-gradient(145deg, #ff8c42 0%, #f46217 50%, #d63d00 100%)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <div className="absolute left-0 top-0 h-full w-[6px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.15) 100%)" }} />
              <div className="relative z-10 flex flex-col items-start justify-start h-full pl-3 pr-2 py-3 w-full">
                <div className="flex justify-between w-full items-start mb-1.5">
                  <div className="flex flex-col">
                    <span className="text-[5px] md:text-[6px] font-bold tracking-[0.05em] text-white/90 leading-none">CAMBRIDGE</span>
                    <span className="text-[4px] md:text-[5px] font-medium tracking-wide text-white/80 leading-none mt-0.5">UNIVERSITY PRESS</span>
                  </div>
                  <div className="w-2.5 h-3 bg-gradient-to-br from-[#f2d06b] to-[#b8860b] rounded-b-sm shadow-sm" />
                </div>

                <div className="text-[6.5px] md:text-[7.5px] font-medium tracking-[0.1em] text-white/90 mt-1">CAMBRIDGE</div>
                <div className="text-[22px] md:text-[26px] font-extrabold text-white leading-none mt-0.5 tracking-tight font-sans">IELTS</div>

                <div className="text-[36px] md:text-[44px] font-normal mt-0.5 leading-none text-white">
                  20
                </div>

                <div className="text-[5px] md:text-[6px] font-semibold tracking-[0.1em] text-white/90 mt-auto mb-1">ACADEMIC</div>

                <div className="absolute bottom-2 right-2 w-8 h-8 opacity-40 flex items-end justify-end">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" className="w-full h-full">
                    <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline progress bar */}
          <div className="mt-10 flex items-center justify-center w-full max-w-[800px] mx-auto px-2 md:px-4">
            {/* Number 9 circle */}
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#B38F4D] flex items-center justify-center text-white text-sm md:text-base font-bold shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
              9
            </div>

            {/* Progress line with dots */}
            <div
              className="flex-1 h-[6px] mx-2 md:mx-4"
              style={{
                background: "linear-gradient(90deg, #B38F4D 0%, #3B5C37 100%)",
                WebkitMaskImage: "radial-gradient(circle, black 2.5px, transparent 2.5px), linear-gradient(black, black)",
                WebkitMaskSize: "28px 6px, 100% 2px",
                WebkitMaskPosition: "center, center",
                WebkitMaskRepeat: "repeat-x, no-repeat",
              }}
            />

            {/* Number 20 circle */}
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#3B5C37] flex items-center justify-center text-white text-sm md:text-base font-bold shadow-[0_4px_12px_rgba(59, 92, 55,0.4)]">
              20
            </div>
          </div>

          {/* Feature badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">{t("cambridge.features.official")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">{t("cambridge.features.realExam")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">{t("cambridge.features.aiEval")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">{t("cambridge.features.detailedFeedback")}</span>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2 items-center">
          {/* Left side - Text content */}
          <div className="p-6 md:p-8">
            <h3 className="text-4xl md:text-5xl leading-[1.08] font-extrabold text-[#121a3c]">
              {t("adaptive.titlePart1")}
              <br />
              {t("adaptive.titlePart2")} <span className="text-[#3B5C37]">{t("adaptive.titlePart3")}</span>
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[#5b6484]">
              {t("adaptive.desc")}
            </p>

            {/* Feature bullets */}
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#f2f6ee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B5C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#121a3c] text-[15px]">{t("adaptive.diagnose.title")}</div>
                  <div className="text-sm text-[#6b7394]">{t("adaptive.diagnose.desc")}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#f2f6ee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B5C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#121a3c] text-[15px]">{t("adaptive.personalize.title")}</div>
                  <div className="text-sm text-[#6b7394]">{t("adaptive.personalize.desc")}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#f2f6ee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B5C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#121a3c] text-[15px]">{t("adaptive.improve.title")}</div>
                  <div className="text-sm text-[#6b7394]">{t("adaptive.improve.desc")}</div>
                </div>
              </div>
            </div>

            <button className="mt-8 rounded-xl bg-[#3B5C37] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59, 92, 55,0.3)] hover:shadow-[0_12px_28px_rgba(59, 92, 55,0.4)] transition-all duration-300 flex items-center gap-2">
              {t("adaptive.cta")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Right side - Dashboard card */}
          <div className="relative">
            <div className="rounded-2xl bg-white border border-[#e8ebf3] shadow-[0_8px_40px_rgba(20,28,60,0.08)] overflow-visible relative">
              <div className="flex">
                {/* Sidebar navigation */}
                <div className="hidden md:flex flex-col w-[140px] border-r border-[#eef0f6] bg-[#fafbfe] p-3 gap-1 rounded-l-2xl">
                  {[
                    { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: t("dashboard.sidebar.overview"), active: true },
                    { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: t("dashboard.sidebar.practice"), active: false },
                    { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: t("dashboard.sidebar.mockTests"), active: false },
                    { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: t("dashboard.sidebar.progress"), active: false },
                    { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: t("dashboard.sidebar.aiTutor"), active: false },
                    { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: t("dashboard.sidebar.reports"), active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium cursor-pointer transition-colors ${item.active
                          ? "bg-white text-[#3B5C37] shadow-sm font-semibold"
                          : "text-[#7b83a6] hover:bg-white/60"
                        }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  ))}
                  <div className="mt-4 flex justify-center pointer-events-none">
                    <img
                      src="/assets/perfectshit.png"
                      alt="AI Robot Assistant"
                      className="h-[118px] w-[118px] object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                    />
                  </div>
                </div>

                {/* Main dashboard content */}
                <div className="flex-1 p-5 relative">
                  {/* {t("dashboard.progress.title")} header + {t("dashboard.progress.subtitle")} */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-[#1a2348] text-[15px]">Your Progress</span>
                        <span className="text-xs text-[#8b90b0]">Overall Band</span>
                      </div>
                      {/* Chart area */}
                      <div className="relative h-[120px] rounded-xl bg-gradient-to-b from-white to-[#f8f9ff] border border-[#eef0f6] overflow-hidden">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-3 px-4">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="border-b border-dashed border-[#eef0f6]" />
                          ))}
                        </div>
                        {/* Chart line (SVG) */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B5C37" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#3B5C37" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M20 90 Q60 85 100 80 T180 65 T260 45 T340 35 T380 30" fill="none" stroke="#3B5C37" strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M20 90 Q60 85 100 80 T180 65 T260 45 T340 35 T380 30 L380 120 L20 120 Z" fill="url(#chartGrad)" />
                        </svg>
                        {/* Month labels */}
                        <div className="absolute bottom-1 inset-x-0 flex justify-between px-4 text-[10px] text-[#a0a5c0]">
                          <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                      </div>
                    </div>
                    {/* Overall Band circle */}
                    <div className="ml-5 flex flex-col items-center">
                      <div className="relative w-[90px] h-[90px]">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#eef0f6" strokeWidth="6" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#3B5C37" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${0.75 * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-extrabold text-[#1a2348]">7.5</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs font-medium text-[#2fa56f] flex items-center gap-1">
                        {t("dashboard.progress.message")}
                      </div>
                      <div className="text-[11px] text-[#2fa56f] font-semibold mt-0.5">▲ 1.5</div>
                    </div>
                  </div>

                  {/* {t("dashboard.breakdown.title")} */}
                  <div className="mt-4">
                    <div className="font-bold text-[#1a2348] text-[14px] mb-3">Skill Breakdown</div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { score: "8.5", label: t("skills.listening.title"), level: t("dashboard.breakdown.levelAdvanced"), color: "#3B5C37" },
                        { score: "7.0", label: t("skills.reading.title"), level: t("dashboard.breakdown.levelGood"), color: "#3b82f6" },
                        { score: "7.0", label: t("skills.writing.title"), level: t("dashboard.breakdown.levelGood"), color: "#8b5cf6" },
                        { score: "7.5", label: t("skills.speaking.title"), level: t("dashboard.breakdown.levelGood"), color: "#10b981" },
                      ].map((skill) => (
                        <div key={skill.label} className="flex flex-col items-center">
                          <div className="relative w-[52px] h-[52px]">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                              <circle cx="30" cy="30" r="24" fill="none" stroke="#eef0f6" strokeWidth="4" />
                              <circle
                                cx="30" cy="30" r="24" fill="none"
                                stroke={skill.color}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${(parseFloat(skill.score) / 9) * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[13px] font-extrabold text-[#1a2348]">{skill.score}</span>
                            </div>
                          </div>
                          <div className="mt-1.5 text-[11px] font-semibold text-[#1a2348]">{skill.label}</div>
                          <div className="text-[10px] text-[#8b90b0]">{skill.level}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* {t("dashboard.aiRec.title")} */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f8f5ff] border border-[#e8e0f8] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#B38F4D] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#5b21b6]">AI Recommendation</div>
                        <div className="text-[11px] text-[#7c7fa0]">{t("dashboard.aiRec.desc")}</div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#3B5C37] cursor-pointer hover:underline whitespace-nowrap">{t("dashboard.aiRec.cta")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why QualiCode */}
        <section className="mb-6 rounded-3xl bg-[linear-gradient(135deg,#0c1a0e_0%,#1a331c_40%,#2a4d2c_100%)] px-6 py-8 md:px-10 md:py-10 text-white overflow-hidden relative">
          {/* Decorative blurred circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#3B5C37]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#4f84ff]/10 blur-3xl" />

          <h3 className="mb-8 text-center text-2xl md:text-3xl font-extrabold relative z-10">
            {t("features.titlePrefix")} <span className="text-[#B38F4D]">{t("features.titleHighlight")}</span>
          </h3>
          <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-0 md:grid-cols-5 md:divide-x md:divide-white/10">
            {[
              {
                title: t("features.items.aiLearning.title"),
                desc: t("features.items.aiLearning.desc"),
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#B38F4D" strokeWidth={1.8}>
                    {/* Brain icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 8c-3.5 0-6.5 1.2-8.5 3.5C13.5 14 12.5 17 13 20c-2 1-3 3-3 5.5 0 3 2 5.5 4.5 6 .5 2.5 2.5 4.5 5.5 4.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 8c3.5 0 6.5 1.2 8.5 3.5 2 2.5 3 5.5 2.5 8.5 2 1 3 3 3 5.5 0 3-2 5.5-4.5 6-.5 2.5-2.5 4.5-5.5 4.5" />
                    <path strokeLinecap="round" d="M24 8v28M18 16h12M16 22h4M28 22h4M18 28h4M26 28h4" />
                  </svg>
                ),
              },
              {
                title: t("features.items.adaptive.title"),
                desc: t("features.items.adaptive.desc"),
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#B38F4D" strokeWidth={1.8}>
                    {/* Target/bullseye icon */}
                    <circle cx="24" cy="24" r="18" />
                    <circle cx="24" cy="24" r="12" />
                    <circle cx="24" cy="24" r="6" />
                    <circle cx="24" cy="24" r="2" fill="#B38F4D" />
                    <path strokeLinecap="round" d="M34 14l-7 7" />
                    <path strokeLinecap="round" d="M32 10h6v6" />
                  </svg>
                ),
              },
              {
                title: t("features.items.cambridge.title"),
                desc: t("features.items.cambridge.desc"),
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#B38F4D" strokeWidth={1.8}>
                    {/* Book with bookmark icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8a4 4 0 014 4v22a3 3 0 00-3-3H8V10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M40 10h-8a4 4 0 00-4 4v22a3 3 0 013-3h9V10z" />
                    <path strokeLinecap="round" d="M18 18h4M26 18h4M18 24h4M26 24h4" />
                    <path strokeLinejoin="round" d="M32 10v10l3-2.5 3 2.5V10" fill="none" />
                  </svg>
                ),
              },
              {
                title: t("features.items.feedback.title"),
                desc: t("features.items.feedback.desc"),
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#B38F4D" strokeWidth={1.8}>
                    {/* Chat bubble with lightning */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h24a2 2 0 012 2v16a2 2 0 01-2 2H16l-6 6v-6H8a2 2 0 01-2-2V12a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 16l-3 6h6l-3 6" />
                    <circle cx="38" cy="18" r="7" />
                    <path strokeLinecap="round" d="M36 16l2 2 4-4" />
                  </svg>
                ),
              },
              {
                title: t("features.items.privacy.title"),
                desc: t("features.items.privacy.desc"),
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#B38F4D" strokeWidth={1.8}>
                    {/* Shield lock icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 4L8 12v10c0 11 7 20 16 22 9-2 16-11 16-22V12L24 4z" />
                    <rect x="18" y="22" width="12" height="10" rx="2" strokeLinejoin="round" />
                    <path strokeLinecap="round" d="M21 22v-4a3 3 0 016 0v4" />
                    <circle cx="24" cy="27" r="1.5" fill="#B38F4D" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="group flex flex-col items-center text-center px-3 py-4 md:px-5 transition-all duration-300 hover:scale-[1.03]">
                <div className="mb-3">{f.icon}</div>
                <div className="text-[14px] font-bold mb-1">{f.title}</div>
                <div className="text-[11px] text-white/55 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Loved by Learners Worldwide */}
        <section className="mb-6 rounded-3xl bg-white p-8 md:p-12 shadow-[0_4px_32px_rgba(20,28,60,0.07)]">
          <h3 className="mb-8 text-center text-3xl md:text-4xl font-extrabold text-[#141b40]">
            {t("testimonials.titlePrefix")} <span className="text-[#3B5C37]">{t("testimonials.titleHighlight")}</span> {t("testimonials.titleSuffix")}
          </h3>
          <div className="relative">
            {/* Navigation arrows */}
            <button className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#e8ebf3] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#4b5472] hover:bg-[#f8f9fc] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#e8ebf3] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#4b5472] hover:bg-[#f8f9fc] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="grid gap-5 md:grid-cols-3 px-4">
              {[
                {
                  name: t("testimonials.items.ananya.name"),
                  band: t("testimonials.items.ananya.band"),
                  quote: t("testimonials.items.ananya.quote"),
                  color: "#3B5C37",
                },
                {
                  name: t("testimonials.items.minh.name"),
                  band: t("testimonials.items.minh.band"),
                  quote: t("testimonials.items.minh.quote"),
                  color: "#3b82f6",
                },
                {
                  name: t("testimonials.items.fatima.name"),
                  band: t("testimonials.items.fatima.band"),
                  quote: t("testimonials.items.fatima.quote"),
                  color: "#8b5cf6",
                },
              ].map((item) => (
                <article
                  key={item.name}
                  className="relative rounded-2xl border border-[#e8ebf3] bg-[#fafbfe] p-6 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(20,28,60,0.08)] hover:border-[#d0d4e4]"
                >
                  {/* Quote mark */}
                  <div className="mb-3 text-3xl font-serif leading-none" style={{ color: item.color }}>
                    &ldquo;&ldquo;
                  </div>
                  <p className="mb-5 text-[14px] leading-relaxed text-[#495170]">
                    {item.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-[#eef0f6]">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${item.color}99, ${item.color})` }}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#182045]">— {item.name}</div>
                      <div className="text-[11px] text-[#8b90b0]">{item.band}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Ready to Achieve */}
        <section className="relative mt-12 rounded-3xl overflow-visible" style={{ background: "linear-gradient(105deg, #1a331c 0%, #3B5C37 40%, #5c8257 100%)" }}>
          {/* Decorative overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative z-10 flex flex-col items-center gap-6 p-8 md:p-0 md:flex-row md:items-end">
            {/* Robot mascot */}
            <div className="hidden md:block flex-shrink-0 w-[300px] h-[300px] relative -ml-8 -mt-12 -mb-8">
              <img
                src="/assets/perfectshit.png"
                alt="AI Robot Mascot"
                className="w-full h-full object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
              />
            </div>

            {/* Text content */}
            <div className="flex-1 md:py-10">
              <h3 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {t("cta.title").split("\\n").map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
              </h3>
              <p className="mt-3 text-[15px] text-white/85 leading-relaxed">
                {t("cta.desc")}
              </p>
            </div>

            {/* CTA button */}
            <div className="flex flex-col items-center gap-2 md:pr-10 flex-shrink-0 md:pb-10">
              <button className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#3B5C37] shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 whitespace-nowrap">
                {t("cta.button")}
              </button>
              <span className="text-[11px] text-white/60 italic">{t("cta.noCreditCard")}</span>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
