import { NextResponse } from "next/server";
import { consumeMagicLink, signIn } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }
  const row = await consumeMagicLink(token);
  if (!row) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired", req.url));
  }

  // Set a short-lived signed cookie so signIn("magic-link", ...) can find the email
  const cookieName = "magic_email_pending";
  const cookie = `${cookieName}=${encodeURIComponent(row.email)}; Path=/; HttpOnly; Max-Age=120; SameSite=Lax`;
  const res = NextResponse.redirect(new URL("/", req.url));
  res.headers.append("Set-Cookie", cookie);

  try {
    await signIn("magic-link", { email: row.email, redirect: false });
  } catch {
    // handled by cookie helper
  }
  return res;
}
