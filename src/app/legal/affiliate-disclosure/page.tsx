import type { Metadata } from "next";

export const metadata: Metadata = { title: "联盟披露" };

export default function AffiliateDisclosure() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">联盟披露 / Affiliate Disclosure</h1>
      <p className="mt-4 text-bunny-muted">
        本站部分链接为商家联盟推广链接。当您通过我们的链接跳转至商家并完成购买时，
        商家可能向我们支付佣金。这一举措<strong className="text-bunny-ink">不会</strong>增加您的任何购买成本，
        也不会影响我们对优惠的客观筛选。
      </p>
      <h2 className="mt-8 text-xl font-bold text-bunny-ink">编辑独立性</h2>
      <p className="mt-2 text-bunny-muted">
        我们以用户价值为唯一筛选标准。联盟关系不影响编辑判断，商家也无法通过付费获得优先展示。
      </p>
    </div>
  );
}
