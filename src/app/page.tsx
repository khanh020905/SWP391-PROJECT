"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, LogOut, ShieldAlert, Sparkles, Calendar, Mail, UserCheck } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check current session
  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session load error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkUser();

    // Listen for session modifications
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scrolling to trigger navbar glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    window.location.reload();
  };

  return (
    <div className="bg-[#f4f5f9] text-[#0f1738]">
      <div className={`w-full sticky top-0 z-30 border-b transition-all duration-300 ease-in-out ${
        isScrolled 
          ? "bg-[#e5ebd8]/80 backdrop-blur-md shadow-sm border-[#d8e0cc]/60" 
          : "bg-[#e5ebd8] border-[#d8e0cc]"
      }`}>
        <header className={`mx-auto flex w-full max-w-[1160px] items-center justify-between px-9 transition-all duration-300 ease-in-out ${
          isScrolled ? "py-3.5" : "py-5"
        }`}>
          <div className="flex items-center gap-2.5 text-xl font-black text-[#1b3d1e]">
            <div className="w-8 h-8 rounded-lg bg-[#3B5C37] flex items-center justify-center text-white font-black text-lg shadow-sm">
              Q
            </div>
            <span className="tracking-tight">Quali IELTS</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-bold text-[#4e5c4c] md:flex">
            <Link href="/" className="hover:text-[#3B5C37] transition-colors">Home</Link>
            <Link href="/speaking" className="text-[#3B5C37] font-black flex items-center gap-1 transition-all hover:scale-105">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#3B5C37]" />
              <span>Speaking AI</span>
            </Link>
            <Link href="/exam/review" className="hover:text-[#3B5C37] transition-colors">Review Đáp án</Link>
            <a href="#" className="hover:text-[#3B5C37] transition-colors">Cambridge Cams</a>
            <a href="#" className="hover:text-[#3B5C37] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#3B5C37] transition-colors">About Us</a>
          </nav>
          {/* Dynamic Auth Header section */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            {loading ? (
              <div className="w-8 h-8 border-2 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin" />
            ) : user ? (
              <>
                {/* Premium User Avatar Bubble */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#7c3aed] text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(59, 92, 55,0.15)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(59, 92, 55,0.25)] active:scale-95 transition-all outline-none border border-white/40 select-none relative group"
                  aria-label="User menu"
                >
                  <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-all duration-300" />
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>
                      {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-12 w-64 rounded-2xl bg-white/95 border border-slate-100 shadow-[0_16px_48px_rgba(15,23,56,0.1)] backdrop-blur-md p-4 animate-scale-in z-50 text-left">
                    <div className="border-b border-slate-100 pb-3 mb-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Đang đăng nhập</p>
                      <p className="text-xs font-black text-[#0d153a] truncate">
                        {user.user_metadata?.name || "Người dùng QualiCode"}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37] active:scale-[0.98] transition-all cursor-pointer no-underline"
                      >
                        <User className="w-4 h-4 text-[#3B5C37]" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      {user.user_metadata?.role === "ADMIN" && (
                        <Link
                          href="/admin/users"
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#7c3aed] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-[#7c3aed]" />
                          <span>Trang Quản trị Admin</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all cursor-pointer border-none outline-none border-t border-slate-50 mt-1 pt-2"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth"
                  className="rounded-xl border border-[#c7d1b8] px-5 py-2 text-sm font-semibold hover:bg-white/40 transition-colors cursor-pointer select-none text-[#1b3d1e]"
                >
                  Log in
                </Link>
                <Link
                  href="/auth"
                  className="rounded-xl bg-[#3B5C37] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f3e1b] transition-colors shadow-sm cursor-pointer select-none"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>
      </div>

      <section
        className="relative w-full h-[calc(100vh-75px)] min-h-[600px] bg-no-repeat overflow-hidden bg-[#e5ebd8]"
        style={{
          backgroundImage: "url('/assets/hero-background-new.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center top"
        }}
      >
        {/* Full Screen Overlay Container that matches the aspect ratio of the image */}
        <div className="absolute inset-0 mx-auto w-full max-w-[1160px] h-full pointer-events-none select-none">
          
          {/* 1. Brand Pill Overlay (Covers "THEIELTSDICTIONARY") */}
          <div className="absolute left-[31.5%] top-[33.5%] pointer-events-auto">
            <span className="inline-flex rounded-full bg-[#ebefe0] border border-[#d8e0cc] px-2.5 py-1 text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-wider text-[#3B5C37] uppercase shadow-sm">
              QUALI IELTS
            </span>
          </div>

          {/* 2. Brand Button Overlay (Covers "Bài viết của TID →") */}
          <div className="absolute left-[7.2%] top-[78.2%] pointer-events-auto">
            <Link
              href="/speaking"
              className="inline-flex items-center justify-center rounded-full bg-[#3B5C37] hover:bg-[#1f3e1b] px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3.5 text-[10px] sm:text-xs md:text-sm font-black text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer select-none"
            >
              Bài viết của Quali IELTS →
            </Link>
          </div>

          {/* 3. Free Resource Link Overlay (Covers "Khám phá tài liệu miễn phí >") */}
          <div className="absolute left-[33%] md:left-[35%] top-[79.5%] pointer-events-auto">
            <Link
              href="/exam/review"
              className="text-[10px] sm:text-xs md:text-sm font-black text-[#3B5C37] hover:underline cursor-pointer select-none flex items-center gap-1"
            >
              <span>Khám phá tài liệu miễn phí</span>
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 4. Dinosaur Speech Bubble Overlay (Covers the bubble in the image) */}
          <div className="absolute left-[47%] md:left-[51.8%] top-[14%] pointer-events-auto w-[180px] sm:w-[220px] md:w-[260px] lg:w-[280px]">
            <div className="relative bg-white border border-[#d4dec7] rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-md text-left">
              <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-[#1b3d1e] leading-relaxed">
                Bạn in the house! <span className="text-[#3B5C37] font-black">Quali IELTS</span> mở khóa bài học mới nè.
              </p>
              {/* Arrow / Bubble tail */}
              <div className="absolute bottom-[-8px] left-[50%] -translate-x-1/2 w-3.5 h-3.5 bg-white border-r border-b border-[#d4dec7] rotate-45" />
            </div>
          </div>

          {/* 5. Follow Us On Links */}
          <div className="absolute left-[7.2%] top-[65%] pointer-events-auto flex items-center gap-2">
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-wider text-[#4e5c4c] uppercase mr-1">Follow us on</span>
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

        </div>
      </section>

      <main className="mx-auto w-full max-w-[1160px] px-4 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4">
        <section className="mb-6 rounded-3xl bg-white p-8 md:p-12 shadow-[0_4px_32px_rgba(20,28,60,0.07)]">
          <h2 className="text-center text-3xl md:text-4xl font-extrabold text-[#141c41]">
            Complete Cambridge Cams <span className="text-[#3B5C37]">9 → 20</span>
          </h2>
          <p className="mt-3 text-center text-[15px] text-[#5a6282]">Full access to all official Cambridge IELTS practice tests.</p>

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
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm md:text-base font-bold shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
              9
            </div>

            {/* Progress line with dots */}
            <div
              className="flex-1 h-[6px] mx-2 md:mx-4"
              style={{
                background: "linear-gradient(90deg, #7c3aed 0%, #3B5C37 100%)",
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
              <span className="text-sm font-semibold text-[#141c41]">Official Tests</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">Real Exam Experience</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">AI Evaluation</span>
            </div>
            <div className="flex items-center gap-2 text-[#4b5472]">
              <svg className="w-5 h-5 text-[#8b90b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#141c41]">Detailed Feedback</span>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2 items-center">
          {/* Left side - Text content */}
          <div className="p-6 md:p-8">
            <h3 className="text-4xl md:text-5xl leading-[1.08] font-extrabold text-[#121a3c]">
              Adaptive Learning.
              <br />
              Built Just <span className="text-[#3B5C37]">For You.</span>
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[#5b6484]">
              Our AI analyzes your performance in real-time, identifies strengths and weaknesses, and creates a learning path that evolves with you.
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
                  <div className="font-bold text-[#121a3c] text-[15px]">Diagnose</div>
                  <div className="text-sm text-[#6b7394]">AI analyzes 4 skills in depth</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#f2f6ee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B5C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#121a3c] text-[15px]">Personalize</div>
                  <div className="text-sm text-[#6b7394]">Get a plan unique to your profile</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#f2f6ee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B5C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#121a3c] text-[15px]">Improve</div>
                  <div className="text-sm text-[#6b7394]">Focus on what matters, improve faster</div>
                </div>
              </div>
            </div>

            <button className="mt-8 rounded-xl bg-[#3B5C37] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59, 92, 55,0.3)] hover:shadow-[0_12px_28px_rgba(59, 92, 55,0.4)] transition-all duration-300 flex items-center gap-2">
              See How It Works
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
                    { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Overview", active: true },
                    { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Practice", active: false },
                    { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Mock Tests", active: false },
                    { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: "Progress", active: false },
                    { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "AI Tutor", active: false },
                    { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Reports", active: false },
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
                  {/* Your Progress header + Overall Band */}
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
                        Good Progress! 🎉
                      </div>
                      <div className="text-[11px] text-[#2fa56f] font-semibold mt-0.5">▲ 1.5</div>
                    </div>
                  </div>

                  {/* Skill Breakdown */}
                  <div className="mt-4">
                    <div className="font-bold text-[#1a2348] text-[14px] mb-3">Skill Breakdown</div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { score: "8.5", label: "Listening", level: "Advanced", color: "#3B5C37" },
                        { score: "7.0", label: "Reading", level: "Good", color: "#3b82f6" },
                        { score: "7.0", label: "Writing", level: "Good", color: "#8b5cf6" },
                        { score: "7.5", label: "Speaking", level: "Good", color: "#10b981" },
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

                  {/* AI Recommendation */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f8f5ff] border border-[#e8e0f8] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#5b21b6]">AI Recommendation</div>
                        <div className="text-[11px] text-[#7c7fa0]">Focus on Writing Task 2: Improve idea development</div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#3B5C37] cursor-pointer hover:underline whitespace-nowrap">Start Practice →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why QualiCode */}
        <section className="mb-6 rounded-3xl bg-[linear-gradient(135deg,#0a1540_0%,#1a1060_40%,#2f1f6f_100%)] px-6 py-8 md:px-10 md:py-10 text-white overflow-hidden relative">
          {/* Decorative blurred circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#3B5C37]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#4f84ff]/10 blur-3xl" />

          <h3 className="mb-8 text-center text-2xl md:text-3xl font-extrabold relative z-10">
            Why <span className="text-[#3B5C37]">Quali IELTS?</span>
          </h3>
          <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-0 md:grid-cols-5 md:divide-x md:divide-white/10">
            {[
              {
                title: "100% AI Learning",
                desc: "No human tutors. AI handles everything.",
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#3B5C37" strokeWidth={1.8}>
                    {/* Brain icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 8c-3.5 0-6.5 1.2-8.5 3.5C13.5 14 12.5 17 13 20c-2 1-3 3-3 5.5 0 3 2 5.5 4.5 6 .5 2.5 2.5 4.5 5.5 4.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 8c3.5 0 6.5 1.2 8.5 3.5 2 2.5 3 5.5 2.5 8.5 2 1 3 3 3 5.5 0 3-2 5.5-4.5 6-.5 2.5-2.5 4.5-5.5 4.5" />
                    <path strokeLinecap="round" d="M24 8v28M18 16h12M16 22h4M28 22h4M18 28h4M26 28h4" />
                  </svg>
                ),
              },
              {
                title: "Adaptive & Smart",
                desc: "Learning path that adapts to you.",
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#3B5C37" strokeWidth={1.8}>
                    {/* Target/bullseye icon */}
                    <circle cx="24" cy="24" r="18" />
                    <circle cx="24" cy="24" r="12" />
                    <circle cx="24" cy="24" r="6" />
                    <circle cx="24" cy="24" r="2" fill="#ff8a28" />
                    <path strokeLinecap="round" d="M34 14l-7 7" />
                    <path strokeLinecap="round" d="M32 10h6v6" />
                  </svg>
                ),
              },
              {
                title: "Cambridge Standard",
                desc: "Official Cambridge materials 9 to 20.",
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#3B5C37" strokeWidth={1.8}>
                    {/* Book with bookmark icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8a4 4 0 014 4v22a3 3 0 00-3-3H8V10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M40 10h-8a4 4 0 00-4 4v22a3 3 0 013-3h9V10z" />
                    <path strokeLinecap="round" d="M18 18h4M26 18h4M18 24h4M26 24h4" />
                    <path strokeLinejoin="round" d="M32 10v10l3-2.5 3 2.5V10" fill="none" />
                  </svg>
                ),
              },
              {
                title: "Real-Time Feedback",
                desc: "Instant AI feedback on everything.",
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#3B5C37" strokeWidth={1.8}>
                    {/* Chat bubble with lightning */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h24a2 2 0 012 2v16a2 2 0 01-2 2H16l-6 6v-6H8a2 2 0 01-2-2V12a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 16l-3 6h6l-3 6" />
                    <circle cx="38" cy="18" r="7" />
                    <path strokeLinecap="round" d="M36 16l2 2 4-4" />
                  </svg>
                ),
              },
              {
                title: "Privacy First",
                desc: "Your data is secure and always private.",
                icon: (
                  <svg className="w-10 h-10 mx-auto" viewBox="0 0 48 48" fill="none" stroke="#3B5C37" strokeWidth={1.8}>
                    {/* Shield lock icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M24 4L8 12v10c0 11 7 20 16 22 9-2 16-11 16-22V12L24 4z" />
                    <rect x="18" y="22" width="12" height="10" rx="2" strokeLinejoin="round" />
                    <path strokeLinecap="round" d="M21 22v-4a3 3 0 016 0v4" />
                    <circle cx="24" cy="27" r="1.5" fill="#ff8a28" />
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
            Loved by <span className="text-[#3B5C37]">Learners</span> Worldwide
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
                  name: "Ananya S.",
                  band: "Band 8.0 Achiever",
                  quote: "QualiCode's AI knows me better than I know myself. It helped me improve from 6.0 to 8.0 in 2 months!",
                  color: "#3B5C37",
                },
                {
                  name: "Minh T.",
                  band: "Band 7.5 Achiever",
                  quote: "The adaptive practice is insanely good. I only practice what I need, and I see real improvement.",
                  color: "#3b82f6",
                },
                {
                  name: "Fatima K.",
                  band: "Band 8.5 Achiever",
                  quote: "All Cambridge Cams, AI feedback, and mock tests – everything I need in one place!",
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
        <section className="relative mt-12 rounded-3xl overflow-visible" style={{ background: "linear-gradient(105deg, #3B5C37 0%, #1f3e1b 30%, #b25cff 60%, #4f84ff 100%)" }}>
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
                Ready to Achieve Your
                <br />
                Dream IELTS Score?
              </h3>
              <p className="mt-3 text-[15px] text-white/85 leading-relaxed">
                Start your AI-powered journey today. 100% AI. 100% For You.
              </p>
            </div>

            {/* CTA button */}
            <div className="flex flex-col items-center gap-2 md:pr-10 flex-shrink-0 md:pb-10">
              <button className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#3B5C37] shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 whitespace-nowrap">
                Start Free Now →
              </button>
              <span className="text-[11px] text-white/60 italic">No credit card required</span>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Glassmorphic User Profile Modal */}
      {showProfileModal && user && (
        <div 
          onClick={() => setShowProfileModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-3xl bg-white/95 border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.15)] p-6 md:p-8 animate-scale-in text-left relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#7c3aed]/10 blur-2xl" />

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#5c9255] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(59, 92, 55,0.15)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0d153a]">Thông tin tài khoản</h3>
                <p className="text-[10px] font-bold text-slate-400">Chi tiết tài khoản học viên QualiCode</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-5 mb-6 relative z-10">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#fafaff] to-[#f8faf5] border border-slate-100/60 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#3B5C37] via-[#5c9255] to-[#7c3aed] text-white text-xl font-extrabold flex items-center justify-center shadow-[0_4px_16px_rgba(59, 92, 55,0.2)]">
                  {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#0d153a]">
                    {user.user_metadata?.name || "Thành viên QualiCode"}
                  </h4>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#3B5C37]/10 text-[#3B5C37] border border-[#3B5C37]/25">
                    {user.user_metadata?.role === "ADMIN" ? "Quản trị viên (ADMIN)" : user.user_metadata?.role === "STUDENT" ? "Học sinh (STUDENT)" : "Khách (GUEST)"}
                  </span>
                </div>
              </div>

              {/* Data list */}
              <div className="space-y-3.5 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Địa chỉ Email</span>
                    <span className="text-xs font-bold text-[#0d153a] break-all">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#3B5C37] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Ngày tham gia</span>
                    <span className="text-xs font-bold text-[#0d153a]">
                      {new Date(user.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Trạng thái hệ thống</span>
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                      Đang hoạt động (Active)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 mt-5">
              <Link
                href="/reset-password"
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 px-4 bg-white border border-[#3B5C37] text-[#3B5C37] hover:bg-[#f2f6ee] font-bold text-xs rounded-2xl active:scale-[0.98] transition-all cursor-pointer text-center no-underline flex items-center justify-center"
              >
                Đổi mật khẩu
              </Link>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#0d153a] to-[#252f5f] hover:from-[#1b2550] hover:to-[#3b477c] text-white font-bold text-xs rounded-2xl shadow-[0_4px_12px_rgba(13,21,58,0.15)] hover:shadow-[0_6px_18px_rgba(13,21,58,0.25)] active:scale-[0.98] transition-all cursor-pointer text-center border-none outline-none"
              >
                Đóng thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
