import type { Metadata } from "next";
import Link from "next/link";
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

function HandshakeIcon({ className }: { className?: string }) {
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
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
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

export default function ContactPage() {
  return (
    <>
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
                <span className="text-gray-900">联系我们</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">联系我们</h1>
        <p className="mt-3 text-bunny-muted">有问题或建议？我们很乐意听取您的意见。</p>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-bunny-ink">发送邮件</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            对于一般咨询、合作或反馈：
          </p>
          <a
            href={`mailto:${SITE.emailContact}`}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-[#F97316] hover:text-[#F97316]"
          >
            <MailIcon className="h-4 w-4 text-gray-400" />
            {SITE.emailContact}
          </a>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-bunny-ink">商务合作</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            如果您是品牌或商家，想要与我们合作推广优惠：
          </p>
          <a
            href={`mailto:${SITE.emailBusiness}`}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-[#F97316] hover:text-[#F97316]"
          >
            <HandshakeIcon className="h-4 w-4 text-gray-400" />
            {SITE.emailBusiness}
          </a>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-bunny-ink">提交优惠</h2>
          <p className="mt-3 leading-relaxed text-bunny-muted">
            发现了好优惠想要分享？
            <Link href="/submit" className="ml-1 font-medium text-[#F97316] hover:underline">
              点击这里提交
            </Link>
          </p>
        </section>

        <p className="mt-12 text-sm text-gray-400">
          我们通常会在 1-2 个工作日内回复您的邮件。
        </p>
      </div>
    </>
  );
}