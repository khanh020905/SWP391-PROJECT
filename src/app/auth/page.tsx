"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const AuthPage = () => {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCredentialEmail = (value: string) => {
    const cleaned = value.trim().toLowerCase();
    if (cleaned.includes("@")) {
      return cleaned;
    }
    return `${cleaned.replace(/\s+/g, ".")}@qualicode.local`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Vui lòng nhập tên đăng nhập.");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      const trimmedEmail = email.trim().toLowerCase();
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
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { username: trimmedUsername },
          },
        });

        if (error) throw error;
        setMessage("Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.");
      } catch (err) {
        console.error("Supabase register error:", err);
        setError(err instanceof Error ? err.message : "Lỗi không xác định. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const authEmail = getCredentialEmail(trimmedUsername);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (error) throw error;
      setMessage("Đăng nhập thành công. Chuyển hướng về trang chính...");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err) {
      console.error("Supabase login error:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#f4f5f9] text-[#0f1738]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.18),_transparent_28%)]" />
        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[#ff9a3d]/20 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-20 h-72 w-72 rounded-full bg-[#6d5bff]/20 blur-3xl" />

        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-4 py-10">
          <div className="grid w-full gap-8 rounded-[40px] bg-white/95 p-6 shadow-[0_30px_80px_rgba(15,24,63,0.12)] md:grid-cols-[1.18fr_0.95fr] md:p-10">
            <div className="flex flex-col justify-center gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-[#f4f5f9] bg-[#fff4e6] px-4 py-2 text-sm font-semibold text-[#ff7a00]">
                  Bắt đầu với QualiCode AI
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-[#101a38] sm:text-5xl">
                    {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#5f6687]">
                    Đăng ký với username, email và mật khẩu. Sau đó bạn có thể đăng nhập bằng username hoặc email và mật khẩu.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#e7e9f1] bg-[#fafbff] p-6 shadow-[0_20px_40px_rgba(15,24,63,0.08)]">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[#2b355b]">
                    {mode === "login" ? "Username hoặc Email" : "Username"}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    placeholder={mode === "login" ? "Username hoặc email" : "Tên đăng nhập của bạn"}
                    className="w-full rounded-3xl border border-[#e3e7f2] bg-white px-4 py-4 text-sm text-[#1f2a45] outline-none transition focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20"
                  />
                </div>

                {mode === "register" ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#2b355b]">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-3xl border border-[#e3e7f2] bg-white px-4 py-4 text-sm text-[#1f2a45] outline-none transition focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20"
                    />
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-[#2b355b]">
                    <label>Password</label>
                    <span className="text-[#6f7a9b]">Tối thiểu 6 ký tự</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-3xl border border-[#e3e7f2] bg-white px-4 py-4 text-sm text-[#1f2a45] outline-none transition focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20"
                  />
                </div>

                {error ? (
                  <div className="rounded-3xl border border-[#ffd6d6] bg-[#fff1f1] px-4 py-3 text-sm text-[#b53636]">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-3xl border border-[#d7f0e6] bg-[#eff9f5] px-4 py-3 text-sm text-[#166945]">
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center rounded-3xl bg-[#ff7a00] px-5 text-base font-semibold text-white transition hover:bg-[#ff8e26] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                </button>
              </form>

              <div className="text-center text-sm text-[#5f6687]">
                {mode === "login" ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <button type="button" onClick={toggleMode} className="font-semibold text-[#ff7a00] underline-offset-4 transition hover:text-[#ff8e26]">
                      Đăng ký ngay
                    </button>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <button type="button" onClick={toggleMode} className="font-semibold text-[#ff7a00] underline-offset-4 transition hover:text-[#ff8e26]">
                      Đăng nhập
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0d133d] via-[#1e2a60] to-[#ff8c34] p-8 text-white shadow-[0_25px_60px_rgba(15,24,63,0.22)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_28%)]" />
              <div className="absolute -left-10 top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute right-0 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 shadow-sm">
                    Đánh giá năng lực
                  </div>
                  <h2 className="text-4xl font-extrabold leading-tight">Overall Score</h2>
                  <p className="max-w-[320px] text-sm leading-6 text-white/80">
                    Quan sát tiến độ học tập, nâng cấp kỹ năng và đạt mục tiêu IELTS bằng trải nghiệm đăng nhập thông minh.
                  </p>
                </div>

                <div className="rounded-[32px] bg-white/10 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-white/70">Điểm tổng</p>
                      <p className="mt-2 text-[4.5rem] font-bold leading-none text-white">8.0</p>
                    </div>
                    <div className="rounded-3xl bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                      Great
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 text-sm text-white/85 sm:grid-cols-2">
                    {[
                      { label: "Listening", value: "8.5", tone: "text-[#34d399]" },
                      { label: "Reading", value: "7.0", tone: "text-[#facc15]" },
                      { label: "Writing", value: "7.0", tone: "text-[#f97316]" },
                      { label: "Speaking", value: "7.5", tone: "text-[#60a5fa]" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/70">{item.label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
