"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Mail,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Globe,
  Key,
  Database,
  Layers,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

interface SystemConfig {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: "GUEST" | "STUDENT" | "ADMIN";
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  sendOnRegister: boolean;
  sendOnPayment: boolean;
  sendOnLock: boolean;
}

interface BandScoreConfig {
  fluencyWeight: number;
  lexicalWeight: number;
  grammarWeight: number;
  pronunciationWeight: number;
  beginnerMaxBand: number;
  intermediateMaxBand: number;
  advancedMinBand: number;
  beginnerFeedback: string;
  intermediateFeedback: string;
  advancedFeedback: string;
}

interface SystemSettings {
  system: SystemConfig;
  email: EmailConfig;
  bandScore: BandScoreConfig;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"system" | "email" | "band">("system");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // States for weight percentages (UI displays 0-100 instead of 0.0-1.0)
  const [weights, setWeights] = useState({
    fluency: 25,
    lexical: 25,
    grammar: 25,
    pronunciation: 25,
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (response.ok && data.settings) {
        setSettings(data.settings);
        
        // Convert decimal weights to percentages for UI display
        const bs = data.settings.bandScore;
        setWeights({
          fluency: bs.fluencyWeight <= 1 ? Math.round(bs.fluencyWeight * 100) : bs.fluencyWeight,
          lexical: bs.lexicalWeight <= 1 ? Math.round(bs.lexicalWeight * 100) : bs.lexicalWeight,
          grammar: bs.grammarWeight <= 1 ? Math.round(bs.grammarWeight * 100) : bs.grammarWeight,
          pronunciation: bs.pronunciationWeight <= 1 ? Math.round(bs.pronunciationWeight * 100) : bs.pronunciationWeight,
        });
      } else {
        showToast(data.message || "Không thể tải cấu hình hệ thống.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ khi lấy cấu hình.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Calculate sum of weights dynamically
  const totalWeight = Number(weights.fluency) + Number(weights.lexical) + Number(weights.grammar) + Number(weights.pronunciation);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  // Handle weight change helper
  const handleWeightChange = (field: keyof typeof weights, value: string) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setWeights((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  // Handle saving configurations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    // Validate weights sum
    if (!isWeightValid) {
      showToast(`Tổng trọng số IELTS Speaking phải bằng 100%. Hiện tại: ${totalWeight}%`, "error");
      return;
    }

    // Validate bands consistency
    const { beginnerMaxBand, intermediateMaxBand, advancedMinBand } = settings.bandScore;
    if (Number(beginnerMaxBand) >= Number(intermediateMaxBand)) {
      showToast("Ngưỡng điểm Beginner tối đa phải nhỏ hơn ngưỡng Intermediate tối đa.", "error");
      return;
    }
    if (Number(intermediateMaxBand) >= Number(advancedMinBand)) {
      showToast("Ngưỡng điểm Intermediate tối đa phải nhỏ hơn ngưỡng Advanced tối thiểu.", "error");
      return;
    }

    setIsSaving(true);

    try {
      // Build request body with updated weights
      const payload: SystemSettings = {
        ...settings,
        bandScore: {
          ...settings.bandScore,
          fluencyWeight: weights.fluency,
          lexicalWeight: weights.lexical,
          grammarWeight: weights.grammar,
          pronunciationWeight: weights.pronunciation,
        },
      };

      // Add mock session metadata in headers to log admin actions
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (typeof window !== "undefined") {
        const mockSession = localStorage.getItem("mock_session");
        if (mockSession) {
          try {
            const admin = JSON.parse(mockSession);
            if (admin.name) headers["x-admin-name"] = encodeURIComponent(admin.name);
            if (admin.email) headers["x-admin-email"] = admin.email;
          } catch (e) {
            console.error("Lỗi khi giải mã session admin:", e);
          }
        }
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Lưu cấu hình hệ thống thành công!");
        if (data.settings) {
          setSettings(data.settings);
          // Sync UI weights
          const bs = data.settings.bandScore;
          setWeights({
            fluency: bs.fluencyWeight <= 1 ? Math.round(bs.fluencyWeight * 100) : bs.fluencyWeight,
            lexical: bs.lexicalWeight <= 1 ? Math.round(bs.lexicalWeight * 100) : bs.lexicalWeight,
            grammar: bs.grammarWeight <= 1 ? Math.round(bs.grammarWeight * 100) : bs.grammarWeight,
            pronunciation: bs.pronunciationWeight <= 1 ? Math.round(bs.pronunciationWeight * 100) : bs.pronunciationWeight,
          });
        }
      } else {
        showToast(data.message || "Không thể lưu cấu hình.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối khi gửi dữ liệu cấu hình.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-10 h-10 text-[#3B5C37] animate-spin" />
        <p className="text-sm font-bold animate-pulse">Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Custom Toast Notification */}
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

      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#0d153a] to-[#1e2a5e] text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#3B5C37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5 max-w-xl">
          <span className="bg-[#3B5C37]/25 text-[#ffab66] border border-[#3B5C37]/30 text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block">
            Quản trị tối cao
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Cấu hình <span className="text-[#3B5C37]">Hệ thống</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            Thiết lập các thông số chung, máy chủ gửi email thông báo tự động và tùy chỉnh nhận xét AI cũng như trọng số tính điểm IELTS Speaking.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            onClick={fetchSettings}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải lại</span>
          </button>
        </div>
      </section>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "system"
              ? "border-[#3B5C37] text-[#3B5C37]"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Tham số hệ thống</span>
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "email"
              ? "border-[#3B5C37] text-[#3B5C37]"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Cấu hình Email & SMTP</span>
        </button>

        <button
          onClick={() => setActiveTab("band")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "band"
              ? "border-[#3B5C37] text-[#3B5C37]"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Trọng số & Ngưỡng điểm IELTS</span>
        </button>
      </div>

      {settings && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: SYSTEM SETTINGS */}
          {activeTab === "system" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-scale-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-[#0d153a] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#3B5C37]" />
                  <span>Tham số chung của Ứng dụng</span>
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Quản lý thông tin nhận diện cơ bản của hệ thống và các chế độ truy cập toàn cục.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* App Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên ứng dụng</label>
                  <input
                    type="text"
                    value={settings.system.appName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        system: { ...settings.system, appName: e.target.value },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-semibold"
                    placeholder="Nhập tên ứng dụng..."
                    required
                  />
                </div>

                {/* Support Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email hỗ trợ khách hàng</label>
                  <input
                    type="email"
                    value={settings.system.supportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        system: { ...settings.system, supportEmail: e.target.value },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-semibold"
                    placeholder="support@yourdomain.com"
                    required
                  />
                </div>

                {/* Default User Role */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò mặc định cho tài khoản mới</label>
                  <select
                    value={settings.system.defaultUserRole}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          defaultUserRole: e.target.value as "GUEST" | "STUDENT" | "ADMIN",
                        },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-600 font-semibold"
                  >
                    <option value="GUEST">GUEST (Khách vãng lai)</option>
                    <option value="STUDENT">STUDENT (Học viên)</option>
                    <option value="ADMIN">ADMIN (Quản trị viên)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Các tài khoản đăng ký trực tuyến sẽ tự động được gán vai trò này.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                {/* Allow Registration Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-[#0d153a]">Cho phép Đăng ký tài khoản mới</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Bật/Tắt tính năng tạo tài khoản của học viên bên ngoài giao diện đăng nhập.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.system.allowRegistration}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, allowRegistration: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B5C37]"></div>
                  </label>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Chế độ bảo trì hệ thống (Maintenance Mode)</span>
                    </h4>
                    <p className="text-xs text-amber-600/80 font-medium mt-0.5">
                      Khi được bật, học viên thông thường không thể truy cập vào hệ thống làm bài hoặc thanh toán.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.system.maintenanceMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, maintenanceMode: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL CONFIGS */}
          {activeTab === "email" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-scale-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-[#0d153a] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#3B5C37]" />
                  <span>Cấu hình SMTP Server & Email Gửi đi</span>
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Thiết lập thông tin máy chủ SMTP phục vụ cho việc gửi mã OTP, hóa đơn thanh toán và cảnh báo hệ thống.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* SMTP Host */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Máy chủ SMTP Host</label>
                  <input
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpHost: e.target.value },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-semibold"
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>

                {/* SMTP Port */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cổng Port</label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpPort: Number(e.target.value) || 587 },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-semibold"
                    placeholder="587"
                    required
                  />
                </div>

                {/* SMTP User */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Gửi thư (Username/Email)</label>
                  <input
                    type="text"
                    value={settings.email.smtpUser}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpUser: e.target.value },
                      })
                    }
                    className="w-full bg-white px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-semibold"
                    placeholder="sender@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">
                  Sự kiện gửi thư tự động (Automated Triggers)
                </h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Register Event */}
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.email.sendOnRegister}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, sendOnRegister: e.target.checked },
                        })
                      }
                      className="w-4.5 h-4.5 text-[#3B5C37] bg-white border-slate-300 rounded-lg focus:ring-[#3B5C37] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#0d153a] block">Khi đăng ký mới</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Gửi thư chào mừng học viên</span>
                    </div>
                  </label>

                  {/* Payment Event */}
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.email.sendOnPayment}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, sendOnPayment: e.target.checked },
                        })
                      }
                      className="w-4.5 h-4.5 text-[#3B5C37] bg-white border-slate-300 rounded-lg focus:ring-[#3B5C37] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#0d153a] block">Thanh toán thành công</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Gửi hóa đơn và thông tin gói học</span>
                    </div>
                  </label>

                  {/* Lock Event */}
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.email.sendOnLock}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, sendOnLock: e.target.checked },
                        })
                      }
                      className="w-4.5 h-4.5 text-[#3B5C37] bg-white border-slate-300 rounded-lg focus:ring-[#3B5C37] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#0d153a] block">Tài khoản bị khóa</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Gửi lý do và hướng dẫn hỗ trợ</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BAND SCORE CONFIGS */}
          {activeTab === "band" && (
            <div className="space-y-6 animate-scale-in">
              {/* Card 1: Weights configuration */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-[#0d153a] flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#3B5C37]" />
                    <span>Trọng số tính điểm IELTS Speaking</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Điều chỉnh tỉ lệ phần trăm của 4 tiêu chí chấm thi Speaking. Tổng của cả 4 giá trị bắt buộc phải bằng **100%**.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-4">
                  {/* Fluency Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Fluency & Coherence (Độ trôi chảy)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weights.fluency}
                        onChange={(e) => handleWeightChange("fluency", e.target.value)}
                        className="w-full bg-white pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Lexical Resource Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Lexical Resource (Từ vựng)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weights.lexical}
                        onChange={(e) => handleWeightChange("lexical", e.target.value)}
                        className="w-full bg-white pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Grammar Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Grammar Range & Accuracy (Ngữ pháp)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weights.grammar}
                        onChange={(e) => handleWeightChange("grammar", e.target.value)}
                        className="w-full bg-white pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Pronunciation Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Pronunciation (Phát âm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weights.pronunciation}
                        onChange={(e) => handleWeightChange("pronunciation", e.target.value)}
                        className="w-full bg-white pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Validation Info Box */}
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  isWeightValid 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                    : "bg-rose-50 border-rose-100 text-rose-700 animate-pulse"
                }`}>
                  <div className="flex items-center gap-2">
                    {isWeightValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>Tổng tỷ trọng hiện tại: {totalWeight}%</span>
                  </div>
                  <span>
                    {isWeightValid ? "Hợp lệ và sẵn sàng lưu trữ" : "Lỗi: Tổng trọng số phải chính xác bằng 100%!"}
                  </span>
                </div>
              </div>

              {/* Card 2: Band score ranges & feedback */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-[#0d153a] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#3B5C37]" />
                    <span>Ngưỡng phân loại cấp độ & Nhận xét mẫu AI</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Cấu hình dải điểm IELTS Speaking cho từng cấp độ và soạn sẵn văn bản nhận xét tương ứng để hiển thị tự động.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* BEGINNER BAND */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <span className="text-sm font-extrabold text-[#0d153a]">1. Cấp độ CƠ BẢN (Beginner)</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Dải điểm: 0.0 - đến tối đa:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          value={settings.bandScore.beginnerMaxBand}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              bandScore: {
                                ...settings.bandScore,
                                beginnerMaxBand: Number(e.target.value) || 4.5,
                              },
                            })
                          }
                          className="w-16 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold rounded-lg border border-slate-200 focus:outline-none focus:border-[#3B5C37]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Văn bản nhận xét mẫu</label>
                      <textarea
                        value={settings.bandScore.beginnerFeedback}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bandScore: {
                              ...settings.bandScore,
                              beginnerFeedback: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        className="w-full bg-white px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-600 font-medium leading-relaxed"
                        placeholder="Nhập nhận xét mẫu cho cấp độ Beginner..."
                        required
                      />
                    </div>
                  </div>

                  {/* INTERMEDIATE BAND */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <span className="text-sm font-extrabold text-[#0d153a]">2. Cấp độ TRUNG CẤP (Intermediate)</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Dải điểm từ: {(Number(settings.bandScore.beginnerMaxBand) + 0.5).toFixed(1)} - đến tối đa:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          value={settings.bandScore.intermediateMaxBand}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              bandScore: {
                                ...settings.bandScore,
                                intermediateMaxBand: Number(e.target.value) || 6.5,
                              },
                            })
                          }
                          className="w-16 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold rounded-lg border border-slate-200 focus:outline-none focus:border-[#3B5C37]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Văn bản nhận xét mẫu</label>
                      <textarea
                        value={settings.bandScore.intermediateFeedback}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bandScore: {
                              ...settings.bandScore,
                              intermediateFeedback: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        className="w-full bg-white px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-600 font-medium leading-relaxed"
                        placeholder="Nhập nhận xét mẫu cho cấp độ Intermediate..."
                        required
                      />
                    </div>
                  </div>

                  {/* ADVANCED BAND */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <span className="text-sm font-extrabold text-[#0d153a]">3. Cấp độ CAO CẤP (Advanced)</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Dải điểm từ tối thiểu:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          value={settings.bandScore.advancedMinBand}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              bandScore: {
                                ...settings.bandScore,
                                advancedMinBand: Number(e.target.value) || 7.0,
                              },
                            })
                          }
                          className="w-16 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold rounded-lg border border-slate-200 focus:outline-none focus:border-[#3B5C37]"
                        />
                        <span>trở lên (đến 9.0)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Văn bản nhận xét mẫu</label>
                      <textarea
                        value={settings.bandScore.advancedFeedback}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bandScore: {
                              ...settings.bandScore,
                              advancedFeedback: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        className="w-full bg-white px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-600 font-medium leading-relaxed"
                        placeholder="Nhập nhận xét mẫu cho cấp độ Advanced..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer Panel */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Hãy kiểm tra kỹ trước khi bấm lưu để tránh lỗi hoạt động.</span>
            </div>
            
            <button
              type="submit"
              disabled={isSaving || (activeTab === "band" && !isWeightValid)}
              className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#3B5C37] hover:bg-[#2f4a2b] disabled:opacity-50 transition-all shadow-md shadow-orange-100 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu cấu hình hệ thống</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
