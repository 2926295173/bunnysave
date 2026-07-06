import Link from "next/link";

const ARTICLES: Array<{ title: string; excerpt: string; href: string }> = [
  {
    title: "一年中什么时候买什么最便宜：逐月购物日历",
    excerpt:
      "价格波动其实有章可循。这份逐月购物日历告诉你电子产品、家具、服装、家电等品类的最佳购买时机，让你提前规划、告别追着促销跑。",
    href: "/articles/best-time-to-buy-calendar",
  },
  {
    title: "5 个每周都能帮你省钱的聪明购物习惯",
    excerpt:
      "一些简单又实用的购物习惯，帮你识别真正的优惠、避开营销陷阱，在日常消费中留住更多的钱。",
    href: "/articles/smart-shopping-habits",
  },
];

export function ShoppingGuide() {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
            购物指南
          </h2>
        </div>
        <ul className="space-y-3">
          {ARTICLES.map((a) => (
            <li key={a.href}>
              <Link className="group block" href={a.href}>
                <span className="block text-sm font-semibold leading-snug text-gray-800 transition-colors group-hover:text-[#F97316]">
                  {a.title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-400 line-clamp-1">
                  {a.excerpt}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
