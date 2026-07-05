import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec } from "@/lib/db";

export const runtime = "nodejs";

type Action =
  | "delete"
  | "addCategory"
  | "removeCategory"
  | "setFree"
  | "setHot"
  | "unsetFree"
  | "unsetHot";

type Body = { ids?: string[]; action?: Action; category?: string };

const ACTIONS: Action[] = [
  "delete",
  "addCategory",
  "removeCategory",
  "setFree",
  "setHot",
  "unsetFree",
  "unsetHot",
];

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
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (ids.length === 0) return bad("未选择任何条目");
  if (ids.length > 500) return bad("一次最多 500 条");
  if (!body.action || !ACTIONS.includes(body.action)) return bad("无效操作");

  let affected = 0;
  try {
    switch (body.action) {
      case "delete": {
        // Clean up join rows first to avoid FK violations.
        await exec("DELETE FROM deal_categories WHERE deal_id = ANY($1)", [ids]);
        const r = await exec("DELETE FROM deals WHERE id = ANY($1)", [ids]);
        affected = ids.length;
        await recordAudit(admin.id, "delete", "deal", ids.join(","), { ids }, null);
        break;
      }
      case "setFree":
        affected = await batchUpdate(admin, "update", "deal", ids, { is_free: true });
        break;
      case "unsetFree":
        affected = await batchUpdate(admin, "update", "deal", ids, { is_free: false });
        break;
      case "setHot":
        affected = await batchUpdate(admin, "update", "deal", ids, { is_hot: true });
        break;
      case "unsetHot":
        affected = await batchUpdate(admin, "update", "deal", ids, { is_hot: false });
        break;
      case "addCategory": {
        if (!body.category) return bad("缺少分类 slug");
        for (const id of ids) {
          await exec(
            "INSERT INTO deal_categories (deal_id, category_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, body.category],
          );
        }
        affected = ids.length;
        await recordAudit(admin.id, "update", "deal", ids.join(","), null, {
          action: "addCategory",
          category: body.category,
        });
        break;
      }
      case "removeCategory": {
        if (!body.category) return bad("缺少分类 slug");
        for (const id of ids) {
          await exec(
            "DELETE FROM deal_categories WHERE deal_id = $1 AND category_slug = $2",
            [id, body.category],
          );
        }
        affected = ids.length;
        await recordAudit(admin.id, "update", "deal", ids.join(","), null, {
          action: "removeCategory",
          category: body.category,
        });
        break;
      }
    }
    return NextResponse.json({ ok: true, affected });
  } catch (err) {
    return bad((err as Error).message ?? "batch failed", 500);
  }
}

async function batchUpdate(
  admin: { id: string },
  action: "update",
  entity: "deal",
  ids: string[],
  patch: Record<string, unknown>,
): Promise<number> {
  // Build a positional UPDATE … WHERE id = ANY($1) using a single statement.
  const cols = Object.keys(patch);
  if (cols.length === 0) return 0;
  const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const values = [ids, ...cols.map((c) => patch[c])];
  await exec(`UPDATE ${entity}s SET ${setClauses} WHERE id = ANY($1)`, values);
  await recordAudit(admin.id, action, entity, ids.join(","), null, patch);
  return ids.length;
}
