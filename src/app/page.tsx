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
  const ordered = sort === "popular"
    ? [...deals].sort((a, b) => a.title.localeCompare(b.title)).reverse()
    : deals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="space-y-4">
              {ordered.map((d, i) => (
                <DealCard key={d.id} deal={d} index={i} priority={i < 4} />
              ))}
            </div>
            <div className="py-8 flex justify-center" aria-hidden="true">
              <div className="h-10" />
            </div>
          </div>
        </div>
        <Sidebar latestDeals={deals} brands={brands} showFollowUs />
      </div>
    </div>
  );
}
