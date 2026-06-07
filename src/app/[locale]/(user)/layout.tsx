"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { User, Key, Camera, LogOut, ArrowLeft, ShieldAlert, Bell, Flame, Sparkles } from "lucide-react";

export default function UserAreaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Notification and streak state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and streak
  const fetchProgressData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch notifications
      const notifyRes = await fetch("/api/student/notifications", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (notifyRes.ok) {
        const data = await notifyRes.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: any) => n.status === "UNREAD").length);
      }

      // 2. Fetch streak
      const streakRes = await fetch("/api/student/streak", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreakCount(data.streak?.currentStreak || 0);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin tiến độ học viên:", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
      
      // Reactive updates when student completes exercises or logs minutes
      window.addEventListener("visibilitychange", fetchProgressData);
      window.addEventListener("progress-updated", fetchProgressData);
      
      const interval = setInterval(fetchProgressData, 20000);
      return () => {
        clearInterval(interval);
        window.removeEventListener("visibilitychange", fetchProgressData);
        window.removeEventListener("progress-updated", fetchProgressData);
      };
    }
  }, [user]);

  // Click outside notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
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

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f4f5f9] text-[#0f1738]">
        <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#5e6792] animate-pulse">Đang xác thực thông tin...</p>
      </div>
    );
  }

  const menuItems = [
    { label: "Hồ sơ cá nhân", href: "/profile", icon: User },
    { label: "Chỉnh sửa hồ sơ", href: "/profile/edit", icon: User },
    { label: "Lộ trình học AI", href: "/roadmap", icon: Sparkles },
    { label: "Đổi ảnh đại diện", href: "/settings/avatar", icon: Camera },
    { label: "Đổi mật khẩu", href: "/settings/password", icon: Key },
  ];

  const initialsFallback = (user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1.5 text-2xl font-black text-[#0d153a] no-underline">
              <span className="text-[#3B5C37]">*</span>
              <span>QualiIelts</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#5e6792]">
              <span>Tài khoản của tôi</span>
              <span>/</span>
              <span className="text-[#0d153a]">{pathname.includes("/settings") ? "Cài đặt" : "Hồ sơ"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Streak Indicator */}
            {streakCount > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl text-orange-600 text-[10px] font-black shadow-sm">
                <span>{streakCount} ngày liên tục</span>
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-bounce" />
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-[#3B5C37] hover:bg-[#3B5C37]/5 rounded-full transition-all cursor-pointer relative border-none bg-transparent outline-none flex items-center justify-center"
                aria-label="Thông báo"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 rounded-2xl bg-white/95 border border-slate-100 shadow-[0_16px_48px_rgba(15,23,56,0.1)] backdrop-blur-md p-4 animate-scale-in z-50 text-left">
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

            <div className="h-4 w-px bg-slate-200" />

            <Link href="/" className="text-xs font-bold text-[#3B5C37] hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 mx-auto max-w-7xl w-full p-4 md:p-8 grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#3B5C37] shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] text-white flex items-center justify-center text-3xl font-black border-2 border-white shadow-md">
                {initialsFallback}
              </div>
            )}
            <h3 className="font-extrabold text-[#0d153a] mt-3 leading-tight text-base">{user.user_metadata?.name || "Người dùng"}</h3>
            <span className="text-[10px] font-black tracking-wider text-[#3B5C37] bg-[#fff4e6] px-2.5 py-1 rounded-full mt-1.5 uppercase">
              {user.user_metadata?.role || "STUDENT"}
            </span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#3B5C37] text-white shadow-[0_4px_12px_rgba(59, 92, 55,0.2)]"
                      : "text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {user.user_metadata?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[#B38F4D] hover:bg-[#B38F4D]/5 transition-all"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Trang Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all w-full text-left mt-4 border-t border-slate-50 pt-3"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="md:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
