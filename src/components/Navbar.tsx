"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { User, LogOut, ShieldAlert, Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const isTedPage = pathname.includes("/speaking/ted");
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
      isTedPage
        ? (isScrolled 
            ? "bg-[#120808]/95 border-[#301010] shadow-[0_4px_20px_rgba(230,43,30,0.12)]" 
            : "bg-[#0a0505] border-[#261313]")
        : (isScrolled 
            ? "bg-[#e5ebd8] border-[#d8e0cc] shadow-sm" 
            : "bg-transparent border-transparent")
    }`}>
      <header className={`mx-auto flex w-full max-w-[1160px] items-center justify-between px-9 transition-all duration-300 ease-in-out ${
        isScrolled ? "py-3.5" : "py-5"
      }`}>
        <Link href="/" className={`flex items-center gap-2.5 text-xl font-black cursor-pointer hover:opacity-90 transition-opacity ${
          isTedPage ? "text-white" : "text-[#1b3d1e]"
        }`}>
          <img src="/assets/logo-final.png" alt="Quali IELTS Logo" className="h-12 w-auto object-contain" />
          <span className="tracking-tight">
            Quali {isTedPage ? <span className="text-[#E62B1E]">IELTS</span> : "IELTS"}
          </span>
        </Link>


        {/* Dynamic Auth Header section */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <LanguageSwitcher />
          {loading ? (
            <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
              isTedPage ? "border-[#E62B1E]/30 border-t-[#E62B1E]" : "border-[#3B5C37]/30 border-t-[#3B5C37]"
            }`} />
          ) : user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowDropdown(false);
                  }}
                  className={`p-2 rounded-full transition-all cursor-pointer relative border-none bg-transparent outline-none flex items-center justify-center ${
                    isTedPage 
                      ? "text-[#b5a9a9] hover:text-[#E62B1E] hover:bg-[#E62B1E]/5" 
                      : "text-slate-600 hover:text-[#3B5C37] hover:bg-[#3B5C37]/5"
                  }`}
                  aria-label="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 animate-pulse ${
                      isTedPage ? "bg-[#E62B1E] border-[#120808]" : "bg-orange-500 border-white"
                    }`} />
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className={`absolute right-[-80px] sm:right-0 top-12 w-80 rounded-2xl border shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-md p-4 animate-scale-in z-50 text-left ${
                    isTedPage 
                      ? "bg-[#120a0a]/95 border-[#261313] text-[#f5f5f5]" 
                      : "bg-white/95 border-slate-100 text-[#0d153a]"
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2.5 mb-2.5 ${
                      isTedPage ? "border-[#261313]" : "border-slate-100"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs font-black ${isTedPage ? "text-white" : "text-[#0d153a]"}`}>Thông báo</h4>
                        {unreadCount > 0 && (
                          <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${
                            isTedPage ? "bg-[#E62B1E]" : "bg-orange-500"
                          }`}>
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className={`text-[9px] font-bold hover:underline cursor-pointer bg-transparent border-none outline-none ${
                            isTedPage ? "text-[#E62B1E]" : "text-[#3B5C37]"
                          }`}
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
                                ? (isTedPage 
                                    ? "bg-[#1a0f0f] border-[#E62B1E]/20 cursor-pointer hover:bg-[#261313]" 
                                    : "bg-slate-50/80 border-[#3B5C37]/10 cursor-pointer hover:bg-slate-100")
                                : (isTedPage 
                                    ? "bg-[#120a0a] border-[#261313] opacity-75" 
                                    : "bg-white border-slate-100 opacity-75")
                            }`}
                          >
                            {/* Color bar indicator based on type */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              n.type === "STREAK_WARNING" ? "bg-orange-500" : (isTedPage ? "bg-[#E62B1E]" : "bg-[#3B5C37]")
                            }`} />

                            <div className="pl-2">
                              <div className="flex items-start justify-between gap-1">
                                <span className={`font-extrabold text-[11px] leading-tight flex items-center gap-1 ${
                                  isTedPage ? "text-white" : "text-[#0d153a]"
                                }`}>
                                  {n.type === "STREAK_WARNING" && "🔥"}
                                  {n.type === "STUDY_REMINDER" && "📚"}
                                  {n.title}
                                </span>
                                {n.status === "UNREAD" && (
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                                    isTedPage ? "bg-[#E62B1E]" : "bg-[#3B5C37]"
                                  }`} />
                                )}
                              </div>
                              <p className={`text-[10px] font-medium mt-1 leading-relaxed ${
                                isTedPage ? "text-[#b5a9a9]" : "text-slate-600"
                              }`}>
                                {n.content}
                              </p>
                              <span className={`text-[8px] font-bold mt-1.5 block ${
                                isTedPage ? "text-[#8a7f7f]" : "text-slate-400"
                              }`}>
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
                className={`w-10 h-10 rounded-full text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all outline-none border select-none relative group ${
                  isTedPage 
                    ? "bg-gradient-to-tr from-[#E62B1E] to-[#B38F4D] border-white/20 hover:shadow-[0_6px_20px_rgba(230,43,30,0.3)]" 
                    : "bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] border-white/40 hover:shadow-[0_6px_20px_rgba(59, 92, 55,0.25)]"
                }`}
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
                <div className={`absolute right-0 top-12 w-64 rounded-2xl border shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-md p-4 animate-scale-in z-50 text-left ${
                  isTedPage 
                    ? "bg-[#120a0a]/95 border-[#261313] text-[#f5f5f5]" 
                    : "bg-white/95 border-slate-100 text-[#0d153a]"
                }`}>
                  <div className={`border-b pb-3 mb-3 ${isTedPage ? "border-[#261313]" : "border-slate-100"}`}>
                    <p className={`text-[10px] font-black uppercase tracking-wider leading-none mb-1 ${
                      isTedPage ? "text-[#8a7f7f]" : "text-slate-400"
                    }`}>{t("loggedInAs")}</p>
                    <p className={`text-xs font-black truncate ${isTedPage ? "text-white" : "text-[#0d153a]"}`}>
                      {user.user_metadata?.name || "Người dùng QualiCode"}
                    </p>
                    <p className={`text-[10px] font-medium truncate ${isTedPage ? "text-[#b5a9a9]" : "text-slate-500"}`}>
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold active:scale-[0.98] transition-all cursor-pointer no-underline ${
                        isTedPage 
                          ? "text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-[#E62B1E]" 
                          : "text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37]"
                      }`}
                    >
                      <User className={`w-4 h-4 ${isTedPage ? "text-[#E62B1E]" : "text-[#3B5C37]"}`} />
                      <span>{t("profile")}</span>
                    </Link>

                    {user.user_metadata?.role === "ADMIN" && (
                      <Link
                        href="/admin/users"
                        onClick={() => setShowDropdown(false)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold active:scale-[0.98] transition-all cursor-pointer ${
                          isTedPage 
                            ? "text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-[#B38F4D]" 
                            : "text-[#5e6792] hover:bg-slate-50 hover:text-[#B38F4D]"
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B38F4D]" />
                        <span>{t("adminPanel")}</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 active:scale-[0.98] transition-all cursor-pointer border-none outline-none mt-1 pt-2 border-t ${
                        isTedPage 
                          ? "border-[#261313] hover:bg-red-500/10" 
                          : "border-slate-50 hover:bg-red-50"
                      }`}
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
                className={`rounded-xl border px-5 py-2 text-sm font-semibold transition-colors cursor-pointer select-none ${
                  isTedPage 
                    ? "border-[#4a1c1c] text-[#f5f5f5] hover:bg-white/5" 
                    : "border-[#c7d1b8] text-[#1b3d1e] hover:bg-white/40"
                }`}
              >
                {t("login")}
              </Link>
              <Link
                href="/auth"
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer select-none ${
                  isTedPage 
                    ? "bg-[#E62B1E] hover:bg-[#b81d13]" 
                    : "bg-[#3B5C37] hover:bg-[#1f3e1b]"
                }`}
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
