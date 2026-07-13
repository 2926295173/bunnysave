import { requireAdmin } from "@/lib/admin";
import { fetchAll } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  email: string;
  source: string | null;
  ip: string | null;
  created_at: number;
  unsubscribed_at: number | null;
};

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function fmt(epoch: number | null): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  return d.toISOString();
}

export async function GET() {
  await requireAdmin();

  const rows = await fetchAll<Row>(
    `SELECT email, source, ip,
            created_at::BIGINT AS created_at,
            unsubscribed_at::BIGINT AS unsubscribed_at
       FROM newsletter_subscribers
      ORDER BY created_at DESC`,
  );

  const header = ["email", "source", "ip", "created_at", "unsubscribed_at"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.email),
        csvEscape(r.source ?? ""),
        csvEscape(r.ip ?? ""),
        csvEscape(fmt(r.created_at)),
        csvEscape(fmt(r.unsubscribed_at)),
      ].join(","),
    );
  }
  const body = "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8 detection.

  const filename = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}