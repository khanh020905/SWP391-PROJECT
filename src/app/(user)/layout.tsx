"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { User, Key, Camera, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";

export default function UserAreaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [user, loading, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
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
              <span>QualiCode</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#5e6792]">
              <span>Tài khoản của tôi</span>
              <span>/</span>
              <span className="text-[#0d153a]">{pathname.includes("/settings") ? "Cài đặt" : "Hồ sơ"}</span>
            </div>
          </div>
          <Link href="/" className="text-xs font-bold text-[#3B5C37] hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Trang chủ</span>
          </Link>
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#7c3aed] text-white flex items-center justify-center text-3xl font-black border-2 border-white shadow-md">
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[#7c3aed] hover:bg-[#7c3aed]/5 transition-all"
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
