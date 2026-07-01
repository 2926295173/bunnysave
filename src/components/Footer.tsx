"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function Footer() {
  const { data: session } = useSession();
  const [pending, setPending] = useState(false);
  const email = session?.user?.email ?? null;
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-extrabold text-gray-800">
            {SITE.name} · {SITE.tagline}
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500">{SITE.description}</p>
          <p className="mt-4 text-xs text-gray-400">
            部分链接为商家联盟链接，结算时我们可能获得佣金 —— 这不会增加你的购买成本。
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
              <li>
                <Link href="/login" className="hover:text-[#F97316]">
                  登录
                </Link>
              </li>
            )}
            {!email && (
              <li>
                <Link href="/signup" className="hover:text-[#F97316]">
                  注册
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800">关注我们</p>
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
          <p>© {new Date().getFullYear()} {SITE.tagline}. 保留所有权利。</p>
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
