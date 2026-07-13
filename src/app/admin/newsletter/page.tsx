import { requireAdmin } from "@/lib/admin";
import { fetchAll, fetchOne } from "@/lib/db";
import { AdminTable } from "@/components/admin/AdminTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "邮件订阅 | 省钱兔 Admin", robots: { index: false } };

type Row = {
  email: string;
  source: string | null;
  ip: string | null;
  created_at: number;
  unsubscribed_at: number | null;
};

type Counts = { total: number; active: number; unsubscribed: number; today: number };

function fmt(epoch: number | null): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "all" | "active" | "unsubscribed" }>;
}) {
  await requireAdmin();
  const { filter = "active" } = await searchParams;

  const dayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const [counts, rows] = await Promise.all([
    fetchOne<Counts>(
      `SELECT
         COUNT(*)::INT AS total,
         COUNT(*) FILTER (WHERE unsubscribed_at IS NULL)::INT AS active,
         COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::INT AS unsubscribed,
         COUNT(*) FILTER (WHERE created_at >= $1 AND unsubscribed_at IS NULL)::INT AS today
       FROM newsletter_subscribers`,
      [dayStart],
    ),
    fetchAll<Row>(
      filter === "all"
        ? `SELECT email, source, ip,
                  created_at::BIGINT AS created_at,
                  unsubscribed_at::BIGINT AS unsubscribed_at
             FROM newsletter_subscribers
            ORDER BY created_at DESC LIMIT 500`
        : filter === "unsubscribed"
          ? `SELECT email, source, ip,
                    created_at::BIGINT AS created_at,
                    unsubscribed_at::BIGINT AS unsubscribed_at
               FROM newsletter_subscribers
              WHERE unsubscribed_at IS NOT NULL
              ORDER BY unsubscribed_at DESC LIMIT 500`
          : `SELECT email, source, ip,
                    created_at::BIGINT AS created_at,
                    unsubscribed_at::BIGINT AS unsubscribed_at
               FROM newsletter_subscribers
              WHERE unsubscribed_at IS NULL
              ORDER BY created_at DESC LIMIT 500`,
      [],
    ),
  ]);

  const c: Counts = counts ?? { total: 0, active: 0, unsubscribed: 0, today: 0 };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">邮件订阅</h1>
        <p className="mt-1 text-sm text-gray-500">通过页脚订阅表单收集的邮箱列表。</p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="总订阅" value={c.total} />
        <Stat label="活跃" value={c.active} accent="green" />
        <Stat label="今日新增" value={c.today} accent="orange" />
        <Stat label="已退订" value={c.unsubscribed} accent="gray" />
      </section>

      <div className="flex flex-wrap gap-2">
        {(["active", "all", "unsubscribed"] as const).map((f) => (
          <a
            key={f}
            href={`/admin/newsletter?filter=${f}`}
            className={
              "rounded-full px-3 py-1 text-sm font-medium transition " +
              (f === filter
                ? "bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
            }
          >
            {f === "active" ? "活跃" : f === "all" ? "全部" : "已退订"}
          </a>
        ))}
        <a
          href="/api/admin/newsletter/export"
          className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          导出 CSV
        </a>
      </div>

      <AdminTable
        columns={[
          { key: "email", label: "邮箱" },
          { key: "source", label: "来源" },
          { key: "ip", label: "IP" },
          { key: "created_at", label: "订阅时间" },
          { key: "status", label: "状态" },
        ]}
        rows={rows.map((r) => ({
          key: r.email,
          cells: [
            <span key="e" className="font-medium text-gray-900">{r.email}</span>,
            r.source ? (
              <span key="s" className="line-clamp-1 max-w-xs text-gray-500">{r.source}</span>
            ) : (
              <span key="s" className="text-gray-300">—</span>
            ),
            <span key="i" className="font-mono text-xs text-gray-500">{r.ip ?? "—"}</span>,
            <span key="c" className="text-gray-600">{fmt(r.created_at)}</span>,
            r.unsubscribed_at ? (
              <span
                key="st"
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
              >
                已退订 {fmt(r.unsubscribed_at)}
              </span>
            ) : (
              <span
                key="st"
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
              >
                活跃
              </span>
            ),
          ],
        }))}
        emptyText="暂无订阅者"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: number;
  accent?: "blue" | "green" | "orange" | "gray";
}) {
  const colors = {
    blue: "from-blue-50 to-blue-100/40 text-blue-600",
    green: "from-emerald-50 to-emerald-100/40 text-emerald-600",
    orange: "from-orange-50 to-orange-100/40 text-[#F97316]",
    gray: "from-gray-50 to-gray-100/40 text-gray-500",
  } as const;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <div className={`mt-2 h-1 w-12 rounded-full bg-gradient-to-r ${colors[accent]}`} />
    </div>
  );
}