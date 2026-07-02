import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type Body = {
  id?: string;
  title?: string;
  cover?: string;
  brand_id?: string | null;
  cta?: string | null;
  source?: string;
  price?: string | null;
  discount?: string | null;
  description?: string | null;
  is_free?: boolean;
  is_hot?: boolean;
  heat?: number;
  categories?: string[];
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as Body;
  if (!body.title?.trim()) return bad("标题不能为空");
  if (!body.cover?.trim()) return bad("封面 URL 不能为空");
  const id = (body.id?.trim() || randomUUID().replace(/-/g, "")).slice(0, 64);
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return bad("ID 格式不合法");

  try {
    await exec(
      `INSERT INTO deals (id, title, cover, brand_id, cta, source, price, discount, description, is_free, is_hot, heat, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, EXTRACT(EPOCH FROM NOW())::BIGINT)`,
      [
        id,
        body.title.trim(),
        body.cover.trim(),
        body.brand_id || null,
        body.cta?.trim() || null,
        (body.source || "bunnysave.com").trim(),
        body.price?.trim() || null,
        body.discount?.trim() || null,
        body.description || null,
        Boolean(body.is_free),
        Boolean(body.is_hot),
        Number.isFinite(body.heat) ? body.heat! : 100,
      ],
    );
    for (const slug of body.categories ?? []) {
      await exec(
        "INSERT INTO deal_categories (deal_id, category_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, slug],
      );
    }
    await recordAudit(admin.id, "create", "deal", id, null, body);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return bad((err as Error).message || "create failed", 500);
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "use /api/admin/deals/[id]" }, { status: 405 });
}
