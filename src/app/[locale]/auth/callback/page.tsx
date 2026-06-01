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
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const next = params.get("next") || "/";
      const error = params.get("error");
      const errorDesc = params.get("error_description");

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(errorDesc || error)}`);
        return;
      }

      let authData: any = null;
      let authError: any = null;

      if (code) {
        // PKCE code flow (Google OAuth + email PKCE confirmation)
        const { data, error: err } = await supabase.auth.exchangeCodeForSession(code);
        authData = data;
        authError = err;
      } else if (tokenHash && type) {
        // Magic link / email OTP confirmation (token_hash flow)
        const { data, error: err } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });
        authData = data;
        authError = err;
      }

      const isNewUser = !authData?.user?.user_metadata?.welcomeEmailSent;
      if (!authError && authData?.user && isNewUser) {
        const name =
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          authData.user.email?.split("@")[0] ||
          "Người dùng";
        await supabase.auth.updateUser({
          data: {
            role: authData.user.user_metadata?.role || "STUDENT",
            name,
            isLocked: authData.user.user_metadata?.isLocked ?? false,
            welcomeEmailSent: true,
          },
        });
        await fetch("/api/auth/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authData.user.email, name }),
        }).catch(() => {});
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
