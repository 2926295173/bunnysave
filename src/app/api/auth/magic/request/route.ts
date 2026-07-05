import { NextResponse } from "next/server";
import { createMagicLink, findOrCreateUserByEmail } from "@/auth";

export const runtime = "nodejs";

type Body = { email?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "无效的请求体" }, { status: 400 });
  }
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "邮箱格式不正确" }, { status: 400 });
  }

  // Auto-create user on demand so first-time magic link still works
  await findOrCreateUserByEmail(email);

  const { token } = await createMagicLink(email);
  const link = `${new URL(req.url).origin}/api/auth/magic?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    // Production: hand off to Resend
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.MAGIC_FROM ?? "省钱兔 <admin@codestory.top>",
          to: email,
          subject: "你的省钱兔登录链接",
          html: `<p>点击下方链接登录（15 分钟内有效）：</p><p><a href="${link}">${link}</a></p>`,
        }),
      });
      if (!r.ok) {
        const body = await r.text();
        console.error("[magic] resend failed", r.status, body);
        // Fall back to logging the link so the user can still sign in
        // from the Vercel function logs if the email provider hiccups.
        console.log(`[magic link fallback] ${email} -> ${link}`);
      }
    } catch (e) {
      console.error("[magic] resend error", e);
      console.log(`[magic link fallback] ${email} -> ${link}`);
    }
  } else {
    // Dev fallback: log link so the developer can copy/paste
    console.log(`\n[magic link] ${email} -> ${link}\n`);
  }

  return NextResponse.json({ ok: true, message: "登录链接已发送" });
}
