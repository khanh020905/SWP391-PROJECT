# Auth Module Implementation Plan

## Project Context
- **Framework**: Next.js 16.2.6 (App Router)
- **Auth**: Supabase (`@supabase/supabase-js` v2)
- **Email**: Resend (`resend` package — already installed via `npm install resend`)
- **Styling**: Tailwind CSS v4
- **Design System**: Orange `#ff7a00`, Purple `#7c3aed`, Dark blue `#0d153a`, Gray `#5e6792`, Background `#f4f5f9`
- **Language**: Vietnamese UI text

## What Already Exists (DO NOT REBUILD)
- `src/app/login/page.tsx` — email/password login + Google OAuth ✅
- `src/app/register/page.tsx` — registration with 6-digit OTP email verification ✅
- `src/app/reset-password/page.tsx` — forgot password 3-step flow (email → OTP → new password) ✅
- `src/lib/supabase.ts` — exports `supabase` (anon) and `supabaseAdmin` (service role) ✅
- `src/app/page.tsx` — home page with navbar user dropdown + profile modal ✅
- `src/app/admin/layout.tsx` — admin sidebar with logout ✅

## Environment Variables Needed
Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx   # Get from resend.com → API Keys
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Verified sender in Resend
```

---

## FILES TO CREATE

### 1. `src/hooks/useAuth.ts`
Custom React hook for session state.

```typescript
"use client";
import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser extends User {
  user_metadata: {
    name?: string;
    role?: "ADMIN" | "STUDENT" | "GUEST";
    isLocked?: boolean;
    avatar_url?: string;
    bio?: string;
    phone?: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser((session?.user as AuthUser) ?? null);
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
```

---

### 2. `src/middleware.ts`
Route protection — redirect unauthenticated users away from `/profile` and `/settings/*`.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/profile", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Supabase JS v2 sets cookie "sb-{projectRef}-auth-token" for cross-tab sync
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (!hasAuthCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|assets).*)"],
};
```

---

### 3. `src/app/api/auth/callback/route.ts`
Handles Google OAuth redirect and exchanges `code` for session.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc || error)}`
    );
  }

  if (code) {
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!exchangeError && data?.user) {
      // Initialize metadata for new Google users
      if (!data.user.user_metadata?.role) {
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          user_metadata: {
            role: "STUDENT",
            name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Người dùng",
            isLocked: false,
          },
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

---

### 4. `src/app/api/auth/send-welcome/route.ts`
Called after successful OTP verification to send a welcome email via Resend.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@qualicode.com",
      to: email,
      subject: "Chào mừng bạn đến với QualiCode! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #7c3aed 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">
                <span style="color: #ff7a00;">*</span> QualiCode
              </div>
              <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0;">AI-Powered IELTS Learning</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Chào mừng ${name || "bạn"} đến với QualiCode! 👋</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu hành trình chinh phục IELTS với AI ngay hôm nay!
              </p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://qualicode.com"}/login"
                style="display: inline-block; background: #ff7a00; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Đăng nhập ngay →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 5. `src/app/api/auth/reset-password/route.ts`
Generates a Supabase recovery link and sends it via Resend (replaces Supabase's default reset email).

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Generate Supabase recovery link (handles token storage)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
      },
    });

    if (error) throw error;

    const resetLink = data?.properties?.action_link;
    if (!resetLink) throw new Error("Không thể tạo đường dẫn đặt lại mật khẩu.");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@qualicode.com",
      to: email,
      subject: "Đặt lại mật khẩu QualiCode",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f4f5f9; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,56,0.08);">
            <div style="background: linear-gradient(135deg, #0d153a 0%, #7c3aed 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: white;">
                <span style="color: #ff7a00;">*</span> QualiCode
              </div>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0d153a; margin: 0 0 12px;">Đặt lại mật khẩu 🔐</h2>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.
              </p>
              <p style="color: #5e6792; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Nhấn nút bên dưới để tạo mật khẩu mới. Link có hiệu lực trong <strong>1 giờ</strong>.
              </p>
              <a href="${resetLink}"
                style="display: inline-block; background: #ff7a00; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Đặt lại mật khẩu →
              </a>
              <p style="color: #97a0c3; font-size: 12px; margin: 24px 0 0;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 6. `src/app/api/profile/route.ts`
Read and update user profile metadata.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/profile — returns current user profile
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name,
    role: user.user_metadata?.role,
    avatar_url: user.user_metadata?.avatar_url,
    bio: user.user_metadata?.bio,
    phone: user.user_metadata?.phone,
    created_at: user.created_at,
  });
}

// PATCH /api/profile — update name, phone, bio
export async function PATCH(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { name, phone, bio } = await request.json();

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, name, phone, bio },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data.user });
}
```

---

### 7. `src/app/api/profile/avatar/route.ts`
Upload avatar to Supabase Storage bucket `avatars` (must be created in Supabase dashboard).

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("avatar") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `avatars/${user.id}-${Date.now()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_url: urlData.publicUrl },
  });

  return NextResponse.json({ avatar_url: urlData.publicUrl });
}
```

---

### 8. `src/app/(user)/layout.tsx`
Client-side auth guard + sidebar navigation for all `/profile` and `/settings` pages.

**Sidebar nav items:**
- Hồ sơ cá nhân → `/profile`
- Chỉnh sửa hồ sơ → `/profile/edit`
- Đổi mật khẩu → `/settings/password`
- Đổi ảnh đại diện → `/settings/avatar`
- Đăng xuất button (calls `supabase.auth.signOut()` then `router.replace("/login")`)

**Auth guard logic:**
```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
    } else {
      setUser(session.user as AuthUser);
      setLoading(false);
    }
  });
}, []);
```

**Header**: Shows `* QualiCode` logo → `Tài khoản của tôi` breadcrumb + Home link

---

### 9. `src/app/(user)/profile/page.tsx`
View profile page.

**Sections:**
1. **Cover card** — gradient cover bg `#0d153a → #7c3aed`, avatar (image or initials fallback), user name, role badge, "Chỉnh sửa" button linking to `/profile/edit`
2. **Info card** — grid with: Email, Ngày tham gia, Số điện thoại (if set), Trạng thái hoạt động, Bio (if set)
3. **Quick actions row** — 3 cards: "Chỉnh sửa hồ sơ", "Đổi mật khẩu", "Đổi ảnh đại diện"

---

### 10. `src/app/(user)/profile/edit/page.tsx`
Edit profile form.

**Fields:**
- Họ và Tên (required) — current value pre-filled from `user.user_metadata.name`
- Số điện thoại (optional) — pre-filled from `user.user_metadata.phone`
- Giới thiệu bản thân (textarea, max 300 chars) — pre-filled from `user.user_metadata.bio`
- Email (read-only, disabled)

**Save logic:**
```typescript
await supabase.auth.updateUser({
  data: { name, phone, bio }
});
```
Show success banner on save. Show error banner on failure. "Hủy bỏ" button links back to `/profile`.

---

### 11. `src/app/(user)/settings/password/page.tsx`
Change password page for logged-in users.

**Fields:**
- Mật khẩu hiện tại (with show/hide toggle)
- Mật khẩu mới (with show/hide + real-time strength indicator)
- Xác nhận mật khẩu mới (with match indicator)

**Validation before API call:**
- `newPassword.length >= 6`
- `newPassword === confirmPassword`
- `newPassword !== currentPassword`

**Logic:**
1. Re-authenticate with current password: `supabase.auth.signInWithPassword({ email, password: currentPassword })`
2. If that fails → show "Mật khẩu hiện tại không chính xác"
3. If passes → `supabase.auth.updateUser({ password: newPassword })`

**Special case:** If user logged in via Google (detect via `user.app_metadata.provider === "google"`), show a notice: "Tài khoản Google không sử dụng mật khẩu. Bạn có thể đặt mật khẩu mới trực tiếp." and skip the current password verification step.

**Password strength meter:**
Score 1-5 based on: length≥6, length≥10, has uppercase, has number, has special char
Colors: red (1), orange (2), yellow (3), green (4), emerald (5)

**Security tips card** below the form with 5 bullet points.

---

### 12. `src/app/(user)/settings/avatar/page.tsx`
Avatar upload page.

**Layout:**
- Left: current avatar display (image or initials) + "Xem trước ảnh mới" when file selected
- Right: drag-click upload zone, file info row, upload/remove buttons

**File validation:**
- Types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 2MB
- Show error immediately on invalid file

**Upload flow:**
1. User selects file → preview shown locally via `FileReader`
2. User clicks "Tải ảnh lên" → calls `POST /api/profile/avatar` with `FormData` + `Authorization: Bearer {accessToken}` header
3. On success → refresh user session to show new avatar

**Remove avatar:** calls `supabase.auth.updateUser({ data: { avatar_url: null } })`

---

### 13. `src/components/ui/OtpInput.tsx`
Reusable 6-digit OTP input component.

**Props:**
```typescript
interface OtpInputProps {
  value: string[];        // array of 6 strings
  onChange: (otp: string[]) => void;
  disabled?: boolean;
  length?: number;        // default 6
}
```

**Behavior:**
- Auto-focus next input on digit entry
- Backspace moves to previous input if current is empty
- Paste support (pastes up to 6 digits, jumps to next empty)
- Disabled state (opacity-50, pointer-events-none)

**Style:** Same as existing OTP inputs in `register/page.tsx` and `reset-password/page.tsx`

---

## FILES TO UPDATE

### 14. `src/app/register/page.tsx`
After successful OTP verification (inside `handleVerifyOTP` after `supabase.auth.verifyOtp` succeeds):

```typescript
// Send welcome email via Resend
try {
  await fetch("/api/auth/send-welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });
} catch (_) { /* non-blocking */ }

await supabase.auth.signOut();
window.location.href = "/login?verified=true";
```

Also: Replace the inline OTP inputs (6 `<input>` elements) with `<OtpInput value={otp} onChange={setOtp} disabled={expiryCountdown <= 0} />` from the new component.

---

### 15. `src/app/reset-password/page.tsx`
**Two changes:**

**A) Replace `handleRequestReset` to use Resend API instead of `supabase.auth.resetPasswordForEmail`:**

```typescript
const handleRequestReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSuccessMsg("Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hòm thư.");
    // Since we're now using link-based reset (not OTP), just show success
    // No longer go to step 2 (OTP step)
  } catch (err: any) { setErrorMsg(err.message); }
  finally { setIsLoading(false); }
};
```

> **Note**: With Resend's link-based reset, the 3-step flow (email → OTP → new password) simplifies to:
> - Step 1: Enter email → Resend sends link
> - Step 2: User clicks link in email → lands on `/reset-password` with Supabase session (via callback)  
> - Step 3: Set new password (existing step 3 UI works as-is since Supabase session is active)
>
> You can keep the OTP step 2 UI hidden/removed, OR keep it for UX consistency but note it won't work with link-based Resend flow. **Recommend**: simplify to 2-step: email submission → success message. User clicks link and arrives at step 3 directly.

**B)** Replace inline OTP inputs in step 2 with `<OtpInput>` component (if keeping OTP flow).

---

### 16. `src/app/login/page.tsx`
Update Google OAuth `redirectTo` from `/login` to `/api/auth/callback`:

```typescript
// CHANGE THIS:
redirectTo: `${window.location.origin}/login`,

// TO THIS:
redirectTo: `${window.location.origin}/api/auth/callback`,
```

---

### 17. `src/app/page.tsx`
In the user dropdown, the "Thông tin tài khoản" button currently opens a modal. 
**Change it to a Link to `/profile`** instead of opening the modal:

```typescript
// Replace the button with:
<Link href="/profile" onClick={() => setShowDropdown(false)}
  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#ff7a00] transition-all cursor-pointer">
  <User className="w-4 h-4 text-[#ff7a00]" />
  <span>Hồ sơ cá nhân</span>
</Link>
```

Also show the user's actual avatar image in the navbar button (if `user.user_metadata.avatar_url` exists), otherwise show initials.

You can keep or remove the profile modal (`showProfileModal`) — it's optional after the profile page exists.

---

## SUPABASE STORAGE SETUP
Before avatar upload works, create a storage bucket in Supabase dashboard:
1. Go to Supabase → Storage → New Bucket
2. Name: `avatars`
3. Public: **Yes** (so avatars are publicly accessible)
4. Add policy: Allow authenticated users to upload/update/delete their own files

---

## COMMIT PLAN (aim for 25+ commits)

```
1.  feat: add useAuth hook for centralized session state management
2.  feat: add Next.js middleware for route protection on profile and settings
3.  feat: add OAuth auth callback API route for Google login redirect
4.  feat: add profile GET and PATCH API endpoint
5.  feat: add avatar upload API endpoint with Supabase Storage
6.  feat: add send-welcome API route using Resend email
7.  feat: add reset-password API route using Resend with Supabase admin link
8.  feat: create user account area layout with sidebar and auth guard
9.  feat: add user profile sidebar with avatar and navigation links
10. feat: add logout button to user area sidebar
11. feat: create profile view page with cover and user info card
12. feat: add quick actions section to profile page
13. feat: display user avatar in profile with initials fallback
14. feat: create edit profile page with name, phone, bio fields
15. feat: add form validation and success feedback to edit profile page
16. feat: create change password page with current password verification
17. feat: add real-time password strength indicator to change password form
18. feat: add password match indicator and security tips to password page
19. feat: handle Google OAuth users on change password page
20. feat: create avatar settings page with file upload and preview
21. feat: add file type and size validation to avatar upload
22. feat: add remove avatar option to avatar settings page
23. feat: add reusable OtpInput component with auto-focus and paste support
24. refactor: replace inline OTP inputs in register page with OtpInput component
25. refactor: replace inline OTP inputs in reset-password page with OtpInput component
26. feat: trigger welcome email via Resend after successful OTP verification
27. feat: update reset-password page to use Resend link-based email flow
28. fix: update Google OAuth redirectTo to use auth callback URL
29. feat: add profile page link to home page user dropdown
30. feat: show user avatar image in navbar when avatar_url is set
31. chore: add RESEND_API_KEY and RESEND_FROM_EMAIL to env.example
32. docs: add TypeScript types for user profile metadata in useAuth hook
```

---

## NOTES FOR IMPLEMENTATION

1. **All pages under `src/app/(user)/`** — The `(user)` is a Next.js Route Group (parentheses = no URL segment). So `(user)/profile/page.tsx` → URL is `/profile`.

2. **Password change for Google users** — Check `user.app_metadata?.provider`. If it's `google`, they may not have a password set. Skip current-password verification and let them set a new one directly.

3. **Avatar upload** — The frontend can handle upload directly (without the API route) by calling `supabase.storage` directly from the client, using `supabase.auth.getSession()` to get the access token. The API route is optional but cleaner.

4. **Welcome email timing** — Only send it ONCE. Add a flag `welcome_email_sent: true` to user metadata so you don't re-send on re-verification.

5. **Resend free tier** — 3,000 emails/month free. Domain verification required for custom from-address. For testing use the default Resend sandbox domain.

6. **`.env.local` is already gitignored** — Add `RESEND_API_KEY=your_key_here` to it.
