"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function Footer() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const email = session?.user?.email ?? null;
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-sm text-gray-600">
          <Link href="/stores" className="hover:text-[#F97316]">商家</Link>
          <span className="text-gray-300">·</span>
          <Link href="/stores" className="hover:text-[#F97316]">品牌</Link>
          <span className="text-gray-300">·</span>
          <Link href="/category/daily-deals/coupons" className="hover:text-[#F97316]">优惠券</Link>
          <span className="text-gray-300">·</span>
          <Link href="/about" className="hover:text-[#F97316]">关于</Link>
          <span className="text-gray-300">·</span>
          <Link href="/contact" className="hover:text-[#F97316]">联系</Link>
          <span className="text-gray-300">·</span>
          <Link href="/legal/privacy" className="hover:text-[#F97316]">隐私</Link>
          <span className="text-gray-300">·</span>
          <Link href="/legal/terms" className="hover:text-[#F97316]">条款</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-extrabold text-gray-800">
            {SITE.name}
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500">{SITE.description}</p>
          <p className="mt-4 text-xs text-gray-400 leading-relaxed">
            <strong className="font-semibold text-gray-500">声明：</strong>
            本网站部分信用卡及产品链接可能会为我们带来联盟佣金或推荐奖励。作为亚马逊合作伙伴，我们从符合条件的购买中获得收入。此类报酬可能会影响产品在本网站上的展示方式和位置。本网站不包含所有信用卡发行商或所有可用的信用卡优惠。
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800">浏览</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-[#F97316]">最新优惠</Link>
            </li>
            <li>
              <Link href="/category/freebies" className="hover:text-[#F97316]">免费薅羊毛</Link>
            </li>
            <li>
              <Link href="/category/daily-deals" className="hover:text-[#F97316]">每日精选</Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-[#F97316]">搜索</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800">账户</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            {email ? (
              <>
                <li>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    已登录 · {email}
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={async () => {
                      setPending(true);
                      await signOut({ callbackUrl: "/" });
                    }}
                    className="hover:text-[#F97316] disabled:opacity-50"
                  >
                    {pending ? "退出中…" : "退出登录"}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-[#F97316]">
                    登录
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-[#F97316]">
                    注册
                  </Link>
                </li>
              </>
            )}
          </ul>

          <p className="mt-6 text-sm font-semibold text-gray-800">关注我们</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>
              <a
                href={SITE.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F97316]"
              >
                X (Twitter)
              </a>
            </li>
            <li>
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F97316]"
              >
                Facebook
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-[#F97316]">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. 保留所有权利。</p>
          <p>
            <Link href="/legal/affiliate-disclosure" className="hover:text-[#F97316]">
              联盟披露
            </Link>
            <span className="mx-2">·</span>
            <Link href="/legal/privacy" className="hover:text-[#F97316]">
              隐私
            </Link>
            <span className="mx-2">·</span>
            <Link href="/legal/terms" className="hover:text-[#F97316]">
              条款
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}