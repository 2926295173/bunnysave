import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { exec } from "@/lib/db";
import { randomUUID } from "node:crypto";

/**
 * Server-side gate for /admin/* pages and API routes. Returns the session
 * when the caller is signed in and has role=admin; otherwise throws a
 * redirect to /login (or 403 for API routes).
 */
export async function requireAdmin(): Promise<{ id: string; email: string; role: "admin" }> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?error=forbidden&callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/login?error=forbidden&callbackUrl=/admin");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: "admin",
  };
}

export async function requireAdminOr403(): Promise<{ id: string; email: string; role: "admin" }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new AdminForbiddenError();
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: "admin",
  };
}

export class AdminForbiddenError extends Error {
  status = 403 as const;
  constructor() {
    super("admin only");
  }
}

type AuditEntity = "deal" | "brand" | "category" | "submission";

export async function recordAudit(
  actorId: string,
  action: "create" | "update" | "delete" | "approve" | "reject",
  entity: AuditEntity,
  entityId: string,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  try {
    await exec(
      `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, before, after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        actorId,
        action,
        entity,
        entityId,
        before == null ? null : JSON.stringify(before),
        after == null ? null : JSON.stringify(after),
      ],
    );
  } catch (err) {
    // Audit logging is best-effort — never block the user-facing action.
    console.warn("[audit] failed to write log:", (err as Error).message);
  }
}
