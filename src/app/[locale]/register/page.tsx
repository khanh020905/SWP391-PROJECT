"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, ArrowRight, Shield, Brain, TrendingUp, BookOpen, Compass, Zap, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Multi-step: 1 = form, 2 = OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Countdown for resend
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check existing session
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userRole = session.user.user_metadata?.role || "GUEST";
        if (userRole === "ADMIN") {
          window.location.href = "/admin/users";
        } else {
          window.location.href = "/";
        }
      }
    }
    checkUser();
  }, []);

  // Countdown timer effect
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

  const handleRegister = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg(t("error.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t("error.passwordTooShort"));
      return;
    }

    sendSignUp();
  };

  const sendSignUp = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            role: "STUDENT",
            isLocked: false,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        // Send welcome email immediately via Resend API (bypasses Supabase SMTP entirely)
        fetch("/api/auth/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, userId: data.user.id }),
        }).catch(() => {});

        await supabase.auth.signOut();
        setStep(2);
        startCountdown();
        setIsLoading(false);
      }
    } catch (err: any) {
      let msg = err.message || "Đã xảy ra lỗi trong quá trình đăng ký.";
      if (msg.includes("rate limit exceeded") || msg.includes("For security purposes")) {
        msg = "Tần suất gửi email xác thực quá nhanh. Vui lòng đợi 1-2 phút trước khi thử lại.";
      } else if (msg.includes("already registered") || msg.includes("already exists")) {
        msg = "Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập ngay.";
      }
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Re-send by calling signUp again (Supabase resends confirmation email for existing unconfirmed users)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "STUDENT",
            isLocked: false,
          },
        },
      });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      setSuccessMsg(t("verify.resendSuccess"));
      startCountdown();
    } catch (err: any) {
      let msg = err.message || "Không thể gửi lại email xác nhận.";
      if (msg.includes("rate limit exceeded") || msg.includes("For security purposes")) {
        msg = t("verify.rateLimited");
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f5f9] p-4 md:p-6 overflow-hidden relative">
      
      {/* Background soft glowing pastel circles (matching illustration) */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#ffe8d6] via-[#f5e1ff] to-[#dcf0ff] opacity-75 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#f5e1ff] via-[#e8e2ff] to-[#ffece0] opacity-75 blur-3xl pointer-events-none" />
      
      {/* Container card */}
      <div className="w-full max-w-[1100px] min-h-[660px] grid md:grid-cols-2 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.08)] relative z-10 animate-fade-in">
        
        {/* Left Side: Premium Custom Abstract Art Panel using exact color system and orbits from image */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#fafaff] via-[#f7ebff] to-[#fff5ec] relative overflow-hidden select-none">
          
          {/* Custom SVG and CSS drawing the orbits and sparks */}
          <div className="absolute inset-0 z-0">
            {/* Background glowing spheres matching image */}
            <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#ffe8d6] via-[#f3dbff] to-[#d6e4ff] opacity-80 filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute top-[50%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#f4f2eb]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
            
            {/* SVG curves & orbits representing the thin lines in the image */}
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Curved orbit 1 (Orange/Pink gradient) */}
              <path d="M-100,200 C150,100 350,250 450,500 C500,630 480,800 480,800" stroke="url(#orbit-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Curved orbit 2 (Purple gradient) */}
              <path d="M-50,100 C200,20 400,200 480,450 C550,700 450,850 450,850" stroke="url(#orbit-purple)" strokeWidth="1" />
              {/* Curved orbit 3 (Green/Teal gradient) */}
              <path d="M-20,20 C250,-20 450,150 510,400" stroke="url(#orbit-teal)" strokeWidth="1" />
              
              {/* Star Sparkle SVG Shapes matching the sparkle icons in the background */}
              <g transform="translate(120, 280) scale(0.8)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3B5C37" className="animate-pulse" />
              </g>
              <g transform="translate(320, 140) scale(0.6)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#B38F4D" className="animate-pulse" style={{ animationDelay: "1.2s" }} />
              </g>
              <g transform="translate(80, 480) scale(0.7)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: "0.6s" }} />
              </g>

              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="orbit-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B5C37" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#ff8c42" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ffccd5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="orbit-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B38F4D" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#d1c3a5" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f4f2eb" stopOpacity="0" />
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
            <span className="text-[10px] font-black tracking-[0.15em] text-[#3B5C37] uppercase bg-[#3B5C37]/10 px-3.5 py-1.5 rounded-full inline-block">
              HỌC IELTS BẰNG AI
            </span>
            <h3 className="text-3xl font-black text-[#0d153a] mt-5 leading-tight tracking-tight">
              Bắt đầu hành trình chinh phục Band điểm mơ ước
            </h3>
          </div>

          {/* Interactive Floating AI Dashboard widget instead of cartoon girl image */}
          <div className="relative z-10 my-auto flex justify-center py-6">
            <div className="w-[310px] rounded-3xl bg-white/70 border border-white/80 shadow-[0_20px_50px_rgba(25,12,6,0.06)] backdrop-blur-md p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] hover:shadow-[0_24px_60px_rgba(25,12,6,0.1)] group">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#B38F4D]/10 blur-xl" />
              
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] text-white flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0d153a] leading-none">AI Path Planner</h4>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">Milestones Roadmap</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#B38F4D]/10 text-[#B38F4D] px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                  <Zap className="w-2.5 h-2.5" />
                  <span>Interactive</span>
                </div>
              </div>

              {/* Milestones list inside widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/15 text-green-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#0d153a]">Diagnostic Test</span>
                      <span className="text-[9px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-md">Done</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full w-full bg-green-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#3B5C37]/15 text-[#3B5C37] flex items-center justify-center shrink-0 mt-0.5 relative">
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "8s" }} />
                    <span className="absolute inset-0 w-full h-full rounded-full bg-[#3B5C37]/25 scale-125 animate-ping opacity-35" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#0d153a]">Personalized Path</span>
                      <span className="text-[9px] text-[#3B5C37] font-black animate-pulse">Designing...</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full w-[45%] bg-[#3B5C37] rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-xs font-bold text-slate-500">IELTS Band Booster Labs</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded-md">Locked</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5" />
                  </div>
                </div>
              </div>

              {/* Summary target bottom badge */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#B38F4D]" />
                  Success Rate
                </span>
                <span className="text-[#B38F4D] bg-[#B38F4D]/10 px-3 py-1 rounded-xl">
                  98.6%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom testimonial/security card */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-[0_12px_28px_rgba(15,23,56,0.04)] max-w-[360px] self-center flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0d153a]">Dữ liệu được bảo mật tuyệt đối</p>
              <p className="text-[10px] text-[#5e6792] font-semibold leading-relaxed">
                Chúng tôi bảo mật 100% thông tin cá nhân và lịch sử học tập của bạn bằng các tiêu chuẩn bảo mật tối tân.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form (Step 1) or OTP Verification (Step 2) */}
        <div className="flex flex-col justify-between p-8 md:p-12 relative border-l border-white/50 min-h-[500px]">
          
          {/* Logo brand */}
          <div className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-6 md:mb-0 select-none">
            <span className="text-[#3B5C37] font-black">*</span>
            <span>QualiCode</span>
          </div>

          {step === 1 ? (
            /* ============ STEP 1: Registration Form ============ */
            <>
              <div className="my-auto max-w-[420px] w-full">
                <h2 className="text-2xl font-extrabold text-[#0d153a] tracking-tight mb-1">
                  Đăng ký tài khoản mới
                </h2>
                <p className="text-xs font-semibold text-[#5e6792] mb-6">
                  Điền thông tin bên dưới để trải nghiệm phương pháp học tập AI hiệu quả.
                </p>

                {/* Error Message */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success Message */}
                {successMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  
                  {/* Name field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Họ và Tên
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#3B5C37] transition-colors duration-200">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#3B5C37] focus:ring-4 focus:ring-[#3B5C37]/10 transition-all duration-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Địa chỉ Email
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

                  {/* Password field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Mật khẩu (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#3B5C37] transition-colors duration-200">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  {/* Confirm Password field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                      Xác nhận Mật khẩu
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
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{t("submitBtn")}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer of card */}
              <div className="text-xs font-semibold text-[#5e6792] mt-6 md:mt-0 text-center md:text-left">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-[#3B5C37] font-bold hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          ) : (
            /* ============ STEP 2: Email Confirmation Waiting ============ */
            <>
              <div className="my-auto max-w-[420px] w-full">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#5e6792] hover:text-[#3B5C37] transition-colors mb-6 bg-transparent border-none cursor-pointer outline-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                {/* Mail Icon */}
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#3B5C37]/15 to-[#ff9e4f]/10 text-[#3B5C37] flex items-center justify-center mx-auto mb-5 relative">
                  <div className="absolute inset-0 rounded-3xl bg-[#3B5C37]/20 scale-110 blur-md opacity-50 animate-pulse" />
                  <Mail className="w-7 h-7 relative z-10" />
                </div>

                <h2 className="text-2xl font-extrabold text-[#0d153a] tracking-tight mb-2 text-center">
                  Xác nhận Email của bạn
                </h2>
                <p className="text-xs font-semibold text-[#5e6792] mb-2 text-center leading-relaxed">
                  Đăng ký thành công! Đang chờ bạn xác thực Email từ Gmail...
                </p>

                {/* Email display */}
                <div className="bg-[#f0f4fd] border border-[#e1e4ed]/60 rounded-2xl px-4 py-3 text-center mb-6">
                  <p className="text-[11px] text-[#5e6792] font-semibold mb-1">Chúng tôi đã gửi một liên kết xác nhận tài khoản đến địa chỉ:</p>
                  <p className="text-sm font-black text-[#0d153a] break-all">{email}</p>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded-2xl bg-[#3B5C37]/5 border border-[#3B5C37]/20 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#3B5C37]/10 text-[#3B5C37] flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-[#5e6792] font-semibold leading-relaxed">
                      Vui lòng mở hòm thư của bạn và bấm vào liên kết xác nhận để kích hoạt tài khoản.
                    </p>
                  </div>
                  <p className="text-[11px] text-[#3B5C37] font-bold leading-relaxed pl-10">
                    Sau khi bấm nút xác thực trong email, hệ thống sẽ tự động chuyển hướng bạn đến trang Đăng nhập để tiếp tục.
                  </p>
                </div>

                {/* Error / Success */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Resend */}
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-[#97a0c3] mb-2">
                    * Lưu ý: Hãy kiểm tra cả hòm thư <strong>Spam (Thư rác)</strong> hoặc <strong>Quảng cáo</strong> nếu không nhận được sau 1-2 phút.
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
                      <span>Gửi lại email xác nhận</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs font-semibold text-[#5e6792] mt-6 md:mt-0 text-center md:text-left">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-[#3B5C37] font-bold hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
