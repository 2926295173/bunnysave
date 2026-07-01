import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { fetchOne, exec } from "@/lib/db";

export const runtime = "nodejs";

type Body = { email?: unknown; password?: unknown; name?: unknown };

type Row = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password_hash: string | null;
  provider: string;
  created_at: number | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "无效的请求体" }, { status: 400 });
  }
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim() || email.split("@")[0];

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, message: "密码至少需要 8 位字符" },
      { status: 400 },
    );
  }

  try {
    const existing = await fetchOne<Row>("SELECT id FROM users WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "该邮箱已注册，请直接登录" },
        { status: 409 },
      );
    }

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 12);
    await exec(
      "INSERT INTO users (id, email, name, password_hash, provider) VALUES ($1, $2, $3, $4, $5)",
      [id, email, name, hash, "credentials"],
    );

    // We intentionally do NOT call `signIn()` here. Calling
    // `signIn("credentials", { redirect: false })` from a JSON route handler
    // throws an error internally and produces an empty 500 body — exactly the
    // "Unexpected end of JSON input" the browser reports. The frontend calls
    // `signIn("credentials", ...)` itself when our `/ok` is true.
    return NextResponse.json({ ok: true, message: "注册成功", redirect: "/" });
  } catch (err) {
    console.error("[signup] error", err);
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "注册失败，请稍后再试",
      },
      { status: 500 },
    );
  }
}
