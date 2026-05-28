"use client";

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, UserCheck, CheckCircle2, AlertTriangle, ArrowRight, Shield, Brain, Sparkles, TrendingUp, BookOpen, Compass, Zap } from "lucide-react";

const AuthPage = () => {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check existing session and email verification callback
  useEffect(() => {
    async function checkUser() {
      const urlParams = new URLSearchParams(window.location.search);
      const isVerified = urlParams.get("verified") === "true" || window.location.hash.includes("type=signup");

      if (isVerified) {
        // Signal to OTHER open tabs (e.g. the registration modal tab) that email was confirmed.
        // The `storage` event fires in all other tabs when localStorage changes.
        try { localStorage.setItem("qualicode_email_confirmed", "true"); } catch {}

        // Sign out to prevent auto-login; user should log in manually.
        await supabase.auth.signOut();
        setMessage("Tài khoản của bạn đã được kích hoạt thành công! Vui lòng đăng nhập bên dưới.");

        // Clean up URL so refreshing doesn't re-trigger this block
        if (typeof window !== "undefined" && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let userRole = session.user.user_metadata?.role;
        
        // Handle new Google OAuth users that do not have a role yet
        if (!userRole) {
          userRole = "STUDENT";
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
        
        if (userRole === "ADMIN") {
          window.location.href = "/admin/users";
        } else {
          window.location.href = "/";
        }
      }
    }
    checkUser();
  }, []);

  // Listen for email confirmation from the Gmail redirect tab via localStorage `storage` event.
  // The `storage` event fires instantly in OTHER tabs when localStorage is modified —
  // this avoids the race condition that occurred with onAuthStateChange + signOut.
  useEffect(() => {
    if (!isRegistered) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "qualicode_email_confirmed" && e.newValue === "true") {
        // Clean up the flag so it doesn't re-trigger
        try { localStorage.removeItem("qualicode_email_confirmed"); } catch {}
        setMode("login");
        setIsRegistered(false);
        setMessage("Tài khoản của bạn đã được kích hoạt thành công! Vui lòng đăng nhập bên dưới.");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isRegistered]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (mode === "register") {
      if (!trimmedName) {
        setError("Vui lòng nhập họ và tên.");
        setLoading(false);
        return;
      }
      if (!trimmedEmail) {
        setError("Vui lòng nhập email đăng ký.");
        setLoading(false);
        return;
      }
      if (!password || password.length < 6) {
        setError("Mật khẩu phải dài tối thiểu 6 ký tự.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/auth?verified=true" : undefined,
            data: {
              name: trimmedName,
              role: "STUDENT",
              isLocked: false,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          // Sign out immediately to clear localstorage of unconfirmed user session
          await supabase.auth.signOut();
          setMessage("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");
          setIsRegistered(true);
        }
      } catch (err) {
        console.error("Supabase register error:", err);
        let msg = err instanceof Error ? err.message : "Lỗi không xác định. Vui lòng thử lại.";
        if (msg.includes("rate limit exceeded") || msg.includes("For security purposes")) {
          msg = "Tần suất gửi email xác thực quá nhanh. Vui lòng đợi 1-2 phút trước khi thử lại.";
        } else if (msg.includes("already registered") || msg.includes("already exists")) {
          msg = "Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập ngay.";
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
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

        // Block login if email has not been confirmed yet
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error("Email của bạn chưa được xác nhận. Vui lòng kiểm tra Gmail (kể cả Spam/Quảng cáo) và bấm vào liên kết kích hoạt trước khi đăng nhập.");
        }

        if (isLocked) {
          await supabase.auth.signOut();
          throw new Error("Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ.");
        }

        setMessage("Đăng nhập thành công. Chuyển hướng...");
        setTimeout(() => {
          if (role === "ADMIN") {
            window.location.href = "/admin/users";
          } else {
            window.location.href = "/";
          }
        }, 1200);
      }
    } catch (err) {
      console.error("Supabase login error:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/auth?verified=true" : undefined,
        },
      });

      if (error) throw error;
      setMessage("Đã gửi lại email xác nhận thành công!");
    } catch (err) {
      console.error("Supabase resend error:", err);
      let msg = err instanceof Error ? err.message : "Lỗi không thể gửi lại email xác nhận.";
      if (msg.includes("rate limit exceeded") || msg.includes("For security purposes")) {
        msg = "Tần suất gửi email xác thực quá nhanh. Vui lòng đợi 1-2 phút trước khi gửi lại.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
    setError("");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đăng nhập bằng Google.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f9] text-[#0f1738]">
      <div className="relative overflow-hidden">
        {/* Soft background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#ffe8d6] via-[#f5e1ff] to-[#dcf0ff] opacity-75 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#f5e1ff] via-[#e8e2ff] to-[#ffece0] opacity-75 blur-3xl pointer-events-none" />

        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-4 py-10">
          <div className="grid w-full max-w-[1100px] min-h-[640px] grid-cols-1 md:grid-cols-2 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.08)] relative z-10 animate-fade-in">
            
            {/* COLUMN 1 (LEFT COLUMN) */}
            {mode === "login" ? (
              /* Login Form */
              <div className="flex flex-col justify-between p-8 md:p-14 relative h-full">
                {/* Logo brand */}
                <div className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-8 md:mb-0 select-none">
                  <span className="text-[#3B5C37] font-black">*</span>
                  <span>QualiCode</span>
                </div>

                <div className="my-auto max-w-[400px] w-full">
                  <h2 className="text-3xl font-extrabold text-[#0f1738] tracking-tight mb-2">
                    Chào mừng quay lại!
                  </h2>
                  <p className="text-xs font-semibold text-[#5e6792] mb-8 leading-relaxed">
                    Đăng nhập để tiếp tục hành trình học IELTS đột phá bằng công nghệ AI.
                  </p>

                  {/* Error & Success Messages */}
                  {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  {message && (
                    <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email field */}
                    <div className="group relative">
                      <label className="block text-[10px] font-black text-[#5e6792] uppercase tracking-wider mb-2 group-focus-within:text-[#3B5C37] transition-colors duration-200">
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
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-[#5e6792] uppercase tracking-wider group-focus-within:text-[#3B5C37] transition-colors duration-200">
                          Mật khẩu
                        </label>
                        <Link href="/reset-password" className="text-xs font-bold text-[#3B5C37] hover:text-[#e06b00] transition-colors">
                          Quên mật khẩu?
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
                      disabled={loading}
                      className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Đăng nhập ngay</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center my-5">
                      <div className="flex-grow border-t border-[#e1e4ed]/70"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold text-[#97a0c3] uppercase tracking-wider">
                        Hoặc đăng nhập bằng
                      </span>
                      <div className="flex-grow border-t border-[#e1e4ed]/70"></div>
                    </div>

                    {/* Google login button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-13 bg-white hover:bg-slate-50 text-[#0f1738] font-bold text-xs rounded-2xl border border-[#e1e4ed] shadow-sm hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 cursor-pointer outline-none"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>Tiếp tục với Google</span>
                    </button>
                  </form>
                </div>

                {/* Footer of card */}
                <div className="text-xs font-semibold text-[#5e6792] mt-8 md:mt-0 text-center md:text-left">
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={toggleMode} className="text-[#3B5C37] font-bold hover:underline bg-transparent border-none cursor-pointer">
                    Đăng ký miễn phí
                  </button>
                </div>
              </div>
            ) : (
              /* AI Path Planner (Illustration for Register Mode) */
              <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#fafaff] via-[#f7ebff] to-[#fff5ec] relative overflow-hidden select-none h-full">
                {/* SVG/Orbits curves */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#ffe8d6] via-[#f3dbff] to-[#d6e4ff] opacity-80 filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
                  <div className="absolute top-[50%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#ebd3f8]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
                  <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-100,200 C150,100 350,250 450,500 C500,630 480,800 480,800" stroke="url(#orbit-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M-50,100 C200,20 400,200 480,450 C550,700 450,850 450,850" stroke="url(#orbit-purple)" strokeWidth="1" />
                    <path d="M-20,20 C250,-20 450,150 510,400" stroke="url(#orbit-teal)" strokeWidth="1" />
                    <g transform="translate(120, 280) scale(0.8)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3B5C37" className="animate-pulse" /></g>
                    <g transform="translate(320, 140) scale(0.6)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#7c3aed" className="animate-pulse" style={{ animationDelay: "1.2s" }} /></g>
                    <g transform="translate(80, 480) scale(0.7)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: "0.6s" }} /></g>
                    <defs>
                      <linearGradient id="orbit-orange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B5C37" stopOpacity="0.1" /><stop offset="50%" stopColor="#ff8c42" stopOpacity="0.6" /><stop offset="100%" stopColor="#ffccd5" stopOpacity="0" /></linearGradient>
                      <linearGradient id="orbit-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" /><stop offset="60%" stopColor="#b8a8ff" stopOpacity="0.6" /><stop offset="100%" stopColor="#ebd3f8" stopOpacity="0" /></linearGradient>
                      <linearGradient id="orbit-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" stopOpacity="0" /><stop offset="50%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#d6e4ff" stopOpacity="0" /></linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="relative z-10 max-w-[320px]">
                  <span className="text-[10px] font-black tracking-wider text-[#3B5C37] bg-[#fff4e6] px-3.5 py-1.5 rounded-full inline-block">
                    HỌC IELTS BẰNG AI
                  </span>
                  <h3 className="text-3xl font-black text-[#0f1738] mt-5 leading-tight tracking-tight">
                    Bắt đầu hành trình chinh phục Band điểm mơ ước
                  </h3>
                </div>

                {/* AI Path Planner Card */}
                <div className="relative z-10 my-auto flex justify-center py-6">
                  <div className="w-[320px] rounded-3xl bg-white border border-white shadow-[0_20px_50px_rgba(25,12,6,0.04)] p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] group">
                    <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#7c3aed]/10 blur-xl" />
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#3B5C37] text-white flex items-center justify-center font-bold">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#0f1738] leading-none">AI Path Planner</h4>
                          <span className="text-[9px] text-slate-400 font-semibold leading-none">Milestones Roadmap</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#7c3aed]/10 text-[#7c3aed] px-2.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                        <Zap className="w-2.5 h-2.5" />
                        <span>Interactive</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/15 text-green-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#0f1738]">Diagnostic Test</span>
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
                            <span className="text-xs font-bold text-[#0f1738]">Personalized Path</span>
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

                {/* Bottom security card */}
                <div className="relative z-10 bg-white p-5 rounded-2xl border border-white/60 shadow-[0_12px_28px_rgba(15,23,56,0.04)] max-w-[360px] self-center flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 shadow-inner">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f1738]">Dữ liệu được bảo mật tuyệt đối</p>
                    <p className="text-[10px] text-[#5e6792] font-semibold leading-relaxed">
                      Chúng tôi bảo mật 100% thông tin cá nhân và lịch sử học tập của bạn bằng các tiêu chuẩn bảo mật tối tân.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* COLUMN 2 (RIGHT COLUMN) */}
            {mode === "login" ? (
              /* AI Stats (Illustration for Login Mode) */
              <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#fafaff] via-[#f7ebff] to-[#fff5ec] relative overflow-hidden border-l border-white/50 select-none h-full">
                <div className="absolute inset-0 z-0">
                  <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#ffe8d6] via-[#f3dbff] to-[#d6e4ff] opacity-80 filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
                  <div className="absolute top-[32%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-[#ffccd5]/50 to-[#ebd3f8]/50 filter blur-2xl animate-[pulse_6s_ease-in-out_infinite]" />
                  <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-100,500 C150,600 350,450 450,200 C500,70 480,-100 480,-100" stroke="url(#orbit-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M-50,600 C200,680 400,500 480,250 C550,0 450,-150 450,-150" stroke="url(#orbit-purple)" strokeWidth="1" />
                    <path d="M-20,680 C250,720 450,550 510,300" stroke="url(#orbit-teal)" strokeWidth="1" />
                    <g transform="translate(380, 180)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3B5C37" className="animate-pulse" /></g>
                    <g transform="translate(180, 240) scale(0.6)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#7c3aed" className="animate-pulse" style={{ animationDelay: "1s" }} /></g>
                    <g transform="translate(420, 360) scale(0.8)"><path d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: "2s" }} /></g>
                    <defs>
                      <linearGradient id="orbit-orange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B5C37" stopOpacity="0.1" /><stop offset="50%" stopColor="#ff8c42" stopOpacity="0.6" /><stop offset="100%" stopColor="#ffccd5" stopOpacity="0" /></linearGradient>
                      <linearGradient id="orbit-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" /><stop offset="60%" stopColor="#b8a8ff" stopOpacity="0.6" /><stop offset="100%" stopColor="#ebd3f8" stopOpacity="0" /></linearGradient>
                      <linearGradient id="orbit-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" stopOpacity="0" /><stop offset="50%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#d6e4ff" stopOpacity="0" /></linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="relative z-10 max-w-[320px]">
                  <span className="text-[10px] font-black tracking-wider text-[#3B5C37] bg-[#fff4e6] px-3.5 py-1.5 rounded-full inline-block">
                    HỌC IELTS BẰNG AI
                  </span>
                  <h3 className="text-3xl font-black text-[#0f1738] mt-5 leading-tight tracking-tight">
                    Cá nhân hóa mọi lộ trình của bạn
                  </h3>
                </div>

                {/* QualiCode AI Card */}
                <div className="relative z-10 my-auto flex justify-center py-6">
                  <div className="w-[320px] rounded-3xl bg-white border border-white shadow-[0_20px_50px_rgba(25,12,6,0.04)] p-6 relative overflow-hidden transition-transform duration-500 hover:scale-[1.03] group">
                    <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-[#3B5C37]/10 to-[#7c3aed]/10 blur-xl" />
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#3B5C37] flex items-center justify-center text-white font-bold">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#0f1738] leading-none">QualiCode AI</h4>
                          <span className="text-[9px] text-slate-400 font-semibold leading-none">Band Predictor v2</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#fff4e6] text-[#3B5C37] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Realtime</span>
                      </div>
                    </div>

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
                          <span className="text-xs font-black text-[#7c3aed]">7.5 / 9.0</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-[78%] bg-gradient-to-r from-[#7c3aed] to-[#b8a8ff] rounded-full transition-all duration-1000 group-hover:w-[83%]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#3B5C37]" />
                        Target Score
                      </span>
                      <span className="text-white bg-gradient-to-r from-[#7c3aed] via-[#ff8c42] to-[#3B5C37] px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(59, 92, 55,0.2)]">
                        8.0+ Band
                      </span>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card */}
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
            ) : (
              /* Register Form */
              <div className="flex flex-col justify-between p-8 md:p-12 relative border-l border-white/50 min-h-[500px] h-full">
                {/* Logo brand */}
                <div className="flex items-center gap-1.5 text-2xl font-black text-[#0f1738] mb-6 md:mb-0 select-none">
                  <span className="text-[#3B5C37] font-black">*</span>
                  <span>QualiCode</span>
                </div>

                <div className="my-auto max-w-[420px] w-full">
                  <h2 className="text-2xl font-extrabold text-[#0f1738] tracking-tight mb-1">
                    Đăng ký tài khoản mới
                  </h2>
                  <p className="text-xs font-semibold text-[#5e6792] mb-6 leading-relaxed">
                    Điền thông tin bên dưới để trải nghiệm phương pháp học tập AI hiệu quả.
                  </p>

                  {/* Error & Success Messages */}
                  {error && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  {message && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
                      <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-13 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-[0_10px_25px_rgba(59, 92, 55,0.25)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6 cursor-pointer border-none outline-none"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Đăng ký tài khoản</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Footer of card */}
                <div className="text-xs font-semibold text-[#5e6792] mt-6 md:mt-0 text-center md:text-left">
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={toggleMode} className="text-[#3B5C37] font-bold hover:underline bg-transparent border-none cursor-pointer">
                    Đăng nhập ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centered Gmail Verification Modal */}
      {isRegistered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[460px] rounded-3xl bg-white/95 border border-white/60 shadow-[0_24px_64px_rgba(15,23,56,0.15)] p-6 md:p-8 text-center relative z-50 animate-scale-in">
            
            {/* Modal Header */}
            <div className="w-16 h-16 rounded-3xl bg-[#3B5C37]/10 text-[#3B5C37] flex items-center justify-center mx-auto mb-6 shadow-[0_12px_24px_rgba(59, 92, 55,0.15)] relative group animate-bounce">
              <div className="absolute inset-0 rounded-3xl bg-[#3B5C37]/25 scale-110 blur-md opacity-50" />
              <Mail className="w-7 h-7 relative z-10 text-[#3B5C37]" />
            </div>

            <h3 className="text-2xl font-extrabold text-[#0d153a] tracking-tight mb-2">
              Xác nhận Email của bạn
            </h3>
            <p className="text-sm font-semibold text-[#3B5C37] mb-5 animate-pulse">
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
                <span className="font-bold text-[#3B5C37] shrink-0">* Lưu ý:</span>
                <span>Hãy kiểm tra cả hòm thư **Spam (Thư rác)** hoặc **Quảng cáo** nếu không nhận được sau 1-2 phút.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsRegistered(false);
                  setMode("login");
                }}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-[#ff9100] to-[#ff6a00] hover:from-[#ff8000] hover:to-[#ef5900] text-white font-bold text-xs rounded-2xl shadow-[0_8px_24px_rgba(59, 92, 55,0.2)] hover:shadow-[0_12px_32px_rgba(59, 92, 55,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
              >
                <span>Quay lại trang Đăng nhập</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={handleResendEmail}
                className="w-full text-xs font-semibold text-[#3B5C37] hover:underline cursor-pointer bg-transparent border-none py-1"
              >
                Gửi lại email xác nhận
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
};

export default AuthPage;
