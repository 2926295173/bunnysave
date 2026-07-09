import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = {
  title?: string;
  excerpt?: string;
  cover?: string;
  tags?: string[];
  body?: string;
  status?: "published" | "draft";
  published_at?: number;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function normalizeStatus(s: unknown): "published" | "draft" {
  return s === "draft" ? "draft" : "published";
}

function normalizeTags(t: unknown): string[] {
  if (!Array.isArray(t)) return [];
  return t
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
    .slice(0, 16);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const { slug } = await params;
  const before = await fetchOne<{ slug: string; title: string }>(
    "SELECT slug, title FROM articles WHERE slug = $1",
    [slug],
  );
  if (!before) return bad("not found", 404);
  const body = (await req.json()) as Body;
  if (!body.title?.trim()) return bad("标题不能为空");
  if (!body.cover?.trim()) return bad("封面 URL 不能为空");
  if (!body.body?.trim()) return bad("正文不能为空");

  const tags = normalizeTags(body.tags);
  const status = normalizeStatus(body.status);
  const publishedAt = Number.isFinite(body.published_at) && body.published_at! > 0
    ? Math.floor(body.published_at!)
    : Math.floor(Date.now() / 1000);

  try {
    await exec(
      `UPDATE articles SET
         title = $2,
         excerpt = $3,
         cover = $4,
         tags = $5::text[],
         body = $6,
         status = $7,
         published_at = $8,
         updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT
       WHERE slug = $1`,
      [
        slug,
        body.title.trim(),
        body.excerpt?.trim() ?? "",
        body.cover.trim(),
        tags,
        body.body,
        status,
        publishedAt,
      ],
    );
    await recordAudit(admin.id, "update", "article", slug, before, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message || "update failed", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const { slug } = await params;
  const before = await fetchOne<{ slug: string; title: string }>(
    "SELECT slug, title FROM articles WHERE slug = $1",
    [slug],
  );
  if (!before) return bad("not found", 404);
  try {
    await exec("DELETE FROM articles WHERE slug = $1", [slug]);
    await recordAudit(admin.id, "delete", "article", slug, before, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad((err as Error).message || "delete failed", 500);
  }
}
