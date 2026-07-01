import type { Metadata } from "next";

export const metadata: Metadata = { title: "服务条款" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">服务条款</h1>
      <p className="mt-4 text-bunny-muted">
        本站信息仅供参考。我们尽力保证信息准确，但不保证商家页面或优惠内容的实时有效性。
        请以商家页面为准。
      </p>
      <h2 className="mt-8 text-xl font-bold text-bunny-ink">责任限制</h2>
      <p className="mt-2 text-bunny-muted">
        因商家调整、库存售罄、地区限制等不可控因素导致优惠失效，本站不承担相应责任。
      </p>
    </div>
  );
}
