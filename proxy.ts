import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse pre-filter for /admin/*. The real role check happens inside each
 * page (RSC) via `requireAdmin()` so we can read the latest role from the
 * DB. The proxy just bounces unauthenticated visitors early.
 */
export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
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
