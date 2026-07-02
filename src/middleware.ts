import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse pre-filter for /admin/*. The real role check happens inside each
 * page (RSC) via `requireAdmin()` so we can read the latest role from the
 * DB. The middleware just bounces unauthenticated visitors early.
 *
 * We intentionally do NOT use `withAuth` here — that would force
 * `next-auth/middleware` to run on Edge runtime and read the JWT cookie
 * twice (once here, once in the RSC). A simple 302 is cheaper and the
 * authoritative gate stays server-side.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  // next-auth's default session cookie names
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");
  if (hasSession) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("error", "forbidden");
  url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
