"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserPlus,
  Sparkles,
  Info,
  Calendar,
  User,
} from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOCK" | "UNLOCK" | "UPGRADE";
  targetName: string;
  targetEmail: string;
  details: string;
}

interface Pagination {
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic KPIs calculated from all logs (we will fetch all logs or calculate from local state)
  const [kpis, setKpis] = useState({
    total: 0,
    locks: 0,
    upgrades: 0,
    creations: 0,
  });

  // Modal & Toast States
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch paginated logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        action: actionFilter,
        page: currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/admin/activity-logs?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
        setPagination(data.pagination || { totalLogs: 0, totalPages: 1, currentPage: 1, limit: 10 });
      } else {
        showToast(data.message || "Không thể tải lịch sử hoạt động.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ khi lấy logs.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, currentPage, showToast]);

  // Fetch all logs to compute absolute KPIs
  const fetchKpis = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/activity-logs?limit=5000");
      const data = await response.json();
      if (response.ok && data.logs) {
        const allLogs: ActivityLog[] = data.logs;
        setKpis({
          total: allLogs.length,
          locks: allLogs.filter(l => l.action === "LOCK" || l.action === "UNLOCK").length,
          upgrades: allLogs.filter(l => l.action === "UPGRADE").length,
          creations: allLogs.filter(l => l.action === "CREATE").length,
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải KPIs lịch sử:", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Clear all logs action
  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const response = await fetch("/api/admin/activity-logs", {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        showToast("Đã dọn dẹp sạch toàn bộ lịch sử hoạt động hệ thống!");
        setShowClearModal(false);
        fetchLogs();
        fetchKpis();
      } else {
        showToast(data.message || "Không thể xóa lịch sử hoạt động.", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi kết nối khi dọn dẹp lịch sử.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  // UI Helpers
  const getActionBadge = (action: ActivityLog["action"]) => {
    switch (action) {
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-emerald-50 border-emerald-200 text-emerald-700">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo tài khoản</span>
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-blue-50 border-blue-200 text-blue-700">
            <Info className="w-3.5 h-3.5" />
            <span>Cập nhật</span>
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-red-50 border-red-200 text-red-700">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tài khoản</span>
          </span>
        );
      case "LOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-rose-50 border-rose-200 text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Khóa tài khoản</span>
          </span>
        );
      case "UNLOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-teal-50 border-teal-200 text-teal-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mở khóa</span>
          </span>
        );
      case "UPGRADE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Nâng cấp Học viên</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border bg-slate-50 border-slate-200 text-slate-700">
            <span>{action}</span>
          </span>
        );
    }
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatVietnameseDate = (isoString: string) => {
    const d = new Date(isoString);
    const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${timeStr} - ${dateStr}`;
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Notification Custom */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-l-4 border-l-[#3B5C37] border border-slate-100 animate-slide-in max-w-sm">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
          )}
          <span className="text-sm font-bold text-slate-800 leading-tight">{toast.message}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-[#0d153a] to-[#1e2a5e] text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#3B5C37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5 max-w-xl">
          <span className="bg-[#3B5C37]/25 text-[#ffab66] border border-[#3B5C37]/30 text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block">
            Nhật ký Bảo mật
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Lịch sử hoạt động <span className="text-[#3B5C37]">Hệ thống</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            Theo dõi thời gian thực mọi thay đổi, từ tạo tài khoản mới, nâng cấp học viên, cho đến khóa/mở khóa tài khoản bảo mật của QualiCode.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            onClick={() => {
              fetchLogs();
              fetchKpis();
              showToast("Đã cập nhật lịch sử mới nhất!");
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
          
          <button
            onClick={() => setShowClearModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa toàn bộ nhật ký</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {/* KPI: Tổng số hoạt động */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-[#e8ede6] flex items-center justify-center text-[#3B5C37] flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số hoạt động</div>
            <div className="text-2xl font-black text-[#0d153a] mt-0.5">{kpis.total}</div>
          </div>
        </div>

        {/* KPI: Lượt nâng cấp học viên */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nâng cấp Học viên</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">{kpis.upgrades}</div>
          </div>
        </div>

        {/* KPI: Tạo mới tài khoản */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tạo tài khoản</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{kpis.creations}</div>
          </div>
        </div>

        {/* KPI: Khóa/Mở bảo mật */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khóa & Bảo mật</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{kpis.locks}</div>
          </div>
        </div>
      </section>

      {/* Filters and Table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Filter Panel */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50/50">
          <h2 className="text-base font-black text-[#0d153a] flex items-center gap-2">
            <span>Chi tiết nhật ký hoạt động</span>
            {isLoading && <Loader2 className="w-4 h-4 text-[#3B5C37] animate-spin" />}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm admin, người nhận, nội dung..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>

            {/* Action Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-600 font-semibold"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="CREATE">CREATE (Tạo mới)</option>
                <option value="UPDATE">UPDATE (Cập nhật)</option>
                <option value="DELETE">DELETE (Xóa bỏ)</option>
                <option value="LOCK">LOCK (Khóa tài khoản)</option>
                <option value="UNLOCK">UNLOCK (Mở khóa)</option>
                <option value="UPGRADE">UPGRADE (Nâng cấp Học viên)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading && logs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-[#3B5C37] animate-spin" />
              <p className="text-xs font-bold">Đang tải nhật ký lịch sử hệ thống...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Clock className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold">Không tìm thấy bản ghi hoạt động nào.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("ALL");
                  setCurrentPage(1);
                }}
                className="text-[#3B5C37] text-xs font-bold underline mt-2"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Quản trị viên (Admin)</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                  <th className="px-6 py-4">Đối tượng tác động</th>
                  <th className="px-6 py-4">Chi tiết hoạt động</th>
                  <th className="px-6 py-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Admin User */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] font-black text-xs flex items-center justify-center">
                          {getAvatarInitials(log.adminName)}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#0d153a] block leading-tight">{log.adminName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{log.adminEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Target User */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.targetEmail ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <span className="font-bold text-[#0d153a] block leading-none">{log.targetName}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1">{log.targetEmail}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Không có đối tượng</span>
                      )}
                    </td>

                    {/* Activity Details */}
                    <td className="px-6 py-4">
                      <p className="text-slate-500 font-semibold max-w-sm break-words leading-relaxed">
                        {log.details}
                      </p>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatVietnameseDate(log.timestamp)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {logs.length > 0 && (
          <div className="p-5 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">
              Hiển thị {logs.length} trên tổng số {pagination.totalLogs} bản ghi hoạt động
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 px-3">
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CONFIRM CLEAR LOGS MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-zoom-in p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 border-4 border-rose-100 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-600 text-lg">Dọn dẹp lịch sử hoạt động?</h3>
                <p className="text-slate-400 text-xs mt-2 font-medium px-2 leading-relaxed">
                  Hành động này sẽ **xóa sạch vĩnh viễn** toàn bộ nhật ký ghi lại các thao tác của Admin từ trước tới nay. Hành động này **không thể hoàn tác**.
                </p>
              </div>
              <div className="w-full flex gap-2.5 mt-4">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {isClearing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
