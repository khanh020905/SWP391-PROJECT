import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserTier = "guest" | "user" | "vip";

export interface SubscriptionInfo {
  tier: UserTier;
  plan: string | null;        // 'premium' | 'vip' | 'master' | null
  expiresAt: Date | null;
  isVip: boolean;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionInfo {
  const [info, setInfo] = useState<SubscriptionInfo>({
    tier: "guest",
    plan: null,
    expiresAt: null,
    isVip: false,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (active) {
            setInfo({ tier: "guest", plan: null, expiresAt: null, isVip: false, isLoading: false });
          }
          return;
        }

        // Check subscription trong Supabase
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        if (active) {
          const metaRole = user.user_metadata?.role;
          const metaPkg = user.user_metadata?.packageId;
          const isMetadataVip = metaRole === "ADMIN" || metaRole === "INSTRUCTOR" || metaRole === "STUDENT" || ["pkg_1", "pkg_2", "pkg_3", "premium", "vip", "master"].includes(metaPkg);

          if (sub) {
            setInfo({
              tier: "vip",
              plan: sub.plan,
              expiresAt: new Date(sub.expires_at),
              isVip: true,
              isLoading: false,
            });
          } else if (isMetadataVip) {
            setInfo({
              tier: "vip",
              plan: metaPkg || null,
              expiresAt: null,
              isVip: true,
              isLoading: false,
            });
          } else {
            setInfo({
              tier: "user",
              plan: null,
              expiresAt: null,
              isVip: false,
              isLoading: false,
            });
          }
        }
      } catch (err) {
        console.error("Error in useSubscription:", err);
        if (active) {
          setInfo({
            tier: "guest",
            plan: null,
            expiresAt: null,
            isVip: false,
            isLoading: false,
          });
        }
      }
    };

    check();

    // Listen for auth changes to recheck subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return info;
}
