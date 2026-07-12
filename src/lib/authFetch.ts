import { supabase } from "@/lib/supabase";

/**
 * fetch() wrapper that attaches the current Supabase access token as a
 * Bearer Authorization header. Required for admin API routes guarded by
 * requireRole(), because this app keeps the session in localStorage (not
 * cookies), so the server can only read the token from this header.
 *
 * Any caller-supplied headers (e.g. Content-Type) are preserved.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  let session = null;
  try {
    const { data: { session: s }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("authFetch: Failed to get Supabase session:", error);
      if (error.message?.includes("Refresh Token") || error.message?.includes("refresh_token") || error.message?.includes("refresh token")) {
        supabase.auth.signOut().catch(() => {});
      }
    } else {
      session = s;
    }
  } catch (err) {
    console.error("authFetch: Exception during getSession:", err);
  }

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
