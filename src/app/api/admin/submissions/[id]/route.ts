import { NextResponse, type NextRequest } from "next/server";
import { requireAdminOr403, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = { action?: "approve" | "reject" | "spam" };

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdminOr403();
  } catch {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json()) as Body;
  const action = body.action;
  if (!action || !["approve", "reject", "spam"].includes(action)) return bad("无效操作");

  const before = await fetchOne<{ id: string; status: string }>(
    "SELECT id, status FROM deal_submissions WHERE id = $1",
    [id],
  );
  if (!before) return bad("not found", 404);

  const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "spam";
  try {
    await exec(
      "UPDATE deal_submissions SET status = $2, reviewed_at = EXTRACT(EPOCH FROM NOW())::BIGINT, reviewer_id = $3 WHERE id = $1",
      [id, newStatus, admin.id],
    );
    await recordAudit(admin.id, newStatus === "approved" ? "approve" : "reject", "submission", id, before, { status: newStatus });
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    return bad((err as Error).message, 500);
  }
}
