"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { localImageFor } from "@/lib/image-path";
import { IconPlus, IconExternal } from "@/components/admin/AdminIcons";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  BatchToolbar,
  useBatchSelection,
  type BatchCategory,
} from "@/components/admin/DealBatchActions";

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

type Category = { slug: string; label: string };

function fmtDate(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AdminDealsClient({
  rows,
  categories,
  q,
}: {
  rows: Row[];
  categories: Category[];
  q: string;
}) {
  const router = useRouter();
  const { selected, toggle, setMany, clear } = useBatchSelection();
  const [searchInput, setSearchInput] = useState(q);

  const cats: BatchCategory[] = useMemo(
    () => categories.map((c) => ({ slug: c.slug, label: c.label })),
    [categories],
  );

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (searchInput) params.set("q", searchInput);
          router.push(`/admin/deals${params.toString() ? `?${params}` : ""}`);
        }}
        className="flex gap-2"
      >
        <input
          name="q"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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

      {selected.size > 0 ? (
        <BatchToolbar
          selectedIds={Array.from(selected)}
          onClear={clear}
          categories={cats}
        />
      ) : null}

      <AdminTable
        selectable
        selected={selected}
        onToggleRow={toggle}
        onToggleAll={(on) => setMany(rows.map((r) => r.id), on)}
        columns={[
          { key: "cover", label: "", width: "w-16" },
          { key: "title", label: "标题", link: true },
          { key: "brand", label: "商家", width: "w-32" },
          { key: "source", label: "来源", width: "w-32" },
          { key: "flags", label: "标签", width: "w-32" },
          { key: "heat", label: "热度", width: "w-20", align: "right" },
          { key: "date", label: "日期", width: "w-20" },
          { key: "actions", label: "", width: "w-16", align: "right" },
        ]}
        rows={rows.map((r) => ({
          key: r.id,
          cells: [
            // cover
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key="cover"
              src={localImageFor(r.cover, "deals")}
              alt=""
              className="h-10 w-10 rounded-lg border border-gray-100 object-contain"
            />,
            // title (link=true wraps in <Link>)
            <span key="title" className="line-clamp-2 text-sm font-medium">
              {r.title}
            </span>,
            r.brand_name ?? "—",
            <span key="source" className="text-xs text-gray-500">{r.source}</span>,
            <div key="flags" className="flex flex-wrap gap-1">
              {r.is_free ? <Pill color="emerald">免费</Pill> : null}
              {r.is_hot ? <Pill color="orange">热门</Pill> : null}
            </div>,
            <span key="heat" className="font-mono text-gray-700">{r.heat}</span>,
            <span key="date" className="text-xs text-gray-500">{fmtDate(r.published_at)}</span>,
            // last cell — "编辑" link
            <span key="actions" className="text-xs font-medium text-[#F97316]">
              编辑 <IconExternal className="ml-0.5 inline h-3 w-3" />
            </span>,
          ],
          href: `/admin/deals/${r.id}`,
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
