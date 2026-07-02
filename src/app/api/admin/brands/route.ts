import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = { id?: string; name?: string; logo?: string; sort_order?: number };

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
  if (!body.id?.trim()) return bad("ID 不能为空");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(body.id)) return bad("ID 格式不合法（仅字母数字 _ -）");
  if (!body.name?.trim()) return bad("名称不能为空");
  if (!body.logo?.trim()) return bad("Logo URL 不能为空");

  try {
    await exec(
      "INSERT INTO brands (id, name, logo, sort_order) VALUES ($1, $2, $3, $4)",
      [body.id, body.name.trim(), body.logo.trim(), Number(body.sort_order ?? 0)],
    );
    await recordAudit(admin.id, "create", "brand", body.id, null, body);
    return NextResponse.json({ ok: true, id: body.id });
  } catch (err) {
    return bad((err as Error).message, 500);
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "use /api/admin/brands/[id]" }, { status: 405 });
}
