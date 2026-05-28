"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, LogOut, ShieldAlert, Sparkles } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
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

  // Handle scrolling to trigger navbar background change
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
    <div className={`w-full fixed top-0 left-0 z-30 border-b transition-all duration-300 ease-in-out ${
      isScrolled 
        ? "bg-[#e5ebd8] border-[#d8e0cc] shadow-sm" 
        : "bg-transparent border-transparent"
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
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(59, 92, 55,0.15)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(59, 92, 55,0.25)] active:scale-95 transition-all outline-none border border-white/40 select-none relative group"
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
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#B38F4D] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B38F4D]" />
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
  );
}
