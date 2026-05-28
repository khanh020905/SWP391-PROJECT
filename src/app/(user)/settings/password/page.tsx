"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, Lock, Eye, EyeOff, Key, ShieldCheck } from "lucide-react";

export default function SettingsPasswordPage() {
  const { user, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Password Strength Meter score 1-5
  let passwordStrength = 0;
  if (newPassword.length >= 6) passwordStrength += 1;
  if (newPassword.length >= 10) passwordStrength += 1;
  if (/[A-Z]/.test(newPassword)) passwordStrength += 1;
  if (/[0-9]/.test(newPassword)) passwordStrength += 1;
  if (/[^A-Za-z0-9]/.test(newPassword)) passwordStrength += 1;

  if (loading || !user) return null;

  const isGoogleUser = user.app_metadata?.provider === "google";

  const getStrengthLabelAndColor = () => {
    switch (passwordStrength) {
      case 1: return { label: "Yếu", color: "bg-red-500", text: "text-red-500" };
      case 2: return { label: "Trung bình", color: "bg-orange-500", text: "text-orange-500" };
      case 3: return { label: "Khá", color: "bg-yellow-500", text: "text-yellow-500" };
      case 4: return { label: "Mạnh", color: "bg-green-500", text: "text-green-500" };
      case 5: return { label: "Rất mạnh", color: "bg-emerald-500", text: "text-emerald-500" };
      default: return { label: "Quá ngắn", color: "bg-slate-200", text: "text-slate-400" };
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải dài tối thiểu 6 ký tự.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      setIsLoading(false);
      return;
    }

    if (!isGoogleUser && newPassword === currentPassword) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      setIsLoading(false);
      return;
    }

    try {
      if (!isGoogleUser) {
        // Re-authenticate
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user.email || "",
          password: currentPassword,
        });

        if (authError) {
          setErrorMsg("Mật khẩu hiện tại không chính xác.");
          setIsLoading(false);
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getStrengthLabelAndColor();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#0d153a]">Đổi mật khẩu</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Thay đổi mật khẩu đăng nhập của bạn.</p>
        </div>

        {isGoogleUser && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-blue-800 text-xs leading-relaxed animate-fade-in">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-bold">Đăng nhập qua tài khoản Google</p>
              <p className="mt-0.5 text-blue-700">Tài khoản Google hiện tại của bạn không liên kết mật khẩu trực tiếp. Bạn có thể đặt mật khẩu mới ngay tại đây để đăng nhập trực tiếp bằng email sau này.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          {!isGoogleUser && (
            <div className="group relative">
              <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00]">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] bg-transparent border-none cursor-pointer outline-none"
                >
                  {showCurrent ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="group relative">
            <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2">Mật khẩu mới</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00]">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] bg-transparent border-none cursor-pointer outline-none"
              >
                {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Password strength meter */}
            {newPassword && (
              <div className="mt-2.5 space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        idx <= passwordStrength ? strength.color : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="group relative">
            <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00]">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] bg-transparent border-none cursor-pointer outline-none"
              >
                {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Match status */}
            {confirmPassword && (
              <div className="mt-1 text-[10px] font-bold">
                {newPassword === confirmPassword ? (
                  <span className="text-green-600">✓ Mật khẩu trùng khớp</span>
                ) : (
                  <span className="text-red-500">✗ Mật khẩu xác nhận chưa khớp</span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (newPassword !== confirmPassword && confirmPassword !== "")}
            className="px-6 h-12 bg-[#ff7a00] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer border-none outline-none mt-6"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Thay đổi mật khẩu</span>
                <Key className="w-3.5 h-3.5 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security tips card */}
      <div className="bg-[#fcfcff] border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <h4 className="font-extrabold text-[#0d153a] text-xs flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4.5 h-4.5 text-[#ff7a00]" />
          <span>Mẹo bảo mật mật khẩu an toàn</span>
        </h4>
        <ul className="list-disc pl-5 text-[11px] font-semibold text-[#5e6792] space-y-2 leading-relaxed">
          <li>Mật khẩu lý tưởng nên có độ dài từ 10 ký tự trở lên.</li>
          <li>Kết hợp hài hòa chữ hoa, chữ thường, con số và ít nhất một ký tự đặc biệt (ví dụ: @, #, !, *).</li>
          <li>Tuyệt đối tránh sử dụng các thông tin dễ đoán như ngày sinh, số điện thoại hoặc tên cá nhân.</li>
          <li>Không dùng chung một mật khẩu cho nhiều tài khoản dịch vụ khác nhau.</li>
          <li>Định kỳ cập nhật mật khẩu mới mỗi 3-6 tháng để tối ưu hóa khả năng bảo mật.</li>
        </ul>
      </div>
    </div>
  );
}
