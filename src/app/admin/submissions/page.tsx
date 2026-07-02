import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchAll } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "投稿审核 | 省钱兔 Admin", robots: { index: false } };

type Row = {
  id: string;
  title: string;
  url: string;
  submitter_email: string | null;
  status: "pending" | "approved" | "rejected" | "spam";
  created_at: number;
};

function fmt(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<Row["status"], string> = {
  pending: "待审",
  approved: "已通过",
  rejected: "已拒绝",
  spam: "垃圾",
};

const STATUS_COLOR: Record<Row["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  spam: "bg-gray-100 text-gray-500",
};

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Row["status"] }>;
}) {
  await requireAdmin();
  const { status = "pending" } = await searchParams;

  const rows = await fetchAll<Row>(
    "SELECT id, title, url, submitter_email, status, created_at::BIGINT AS created_at FROM deal_submissions WHERE status = $1 ORDER BY created_at DESC LIMIT 200",
    [status],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">投稿</h1>
        <p className="text-sm text-gray-500">用户通过 /submit 提交的优惠，等待审核</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "spam"] as Row["status"][]).map((s) => (
          <Link
            key={s}
            href={`/admin/submissions?status=${s}`}
            className={
              "rounded-full px-3 py-1 text-sm font-medium transition " +
              (s === status
                ? "bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
            }
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-3 py-12 text-center text-sm text-gray-400">暂无投稿</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/submissions/${r.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-800">{r.title}</p>
                    <p className="line-clamp-1 text-xs text-gray-400">
                      {r.submitter_email ?? "匿名"} · {fmt(r.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
