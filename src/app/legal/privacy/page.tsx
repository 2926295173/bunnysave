import type { Metadata } from "next";

export const metadata: Metadata = { title: "隐私政策" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-bunny-ink">隐私政策</h1>
      <p className="mt-4 text-bunny-muted">
        我们仅收集提供服务所必需的最少信息。订阅邮件时仅保存您的邮箱地址，用于发送每日精选。
        您可以随时通过邮件中的退订链接取消订阅。
      </p>
      <h2 className="mt-8 text-xl font-bold text-bunny-ink">Cookie</h2>
      <p className="mt-2 text-bunny-muted">
        本站使用 Google Analytics（GA4）统计访问情况。Analytics 数据匿名化处理，您可以
        通过浏览器插件或系统设置阻止追踪。
      </p>
    </div>
  );
}
