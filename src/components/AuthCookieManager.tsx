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
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        updateCookie(session);
      })
      .catch((err) => {
        console.warn("Failed to get initial Supabase session in AuthCookieManager:", err);
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateCookie(session);
    });

    // Sync session if storage changes (e.g. from another tab or dev tools)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mock_session" || (e.key && e.key.includes("-auth-token"))) {
        supabase.auth.getSession()
          .then(({ data: { session } }) => {
            updateCookie(session);
          })
          .catch((err) => {
            console.debug("Failed to sync Supabase session on storage change:", err);
          });
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Mute transient network errors (e.g. Failed to fetch) in background promises (like Supabase init/refresh)
    // to prevent full-screen Next.js overlay/console crashes when offline or blocked.
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason || "");
      if (
        msg.includes("Failed to fetch") || 
        msg.includes("fetch") || 
        msg.includes("NetworkError") || 
        msg.includes("Load failed")
      ) {
        console.debug("Muted transient background network error:", event.reason);
        event.preventDefault(); // Prevents browser/Next.js overlay from crashing
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
