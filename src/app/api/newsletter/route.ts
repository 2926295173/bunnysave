import { NextResponse } from "next/server";

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

  // Serverless platforms have ephemeral filesystems, so we only acknowledge the
  // subscription client-side and surface a success message without persisting.
  // Hook up to a real provider (Mailchimp, Buttondown, Loops, etc.) when ready.
  return NextResponse.json({ ok: true, message: "订阅成功" });
}
