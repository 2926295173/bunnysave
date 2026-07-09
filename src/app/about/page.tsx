import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于我们 | 省钱兔",
  description: "了解省钱兔的使命与团队 — 每天为您精选最有价值的优惠、折扣和省钱机会。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-[#f9fafb]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1
          className="text-[24px] font-bold leading-[32px] text-gray-900"
          style={{ marginBottom: "32px" }}
        >
          关于我们
        </h1>

        <section style={{ marginBottom: "32px" }}>
          <h2
            className="text-[18px] font-semibold leading-[28px] text-gray-900"
            style={{ marginBottom: "12px" }}
          >
            我们的使命
          </h2>
          <p
            className="text-[16px] leading-[26px] text-gray-600"
          >
            省钱兔致力于帮助消费者发现最好的优惠、折扣和省钱机会。我们的团队每天搜索互联网，为您精选最有价值的交易，让您在购物时省更多。
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2
            className="text-[18px] font-semibold leading-[28px] text-gray-900"
            style={{ marginBottom: "12px" }}
          >
            我们做什么
          </h2>
          <p className="text-[16px] leading-[26px] text-gray-600">
            我们收集并验证来自各大商家和品牌的优惠信息，包括折扣码、限时特价、返现优惠等。我们的目标是成为您购物前的第一站，帮您做出更明智的购买决策。
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2
            className="text-[18px] font-semibold leading-[28px] text-gray-900"
            style={{ marginBottom: "12px" }}
          >
            如何联系我们
          </h2>
          <p className="text-[16px] leading-[26px] text-gray-600">
            如果您有任何问题、建议或合作意向，欢迎通过我们的
            <a
              href="/contact"
              className="ml-1 font-medium text-[#f97316] hover:underline"
            >
              联系页面
            </a>
            与我们取得联系。我们非常重视您的反馈！
          </p>
        </section>
      </div>
    </div>
  );
}