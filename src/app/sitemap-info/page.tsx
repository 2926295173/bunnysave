import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { getDeals } from "@/lib/deals";

export const metadata: Metadata = {
  title: "站点地图",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function SitemapInfoPage() {
  const deals = await getDeals();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">站点地图</h1>
      <p className="mt-4 text-bunny-muted">以下是我们网站的主要页面，搜索引擎可以直接访问 <code className="rounded bg-bunny-soft px-1">/sitemap.xml</code> 获取完整列表。</p>

      <h2 className="mt-8 text-xl font-bold text-bunny-ink">分类</h2>
      <ul className="mt-3 list-disc pl-6 text-bunny-ink">
        <li><Link href="/category/daily-deals" className="hover:text-bunny-accent">每日精选</Link></li>
        <li><Link href="/category/freebies" className="hover:text-bunny-accent">免费薅羊毛</Link></li>
        <li><Link href="/category/coupons" className="hover:text-bunny-accent">折扣码</Link></li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-bunny-ink">优惠详情</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {deals.map((d) => (
          <li key={d.id}>
            <Link href={`/deal/${d.id}`} className="line-clamp-1 text-sm hover:text-bunny-accent">
              {d.title}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-bold text-bunny-ink">关于</h2>
      <ul className="mt-3 list-disc pl-6 text-bunny-ink">
        <li><Link href="/legal/affiliate-disclosure" className="hover:text-bunny-accent">联盟披露</Link></li>
        <li><Link href="/legal/privacy" className="hover:text-bunny-accent">隐私政策</Link></li>
        <li><Link href="/legal/terms" className="hover:text-bunny-accent">服务条款</Link></li>
      </ul>

      <p className="mt-10 text-xs text-bunny-muted">© {new Date().getFullYear()} {SITE.tagline}</p>
    </div>
  );
}
