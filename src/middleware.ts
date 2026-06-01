import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  // Run next-intl middleware for locale routing
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|vi)/, "");

  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + "/")
  );

  if (isAdminRoute) {
    const hasAuthCookie = request.cookies.getAll().some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    if (!hasAuthCookie) {
      const localeMatch = pathname.match(/^\/(en|vi)/);
      const locale = localeMatch ? localeMatch[1] : "vi";
      const url = new URL(`/${locale}/login`, request.url);
      url.searchParams.set("error", "insufficient_permissions");
      return NextResponse.redirect(url);
    }
  }
  
  return response;
}

export const config = {
  // matcher from user request
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
