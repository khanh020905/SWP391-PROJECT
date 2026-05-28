"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next") || "/";
      const error = params.get("error");
      const errorDesc = params.get("error_description");

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(errorDesc || error)}`);
        return;
      }

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        const isNewUser = !data?.user?.user_metadata?.role ||
          (new Date().getTime() - new Date(data?.user?.created_at ?? 0).getTime() < 30000);
        if (!exchangeError && data?.user && isNewUser) {
          const name =
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "Người dùng";
          await supabase.auth.updateUser({
            data: { role: "STUDENT", name, isLocked: false },
          });
          await fetch("/api/auth/send-welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.user.email, name }),
          }).catch(() => {});
        }
      }

      router.replace(next);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f4f5f9]">
      <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-[#5e6792] animate-pulse">Đang xác thực...</p>
    </div>
  );
}
