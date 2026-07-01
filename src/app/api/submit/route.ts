import { NextResponse } from "next/server";

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

  if (!title || !url) {
    return NextResponse.json({ ok: false, message: "请提供标题和详情链接" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { ok: false, message: "详情链接必须以 http(s):// 开头" },
      { status: 400 },
    );
  }

  // In production this would write to a `submit_queue` table and notify editors.
  // For now we log so editors (and you) can see submissions in the Vercel logs.
  console.log("[submit]", { title, url, store: body.store, price: body.price, email: body.email });

  return NextResponse.json({ ok: true, message: "已提交，等待编辑审核" });
}
