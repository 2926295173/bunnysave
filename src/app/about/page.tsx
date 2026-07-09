import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于我们 | 省钱兔",
  description: "了解省钱兔的使命与团队 — 每天为您精选最有价值的优惠、折扣和省钱机会。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Breadcrumb band — match the styling used on /articles/[slug]. */}
      <div className="border-b border-gray-200 bg-white py-3">
        <div className="mx-auto max-w-3xl px-4">
          <nav aria-label="面包屑">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#F97316] transition-colors whitespace-nowrap"
                >
                  首页
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight />
                <span className="text-gray-900">关于我们</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">关于我们</h1>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-bunny-ink">我们的使命</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            省钱兔致力于帮助消费者发现最好的优惠、折扣和省钱机会。我们的团队每天搜索互联网，为您精选最有价值的交易，让您在购物时省更多。
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-bunny-ink">我们做什么</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            我们收集并验证来自各大商家和品牌的优惠信息，包括折扣码、限时特价、返现优惠等。我们的目标是成为您购物前的第一站，帮您做出更明智的购买决策。
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-bunny-ink">如何联系我们</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            如果您有任何问题、建议或合作意向，欢迎通过我们的
            <Link href="/contact" className="ml-1 font-medium text-[#F97316] hover:underline">
              联系页面
            </Link>
            与我们取得联系。我们非常重视您的反馈！
          </p>
        </section>
      </div>
    </>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}