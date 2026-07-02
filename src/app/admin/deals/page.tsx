import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin";
import { fetchAll } from "@/lib/db";
import { localImageFor } from "@/lib/image-path";
import { IconPlus, IconExternal } from "@/components/admin/AdminIcons";
import { AdminTable } from "@/components/admin/AdminTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "优惠管理 | 省钱兔 Admin", robots: { index: false } };

type Row = {
  id: string;
  title: string;
  cover: string;
  brand_name: string | null;
  source: string;
  is_free: boolean;
  is_hot: boolean;
  heat: number;
  published_at: number;
};

async function loadRows(q: string | undefined): Promise<Row[]> {
  const sql =
    "SELECT d.id, d.title, d.cover, d.is_free, d.is_hot, d.heat, d.published_at::BIGINT AS published_at, d.source, b.name AS brand_name " +
    "FROM deals d LEFT JOIN brands b ON b.id = d.brand_id " +
    (q ? "WHERE d.title ILIKE $1 OR b.name ILIKE $1 " : "") +
    "ORDER BY d.published_at DESC LIMIT 200";
  return q
    ? fetchAll<Row>(sql, [`%${q}%`])
    : fetchAll<Row>(sql);
}

function fmtDate(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const rows = await loadRows(q);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">优惠</h1>
          <p className="text-sm text-gray-500">共 {rows.length} 条{rows.length === 200 ? "（上限 200）" : ""}</p>
        </div>
        <Link
          href="/admin/deals/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
        >
          <IconPlus className="h-4 w-4" />
          新建优惠
        </Link>
      </header>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="按标题或商家名搜索…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
        />
        <button
          type="submit"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          搜索
        </button>
        {q ? (
          <Link
            href="/admin/deals"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            清除
          </Link>
        ) : null}
      </form>

      <AdminTable
        columns={[
          { key: "cover", label: "", width: "w-16" },
          { key: "title", label: "标题" },
          { key: "brand", label: "商家", width: "w-32" },
          { key: "source", label: "来源", width: "w-32" },
          { key: "flags", label: "标签", width: "w-32" },
          { key: "heat", label: "热度", width: "w-16 text-right" },
          { key: "date", label: "日期", width: "w-20" },
          { key: "actions", label: "", width: "w-20" },
        ]}
        rows={rows.map((r) => ({
          key: r.id,
          href: `/admin/deals/${r.id}`,
          cells: (
            <>
              <td className="px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localImageFor(r.cover, "deals")}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-gray-100 object-contain"
                />
              </td>
              <td className="px-3 py-2.5">
                <span className="line-clamp-2 text-sm font-medium text-gray-800">{r.title}</span>
              </td>
              <td className="px-3 py-2.5 text-sm text-gray-600">{r.brand_name ?? "—"}</td>
              <td className="px-3 py-2.5 text-xs text-gray-500">{r.source}</td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {r.is_free ? <Pill color="emerald">免费</Pill> : null}
                  {r.is_hot ? <Pill color="orange">热门</Pill> : null}
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-sm font-mono text-gray-700">{r.heat}</td>
              <td className="px-3 py-2.5 text-xs text-gray-500">{fmtDate(r.published_at)}</td>
              <td className="px-3 py-2.5 text-right">
                <Link
                  href={`/admin/deals/${r.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#F97316] hover:underline"
                >
                  编辑 <IconExternal className="h-3 w-3" />
                </Link>
              </td>
            </>
          ),
        }))}
      />
    </div>
  );
}

function Pill({ color, children }: { color: "emerald" | "orange"; children: React.ReactNode }) {
  const cls =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-orange-50 text-[#F97316]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
