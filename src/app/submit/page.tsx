import type { Metadata } from "next";
import { SubmitForm } from "@/components/submit/SubmitForm";

export const metadata: Metadata = {
  title: "分享优惠 | 省钱兔",
  description: "把你发现的好价分享给 10,000+ 省钱达人。审核通过后立刻上线。",
  robots: { index: true, follow: true },
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-bunny-soft px-4 py-1 text-xs font-medium text-[#F97316]">
          <SparkIcon className="h-3.5 w-3.5" />
          编辑精选
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">
          分享优惠
        </h1>
        <p className="mt-3 text-bunny-muted">
          把你发现的好价分享给 10,000+ 省钱达人。审核通过后立刻上线。
        </p>
      </header>

      <SubmitForm />

      <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-800">提交须知</h2>
        <ul className="mt-3 space-y-2 text-sm text-bunny-muted">
          <li>· 标题与优惠摘要会由编辑润色，请尽量提供原文链接与有效期。</li>
          <li>· 图片 URL 必须是 HTTPS 公网可访问，且宽高比约 16:10。</li>
          <li>· 同一优惠在不同门店的版本请合并后提交，避免重复。</li>
          <li>· 加急 / 推广发布需走商务合作，请发邮件至 contact@bunnysave.local。</li>
        </ul>
      </section>
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}
