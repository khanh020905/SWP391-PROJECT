import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // Run next-intl middleware for locale routing
  const response = intlMiddleware(request);

  // If there was auth logic, it would go here.
  // For now, we just return the response from intlMiddleware, 
  // which handles redirects like /login -> /vi/login (internally or externally based on routing config)
  
  return response;
}

export const config = {
  // matcher from user request
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
