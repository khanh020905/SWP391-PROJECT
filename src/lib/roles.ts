import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "GUEST";

export const ROLES = {
  ADMIN: "ADMIN" as UserRole,
  INSTRUCTOR: "INSTRUCTOR" as UserRole,
  STUDENT: "STUDENT" as UserRole,
  GUEST: "GUEST" as UserRole,
};

export const ADMIN_ONLY = [ROLES.ADMIN];
export const ADMIN_OR_INSTRUCTOR = [ROLES.ADMIN, ROLES.INSTRUCTOR];

/**
 * Validates if a user has one of the allowed roles.
 * Returns the user's role if authorized, or null if unauthorized.
 * Also checks the database profile as the single source of truth.
 */
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  // Try to get token from header or cookie
  const authHeader = request.headers.get("Authorization");
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // Check cookies for sb-*-auth-token
    const cookies = request.cookies.getAll();
    const authCookie = cookies.find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (authCookie) {
      try {
        const parsed = JSON.parse(authCookie.value);
        if (Array.isArray(parsed)) {
          token = parsed[0];
        } else if (parsed && typeof parsed === "object" && parsed.access_token) {
           token = parsed.access_token;
        } else {
          token = authCookie.value;
        }
      } catch {
        token = authCookie.value;
      }
    }
  }

  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;

    let role = (user.user_metadata?.role as UserRole);

    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role as UserRole;
      }
    } catch {
      // Ignore DB table fetch error if profiles table is missing
    }

    if (!role) role = "STUDENT";

    if (allowedRoles.includes(role)) {
      return { user, role };
    }
    return null;
  } catch (err) {
    console.error("requireRole error:", err);
    return null;
  }
}
