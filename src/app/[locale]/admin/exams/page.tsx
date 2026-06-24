"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Music,
  ChevronDown,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  cambridge_no: number | null;
  test_no: number | null;
  status: "draft" | "published";
  category: "listening" | "reading" | "writing" | "speaking";
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  exam_sections: { id: string; section_no: number; title: string }[];
}

export default function AdminExamsPage() {
  const locale = useLocale();
  const isEn = locale === "en";

  const t = {
    toastErrorLoad: isEn ? "Failed to load exam list" : "Không thể tải danh sách đề thi",
    toastErrorConn: isEn ? "Server connection error" : "Lỗi kết nối máy chủ",
    toastSuccessDelete: (title: string) => isEn ? `Deleted exam "${title}"` : `Đã xóa đề thi "${title}"`,
    toastErrorDelete: isEn ? "Failed to delete exam" : "Xóa thất bại",
    confirmDeleteTitle: isEn ? "Confirm Delete Exam" : "Xác nhận xóa đề thi",
    confirmDeleteDesc: (title: string) => isEn
      ? `Are you sure you want to delete exam "${title}"? This action will permanently delete all contents, questions and related audio files.`
      : `Bạn có chắc chắn muốn xóa đề thi "${title}"? Thao tác này sẽ xóa vĩnh viễn tất cả nội dung, câu hỏi và file audio liên quan.`,
    cancel: isEn ? "Cancel" : "Hủy",
    delete: isEn ? "Delete" : "Xóa",
    deleting: isEn ? "Deleting..." : "Đang xóa...",
    pageTitle: isEn ? "Manage Cambridge Exams" : "Quản lý Đề Thi Cambridge",
    pageDesc: isEn ? "Add, edit and delete Cambridge IELTS Listening, Reading, and Writing exams" : "Thêm, sửa và xóa các đề thi Cambridge IELTS Listening, Reading, và Writing",
    addExam: isEn ? "Add New Exam" : "Thêm đề thi mới",
    searchPlaceholder: isEn ? "Search exam name..." : "Tìm kiếm tên đề thi...",
    filterAllStatus: isEn ? "All statuses" : "Tất cả trạng thái",
    filterPublished: isEn ? "Published" : "Đã xuất bản",
    filterDraft: isEn ? "Draft" : "Nháp",
    loadingData: isEn ? "Loading data..." : "Đang tải dữ liệu...",
    noExamsFound: isEn ? "No exams found" : "Không tìm thấy đề thi",
    filterHelpText: isEn ? "Try changing search filters" : "Thử thay đổi bộ lọc tìm kiếm",
    newExamHelpText: isEn ? "Click \"Add New Exam\" to create your first Cambridge exam" : "Nhấn \"Thêm đề thi mới\" để tạo đề thi Cambridge đầu tiên",
    createNewExam: isEn ? "Create New Exam" : "Tạo đề thi mới",
    thExam: isEn ? "Exam" : "Đề thi",
    thCambridge: isEn ? "Cambridge" : "Cambridge",
    thContent: isEn ? "Content" : "Nội dung",
    thStatus: isEn ? "Status" : "Trạng thái",
    thDate: isEn ? "Created Date" : "Ngày tạo",
    thActions: isEn ? "Actions" : "Hành động",
    statusPublished: isEn ? "Published" : "Đã xuất bản",
    statusDraft: isEn ? "Draft" : "Nháp",
    titleEdit: isEn ? "Edit" : "Chỉnh sửa",
    titleDelete: isEn ? "Delete" : "Xóa",
    showingExams: (count: number) => isEn ? `Showing ${count} exams` : `Hiển thị ${count} đề thi`,
  };

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await authFetch(`/api/admin/exams?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setExams(data.exams || []);
      } else {
        showToast("error", data.error || t.toastErrorLoad);
      }
    } catch {
      showToast("error", t.toastErrorConn);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, t.toastErrorLoad, t.toastErrorConn]);

  useEffect(() => {
    const timer = setTimeout(() => fetchExams(), 300);
    return () => clearTimeout(timer);
  }, [fetchExams]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/admin/exams/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        showToast("success", t.toastSuccessDelete(deleteTarget.title));
        setDeleteTarget(null);
      } else {
        showToast("error", data.error || t.toastErrorDelete);
      }
    } catch {
      showToast("error", t.toastErrorConn);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isEn ? "en-US" : "vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border text-sm font-bold transition-all animate-slide-in-right ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,23,56,0.15)] border border-slate-100 p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0d153a]">{t.confirmDeleteTitle}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {t.confirmDeleteDesc(deleteTarget.title)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? t.deleting : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0d153a]">{t.pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t.pageDesc}
          </p>
        </div>
        <Link
          href="/admin/exams/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B5C37] text-white text-sm font-bold hover:bg-[#2f4a2b] transition-all shadow-[0_4px_16px_rgba(59, 92, 55,0.25)] hover:shadow-[0_6px_20px_rgba(59, 92, 55,0.35)] active:scale-95 select-none"
        >
          <Plus className="w-4 h-4" />
          {t.addExam}
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors cursor-pointer"
          >
            <option value="all">{t.filterAllStatus}</option>
            <option value="published">{t.filterPublished}</option>
            <option value="draft">{t.filterDraft}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors cursor-pointer"
          >
            <option value="all">{isEn ? "All skills" : "Tất cả kỹ năng"}</option>
            <option value="listening">{isEn ? "Listening" : "Nghe (Listening)"}</option>
            <option value="reading">{isEn ? "Reading" : "Đọc (Reading)"}</option>
            <option value="writing">{isEn ? "Writing" : "Viết (Writing)"}</option>
            <option value="speaking">{isEn ? "Speaking" : "Nói (Speaking)"}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchExams}
          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-[#0d153a] hover:border-slate-300 transition-colors"
          title={isEn ? "Refresh" : "Tải lại"}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400">{t.loadingData}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-500">{t.noExamsFound}</p>
              <p className="text-xs text-slate-400 mt-1">
                {search || statusFilter !== "all"
                  ? t.filterHelpText
                  : t.newExamHelpText}
              </p>
            </div>
            {!search && statusFilter === "all" && (
              <Link
                href="/admin/exams/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-bold hover:bg-[#3B5C37]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.createNewExam}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    {t.thExam}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    {isEn ? "Category" : "Kỹ năng"}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    {t.thCambridge}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    {t.thContent}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    {t.thStatus}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    {t.thDate}
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    {t.thActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#3B5C37]/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5 text-[#3B5C37]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d153a] leading-tight line-clamp-1">
                            {exam.title}
                          </p>
                          {exam.description && (
                            <p className="text-xs text-slate-400 mt-0.5 leading-normal line-clamp-1">
                              {exam.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        exam.category === "reading"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : exam.category === "writing"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : exam.category === "speaking"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {exam.category === "reading"
                          ? (isEn ? "Reading" : "Đọc")
                          : exam.category === "writing"
                          ? (isEn ? "Writing" : "Viết")
                          : exam.category === "speaking"
                          ? (isEn ? "Speaking" : "Nói")
                          : (isEn ? "Listening" : "Nghe")}
                      </span>
                    </td>

                    {/* Cambridge Info */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {exam.cambridge_no ? (
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#0d153a]">
                            Cambridge {exam.cambridge_no}
                          </span>
                          {exam.test_no && (
                            <p className="text-[10px] font-medium text-slate-400">
                              Test {exam.test_no}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">–</span>
                      )}
                    </td>

                    {/* Content Summary */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        {exam.audio_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-600 text-[10px] font-bold border border-violet-100">
                            <Music className="w-3 h-3" />
                            Audio
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                          {exam.exam_sections?.length || 0}/{exam.category === "writing" ? 2 : exam.category === "speaking" ? 3 : exam.category === "reading" ? 3 : 4}{" "}
                          {exam.category === "writing" ? "Task" : exam.category === "speaking" ? "Part" : exam.category === "reading" ? "Passage" : "Section"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {exam.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.statusPublished}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                          <Clock3 className="w-3 h-3" />
                          {t.statusDraft}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(exam.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#3B5C37] hover:bg-[#e8ede6] transition-all"
                          title={t.titleEdit}
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(exam)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title={t.titleDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer summary */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40">
              <p className="text-xs font-medium text-slate-400">
                {t.showingExams(exams.length)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
