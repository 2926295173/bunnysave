import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountPanel } from "@/components/account/AccountPanel";
import { fetchAll } from "@/lib/db";
import { localImageFor } from "@/lib/image-path";

export const metadata = { title: "我的收藏", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  cover: string;
  brand_name: string | null;
  discount: string | null;
  price: string | null;
  is_free: boolean;
  is_hot: boolean;
  published_at: number;
  created_at: number;
};

function fmtDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/favorites");
  }
  const userId = session.user.id;
  const rows = await fetchAll<Row>(
    `SELECT d.id, d.title, d.cover, d.price, d.discount, d.is_free, d.is_hot,
            d.published_at::BIGINT AS published_at,
            f.created_at::BIGINT AS created_at,
            b.name AS brand_name
       FROM favorites f
       JOIN deals d ON d.id = f.deal_id
       LEFT JOIN brands b ON b.id = d.brand_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      LIMIT 100`,
    [userId],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-gray-100" />}>
        <AccountPanel />
      </Suspense>

      <header className="mt-8 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">我的收藏</h1>
        <span className="text-sm text-gray-500">共 {rows.length} 条</span>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-600">还没有收藏任何优惠。</p>
          <p className="mt-1 text-xs text-gray-400">在优惠详情页点击「收藏此优惠」即可保存到这里。</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((d) => (
            <li key={d.id}>
              <Link
                href={`/deal/${d.id}`}
                className="group flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localImageFor(d.cover, "deals")}
                  alt=""
                  className="h-20 w-20 flex-shrink-0 rounded-xl border border-gray-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#F97316]">
                    {d.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    {d.brand_name ? <span>{d.brand_name}</span> : null}
                    {d.brand_name ? <span>·</span> : null}
                    <span>收藏于 {fmtDate(d.created_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                    {d.price ? (
                      <span className="text-sm font-bold text-gray-900">{d.price}</span>
                    ) : null}
                    {d.discount ? (
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#F97316]">
                        {d.discount}
                      </span>
                    ) : null}
                    {d.is_free ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        免费
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}