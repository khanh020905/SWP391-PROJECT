"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, UserCheck, AlertTriangle, ArrowRight, Shield, Brain, Sparkles, TrendingUp, BookOpen, Compass, Zap, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
 
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
 
  // Listen for email confirmation events from other tabs (via localstorage session syncing)
  useEffect(() => {
    if (!isRegistered) return;
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // When the user clicks the verification link in their Gmail tab, it logs them in
      if (event === "SIGNED_IN" && session?.user) {
        // Immediately sign out to clear auto-sign-in and redirect this tab to the login screen
        await supabase.auth.signOut();
        window.location.href = "/login?verified=true";
      }
    });
 
    return () => subscription.unsubscribe();
  }, [isRegistered]);

  const handleRegister = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    confirmRegister();
  };

  const confirmRegister = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/login?verified=true" : undefined,
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
        // Sign out immediately to clear localstorage of unconfirmed user session
        await supabase.auth.signOut();
        setSuccessMsg("Đăng ký thành công! Vui lòng xác thực email của bạn.");
        setIsRegistered(true);
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
            <div className="absolute top-[50%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#ebd3f8]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
            
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
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#ff7a00" className="animate-pulse" />
              </g>
              <g transform="translate(320, 140) scale(0.6)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#7c3aed" className="animate-pulse" style={{ animationDelay: "1.2s" }} />
              </g>
              <g transform="translate(80, 480) scale(0.7)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: "0.6s" }} />
              </g>

              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="orbit-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.1" />
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
            <span className="text-[10px] font-black tracking-[0.15em] text-[#ff7a00] uppercase bg-[#ff7a00]/10 px-3.5 py-1.5 rounded-full inline-block">
              HỌC IELTS BẰNG AI
            </span>
            <h3 className="text-3xl font-black text-[#0d153a] mt-5 leading-tight tracking-tight">
              Bắt đầu hành trình chinh phục Band điểm mơ ước
            </h3>
          </div>

          {/* Interactive Floating AI Dashboard widget instead of cartoon girl image */}
          <div className="relative z-10 my-auto flex justify-center py-6">
            <div className="w-[310px] rounded-3xl bg-white/70 border border-white/80 shadow-[0_20px_50px_rgba(25,12,6,0.06)] backdrop-blur-md p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] hover:shadow-[0_24px_60px_rgba(25,12,6,0.1)] group">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#ff7a00]/10 to-[#7c3aed]/10 blur-xl" />
              
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff9e4f] text-white flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0d153a] leading-none">AI Path Planner</h4>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">Milestones Roadmap</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#7c3aed]/10 text-[#7c3aed] px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
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
                  <div className="w-6 h-6 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] flex items-center justify-center shrink-0 mt-0.5 relative">
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "8s" }} />
                    <span className="absolute inset-0 w-full h-full rounded-full bg-[#ff7a00]/25 scale-125 animate-ping opacity-35" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#0d153a]">Personalized Path</span>
                      <span className="text-[9px] text-[#ff7a00] font-black animate-pulse">Designing...</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full w-[45%] bg-[#ff7a00] rounded-full animate-pulse" />
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
                  <TrendingUp className="w-3.5 h-3.5 text-[#7c3aed]" />
                  Success Rate
                </span>
                <span className="text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-xl">
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

        {/* Right Side: Premium Registration Form or Verification Notice */}
        <div className="flex flex-col justify-between p-8 md:p-12 relative border-l border-white/50 min-h-[500px]">
          
          {/* Logo brand */}
          <div className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-6 md:mb-0 select-none">
            <span className="text-[#ff7a00] font-black">*</span>
            <span>QualiCode</span>
          </div>
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
                    <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  
                  {/* Name field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#ff7a00] transition-colors duration-200">
                      Họ và Tên
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00] transition-colors duration-200">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all duration-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#ff7a00] transition-colors duration-200">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00] transition-colors duration-200">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyentrantkhietdan@gmail.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all duration-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="group relative">
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#ff7a00] transition-colors duration-200">
                      Mật khẩu (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00] transition-colors duration-200">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all duration-300 outline-none"
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
                    <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-1.5 group-focus-within:text-[#ff7a00] transition-colors duration-200">
                      Xác nhận Mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#97a0c3] group-focus-within:text-[#ff7a00] transition-colors duration-200">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-11 pr-11 py-3 bg-[#f0f4fd] border border-[#e1e4ed]/40 rounded-2xl text-[#0f1738] font-semibold text-xs placeholder-[#97a0c3]/70 focus:bg-white focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all duration-300 outline-none"
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
                    className="w-full h-13 bg-[#ff7a00] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(255,122,0,0.25)] hover:shadow-[0_12px_32px_rgba(255,122,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng ký tài khoản</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer of card */}
              <div className="text-xs font-semibold text-[#5e6792] mt-6 md:mt-0 text-center md:text-left">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-[#ff7a00] font-bold hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>

        </div>

      </div>

      {/* Centered Gmail Verification Modal */}
      {isRegistered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[460px] rounded-3xl bg-white/95 border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.15)] p-6 md:p-8 animate-scale-in text-center relative z-50">
            
            {/* Modal Header */}
            <div className="w-16 h-16 rounded-3xl bg-[#ff7a00]/10 text-[#ff7a00] flex items-center justify-center mx-auto mb-6 shadow-[0_12px_24px_rgba(255,122,0,0.15)] relative group animate-bounce">
              <div className="absolute inset-0 rounded-3xl bg-[#ff7a00]/25 scale-110 blur-md opacity-50" />
              <Mail className="w-7 h-7 relative z-10 text-[#ff7a00]" />
            </div>

            <h3 className="text-2xl font-extrabold text-[#0d153a] tracking-tight mb-2">
              Xác nhận Email của bạn
            </h3>
            <p className="text-sm font-semibold text-[#ff7a00] mb-5 animate-pulse">
              Đăng ký thành công! Đang chờ bạn xác thực Email từ Gmail...
            </p>

            {/* Modal Content */}
            <div className="space-y-4 text-slate-600 text-xs font-medium leading-relaxed bg-[#fbfbfe] border border-slate-100 p-5 rounded-2xl mb-6 text-left shadow-inner">
              <p>
                Chúng tôi đã gửi một liên kết xác nhận tài khoản đến địa chỉ:
              </p>
              <p className="font-bold text-[#0d153a] text-sm bg-white border border-[#e1e4ed] py-2 px-3.5 rounded-xl break-all">
                {email}
              </p>
              <p>
                Vui lòng mở hòm thư của bạn và bấm vào liên kết xác nhận để kích hoạt tài khoản.
              </p>
              <p className="font-semibold text-emerald-600">
                Sau khi bấm nút xác thực trong email, hệ thống sẽ tự động chuyển hướng bạn đến trang Đăng nhập để tiếp tục.
              </p>
              <div className="pt-2 border-t border-slate-100 flex gap-2 text-[10px] text-slate-400">
                <span className="font-bold text-[#ff7a00] shrink-0">* Lưu ý:</span>
                <span>Hãy kiểm tra cả hòm thư **Spam (Thư rác)** hoặc **Quảng cáo** nếu không nhận được sau 1-2 phút.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full py-3.5 px-5 bg-gradient-to-r from-[#ff9100] to-[#ff6a00] hover:from-[#ff8000] hover:to-[#ef5900] text-white font-bold text-xs rounded-2xl shadow-[0_8px_24px_rgba(255,122,0,0.2)] hover:shadow-[0_12px_32px_rgba(255,122,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Quay lại trang Đăng nhập</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button 
                type="button" 
                onClick={confirmRegister}
                className="w-full text-xs font-semibold text-[#ff7a00] hover:underline cursor-pointer bg-transparent border-none py-1"
              >
                Gửi lại email xác nhận
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
