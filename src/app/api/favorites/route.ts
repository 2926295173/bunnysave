import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { exec, fetchOne } from "@/lib/db";

export const runtime = "nodejs";

type Body = { dealId?: string; action?: "toggle" | "add" | "remove" };

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isSafeDealId(id: string): boolean {
  // Match the deal-id allowlist used elsewhere in admin routes.
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "login_required" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("invalid json body");
  }

  const dealId = String(body.dealId ?? "").trim();
  if (!dealId) return bad("dealId 不能为空");
  if (!isSafeDealId(dealId)) return bad("dealId 格式不合法");

  const action: "toggle" | "add" | "remove" =
    body.action === "add" || body.action === "remove" ? body.action : "toggle";

  // Make sure the deal exists — silently no-op on missing deals so a stale UI
  // doesn't surface a confusing 404.
  const deal = await fetchOne<{ id: string }>("SELECT id FROM deals WHERE id = $1", [dealId]);
  if (!deal) return bad("deal not found", 404);

  const existing = await fetchOne<{ user_id: string }>(
    "SELECT user_id FROM favorites WHERE user_id = $1 AND deal_id = $2",
    [userId, dealId],
  );

  let favorited: boolean;
  if (action === "toggle") {
    if (existing) {
      await exec("DELETE FROM favorites WHERE user_id = $1 AND deal_id = $2", [userId, dealId]);
      favorited = false;
    } else {
      await exec(
        "INSERT INTO favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, dealId],
      );
      favorited = true;
    }
  } else if (action === "add") {
    if (!existing) {
      await exec(
        "INSERT INTO favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, dealId],
      );
    }
    favorited = true;
  } else {
    if (existing) {
      await exec("DELETE FROM favorites WHERE user_id = $1 AND deal_id = $2", [userId, dealId]);
    }
    favorited = false;
  }

  return NextResponse.json({ ok: true, dealId, favorited });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "login_required" }, { status: 401 });
  }
  const rows = await fetchOne<{ n: number }>(
    "SELECT COUNT(*)::INT AS n FROM favorites WHERE user_id = $1",
    [session.user.id],
  );
  return NextResponse.json({ ok: true, count: rows?.n ?? 0 });
}