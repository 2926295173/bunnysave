import { NextResponse } from "next/server";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { email?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "无效的请求体" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "邮箱格式不正确" }, { status: 400 });
  }

  // Best-effort capture of request metadata for the admin audit view.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  const source = req.headers.get("referer") || null;

  try {
    const existing = await fetchOne<{ unsubscribed_at: number | null }>(
      "SELECT unsubscribed_at FROM newsletter_subscribers WHERE email = $1",
      [email],
    );

    if (existing && !existing.unsubscribed_at) {
      // Already subscribed and not unsubscribed — idempotent success.
      return NextResponse.json({ ok: true, message: "订阅成功" });
    }

    if (existing && existing.unsubscribed_at) {
      // Resubscribing after an unsubscribe — clear the flag and update audit fields.
      await exec(
        `UPDATE newsletter_subscribers
            SET unsubscribed_at = NULL,
                ip = $2,
                user_agent = $3,
                source = $4,
                created_at = EXTRACT(EPOCH FROM NOW())::BIGINT
          WHERE email = $1`,
        [email, ip, userAgent, source],
      );
    } else {
      await exec(
        `INSERT INTO newsletter_subscribers (email, source, ip, user_agent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [email, source, ip, userAgent],
      );
    }
  } catch (err) {
    console.error("[newsletter] db error:", err);
    return NextResponse.json({ ok: false, message: "订阅失败，请稍后再试" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "订阅成功" });
}