import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for route protection.
 *
 * Checks for the presence of auth tokens in cookies and redirects
 * unauthenticated users away from protected routes. This runs on the
 * Edge before the page renders, preventing the flash of unauthenticated
 * content that occurs with client-side-only auth checks.
 *
 * Note: This only checks token *existence*, not validity. Token validation
 * still happens server-side in authFetch() / getCurrentUser(). If a token
 * is expired, the page will load but the AuthContext will handle the
 * redirect after the validity check completes.
 */

// Routes that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/our-story",
  "/gallery",
  "/faq",
  "/registry",
];

// Route prefixes that don't require authentication
const PUBLIC_PREFIXES = ["/rsvp", "/restaurant", "/w/", "/api/"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Routes that authenticated users should NOT see (redirect to dashboard)
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const hasAuth = !!(accessToken || refreshToken);

  // Authenticated users trying to visit login/register -> redirect to dashboard
  if (hasAuth && AUTH_REDIRECT_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users trying to visit protected routes -> redirect to login
  if (!hasAuth && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
