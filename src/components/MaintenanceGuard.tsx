"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Hammer, Mail, RefreshCw } from "lucide-react";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch system settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Lỗi lấy cấu hình bảo trì:", err);
      }
    };

    // 2. Check current user session and role
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setRole(session.user.user_metadata?.role || "STUDENT");
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra quyền hạn bảo trì:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setRole(session.user.user_metadata?.role || "STUDENT");
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b0f19] text-[#e2e8f0]">
        <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 animate-pulse">Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  // Check if maintenance mode is active
  const isMaintenanceMode = settings?.system?.maintenanceMode === true;
  const isLoginPage = pathname.includes("/login");
  const isAdminPage = pathname.includes("/admin");
  const isApiRoute = pathname.includes("/api/");

  // Allow admins and login/admin paths
  const shouldBlock = isMaintenanceMode && role !== "ADMIN" && !isLoginPage && !isAdminPage && !isApiRoute;

  if (shouldBlock) {
    const supportEmail = settings?.system?.supportEmail || "support@qualicode.com";
    const appName = settings?.system?.appName || "QualiIelts";

    return (
      <div className="bg-[#0b0f19] text-[#e2e8f0] min-h-screen font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glowing background shapes */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#B38F4D]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#dc2626]/5 to-[#B38F4D]/5 blur-[100px]" />

        <div className="max-w-md w-full text-center relative z-10 space-y-8 animate-scale-in">
          {/* Brand logo */}
          <div className="flex items-center justify-center gap-2 text-2xl font-black text-white">
            <span className="text-[#3B5C37]">*</span>
            <span>{appName}</span>
          </div>

          {/* Maintenance card */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.4)] space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
              <Hammer className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">Hệ thống đang bảo trì</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chúng tôi đang thực hiện nâng cấp định kỳ nhằm tối ưu hiệu năng và cập nhật các tính năng AI mới giúp nâng cao chất lượng học tập của bạn.
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Thời gian dự kiến: 30 phút - 1 giờ</span>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B5C37] hover:bg-[#2f4a2b] text-white text-xs font-bold rounded-xl transition-all border-none cursor-pointer active:scale-95 shadow-lg shadow-[#3B5C37]/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
            </div>
          </div>

          {/* Support footer */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <Mail className="w-4 h-4" />
            <span>Liên hệ hỗ trợ:</span>
            <a href={`mailto:${supportEmail}`} className="text-[#3B5C37] hover:underline font-bold transition-all">
              {supportEmail}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
