"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { OtpInput } from "@/components/ui/OtpInput";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Key, 
  ChevronLeft, 
  ArrowLeft, 
  RefreshCw, 
  Shield, 
  Zap 
} from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Step: 1 = Email Input, 2 = OTP Input, 3 = Password Input
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // OTP state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);

  // Detect recovery session on mount
  useEffect(() => {
    async function detectCallback() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep(3);
        setSuccessMsg("Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.");
      }
    }
    detectCallback();
  }, []);

  // Countdown for resend (60s)
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 5-minute countdown for OTP expiry
  const [expiryCountdown, setExpiryCountdown] = useState(300);
  const [expiryTimerTrigger, setExpiryTimerTrigger] = useState(0);
  const expiryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resend countdown timer effect
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown]);

  const startCountdown = useCallback(() => {
    setCountdown(60);
  }, []);

  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Expiry timer effect (5 minutes = 300s)
  useEffect(() => {
    if (step !== 2) {
      if (expiryRef.current) {
        clearInterval(expiryRef.current);
        expiryRef.current = null;
      }
      return;
    }

    setExpiryCountdown(300);

    if (expiryRef.current) {
      clearInterval(expiryRef.current);
    }

    expiryRef.current = setInterval(() => {
      setExpiryCountdown((prev) => {
        if (prev <= 1) {
          if (expiryRef.current) {
            clearInterval(expiryRef.current);
            expiryRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (expiryRef.current) {
        clearInterval(expiryRef.current);
        expiryRef.current = null;
      }
    };
  }, [step, expiryTimerTrigger]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg("Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hòm thư của bạn.");
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg("Email đặt lại mật khẩu đã được gửi lại!");
      startCountdown();
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      let msg = err.message || "Không thể gửi lại email.";
      if (msg.includes("rate limit exceeded") || msg.includes("For security purposes")) {
        msg = "Tần suất gửi quá nhanh. Vui lòng đợi 1-2 phút.";
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Vui lòng nhập đầy đủ mã OTP 6 số.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: "recovery",
      });

      if (error) throw error;

      // Verification succeeded. We now have an active session for this recovery context!
      setStep(3);
      setSuccessMsg("Mã xác thực chính xác! Vui lòng thiết lập mật khẩu mới.");
      setIsLoading(false);
    } catch (err: any) {
      let msg = err.message || "Xác thực OTP thất bại.";
      if (msg.includes("Token has expired") || msg.includes("expired")) {
        msg = "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.";
      } else if (msg.includes("Invalid") || msg.includes("invalid")) {
        msg = "Mã OTP không chính xác. Vui lòng kiểm tra lại.";
      }
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (newPassword.length < 6) {
        throw new Error("Mật khẩu phải dài tối thiểu 6 ký tự.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp.");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg("Mật khẩu của bạn đã được cập nhật thành công! Đang chuyển hướng về trang đăng nhập...");
      setNewPassword("");
      setConfirmPassword("");
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      console.error("Lỗi cập nhật mật khẩu:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi cập nhật mật khẩu.");
      setIsLoading(false);
    }
  };

  // OTP handlers removed - handled by OtpInput

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f5f9] p-4 md:p-6 overflow-hidden relative">
      
      {/* Background soft glowing pastel circles matching the exact image color palette */}
      <div className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#ffe8d6] via-[#f5e1ff] to-[#dcf0ff] opacity-75 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#f5e1ff] via-[#e8e2ff] to-[#ffece0] opacity-75 blur-3xl pointer-events-none" />
      
      {/* Container card */}
      <div className="w-full max-w-[1100px] min-h-[640px] grid md:grid-cols-2 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.08)] relative z-10 animate-fade-in">
        
        {/* Left Side: Reset Password Functional Panel */}
        <div className="flex flex-col justify-between p-8 md:p-14 relative">
          
          {/* Logo brand */}
          <Link href="/" className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-8 md:mb-0 select-none no-underline outline-none">
            <span className="text-[#3B5C37] font-black">*</span>
            <span>QualiCode</span>
          </Link>

          <div className="my-auto max-w-[400px] w-full">
            
            {step === 1 && (
              /* ============ STEP 1: Enter Email ============ */
              <>
                <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
                  Khôi phục mật khẩu
                </h2>
                <p className="text-xs font-semibold text-[#5e6792] mb-8 leading-relaxed">
                  Nhập địa chỉ Email tài khoản của bạn để nhận mã xác thực OTP 6 số khôi phục mật khẩu.
                </p>

                {/* Messages */}
                {errorMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake animate-duration-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRequestReset} className="space-y-5">
                  {/* Email field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Địa chỉ Email tài khoản
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#3B5C37] transition-colors duration-200">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyentrantkhietdan@gmail.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#3B5C37] focus:ring-4 focus:ring-[#3B5C37]/10 transition-all duration-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Gửi mã xác thực OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              /* ============ STEP 2: Enter OTP ============ */
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                    setSuccessMsg("");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#5e6792] hover:text-[#3B5C37] transition-colors mb-6 bg-transparent border-none cursor-pointer outline-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
                  Xác thực OTP
                </h2>
                <p className="text-xs font-semibold text-[#5e6792] mb-2 leading-relaxed">
                  Mã xác thực 6 số khôi phục mật khẩu đã được gửi đến email:
                </p>
                <p className="text-xs font-bold text-[#0f1738] mb-6 bg-[#f0f4fd] py-2 px-4 rounded-xl border border-[#e1e4ed]/40 inline-block w-fit break-all">
                  {email}
                </p>

                {/* Yêu cầu xác nhận Banner */}
                <div className="mb-6 p-4 rounded-2xl bg-[#3B5C37]/5 border border-[#3B5C37]/25 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-xl bg-[#3B5C37]/10 text-[#3B5C37] flex items-center justify-center shrink-0">
                      <Shield className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0d153a] uppercase tracking-wider">
                        Yêu cầu xác nhận OTP
                      </h4>
                      <p className="text-[11px] text-[#5e6792] font-semibold leading-relaxed mt-0.5">
                        Bạn cần nhập mã OTP khôi phục mật khẩu để xác thực tài khoản. Yêu cầu này chỉ có hiệu lực trong vòng 5 phút.
                      </p>
                    </div>
                  </div>
                  
                  {/* Timer Badge */}
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                    expiryCountdown <= 60 
                      ? "bg-red-50 border-red-100 text-red-600 animate-pulse" 
                      : "bg-[#3B5C37]/5 border-[#3B5C37]/10 text-[#3B5C37]"
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {expiryCountdown <= 0 ? "Yêu cầu đã hết hạn" : "Thời gian xác thực còn lại"}
                    </span>
                    <span className="text-sm font-black tracking-wider">
                      {formatExpiryTime(expiryCountdown)}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Expiry Warning Message */}
                {expiryCountdown <= 0 && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Mã OTP đã hết hạn sau 5 phút. Vui lòng nhấn gửi lại mã mới bên dưới.</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <OtpInput value={otp} onChange={setOtp} disabled={expiryCountdown <= 0 || isLoading} />

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.join("").length !== 6 || expiryCountdown <= 0}
                  className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Xác thực mã OTP</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="mt-5 text-center">
                  <p className="text-[11px] font-semibold text-[#97a0c3] mb-2">
                    Không nhận được mã? Kiểm tra thư mục Spam/Quảng cáo.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                    className={`text-xs font-bold transition-colors bg-transparent border-none cursor-pointer outline-none flex items-center justify-center gap-1.5 mx-auto ${
                      countdown > 0
                        ? "text-[#97a0c3] cursor-not-allowed"
                        : "text-[#3B5C37] hover:text-[#e06b00]"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    {countdown > 0 ? (
                      <span>Gửi lại sau {countdown}s</span>
                    ) : (
                      <span>Gửi lại mã OTP</span>
                    )}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              /* ============ STEP 3: Enter New Password ============ */
              <>
                <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
                  Đặt mật khẩu mới
                </h2>
                <p className="text-xs font-semibold text-[#5e6792] mb-8 leading-relaxed">
                  Thiết lập mật khẩu cực kỳ bảo mật mới cho tài khoản của bạn.
                </p>

                {/* Messages */}
                {errorMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  {/* New Password */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Mật khẩu mới (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#3B5C37] transition-colors duration-200">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#3B5C37] focus:ring-4 focus:ring-[#3B5C37]/10 transition-all duration-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] transition-colors bg-transparent border-none outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#3B5C37] transition-colors duration-200">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#3B5C37] focus:ring-4 focus:ring-[#3B5C37]/10 transition-all duration-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] transition-colors bg-transparent border-none outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Cập nhật mật khẩu</span>
                        <Key className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>

          {/* Footer: navigate back to login */}
          <div className="mt-8 md:mt-0 text-center md:text-left">
            <Link href="/login" className="text-xs font-bold text-[#5e6792] hover:text-[#3B5C37] transition-colors flex items-center justify-center md:justify-start gap-1 select-none no-underline outline-none">
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Custom Abstract Art Panel using exact color system and orbits */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#fafaff] via-[#f7ebff] to-[#fff5ec] relative overflow-hidden border-l border-white/50 select-none">
          
          {/* Custom SVG and CSS drawing the orbits and sparks */}
          <div className="absolute inset-0 z-0">
            {/* Background glowing spheres matching image */}
            <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#ffe8d6] via-[#f3dbff] to-[#d6e4ff] opacity-80 filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute top-[32%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#ebd3f8]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
            
            {/* SVG curves & orbits representing the thin lines in the image */}
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Curved orbit 1 (Orange/Pink gradient) */}
              <path d="M-100,500 C150,600 350,450 450,200 C500,70 480,-100 480,-100" stroke="url(#orbit-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Curved orbit 2 (Purple gradient) */}
              <path d="M-50,600 C200,680 400,500 480,250 C550,0 450,-150 450,-150" stroke="url(#orbit-purple)" strokeWidth="1" />
              {/* Curved orbit 3 (Green/Teal gradient) */}
              <path d="M-20,680 C250,720 450,550 510,300" stroke="url(#orbit-teal)" strokeWidth="1" />
              
              {/* Star Sparkle SVG Shapes */}
              <g transform="translate(380, 180)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3B5C37" className="animate-pulse" />
              </g>
              <g transform="translate(180, 240) scale(0.6)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#7c3aed" className="animate-pulse" style={{ animationDelay: "1s" }} />
              </g>
              <g transform="translate(420, 360) scale(0.8)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: "2s" }} />
              </g>

              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="orbit-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B5C37" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#ff8c42" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ffccd5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="orbit-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#b8a8ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ebd3f8" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="orbit-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d6e4ff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Top text */}
          <div className="relative z-10 max-w-[320px]">
            <span className="text-[10px] font-black tracking-wider text-[#3B5C37] bg-[#fff4e6] px-3.5 py-1.5 rounded-full inline-block">
              HỌC IELTS BẰNG AI
            </span>
            <h3 className="text-3xl font-black text-[#0f1738] mt-5 leading-tight tracking-tight">
              An toàn & Bảo mật thông tin tuyệt đối
            </h3>
          </div>

          {/* Interactive Floating AI Dashboard widget */}
          <div className="relative z-10 my-auto flex justify-center py-6">
            <div className="w-[320px] rounded-3xl bg-white border border-white shadow-[0_20px_50px_rgba(25,12,6,0.04)] p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] group">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#7c3aed]/10 blur-xl" />
              
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#3B5C37] flex items-center justify-center text-white font-bold">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0f1738] leading-none">QualiCode AI</h4>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">Security Center</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#fff4e6] text-[#3B5C37] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Stats / Targets */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-[#97a0c3] uppercase tracking-wider">Mật độ bảo mật</span>
                    <span className="text-xs font-black text-[#0f1738]">99.9% / 100%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[99%] bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] rounded-full transition-all duration-1000" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-[#97a0c3] uppercase tracking-wider">Mã hóa đầu cuối</span>
                    <span className="text-xs font-black text-[#7c3aed]">AES-256 Bit</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[95%] bg-gradient-to-r from-[#7c3aed] to-[#b8a8ff] rounded-full transition-all duration-1000" />
                  </div>
                </div>
              </div>

              {/* Summary target bottom badge */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3B5C37]" />
                  Độ mạnh mật khẩu yêu cầu
                </span>
                <span className="text-white bg-gradient-to-r from-[#7c3aed] via-[#ff8c42] to-[#3B5C37] px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(59, 92, 55,0.2)]">
                  Mạnh (Strong)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom security card */}
          <div className="relative z-10 bg-white p-5 rounded-2xl border border-white/60 shadow-[0_12px_28px_rgba(15,23,56,0.04)] max-w-[360px] self-center">
            <p className="text-xs font-semibold italic text-[#4b5472] leading-relaxed">
              "QualiCode luôn tuân thủ quy trình mã hóa và bảo mật chuẩn công nghệ AI để bảo vệ dữ liệu học viên tốt nhất!"
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3B5C37] text-white font-black text-[10px] flex items-center justify-center">
                QC
              </div>
              <div>
                <p className="text-xs font-bold text-[#0f1738]">QualiCode Admin</p>
                <p className="text-[10px] text-[#5e6792] font-semibold">Hệ thống bảo vệ tài khoản tự động</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
