"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Deal, Brand } from "@/lib/types";
import { localImageFor } from "@/lib/image-path";

type Props = {
  latestDeals: Deal[];
  brands: Brand[];
  showFollowUs?: boolean;
};

export function Sidebar({ latestDeals, brands, showFollowUs = false }: Props) {
  const top5 = latestDeals.slice(0, 5);
  const topBrands = brands.slice(0, 6);

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
      <NewsletterWidget />
      <LatestDealsWidget deals={top5} />
      {showFollowUs ? <FollowUsWidget /> : null}
      {showFollowUs ? null : <TopBrandsWidget brands={topBrands} />}
    </aside>
  );
}

function WidgetShell({
  icon,
  title,
  right,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"bg-white rounded-2xl overflow-hidden card-shadow " + className}>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-white gradient-brand">{icon}</div>
            <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
          </div>
          {right}
        </div>
      </div>
      {children}
    </div>
  );
}

function NewsletterWidget() {
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft)) {
      setState("err");
      setMsg("请输入有效邮箱");
      return;
    }
    setState("loading");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: draft }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "订阅失败");
      setDraft("");
      setState("ok");
      setMsg("订阅成功，明天就能收到第一封精选");
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "订阅失败");
    }
  }

  return (
    <WidgetShell
      icon={<MailIcon className="h-4 w-4" />}
      title="每日优惠提醒"
    >
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          每天早上将最好的优惠发送到您的邮箱。
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="输入邮箱地址"
            aria-label="邮箱地址"
            className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all duration-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 gradient-brand"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>{state === "loading" ? "订阅中…" : "免费订阅"}</span>
          </button>
        </form>
        {msg ? (
          <p
            role={state === "err" ? "alert" : "status"}
            className={
              "mt-3 text-xs text-center " +
              (state === "err" ? "text-red-600" : "text-emerald-600")
            }
          >
            {msg}
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-400 text-center">
            加入 10,000+ 省钱达人。绝无垃圾邮件。
          </p>
        )}
      </div>
    </WidgetShell>
  );
}

function LatestDealsWidget({ deals }: { deals: Deal[] }) {
  return (
    <WidgetShell icon={<FlameIcon className="h-4 w-4" />} title="最新优惠">
      <div className="divide-y divide-gray-50">
        {deals.map((d) => (
          <Link
            key={d.id}
            href={`/deal/${d.id}`}
            className="group flex gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="relative w-14 h-14 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
              <Image
                src={localImageFor(d.cover, "deals")}
                alt={d.title}
                fill
                sizes="56px"
                className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-700 line-clamp-2 leading-snug group-hover:text-gray-900 transition-colors">
                {d.title}
              </h3>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-sm font-bold gradient-brand-text">{extractPrice(d)}</span>
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block">{d.source}</span>
            </div>
          </Link>
        ))}
      </div>
    </WidgetShell>
  );
}

function TopBrandsWidget({ brands }: { brands: Brand[] }) {
  return (
    <WidgetShell
      icon={<StoreIcon className="h-4 w-4" />}
      title="热门商家"
      right={
        <span className="flex items-center gap-1 text-xs font-medium gradient-brand-text">
          <TrendingUpIcon className="h-3 w-3" />
          <span>实时</span>
        </span>
      }
    >
      <div className="divide-y divide-gray-50">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/search?q=${encodeURIComponent(b.name)}`}
            className="group flex items-center gap-3 px-5 py-3.5 transition-all duration-200 hover:bg-gray-50"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src={localImageFor(b.logo, "brands")}
                alt={b.name}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                {b.name}
              </h3>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
      <div className="px-5 py-3.5 border-t border-gray-100">
        <Link href="/stores" className="text-sm font-medium inline-flex items-center gap-1 hover:opacity-80 gradient-brand-text">
          查看全部商家 →
        </Link>
      </div>
    </WidgetShell>
  );
}

function extractPrice(deal: Deal): string {
  const m = deal.title.match(/\$[\d.]+/);
  return m ? m[0] : "查看详情";
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function SparklesIcon({ className }: { className?: string }) {
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
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
function StoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function FollowUsWidget() {
  return (
    <WidgetShell
      icon={<UsersIcon className="h-4 w-4" />}
      title="关注我们"
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <a
            className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 transition-all duration-200 hover:bg-black hover:text-white"
            href="https://x.com/DealSelected"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            <span className="text-xs font-medium text-gray-600 group-hover:text-inherit transition-colors">
              X (Twitter)
            </span>
          </a>
          <a
            className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 transition-all duration-200 hover:bg-[#1877F2] hover:text-white"
            href="https://www.facebook.com/people/Deal-Selected/61585141210415/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            <span className="text-xs font-medium text-gray-600 group-hover:text-inherit transition-colors">
              Facebook
            </span>
          </a>
        </div>
      </div>
    </WidgetShell>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
