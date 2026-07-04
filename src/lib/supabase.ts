import { createClient } from "@supabase/supabase-js";

// Global console.error interceptor to catch and mute annoying Supabase AuthApiErrors
// (e.g. Invalid Refresh Token: Refresh Token Not Found) that crash DevTools/overlays
if (typeof console !== "undefined" && console.error) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const isAuthRefreshTokenError = (arg: any): boolean => {
      if (!arg) return false;
      if (arg instanceof Error) {
        const msg = arg.message || "";
        return (
          msg.includes("Invalid Refresh Token") ||
          msg.includes("Refresh Token Not Found") ||
          msg.includes("refresh_token") ||
          msg.includes("refresh token")
        );
      }
      if (typeof arg === "object") {
        const msg = arg.message || arg.error || arg.error_description || arg.msg || "";
        if (typeof msg === "string") {
          return (
            msg.includes("Invalid Refresh Token") ||
            msg.includes("Refresh Token Not Found") ||
            msg.includes("refresh_token") ||
            msg.includes("refresh token")
          );
        }
      }
      const str = String(arg);
      return (
        str.includes("Invalid Refresh Token") ||
        str.includes("Refresh Token Not Found") ||
        str.includes("refresh_token") ||
        str.includes("refresh token")
      );
    };

    if (args.some(isAuthRefreshTokenError)) {
      if (typeof console.warn !== "undefined") {
        console.warn("Muted transient background auth token refresh error:", ...args);
      }
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_xwHeAklBZamxMUHWzPytHw_s4A7COgp";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";

// Custom fetch wrapper with exponential backoff retry for network/timeout errors
async function customFetch(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const maxRetries = 3;
  let delay = 1000; // 1s start delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err: any) {
      const isTimeoutOrNetwork = 
        err.name === "ConnectTimeoutError" || 
        err.code === "UND_ERR_CONNECT_TIMEOUT" || 
        err.message?.includes("fetch failed") || 
        err.message?.includes("timeout") ||
        err.message?.includes("ECONNRESET");

      if (isTimeoutOrNetwork && attempt < maxRetries) {
        console.warn(`[Supabase Fetch Retry] Attempt ${attempt} failed: ${err.message || err}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        continue;
      }
      throw err;
    }
  }
  return fetch(url, options);
}

// Client-side Supabase client (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});

// Server-side Admin Supabase client
export const supabaseAdmin = createClient(
  supabaseUrl,
  (typeof window === "undefined" && supabaseServiceRoleKey) ? supabaseServiceRoleKey : supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: customFetch,
    },
  }
);
