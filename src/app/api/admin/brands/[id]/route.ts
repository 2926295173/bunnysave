import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = { name?: string; logo?: string; sort_order?: number };

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
  const before = await fetchOne("SELECT * FROM brands WHERE id = $1", [id]);
  if (!before) return bad("not found", 404);
  const body = (await req.json()) as Body;
  if (!body.name?.trim()) return bad("名称不能为空");
  if (!body.logo?.trim()) return bad("Logo URL 不能为空");
  try {
    await exec(
      "UPDATE brands SET name = $2, logo = $3, sort_order = $4 WHERE id = $1",
      [id, body.name.trim(), body.logo.trim(), Number(body.sort_order ?? 0)],
    );
    await exec(
      `UPDATE brands SET deal_count = sub.c FROM (
         SELECT brand_id, COUNT(*)::INT AS c FROM deals WHERE brand_id = $1 GROUP BY brand_id
       ) sub WHERE brands.id = sub.brand_id`,
      [id],
    );
    await recordAudit(admin.id, "update", "brand", id, before, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message, 500);
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
  const before = await fetchOne("SELECT id, name FROM brands WHERE id = $1", [id]);
  if (!before) return bad("not found", 404);
  try {
    // Detach brand from any deals before deleting to avoid FK violations.
    await exec("UPDATE deals SET brand_id = NULL WHERE brand_id = $1", [id]);
    await exec("DELETE FROM brands WHERE id = $1", [id]);
    await recordAudit(admin.id, "delete", "brand", id, before, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message, 500);
  }
}
