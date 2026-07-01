import { Suspense } from "react";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { getDeals } from "@/lib/deals";

export const metadata = { title: "我的收藏", robots: { index: false } };

export default async function FavoritesPage() {
  // Until we wire real favorites to the user, surface a CTA.
  const deals = await getDeals();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-gray-100" />}>
        <AccountPanel />
      </Suspense>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">收藏功能即将上线，先浏览一些优惠：</p>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {deals.slice(0, 4).map((d) => (
            <li key={d.id}>
              <Link
                href={`/deal/${d.id}`}
                className="block truncate rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
