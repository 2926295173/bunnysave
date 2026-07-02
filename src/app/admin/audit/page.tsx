import { requireAdmin } from "@/lib/admin";
import { fetchAll } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "审计日志 | 省钱兔 Admin", robots: { index: false } };

type Row = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: string | null;
  after: string | null;
  created_at: number;
};

function fmt(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
  approve: "bg-emerald-50 text-emerald-700",
  reject: "bg-amber-50 text-amber-700",
};

const ACTION_LABEL: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  approve: "通过",
  reject: "拒绝",
};

export default async function AdminAuditPage() {
  await requireAdmin();
  const rows = await fetchAll<Row>(
    "SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id, a.before, a.after, a.created_at::BIGINT AS created_at, u.email AS actor_email " +
      "FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id " +
      "ORDER BY a.created_at DESC LIMIT 200",
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">审计日志</h1>
        <p className="text-sm text-gray-500">最近 200 条管理操作记录</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["时间", "操作人", "动作", "对象", "变更摘要"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-sm text-gray-400">
                  暂无记录
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">{fmt(r.created_at)}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-700">{r.actor_email ?? r.actor_id ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (ACTION_COLOR[r.action] ?? "bg-gray-100 text-gray-700")
                      }
                    >
                      {ACTION_LABEL[r.action] ?? r.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {r.entity_type} · <span className="font-mono text-gray-400">{r.entity_id?.slice(0, 12)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {summarize(r)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function summarize(r: Row): string {
  try {
    if (r.after) {
      const obj = JSON.parse(r.after) as { title?: string; name?: string; status?: string };
      if (obj.title) return `→ ${obj.title.slice(0, 40)}`;
      if (obj.name) return `→ ${obj.name}`;
      if (obj.status) return `→ status=${obj.status}`;
    }
  } catch {
    // ignore
  }
  return r.entity_id?.slice(0, 20) ?? "";
}
