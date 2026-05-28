"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowRight, ShieldAlert, Award, Star } from "lucide-react";

export default function AdminDashboardOverview() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-[#0d153a] to-[#1e2a5e] text-white p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#3B5C37]/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="bg-[#3B5C37]/25 text-[#ffab66] border border-[#3B5C37]/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block">
            Bảng điều khiển Admin
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Chào mừng đến với <span className="text-[#3B5C37]">QualiCode</span> Dashboard!
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            Tại đây, bạn có quyền quản lý tối cao đối với toàn bộ tài nguyên hệ thống, người dùng, phân quyền vai trò và bảo vệ an toàn tài khoản học viên trong chương trình IELTS QualiCode.
          </p>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Card: Quản lý người dùng */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8ede6] text-[#3B5C37] flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#0d153a] group-hover:text-[#3B5C37] transition-colors">
                Quản lý Người dùng
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Xem danh sách tất cả học viên, quản trị viên và khách. Hỗ trợ tạo tài khoản mới, phân quyền chi tiết, chỉnh sửa thông tin hoặc kích hoạt/khóa tài khoản vi phạm chỉ với một nút bấm.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#3B5C37] hover:text-orange-600 transition-colors"
            >
              <span>Truy cập Quản lý User</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card: Tính năng Bảo mật & Log */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow opacity-90">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#0d153a]">
                Bảo mật & Cấu hình
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Bảo vệ hệ thống bằng cách theo dõi các tài khoản bị khóa, đổi mật khẩu quản trị viên hoặc thiết lập cấu hình kết nối database PostgreSQL. Dữ liệu của bạn được bảo mật tuyệt đối.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
              Sẵn sàng kết nối PostgreSQL
            </span>
          </div>
        </div>
      </section>

      {/* Decorative Brand Stats Row */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-around text-center flex-wrap gap-4 py-8">
        <div>
          <div className="flex items-center justify-center text-amber-500 mb-1">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-slate-400">Tiêu chuẩn IELTS</div>
          <div className="text-lg font-black text-[#0d153a] mt-0.5">Cambridge 9-20</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-slate-100" />
        <div>
          <div className="flex items-center justify-center text-[#3B5C37] mb-1">
            <Star className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-slate-400">Công nghệ thông minh</div>
          <div className="text-lg font-black text-[#0d153a] mt-0.5">Trí Tuệ Nhân Tạo AI</div>
        </div>
      </section>
    </div>
  );
}
