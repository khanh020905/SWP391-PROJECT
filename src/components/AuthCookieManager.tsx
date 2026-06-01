"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCookieManager() {
  useEffect(() => {
    function updateCookie(session: any) {
      const hasMockSession = typeof window !== "undefined" && localStorage.getItem("mock_session") !== null;
      if (session || hasMockSession) {
        document.cookie = "sb-custom-auth-token=true; path=/; max-age=86400; SameSite=Lax";
      } else {
        document.cookie = "sb-custom-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateCookie(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateCookie(session);
    });

    // Periodically sync (e.g. if localStorage is cleared or changed)
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        updateCookie(session);
      });
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return null;
}
