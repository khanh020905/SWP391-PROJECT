"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { 
  Users, 
  ArrowRight, 
  ShieldAlert, 
  Award, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  FileText, 
  CreditCard,
  ChevronRight,
  Percent,
  Loader2,
  Calendar
} from "lucide-react";

interface StatsData {
  revenue: {
    total: number;
    paidCount: number;
    totalCount: number;
    conversionRate: number;
    daily: { date: string; amount: number; count: number }[];
    byPackage: { count: number; revenue: number; name: string }[];
  };
  users: {
    total: number;
    active: number;
    locked: number;
    roles: { ADMIN: number; INSTRUCTOR: number; STUDENT: number; GUEST: number };
  };
  recentInvoices: {
    id: string;
    userName: string;
    userEmail: string;
    packageName: string;
    amount: number;
    status: "PENDING" | "PAID" | "CANCELLED";
    createdAt: string;
    paidAt: string | null;
  }[];
}

export default function AdminDashboardOverview() {
  const locale = useLocale();
  const isEn = locale === "en";

  const t = {
    loading: isEn ? "Preparing system reports..." : "Đang chuẩn bị báo cáo hệ thống...",
    errorTitle: isEn ? "Failed to load statistics" : "Không thể tải dữ liệu thống kê",
    btnRetry: isEn ? "Reload page" : "Tải lại trang",
    tagline: isEn ? "Reports & System Stats" : "Báo cáo & Thống kê Hệ thống",
    welcomeTitle: isEn ? "Welcome to the QualiCode Dashboard!" : "Chào mừng đến với QualiCode Dashboard!",
    welcomeSubtitle: isEn ? "Track real-time sales revenue, IELTS subscription packages, and active registered users on the system." : "Theo dõi thời gian thực doanh thu bán hàng, đăng ký gói học tập IELTS và lượng người dùng đăng ký hoạt động trong hệ thống.",
    dbStatus: isEn ? "Supabase System" : "Hệ thống Supabase",
    dbActive: isEn ? "Active & Stable" : "Đang hoạt động ổn định",
    kpiRevenue: isEn ? "Total Revenue" : "Tổng doanh thu",
    kpiCompleted: isEn ? "Completed" : "Đã hoàn thành",
    kpiInvoices: isEn ? "invoices" : "hóa đơn",
    kpiActiveUsers: isEn ? "Active Users" : "User Hoạt động",
    kpiActiveRate: isEn ? "Activity Rate" : "Tỷ lệ hoạt động",
    kpiTotalStudents: isEn ? "Total Students" : "Tổng số Học viên",
    kpiGuestRole: isEn ? "Guest Visitors" : "Quyền Guest vãng lai",
    kpiPaymentRate: isEn ? "Payment Rate" : "Tỷ lệ thanh toán",
    kpiTotalReq: isEn ? "Total Requests" : "Tổng số yêu cầu",
    
    chartTitle: isEn ? "Recent 7-Day Revenue" : "Doanh thu 7 ngày gần đây",
    chartSubtitle: isEn ? "Growth chart summarizing actual completed payments" : "Biểu đồ tăng trưởng tổng kết thanh toán thực tế",
    chartUpdated: isEn ? "Real-time updates" : "Cập nhật thời gian thực",
    chartTransactions: isEn ? "successful transactions" : "giao dịch thành công",
    pkgTitle: isEn ? "Learning Package Distribution" : "Phân bổ gói học tập",
    pkgSubtitle: isEn ? "Purchase statistics based on sold packages" : "Thống kê mua sắm theo gói cước bán ra",
    pkgNoData: isEn ? "No purchase data available." : "Không có dữ liệu mua hàng.",
    pkgRevenueEarned: isEn ? "Revenue earned" : "Doanh thu thu về",
    pkgRoleRatio: isEn ? "User Role Distribution" : "Phân phối vai trò user",
    pkgTotalMembers: isEn ? "members" : "thành viên",
    roleStudent: isEn ? "Student" : "Học viên",
    roleGuest: isEn ? "Guest" : "Khách",
    roleAdmin: isEn ? "Admin" : "Quản trị",
    
    invTitle: isEn ? "Recent Invoices" : "Hóa đơn đăng ký gần đây",
    invSubtitle: isEn ? "5 latest transaction activation requests on the system" : "5 giao dịch yêu cầu kích hoạt mới nhất trên hệ thống",
    invAllBtn: isEn ? "All Invoices" : "Tất cả hóa đơn",
    invColId: isEn ? "Invoice ID" : "Mã Hóa Đơn",
    invColUser: isEn ? "Student" : "Học Viên",
    invColPkg: isEn ? "Package" : "Gói cước",
    invColAmount: isEn ? "Amount" : "Số tiền",
    invColStatus: isEn ? "Status" : "Trạng thái",
    invPaid: isEn ? "Paid" : "Đã thu tiền",
    invPending: isEn ? "Pending" : "Chờ duyệt",
    invCancelled: isEn ? "Cancelled" : "Đã hủy bỏ",
    invFooterNote: isEn ? "Sepay auto-matching is running automatically 24/7" : "Đối khớp tự động cổng Sepay hoạt động tự động 24/7",
    
    quickUserTitle: isEn ? "User Management" : "Quản lý Người dùng",
    quickUserDesc: isEn ? "Manage students list, assign ADMIN, STUDENT roles, or block/unlock accounts." : "Quản lý danh sách học viên, phân quyền ADMIN, STUDENT, GUEST hoặc mở/khóa tài khoản học viên.",
    quickUserBtn: isEn ? "User Management" : "Quản lý User",
    quickPayTitle: isEn ? "Payment Management" : "Quản lý Thanh toán",
    quickPayDesc: isEn ? "Manually reconcile syntax errors, create manual invoices, or edit packages." : "Đối soát thủ công các giao dịch lỗi cú pháp từ Sepay, tạo hóa đơn tay hoặc chỉnh sửa cấu hình gói cước.",
    quickPayBtn: isEn ? "Payment Management" : "Quản lý thanh toán",
    
    footerIelts: isEn ? "IELTS Standard" : "Tiêu chuẩn IELTS",
    footerSmartTech: isEn ? "Smart Technology" : "Công nghệ thông minh",
    footerAi: isEn ? "Artificial Intelligence AI" : "Trí Tuệ Nhân Tạo AI"
  };

  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const res = await authFetch("/api/admin/stats");
        if (!res.ok) {
          throw new Error(isEn ? "Failed to connect to the server for stats data." : "Không thể kết nối máy chủ để lấy dữ liệu thống kê.");
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || (isEn ? "An error occurred while loading stats." : "Đã xảy ra lỗi khi tải số liệu thống kê."));
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [isEn]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-[#0d153a] space-y-3">
        <Loader2 className="w-10 h-10 text-[#3B5C37] animate-spin" />
        <p className="text-xs font-bold text-slate-500 animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-rose-800">{t.errorTitle}</h3>
        <p className="text-xs text-rose-600 font-semibold leading-relaxed">{error || "Lỗi không xác định."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          {t.btnRetry}
        </button>
      </div>
    );
  }

  const { revenue, users, recentInvoices } = stats;

  // Tính toán biểu đồ cột doanh thu 7 ngày bằng SVG
  const chartHeight = 160;
  const maxDayRevenue = Math.max(...revenue.daily.map(d => d.amount), 500000);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-[#0d153a] to-[#1e2a5e] text-white p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#3B5C37]/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="bg-[#3B5C37]/25 text-[#ffab66] border border-[#3B5C37]/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block">
              {t.tagline}
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {t.welcomeTitle}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              {t.welcomeSubtitle}
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{t.dbStatus}</div>
              <div className="text-xs font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                {t.dbActive}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Cards Grid */}
      <section className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        
        {/* KPI: Doanh thu */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.kpiRevenue}</span>
              <span className="text-2xl font-black text-[#0d153a] tracking-tight block">
                {revenue.total.toLocaleString("vi-VN")}<span className="text-xs font-bold text-slate-400 ml-1">đ</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#e8ede6] text-[#3B5C37] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">{t.kpiCompleted}</span>
            <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {revenue.paidCount} {t.kpiInvoices}
            </span>
          </div>
        </div>

        {/* KPI: Lượng User Active */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.kpiActiveUsers}</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight block">
                {users.active}<span className="text-xs font-bold text-slate-400 ml-1">/ {users.total}</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">{t.kpiActiveRate}</span>
            <span className="font-extrabold text-emerald-600">
              {users.total > 0 ? Math.round((users.active / users.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* KPI: Học viên (Student) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.kpiTotalStudents}</span>
              <span className="text-2xl font-black text-[#0d153a] tracking-tight block">
                {users.roles.STUDENT}<span className="text-xs font-bold text-slate-400 ml-1">users</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">{t.kpiGuestRole}</span>
            <span className="font-extrabold text-slate-600">{users.roles.GUEST}</span>
          </div>
        </div>

        {/* KPI: Tỷ lệ chuyển đổi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.kpiPaymentRate}</span>
              <span className="text-2xl font-black text-amber-600 tracking-tight block">
                {revenue.conversionRate}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">{t.kpiTotalReq}</span>
            <span className="font-extrabold text-amber-600">{revenue.totalCount} {t.kpiInvoices}</span>
          </div>
        </div>

      </section>

      {/* Charts section */}
      <section className="grid gap-6 lg:grid-cols-3">
        
        {/* Doanh thu 7 ngày Chart (Col 1-2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3B5C37]" />
                <span>{t.chartTitle}</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">{t.chartSubtitle}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {t.chartUpdated}
            </span>
          </div>

          {/* SVG Custom Column Chart */}
          <div className="relative pt-4">
            <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = chartHeight - p * (chartHeight - 30) - 15;
                const value = Math.round(maxDayRevenue * p);
                return (
                  <g key={idx} className="opacity-40">
                    <line 
                      x1="45" 
                      y1={y} 
                      x2="480" 
                      y2={y} 
                      stroke="#cbd5e1" 
                      strokeWidth="1" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x="40" 
                      y={y + 3} 
                      textAnchor="end" 
                      className="fill-slate-400 font-mono font-bold text-[8px]"
                    >
                      {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    </text>
                  </g>
                );
              })}

              {/* Chart Columns */}
              {revenue.daily.map((day, idx) => {
                const totalBars = revenue.daily.length;
                const containerWidth = 435; // 480 - 45
                const barSpacing = containerWidth / totalBars;
                const x = 45 + idx * barSpacing + (barSpacing - 24) / 2;
                
                const ratio = day.amount / maxDayRevenue;
                const rawBarHeight = ratio * (chartHeight - 30);
                const barHeight = Math.max(rawBarHeight, day.amount > 0 ? 5 : 0);
                const y = chartHeight - barHeight - 15;

                const isHovered = hoveredBarIndex === idx;

                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* Hover Trigger Box */}
                    <rect
                      x={45 + idx * barSpacing}
                      y="0"
                      width={barSpacing}
                      height={chartHeight - 15}
                      fill="transparent"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    />

                    {/* Bar (Column) */}
                    {day.amount > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width="24"
                        height={barHeight}
                        rx="6"
                        ry="6"
                        className={`transition-all duration-200 ${
                          isHovered 
                            ? "fill-gradient-hover stroke-orange-400 stroke-1" 
                            : "fill-[#3B5C37]"
                        }`}
                        style={{
                          fill: isHovered ? "#ff9233" : "#3B5C37",
                        }}
                      />
                    )}

                    {/* Zero State Dot */}
                    {day.amount === 0 && (
                      <circle
                        cx={x + 12}
                        cy={chartHeight - 15}
                        r="3"
                        fill="#cbd5e1"
                      />
                    )}

                    {/* X Axis Labels */}
                    <text
                      x={x + 12}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      className={`font-semibold text-[8px] transition-colors ${
                        isHovered ? "fill-orange-600 font-extrabold" : "fill-slate-400"
                      }`}
                    >
                      {day.date}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip */}
            {hoveredBarIndex !== null && (
              <div 
                className="absolute z-20 bg-[#0d153a] text-white px-3 py-2 rounded-xl shadow-md border border-white/10 text-left pointer-events-none flex flex-col gap-0.5"
                style={{
                  left: `${5 + (hoveredBarIndex * (100 / revenue.daily.length))}%`,
                  bottom: "35px",
                  transform: "translateX(25%)",
                }}
              >
                <span className="text-[9px] font-bold text-slate-400">{revenue.daily[hoveredBarIndex].date}</span>
                <span className="text-xs font-black text-orange-400">
                  {revenue.daily[hoveredBarIndex].amount.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[9px] font-semibold text-slate-300">
                  {revenue.daily[hoveredBarIndex].count} {t.chartTransactions}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Phân bổ gói cước (Col 3) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-5">
            <h3 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#3B5C37]" />
              <span>{t.pkgTitle}</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">{t.pkgSubtitle}</p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {revenue.byPackage.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {t.pkgNoData}
              </div>
            ) : (
              revenue.byPackage.map((pkg, idx) => {
                const percentage = revenue.total > 0 ? Math.round((pkg.revenue / revenue.total) * 100) : 0;
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700 truncate max-w-[170px]" title={pkg.name}>
                        {pkg.name}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">
                        {pkg.count} {isEn ? "subs" : "lượt"} ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: idx === 0 ? "#3B5C37" : idx === 1 ? "#ff9233" : "#3b82f6"
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                      <span>{t.pkgRevenueEarned}</span>
                      <span className="text-[#0d153a]">
                        {pkg.revenue.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* User role ratio */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-xs font-black text-[#0d153a]">
              <span>{t.pkgRoleRatio}</span>
              <span className="text-slate-400 font-bold">{users.total} {t.pkgTotalMembers}</span>
            </div>
            
            {/* Multi-segmented stack bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
              <div 
                className="h-full bg-[#3B5C37]" 
                style={{ width: `${users.total > 0 ? (users.roles.STUDENT / users.total) * 100 : 0}%` }}
                title={`Student: ${users.roles.STUDENT}`}
              />
              <div
                className="h-full bg-[#b38f4d]"
                style={{ width: `${users.total > 0 ? (users.roles.INSTRUCTOR / users.total) * 100 : 0}%` }}
                title={`Instructor: ${users.roles.INSTRUCTOR}`}
              />
              <div
                className="h-full bg-[#ff9233]"
                style={{ width: `${users.total > 0 ? (users.roles.GUEST / users.total) * 100 : 0}%` }}
                title={`Guest: ${users.roles.GUEST}`}
              />
              <div
                className="h-full bg-[#0d153a]"
                style={{ width: `${users.total > 0 ? (users.roles.ADMIN / users.total) * 100 : 0}%` }}
                title={`Admin: ${users.roles.ADMIN}`}
              />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#3B5C37] block" />
                <span>{t.roleStudent} ({users.roles.STUDENT})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#b38f4d] block" />
                <span>Giảng viên ({users.roles.INSTRUCTOR})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#ff9233] block" />
                <span>{t.roleGuest} ({users.roles.GUEST})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#0d153a] block" />
                <span>{t.roleAdmin} ({users.roles.ADMIN})</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Grid: Quick Links & Recent Invoices */}
      <section className="grid gap-6 lg:grid-cols-3">
        
        {/* Recent Invoices (Col 1-2) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3B5C37]" />
                  <span>{t.invTitle}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">{t.invSubtitle}</p>
              </div>
              <Link 
                href="/admin/payments" 
                className="text-xs font-bold text-[#3B5C37] hover:text-[#ff9233] transition-colors flex items-center gap-0.5"
              >
                <span>{t.invAllBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {recentInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {isEn ? "No invoices found." : "Chưa có yêu cầu thanh toán nào được tạo."}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                      <th className="px-6 py-3.5">{t.invColId}</th>
                      <th className="px-6 py-3.5">{t.invColUser}</th>
                      <th className="px-6 py-3.5">{t.invColPkg}</th>
                      <th className="px-6 py-3.5">{t.invColAmount}</th>
                      <th className="px-6 py-3.5 text-center">{t.invColStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">{inv.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-800">{inv.userName}</div>
                            <div className="text-[9px] text-slate-400 font-semibold">{inv.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">{inv.packageName}</td>
                        <td className="px-6 py-4 font-black text-[#0d153a]">{inv.amount.toLocaleString("vi-VN")} đ</td>
                        <td className="px-6 py-4 text-center">
                          {inv.status === "PAID" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700">
                              {t.invPaid}
                            </span>
                          )}
                          {inv.status === "PENDING" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 border border-amber-100 text-amber-600">
                              {t.invPending}
                            </span>
                          )}
                          {inv.status === "CANCELLED" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 border border-rose-100 text-rose-500">
                              {t.invCancelled}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400">
              {t.invFooterNote}
            </span>
          </div>
        </div>

        {/* Quick Actions (Col 3) */}
        <div className="space-y-6">
          
          {/* Card: Quản lý người dùng */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#e8ede6] text-[#3B5C37] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0d153a] group-hover:text-[#3B5C37] transition-colors">
                  {t.quickUserTitle}
                </h3>
                <p className="text-slate-400 text-[10px] leading-relaxed font-bold">
                  {t.quickUserDesc}
                </p>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                {users.total} {isEn ? "accounts" : "tài khoản"}
              </span>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3B5C37] hover:text-[#ff9233] transition-colors"
              >
                <span>{t.quickUserBtn}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card: Quản lý thanh toán */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff9233] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0d153a] group-hover:text-[#3B5C37] transition-colors">
                  {t.quickPayTitle}
                </h3>
                <p className="text-slate-400 text-[10px] leading-relaxed font-bold">
                  {t.quickPayDesc}
                </p>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                {isEn ? "Manual 24/7" : "Duyệt tay 24/7"}
              </span>
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3B5C37] hover:text-[#ff9233] transition-colors"
              >
                <span>{t.quickPayBtn}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* Decorative Brand Stats Row */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-around text-center flex-wrap gap-4 py-8">
        <div>
          <div className="flex items-center justify-center text-amber-500 mb-1">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.footerIelts}</div>
          <div className="text-base font-black text-[#0d153a] mt-0.5">Cambridge 9-20</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-slate-100" />
        <div>
          <div className="flex items-center justify-center text-[#3B5C37] mb-1">
            <Star className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.footerSmartTech}</div>
          <div className="text-base font-black text-[#0d153a] mt-0.5">{t.footerAi}</div>
        </div>
      </section>

    </div>
  );
}
