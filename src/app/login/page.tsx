"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, AlertTriangle, ArrowRight, Brain, Sparkles, TrendingUp } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check existing session and email verification callback
  useEffect(() => {
    async function checkUser() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check if arriving from a downgrade/insufficient permissions redirect
      const errorParam = urlParams.get("error");
      if (errorParam === "insufficient_permissions") {
        setErrorMsg("Quyền hạn của bạn không đủ để truy cập trang quản trị.");
        // Clean up URL query parameters
        if (typeof window !== "undefined" && window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      // Check if arriving from email confirmation redirect
      const isVerified = urlParams.get("verified") === "true" || window.location.hash.includes("type=signup");

      if (isVerified) {
        // Log out immediately to clear auto-sign-in and let them log in manually
        await supabase.auth.signOut();
        setSuccessMsg("Tài khoản của bạn đã được kích hoạt thành công! Vui lòng đăng nhập bên dưới.");
        
        // Clean up URL query parameters/hash so refreshing doesn't show successMsg again
        if (typeof window !== "undefined" && window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const role = session.user.user_metadata?.role || "GUEST";
        if (role === "ADMIN") {
          window.location.href = "/admin/users";
        } else {
          window.location.href = "/";
        }
      }
    }
    checkUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg === "Invalid login credentials") {
          msg = "Email hoặc mật khẩu không chính xác.";
        } else if (msg === "Email not confirmed") {
          msg = "Email của bạn chưa được xác nhận. Vui lòng kiểm tra Gmail để kích hoạt tài khoản trước khi đăng nhập.";
        }
        throw new Error(msg);
      }

      if (data?.user) {
        const metadata = data.user.user_metadata;
        const isLocked = metadata?.isLocked === true;
        const role = metadata?.role || "GUEST";

        if (isLocked) {
          await supabase.auth.signOut();
          throw new Error("Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ.");
        }

        setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
        
        setTimeout(() => {
          if (role === "ADMIN") {
            window.location.href = "/admin/users";
          } else {
            window.location.href = "/";
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi đăng nhập.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f5f9] p-4 md:p-6 overflow-hidden relative">
      
      {/* Background soft glowing pastel circles matching the exact image color palette */}
      <div className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#ffe8d6] via-[#f5e1ff] to-[#dcf0ff] opacity-75 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#f5e1ff] via-[#e8e2ff] to-[#ffece0] opacity-75 blur-3xl pointer-events-none" />
      
      {/* Container card */}
      <div className="w-full max-w-[1100px] min-h-[640px] grid md:grid-cols-2 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.08)] relative z-10 animate-fade-in">
        
        {/* Left Side: Premium Login Form */}
        <div className="flex flex-col justify-between p-8 md:p-14 relative">
          
          {/* Logo brand */}
          <div className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-8 md:mb-0 select-none">
            <span className="text-[#ff7a00] font-black">*</span>
            <span>QualiCode</span>
          </div>

          <div className="my-auto max-w-[400px] w-full">
            <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
              Chào mừng quay lại!
            </h2>
            <p className="text-xs font-semibold text-[#5e6792] mb-8 leading-relaxed">
              Đăng nhập để tiếp tục hành trình học IELTS đột phá bằng công nghệ AI.
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div className="group relative">
                <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#ff7a00] transition-colors duration-200">
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
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-[#5e6792] uppercase tracking-wider group-focus-within:text-[#ff7a00] transition-colors duration-200">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-xs font-bold text-[#ff7a00] hover:text-[#e06b00] transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
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
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#97a0c3] hover:text-[#5e6792] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Đăng nhập ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer of card */}
          <div className="text-xs font-semibold text-[#5e6792] mt-8 md:mt-0 text-center md:text-left">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-[#ff7a00] font-bold hover:underline">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>

        {/* Right Side: Custom Abstract Art Panel using exact color system and orbits from image */}
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
              
              {/* Star Sparkle SVG Shapes matching the sparkle icons in the background */}
              <g transform="translate(380, 180)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#ff7a00" className="animate-pulse" />
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
            <span className="text-[10px] font-black tracking-wider text-[#ff7a00] bg-[#fff4e6] px-3.5 py-1.5 rounded-full inline-block">
              HỌC IELTS BẰNG AI
            </span>
            <h3 className="text-3xl font-black text-[#0f1738] mt-5 leading-tight tracking-tight">
              Cá nhân hóa mọi lộ trình của bạn
            </h3>
          </div>

          {/* Interactive Floating AI Dashboard widget */}
          <div className="relative z-10 my-auto flex justify-center py-6">
            <div className="w-[320px] rounded-3xl bg-white border border-white shadow-[0_20px_50px_rgba(25,12,6,0.04)] p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] group">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#ff7a00]/10 to-[#7c3aed]/10 blur-xl" />
              
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ff7a00] flex items-center justify-center text-white font-bold">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0f1738] leading-none">QualiCode AI</h4>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">Band Predictor v2</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#fff4e6] text-[#ff7a00] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Realtime</span>
                </div>
              </div>

              {/* Stats / Targets */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-[#97a0c3] uppercase tracking-wider">Listening & Reading</span>
                    <span className="text-xs font-black text-[#0f1738]">8.5 / 9.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] bg-gradient-to-r from-[#ff7a00] to-[#ff9e4f] rounded-full transition-all duration-1000 group-hover:w-[94%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-[#97a0c3] uppercase tracking-wider">Writing & Speaking Labs</span>
                    <span className="text-xs font-black text-[#7c3aed]">7.5 / 9.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-[#7c3aed] to-[#b8a8ff] rounded-full transition-all duration-1000 group-hover:w-[83%]" />
                  </div>
                </div>
              </div>

              {/* Summary target bottom badge */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#ff7a00]" />
                  Target Score
                </span>
                <span className="text-white bg-gradient-to-r from-[#7c3aed] via-[#ff8c42] to-[#ff7a00] px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(255,122,0,0.2)]">
                  8.0+ Band
                </span>
              </div>
            </div>
          </div>

          {/* Bottom testimonial card */}
          <div className="relative z-10 bg-white p-5 rounded-2xl border border-white/60 shadow-[0_12px_28px_rgba(15,23,56,0.04)] max-w-[360px] self-center">
            <p className="text-xs font-semibold italic text-[#4b5472] leading-relaxed">
              "Trình đánh giá thử và sửa bài viết IELTS bằng AI siêu tốc giúp mình tăng ngay 1.5 band chỉ trong vòng 3 tuần luyện tập!"
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff7a00] text-white font-black text-[10px] flex items-center justify-center">
                MA
              </div>
              <div>
                <p className="text-xs font-bold text-[#0f1738]">Minh Anh</p>
                <p className="text-[10px] text-[#5e6792] font-semibold">Học sinh lớp 12 chuyên Anh - Target 8.0</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
