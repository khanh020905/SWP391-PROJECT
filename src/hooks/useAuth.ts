"use client";
import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser extends User {
  user_metadata: {
    name?: string;
    role?: import("@/lib/roles").UserRole;
    isLocked?: boolean;
    avatar_url?: string;
    bio?: string;
    phone?: string;
    inAppReminders?: boolean;
    emailReminders?: boolean;
    streakWarning?: boolean;
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(session);
      setUser((session?.user as AuthUser) ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn("Failed to get initial Supabase session in useAuth:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser((session?.user as AuthUser) ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
