import { getDeals, getBrands } from "@/lib/deals";
import { DealCard } from "@/components/DealCard";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const sort = tab === "popular" ? "popular" : "latest";

  const [deals, brands] = await Promise.all([getDeals(), getBrands()]);
  const ordered =
    sort === "popular"
      ? [...deals].sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0))
      : deals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {/* Hero */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-bunny-ink tracking-tight">
              今日精选优惠、折扣与优惠券
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-500 leading-relaxed">
              每日人工精选北美最值得买的折扣、优惠码和促销活动，实时更新，不错过任何省钱机会。
            </p>
          </header>

          <div className="space-y-4">
            {ordered.map((d, i) => (
              <DealCard key={d.id} deal={d} index={i} priority={i < 4} />
            ))}
          </div>
        </div>
        <Sidebar latestDeals={deals} brands={brands} showFollowUs />
      </div>
    </div>
  );
}