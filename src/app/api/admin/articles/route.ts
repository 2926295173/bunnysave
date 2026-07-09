import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = {
  slug?: string;
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

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as Body;
  const slug = String(body.slug ?? "").trim();
  if (!slug) return bad("Slug 不能为空");
  if (!/^[a-zA-Z0-9_\-一-龥]{1,64}$/.test(slug)) return bad("Slug 格式不合法");
  if (!body.title?.trim()) return bad("标题不能为空");
  if (!body.cover?.trim()) return bad("封面 URL 不能为空");
  if (!body.body?.trim()) return bad("正文不能为空");

  const tags = normalizeTags(body.tags);
  const status = normalizeStatus(body.status);
  const publishedAt = Number.isFinite(body.published_at) && body.published_at! > 0
    ? Math.floor(body.published_at!)
    : Math.floor(Date.now() / 1000);

  try {
    const existing = await fetchOne("SELECT slug FROM articles WHERE slug = $1", [slug]);
    if (existing) return bad("Slug 已存在", 409);

    // Use the postgres array literal form: $2::text[]
    await exec(
      `INSERT INTO articles (slug, title, excerpt, cover, tags, body, status, published_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, EXTRACT(EPOCH FROM NOW())::BIGINT)`,
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
    await recordAudit(admin.id, "create", "article", slug, null, { ...body, slug });
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    return bad((err as Error).message || "create failed", 500);
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "use /api/admin/articles/[slug]" }, { status: 405 });
}
