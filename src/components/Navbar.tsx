"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { User, LogOut, ShieldAlert, Sparkles, Bell, Flame, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations("nav");

  // Fetch notifications helper
  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/student/notifications", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: any) => n.status === "UNREAD").length);
      }
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    }
  };

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

  // Poll for notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowNotifications(false);
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

  const handleMarkAsRead = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "READ" } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Lỗi đọc thông báo:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ notificationId: "all" })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: "READ" })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Lỗi đọc tất cả thông báo:", err);
    }
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
          <img src="/assets/logo-final.png" alt="Quali IELTS Logo" className="h-12 w-auto object-contain" />
          <span className="tracking-tight">Quali IELTS</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-bold text-[#4e5c4c] md:flex">
          <Link href="/" className="hover:text-[#3B5C37] transition-colors">Home</Link>
          <Link href="/speaking" className="text-[#3B5C37] font-black flex items-center gap-1 transition-all hover:scale-105">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#3B5C37]" />
            <span>Speaking AI</span>
          </Link>
          <Link href="/reading" className="text-[#3B5C37] font-black flex items-center gap-1 transition-all hover:scale-105">
            <BookOpen className="w-3.5 h-3.5 text-[#3B5C37]" />
            <span>Reading CBT</span>
          </Link>
          <Link href="/exam/review" className="hover:text-[#3B5C37] transition-colors">Review Đáp án</Link>
          <a href="#" className="hover:text-[#3B5C37] transition-colors">Cambridge Cams</a>
          <a href="#" className="hover:text-[#3B5C37] transition-colors">Pricing</a>
          <a href="#" className="hover:text-[#3B5C37] transition-colors">About Us</a>
        </nav>
        {/* Dynamic Auth Header section */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <LanguageSwitcher />
          {loading ? (
            <div className="w-8 h-8 border-2 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin" />
          ) : user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowDropdown(false);
                  }}
                  className="p-2 text-slate-600 hover:text-[#3B5C37] hover:bg-[#3B5C37]/5 rounded-full transition-all cursor-pointer relative border-none bg-transparent outline-none flex items-center justify-center"
                  aria-label="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-[-80px] sm:right-0 top-12 w-80 rounded-2xl bg-white/95 border border-slate-100 shadow-[0_16px_48px_rgba(15,23,56,0.1)] backdrop-blur-md p-4 animate-scale-in z-50 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-[#0d153a]">Thông báo</h4>
                        {unreadCount > 0 && (
                          <span className="text-[9px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[9px] font-bold text-[#3B5C37] hover:underline cursor-pointer bg-transparent border-none outline-none"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-semibold text-[10px]">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          Bạn không có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => n.status === "UNREAD" && handleMarkAsRead(n.id)}
                            className={`p-3 rounded-xl border transition-all relative overflow-hidden text-left ${
                              n.status === "UNREAD"
                                ? "bg-slate-50/80 border-[#3B5C37]/10 cursor-pointer hover:bg-slate-100"
                                : "bg-white border-slate-100 opacity-75"
                            }`}
                          >
                            {/* Color bar indicator based on type */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              n.type === "STREAK_WARNING" ? "bg-orange-500" : "bg-[#3B5C37]"
                            }`} />

                            <div className="pl-2">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-extrabold text-[11px] text-[#0d153a] leading-tight flex items-center gap-1">
                                  {n.type === "STREAK_WARNING" && "🔥"}
                                  {n.type === "STUDY_REMINDER" && "📚"}
                                  {n.title}
                                </span>
                                {n.status === "UNREAD" && (
                                  <span className="w-1.5 h-1.5 bg-[#3B5C37] rounded-full shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-slate-600 mt-1 leading-relaxed">
                                {n.content}
                              </p>
                              <span className="text-[8px] text-slate-400 font-bold mt-1.5 block">
                                {new Date(n.createdAt).toLocaleDateString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Premium User Avatar Bubble */}
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowNotifications(false);
                }}
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">{t("loggedInAs")}</p>
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
                      <span>{t("profile")}</span>
                    </Link>

                    {user.user_metadata?.role === "ADMIN" && (
                      <Link
                        href="/admin/users"
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#B38F4D] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B38F4D]" />
                        <span>{t("adminPanel")}</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all cursor-pointer border-none outline-none border-t border-slate-50 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>{t("logout")}</span>
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
                {t("login")}
              </Link>
              <Link
                href="/auth"
                className="rounded-xl bg-[#3B5C37] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f3e1b] transition-colors shadow-sm cursor-pointer select-none"
              >
                {t("getStarted")}
              </Link>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
