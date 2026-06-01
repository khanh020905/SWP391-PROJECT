"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  UserPlus,
  Unlock,
  Lock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Users as UsersIcon,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Shield,
  User,
  Sparkles,
} from "lucide-react";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT" | "GUEST";
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationType {
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function AdminUsersPage() {
  // Dữ liệu và trạng thái tải
  const [users, setUsers] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 8,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState({
    total: 0,
    active: 0,
    locked: 0,
    adminCount: 0,
    studentCount: 0,
    guestCount: 0,
  });

  // Trạng thái lọc và phân trang
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Trạng thái Form & Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Trường nhập liệu trong form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "STUDENT" | "GUEST">("STUDENT");
  const [formIsLocked, setFormIsLocked] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Trạng thái thông báo Toast Custom
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Hàm hiển thị thông báo Toast tự động biến mất
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Lấy danh sách users từ API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/users?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setPagination(data.pagination || { totalUsers: 0, totalPages: 1, currentPage: 1, limit: 8 });
      } else {
        showToast(data.message || "Không thể tải danh sách người dùng.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ. Vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage, pagination.limit, showToast]);

  // Lấy toàn bộ người dùng để tính toán KPI (Thống kê)
  const fetchKpis = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000");
      const data = await response.json();
      if (response.ok && data.users) {
        const list: UserType[] = data.users;
        const total = list.length;
        const active = list.filter((u) => !u.isLocked).length;
        const locked = list.filter((u) => u.isLocked).length;
        const adminCount = list.filter((u) => u.role === "ADMIN").length;
        const studentCount = list.filter((u) => u.role === "STUDENT").length;
        const guestCount = list.filter((u) => u.role === "GUEST").length;

        setKpis({ total, active, locked, adminCount, studentCount, guestCount });
      }
    } catch (err) {
      console.error("Lỗi khi tải KPIs:", err);
    }
  }, []);

  // Tự động tải lại dữ liệu khi các điều kiện lọc thay đổi
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Tải KPI thống kê khi bắt đầu và khi cập nhật dữ liệu thành công
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("STUDENT");
    setFormIsLocked(false);
    setFormError("");
    setSelectedUser(null);
  };

  // Thao tác Thêm người dùng mới
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitLoading(true);

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const metadata = session?.user.user_metadata || {};
      const adminName = metadata.name || "Admin";
      const adminEmail = session?.user.email || "admin@qualicode.com";

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-name": encodeURIComponent(adminName),
          "x-admin-email": adminEmail,
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Tạo thành công tài khoản mới cho '${formName}'!`);
        setShowAddModal(false);
        resetForm();
        fetchUsers();
        fetchKpis();
      } else {
        setFormError(data.message || "Đã xảy ra lỗi khi tạo người dùng.");
      }
    } catch (err) {
      setFormError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Thao tác sửa người dùng
  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormIsLocked(user.isLocked);
    setFormError("");
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setIsSubmitLoading(true);

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const metadata = session?.user.user_metadata || {};
      const adminName = metadata.name || "Admin";
      const adminEmail = session?.user.email || "admin@qualicode.com";

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-name": encodeURIComponent(adminName),
          "x-admin-email": adminEmail,
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          role: formRole,
          isLocked: formIsLocked,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Cập nhật thông tin tài khoản của '${formName}' thành công!`);
        setShowEditModal(false);
        resetForm();
        fetchUsers();
        fetchKpis();
      } else {
        setFormError(data.message || "Đã xảy ra lỗi khi cập nhật.");
      }
    } catch (err) {
      setFormError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Thao tác Khóa/Mở khóa tài khoản nhanh qua API Patch
  const handleToggleLock = async () => {
    if (!selectedUser) return;
    setIsSubmitLoading(true);

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const metadata = session?.user.user_metadata || {};
      const adminName = metadata.name || "Admin";
      const adminEmail = session?.user.email || "admin@qualicode.com";

      const response = await fetch(`/api/admin/users/${selectedUser.id}/toggle-lock`, {
        method: "PATCH",
        headers: {
          "x-admin-name": encodeURIComponent(adminName),
          "x-admin-email": adminEmail,
        },
      });
      const data = await response.json();

      if (response.ok) {
        showToast(
          selectedUser.isLocked
            ? `Đã mở khóa thành công tài khoản của '${selectedUser.name}'!`
            : `Đã khóa thành công tài khoản của '${selectedUser.name}'!`
        );
        setShowLockModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchKpis();
      } else {
        showToast(data.message || "Không thể khóa tài khoản.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối. Không thể khóa/mở khóa lúc này.", "error");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Thao tác Xóa tài khoản
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitLoading(true);

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const metadata = session?.user.user_metadata || {};
      const adminName = metadata.name || "Admin";
      const adminEmail = session?.user.email || "admin@qualicode.com";

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-name": encodeURIComponent(adminName),
          "x-admin-email": adminEmail,
        },
      });
      const data = await response.json();

      if (response.ok) {
        showToast(`Đã xóa vĩnh viễn tài khoản của '${selectedUser.name}' khỏi hệ thống!`);
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchKpis();
      } else {
        showToast(data.message || "Không thể xóa người dùng.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối. Không thể thực hiện xóa người dùng.", "error");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Thao tác Nâng cấp quyền Học viên nhanh (GUEST -> STUDENT)
  const handleQuickUpgrade = async () => {
    if (!selectedUser) return;
    setIsSubmitLoading(true);

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const metadata = session?.user.user_metadata || {};
      const adminName = metadata.name || "Admin";
      const adminEmail = session?.user.email || "admin@qualicode.com";

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-name": encodeURIComponent(adminName),
          "x-admin-email": adminEmail,
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: "STUDENT",
          isLocked: selectedUser.isLocked,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Đã nâng cấp tài khoản '${selectedUser.name}' lên Học viên (STUDENT) thành công!`);
        setShowUpgradeModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchKpis();
      } else {
        showToast(data.message || "Đã xảy ra lỗi khi nâng cấp quyền.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.", "error");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Trả về Avatar ngẫu nhiên/tượng trưng dựa trên chữ cái đầu của Tên
  const getAvatarInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification Custom */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-l-4 border-l-[#3B5C37] border border-slate-100 animate-slide-in max-w-sm">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
          )}
          <span className="text-sm font-bold text-slate-800 leading-tight">{toast.message}</span>
        </div>
      )}

      {/* KPI Cards section */}
      <section className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {/* KPI: Tổng số user */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8ede6] flex items-center justify-center text-[#3B5C37] flex-shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Người dùng</div>
            <div className="text-3xl font-black text-[#0d153a] mt-0.5">{kpis.total}</div>
          </div>
        </div>

        {/* KPI: Đang hoạt động */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Hoạt động</div>
            <div className="text-3xl font-black text-emerald-600 mt-0.5">{kpis.active}</div>
          </div>
        </div>

        {/* KPI: Tài khoản bị khóa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Bị khóa</div>
            <div className="text-3xl font-black text-rose-600 mt-0.5">{kpis.locked}</div>
          </div>
        </div>

        {/* KPI: Cơ cấu vai trò */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-center transition-transform duration-200 hover:-translate-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Cơ cấu Vai Trò
          </div>
          <div className="flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400">Admin</span>
              <div className="font-extrabold text-sm text-rose-600">{kpis.adminCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-100" />
            <div>
              <span className="text-[10px] font-bold text-slate-400">Student</span>
              <div className="font-extrabold text-sm text-emerald-600">{kpis.studentCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-100" />
            <div>
              <span className="text-[10px] font-bold text-slate-400">Guest</span>
              <div className="font-extrabold text-sm text-slate-500">{kpis.guestCount}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Action Header Panel */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-[#0d153a] flex items-center gap-2">
            <span>Danh sách người dùng</span>
            {isLoading && <Loader2 className="w-4 h-4 text-[#3B5C37] animate-spin" />}
          </h2>

          {/* Controls: Search, Filters, Add button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1 sm:w-60 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>

            {/* Role Filter dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-600 font-semibold"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STUDENT">STUDENT</option>
              <option value="GUEST">GUEST</option>
            </select>

            {/* Status Filter dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-600 font-semibold"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchUsers();
                fetchKpis();
                showToast("Đã cập nhật danh sách người dùng.");
              }}
              className="p-2 text-slate-500 hover:text-[#3B5C37] hover:bg-slate-100 rounded-xl transition-all"
              title="Làm mới"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Add User Button */}
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-[#3B5C37] hover:bg-[#2f4a2b] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm User</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading && users.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-10 h-10 text-[#3B5C37] animate-spin" />
              <p className="text-sm font-bold">Đang tải danh sách người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold">Không tìm thấy người dùng phù hợp.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className="text-[#3B5C37] text-xs font-bold underline mt-2"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Địa chỉ Email</th>
                  <th className="px-6 py-4 text-center">Vai trò</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tham gia</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors text-slate-700 text-sm font-medium"
                  >
                    {/* User profile with initials */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                            user.role === "ADMIN"
                              ? "bg-rose-500"
                              : user.role === "STUDENT"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        >
                          {getAvatarInitials(user.name)}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#0d153a] block leading-snug">{user.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">ID: {user.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Email address */}
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-500">{user.email}</td>

                    {/* Role badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                          user.role === "ADMIN"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : user.role === "STUDENT"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {user.role === "ADMIN" && <Shield className="w-3 h-3" />}
                        {user.role === "STUDENT" && <User className="w-3 h-3" />}
                        <span>{user.role}</span>
                      </span>
                    </td>

                    {/* Lock Status badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-100 text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Bị khóa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Hoạt động</span>
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs font-semibold">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>

                    {/* Actions Panel */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Upgrade Student Action Button */}
                        {user.role === "GUEST" && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUpgradeModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 transition-all hover:scale-[1.03]"
                            title="Nâng cấp Học viên"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Lock Action Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowLockModal(true);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            user.isLocked
                              ? "bg-emerald-50 hover:bg-[#2f4a2b]merald-100 border-emerald-200 text-emerald-600"
                              : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                          }`}
                          title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        >
                          {user.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 transition-all"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {users.length > 0 && (
          <div className="p-5 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">
              Hiển thị {users.length} trên tổng số {pagination.totalUsers} người dùng
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 px-3">
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL 1: ADD USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-lg">Thêm người dùng mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ tên đầy đủ..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Đăng ký</label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com..."
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Vai trò (Role)</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 font-semibold"
                >
                  <option value="STUDENT">STUDENT (Học viên)</option>
                  <option value="GUEST">GUEST (Khách hàng vãng lai)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-[#3B5C37] hover:bg-[#2f4a2b] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Thêm mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-lg">Chỉnh sửa thông tin</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Vai trò (Role)</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 font-semibold"
                >
                  <option value="STUDENT">STUDENT (Học viên)</option>
                  <option value="GUEST">GUEST (Khách hàng vãng lai)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>

              {/* Lock toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="text-xs font-extrabold text-slate-700 block">Khóa tài khoản</span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    Người dùng sẽ không thể đăng nhập vào ứng dụng
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsLocked}
                  onChange={(e) => setFormIsLocked(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#3B5C37] focus:ring-[#3B5C37] accent-[#3B5C37] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-[#3B5C37] hover:bg-[#2f4a2b] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM QUICK LOCK/UNLOCK */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-zoom-in p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${
                  selectedUser.isLocked
                    ? "bg-emerald-50 border-emerald-100 text-emerald-500"
                    : "bg-rose-50 border-rose-100 text-rose-500"
                }`}
              >
                {selectedUser.isLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-[#0d153a] text-lg">
                  {selectedUser.isLocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
                </h3>
                <p className="text-slate-400 text-xs mt-2 font-medium px-4">
                  Bạn có chắc chắn muốn {selectedUser.isLocked ? "mở khóa" : "khóa"} tài khoản của{" "}
                  <strong className="text-slate-700">{selectedUser.name}</strong> ({selectedUser.email})?
                </p>
              </div>
              <div className="w-full flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setShowLockModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleToggleLock}
                  disabled={isSubmitLoading}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    selectedUser.isLocked
                      ? "bg-emerald-500 hover:bg-[#2f4a2b]merald-600 shadow-emerald-200"
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                  }`}
                >
                  {isSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM DELETE */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-zoom-in p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 border-4 border-rose-100 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-600 text-lg">Xóa vĩnh viễn user?</h3>
                <p className="text-slate-400 text-xs mt-2 font-medium px-4">
                  Hành động này **không thể phục hồi**. Bạn chắc chắn muốn xóa vĩnh viễn tài khoản của{" "}
                  <strong className="text-slate-700">{selectedUser.name}</strong>?
                </p>
              </div>
              <div className="w-full flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isSubmitLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRM QUICK UPGRADE */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-zoom-in p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 border-4 border-indigo-100 text-indigo-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0d153a] text-lg">Nâng cấp Học viên?</h3>
                <p className="text-slate-400 text-xs mt-2 font-medium px-4">
                  Bạn có chắc chắn muốn nâng cấp nhanh tài khoản của{" "}
                  <strong className="text-slate-700">{selectedUser.name}</strong> từ vai trò <strong className="text-amber-600">GUEST</strong> lên <strong className="text-indigo-600">STUDENT (Học viên)</strong>?
                </p>
              </div>
              <div className="w-full flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleQuickUpgrade}
                  disabled={isSubmitLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận nâng cấp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
