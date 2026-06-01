"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, AlertTriangle, ArrowRight, Brain, Sparkles, TrendingUp } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("login");
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
        setErrorMsg(t("error.insufficientPermissions"));
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
        setSuccessMsg(t("success.activated"));
        
        // Clean up URL query parameters/hash so refreshing doesn't show successMsg again
        if (typeof window !== "undefined" && window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
        return;
      }

      let hasSession = false;
      let sessionRole = "GUEST";

      const mockSessionStr = typeof window !== "undefined" ? localStorage.getItem("mock_session") : null;
      if (mockSessionStr) {
        try {
          const mockUser = JSON.parse(mockSessionStr);
          if (mockUser) {
            hasSession = true;
            sessionRole = mockUser.role || "GUEST";
          }
        } catch (e) {}
      }

      if (!hasSession) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            hasSession = true;
            let role = session.user.user_metadata?.role;
            
            // Handle new Google OAuth users that do not have a role yet
            if (!role) {
              role = "STUDENT";
              try {
                await supabase.auth.updateUser({
                  data: {
                    role: "STUDENT",
                    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Người dùng Google",
                    isLocked: false,
                  },
                });
              } catch (updateErr) {
                console.error("Lỗi cập nhật metadata Google user:", updateErr);
              }
            }
            sessionRole = role || "GUEST";
          }
        } catch (e) {
          console.warn("Lỗi lấy session Supabase:", e);
        }
      }

      if (hasSession) {
        if (sessionRole === "ADMIN") {
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

    // Fallback Mock Login Bypass
    if (email.toLowerCase() === "admin@qualicode.com" && password === "admin123") {
      if (typeof window !== "undefined") {
        localStorage.setItem("mock_session", JSON.stringify({
          email: "admin@qualicode.com",
          name: "Admin QualiIelts (Bypass)",
          role: "ADMIN"
        }));
      }
      setSuccessMsg(t("success.loggedIn"));
      setTimeout(() => {
        window.location.href = "/admin/users";
      }, 1200);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg === "Invalid login credentials") {
          msg = t("error.invalidCredentials");
        } else if (msg === "Email not confirmed") {
          msg = t("error.emailNotConfirmed");
        }
        throw new Error(msg);
      }

      if (data?.user) {
        const metadata = data.user.user_metadata;
        const isLocked = metadata?.isLocked === true;
        const role = metadata?.role || "GUEST";

        if (isLocked) {
          await supabase.auth.signOut();
          throw new Error(t("error.accountLocked"));
        }

        setSuccessMsg(t("success.loggedIn"));
        
        setTimeout(() => {
          if (role === "ADMIN") {
            window.location.href = "/admin/users";
          } else {
            window.location.href = "/";
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || t("error.default"));
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || t("error.googleFailed"));
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
            <span className="text-[#3B5C37] font-black">*</span>
            <span>QualiIelts</span>
          </div>

          <div className="my-auto max-w-[400px] w-full">
            <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
              {t("title")}
            </h2>
            <p className="text-xs font-semibold text-[#5e6792] mb-8 leading-relaxed">
              {t("subtitle")}
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
                <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#3B5C37] transition-colors duration-200">
                  {t("emailLabel")}
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
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-[#5e6792] uppercase tracking-wider group-focus-within:text-[#3B5C37] transition-colors duration-200">
                    {t("passwordLabel")}
                  </label>
                  <Link href="/reset-password" className="text-xs font-bold text-[#3B5C37] hover:text-[#e06b00] transition-colors">
                    {t("forgotPassword")}
                  </Link>
                </div>
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
                className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t("submitBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-[#e1e4ed]/70"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-[#97a0c3] uppercase tracking-wider">
                  {t("orWith")}
                </span>
                <div className="flex-grow border-t border-[#e1e4ed]/70"></div>
              </div>

              {/* Google login button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-13 bg-white hover:bg-slate-50 text-[#0f1738] font-bold text-xs rounded-2xl border border-[#e1e4ed] shadow-sm hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 cursor-pointer outline-none"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>{t("googleBtn")}</span>
              </button>
            </form>
          </div>

          {/* Footer of card */}
          <div className="text-xs font-semibold text-[#5e6792] mt-8 md:mt-0 text-center md:text-left">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-[#3B5C37] font-bold hover:underline">
              {t("signupLink")}
            </Link>
          </div>
        </div>

        {/* Right Side: Custom Abstract Art Panel using exact color system and orbits from image */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#fafaff] via-[#f7ebff] to-[#fff5ec] relative overflow-hidden border-l border-white/50 select-none">
          
          {/* Custom SVG and CSS drawing the orbits and sparks */}
          <div className="absolute inset-0 z-0">
            {/* Background glowing spheres matching image */}
            <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#ffe8d6] via-[#f3dbff] to-[#d6e4ff] opacity-80 filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute top-[32%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#f4f2eb]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
            
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
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3B5C37" className="animate-pulse" />
              </g>
              <g transform="translate(180, 240) scale(0.6)">
                <path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#B38F4D" className="animate-pulse" style={{ animationDelay: "1s" }} />
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
            <span className="text-[10px] font-black tracking-wider text-[#3B5C37] bg-[#fff4e6] px-3.5 py-1.5 rounded-full inline-block">
              HỌC IELTS BẰNG AI
            </span>
            <h3 className="text-3xl font-black text-[#0f1738] mt-5 leading-tight tracking-tight">
              Cá nhân hóa mọi lộ trình của bạn
            </h3>
          </div>

          {/* Interactive Floating AI Dashboard widget */}
          <div className="relative z-10 my-auto flex justify-center py-6">
            <div className="w-[320px] rounded-3xl bg-white border border-white shadow-[0_20px_50px_rgba(25,12,6,0.04)] p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] group">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#B38F4D]/10 blur-xl" />
              
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#3B5C37] flex items-center justify-center text-white font-bold">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0f1738] leading-none">QualiIelts AI</h4>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">Band Predictor v2</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#fff4e6] text-[#3B5C37] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
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
                    <div className="h-full w-[90%] bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] rounded-full transition-all duration-1000 group-hover:w-[94%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-[#97a0c3] uppercase tracking-wider">Writing & Speaking Labs</span>
                    <span className="text-xs font-black text-[#B38F4D]">7.5 / 9.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-[#B38F4D] to-[#d1c3a5] rounded-full transition-all duration-1000 group-hover:w-[83%]" />
                  </div>
                </div>
              </div>

              {/* Summary target bottom badge */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3B5C37]" />
                  Target Score
                </span>
                <span className="text-white bg-gradient-to-r from-[#B38F4D] via-[#ff8c42] to-[#3B5C37] px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(59, 92, 55,0.2)]">
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
              <div className="w-8 h-8 rounded-full bg-[#3B5C37] text-white font-black text-[10px] flex items-center justify-center">
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
