import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchAll } from "@/lib/db";
import { localImageFor } from "@/lib/image-path";
import { IconPlus } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";
export const metadata = { title: "商家管理 | 省钱兔 Admin", robots: { index: false } };

type Row = { id: string; name: string; logo: string; deal_count: number };

export default async function AdminBrandsPage() {
  await requireAdmin();
  const rows = await fetchAll<Row>(
    "SELECT id, name, logo, deal_count FROM brands ORDER BY sort_order ASC, name ASC",
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">商家</h1>
          <p className="text-sm text-gray-500">共 {rows.length} 个</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          <IconPlus className="h-4 w-4" />
          新建商家
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/admin/brands/${b.id}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localImageFor(b.logo, "brands")} alt={b.name} className="h-12 w-12 object-contain" />
            </div>
            <p className="line-clamp-1 text-sm font-medium text-gray-800 group-hover:text-[#F97316]">{b.name}</p>
            <p className="text-xs text-gray-400">{b.deal_count ?? 0} 优惠</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
