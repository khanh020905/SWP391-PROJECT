"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users,
  LayoutDashboard,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Clock,
  FileText,
  CreditCard,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>({
    name: "Quản trị viên",
    email: "admin@qualicode.com",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check admin session and implement route protection - Bypassed per user request
  useEffect(() => {
    // Attempt to load current user name if logged in, but don't block or redirect if not
    async function loadUserInfo() {
      try {
        // Check for mock session fallback first
        const mockSessionStr = typeof window !== "undefined" ? localStorage.getItem("mock_session") : null;
        if (mockSessionStr) {
          try {
            const mockUser = JSON.parse(mockSessionStr);
            if (mockUser) {
              setAdminUser({
                name: mockUser.name || "Admin QualiCode (Bypass)",
                email: mockUser.email || "admin@qualicode.com",
              });
              return;
            }
          } catch (e) {
            console.error("Lỗi parse mock_session:", e);
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metadata = user.user_metadata || {};
          setAdminUser({
            name: metadata.name || "Quản trị viên",
            email: user.email || "admin@qualicode.com",
          });
        }
      } catch (err) {
        console.warn("Could not fetch logged-in user metadata, using defaults:", err);
      }
    }
    loadUserInfo();
    setIsLoading(false);
  }, []);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mock_session");
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Không thể gọi signOut trên Supabase:", e);
    }
    window.location.href = "/login";
  };

  // Định nghĩa danh sách menu điều hướng
  const menuItems = [
    {
      label: "Tổng quan",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Quản lý User",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      label: "Quản lý Đề Thi",
      href: "/admin/exams",
      icon: FileText,
      active: pathname.startsWith("/admin/exams"),
    },
    {
      label: "Quản lý Thanh toán",
      href: "/admin/payments",
      icon: CreditCard,
      active: pathname.startsWith("/admin/payments"),
    },
    {
      label: "Lịch sử hoạt động",
      href: "/admin/activity-logs",
      icon: Clock,
      active: pathname.startsWith("/admin/activity-logs"),
    },
    {
      label: "Cấu hình hệ thống",
      href: "/admin/settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f4f5f9] text-[#0f1738]">
        <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#5e6792] animate-pulse">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-[#0f1738] flex flex-col font-sans">
      {/* Top Header Mobile */}
      <header className="md:hidden flex items-center justify-between bg-[#0d153a] text-white px-5 py-4 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="text-[#3B5C37] font-serif text-2xl leading-none">*</span>
          <span>QualiCode Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d153a] text-white flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand Logo Header (Desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-6 py-6 border-b border-white/5">
            <span className="text-[#3B5C37] font-serif text-3xl leading-none">*</span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              QualiCode Admin
            </span>
          </div>

          {/* Quick Profile Admin */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3 bg-[#0a102e]/60">
            <div className="w-10 h-10 rounded-xl bg-[#3B5C37]/10 border border-[#3B5C37]/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#3B5C37]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-sm truncate text-white">{adminUser?.name}</div>
              <div className="text-xs text-[#a0a5c0] truncate">{adminUser?.email}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    item.active
                      ? "bg-[#3B5C37] text-white shadow-[0_6px_16px_rgba(59, 92, 55,0.25)] font-bold scale-[1.02]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/5 bg-[#0a102e]/40 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full"
            >
              <span>Xem trang chủ</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors w-full cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Đăng xuất Admin</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay Mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Navbar Header (Desktop only) */}
          <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200/80 px-8 py-4 sticky top-0 z-30">
            {/* Page title or Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Trang quản trị</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-sm font-extrabold text-[#0d153a]">
                {pathname === "/admin"
                  ? "Tổng quan"
                  : pathname.startsWith("/admin/users")
                  ? "Quản lý người dùng"
                  : pathname.startsWith("/admin/exams")
                  ? "Quản lý đề thi"
                  : pathname.startsWith("/admin/payments")
                  ? "Quản lý thanh toán"
                  : pathname.startsWith("/admin/activity-logs")
                  ? "Lịch sử hoạt động"
                  : "Cấu hình hệ thống"}
              </span>
            </div>

            {/* Quick Actions & Profile */}
            <div className="flex items-center gap-5">
              {/* Notification Button */}
              <button className="relative p-2 text-slate-500 hover:text-[#0d153a] hover:bg-slate-100 rounded-xl transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </button>

              {/* Separator line */}
              <div className="h-6 w-px bg-slate-200" />

              {/* Profile Card */}
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B5C37] to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_10px_rgba(59, 92, 55,0.15)] uppercase">
                  {adminUser?.name?.substring(0, 2)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-[#0d153a] group-hover:text-[#3B5C37] transition-colors leading-tight">
                    {adminUser?.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Hệ thống chính
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Render children contents with professional padding */}
          <div className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
