import type { Metadata } from "next";
import Link from "next/link";
import { getDeals } from "@/lib/deals";
import { DealCard } from "@/components/DealCard";

export const metadata: Metadata = {
  title: "搜索优惠",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const deals = await getDeals();
  const results = term
    ? deals.filter((d) => d.title.toLowerCase().includes(term))
    : deals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <nav className="mb-4 text-sm text-bunny-muted" aria-label="面包屑">
        <Link href="/" className="hover:text-bunny-accent">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-bunny-ink">搜索</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink md:text-4xl">
          {term ? `搜索：${q}` : "全部优惠"}
        </h1>
        <p className="mt-2 text-bunny-muted">
          {term ? `匹配到 ${results.length} 条结果` : `共 ${results.length} 条优惠`}
        </p>
      </header>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bunny-line p-10 text-center text-bunny-muted">
          没有找到匹配 “{q}” 的优惠，试试其他关键词？
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((d) => (
            <DealCard key={d.id} deal={d} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
