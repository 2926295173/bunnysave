import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = {
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const before = await fetchOne("SELECT * FROM deals WHERE id = $1", [id]);
  if (!before) return bad("not found", 404);
  const body = (await req.json()) as Body;
  if (!body.title?.trim()) return bad("标题不能为空");
  if (!body.cover?.trim()) return bad("封面 URL 不能为空");

  try {
    await exec(
      `UPDATE deals SET
         title = $2,
         cover = $3,
         brand_id = $4,
         cta = $5,
         source = $6,
         price = $7,
         discount = $8,
         description = $9,
         is_free = $10,
         is_hot = $11,
         heat = $12
       WHERE id = $1`,
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
    if (Array.isArray(body.categories)) {
      await exec("DELETE FROM deal_categories WHERE deal_id = $1", [id]);
      for (const slug of body.categories) {
        await exec(
          "INSERT INTO deal_categories (deal_id, category_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, slug],
        );
      }
    }
    await recordAudit(admin.id, "update", "deal", id, before, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message || "update failed", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const before = await fetchOne("SELECT id, title FROM deals WHERE id = $1", [id]);
  if (!before) return bad("not found", 404);
  try {
    await exec("DELETE FROM deal_categories WHERE deal_id = $1", [id]);
    await exec("DELETE FROM deals WHERE id = $1", [id]);
    await recordAudit(admin.id, "delete", "deal", id, before, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message || "delete failed", 500);
  }
}
