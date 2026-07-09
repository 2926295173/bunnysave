import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "联系我们 | 省钱兔",
  description: "有问题或建议？我们很乐意听取您的意见。联系省钱兔团队，反馈、合作或分享优惠。",
  alternates: {
    canonical: "/contact",
  },
};

function MailIcon({ className }: { className?: string }) {
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
      className={className}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div className="bg-[#f9fafb]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1
          className="text-[24px] font-bold leading-[32px] text-gray-900"
          style={{ marginBottom: "8px" }}
        >
          联系我们
        </h1>
        <p
          className="text-[16px] leading-[24px] text-gray-500"
          style={{ marginBottom: "32px" }}
        >
          有问题或建议？我们很乐意听取您的意见。
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2 className="text-[16px] font-semibold leading-[24px] text-gray-900">
            发送邮件
          </h2>
          <p
            className="text-[14px] leading-[20px] text-gray-600"
            style={{ marginTop: "8px", marginBottom: "12px" }}
          >
            对于一般咨询、合作或反馈：
          </p>
          <a
            href={`mailto:${SITE.emailContact}`}
            className="inline-block text-[16px] font-medium text-[#f97316] hover:underline"
          >
            {SITE.emailContact}
          </a>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 className="text-[16px] font-semibold leading-[24px] text-gray-900">
            商务合作
          </h2>
          <p
            className="text-[14px] leading-[20px] text-gray-600"
            style={{ marginTop: "8px", marginBottom: "12px" }}
          >
            如果您是品牌或商家，想要与我们合作推广优惠：
          </p>
          <a
            href={`mailto:${SITE.emailBusiness}`}
            className="inline-block text-[16px] font-medium text-[#f97316] hover:underline"
          >
            {SITE.emailBusiness}
          </a>
        </section>

        <section>
          <h2
            className="text-[16px] font-semibold leading-[24px] text-gray-900"
            style={{ marginBottom: "8px" }}
          >
            提交优惠
          </h2>
          <p className="text-[14px] leading-[20px] text-gray-600">
            发现了好优惠想要分享？
            <a
              href="/submit"
              className="ml-1 font-medium text-[#f97316] hover:underline"
            >
              点击这里提交
            </a>
          </p>
        </section>

        <p
          className="text-[14px] leading-[20px] text-gray-400"
          style={{ marginTop: "24px" }}
        >
          我们通常会在 1-2 个工作日内回复您的邮件。
        </p>
      </div>
    </div>
  );
}