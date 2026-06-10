import { supabaseAdmin } from "@/lib/supabase";

export const GLOBAL_DAILY_LIMIT = 25;
export const PER_USER_DAILY_LIMIT = 1;

export async function checkShadowingRateLimit(user: any): Promise<{ allowed: boolean; reason?: "global" | "user" }> {
  // Rate limits temporarily disabled
  return { allowed: true };
}
