import { NextResponse } from "next/server";
import { exec } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type Body = {
  title?: string;
  url?: string;
  image?: string;
  price?: string;
  store?: string;
  email?: string;
  notes?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "无效的请求体" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  const url = String(body.url ?? "").trim();
  const email = String(body.email ?? "").trim() || null;

  if (!title || !url) {
    return NextResponse.json({ ok: false, message: "请提供标题和详情链接" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { ok: false, message: "详情链接必须以 http(s):// 开头" },
      { status: 400 },
    );
  }

  // Pack any extra metadata into the description column so admins can see it.
  const description = [
    body.image ? `封面: ${body.image}` : null,
    body.price ? `价格: ${body.price}` : null,
    body.store ? `商家: ${body.store}` : null,
    body.notes ? `备注: ${body.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n") || null;

  try {
    await exec(
      `INSERT INTO deal_submissions (id, title, url, description, submitter_email, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [randomUUID(), title, url, description, email],
    );
  } catch (err) {
    console.error("[submit] db error:", err);
    return NextResponse.json({ ok: false, message: "提交失败，请稍后再试" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "已提交，等待编辑审核" });
}
