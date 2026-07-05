"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { SITE } from "@/lib/site";
import { SearchBar } from "./SearchBar";

type NavGroup = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: { label: string; href: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  { label: "免费", href: "/category/freebies", icon: <GiftIcon className="h-4 w-4" /> },
  {
    label: "每日优惠",
    href: "/category/daily-deals",
    icon: <ZapIcon className="h-4 w-4" />,
    children: [
      { label: "电子产品", href: "/category/daily-deals/electronics" },
      { label: "家居", href: "/category/daily-deals/household" },
      { label: "服饰", href: "/category/daily-deals/fashion" },
      { label: "美妆", href: "/category/daily-deals/beauty" },
      { label: "美食杂货", href: "/category/daily-deals/food-grocery" },
      { label: "旅行", href: "/category/daily-deals/travel" },
      { label: "优惠券", href: "/category/daily-deals/coupons" },
    ],
  },
  {
    label: "金融理财",
    href: "/category/financial",
    icon: <WalletIcon className="h-4 w-4" />,
    children: [
      { label: "信用卡", href: "/category/financial/credit-cards" },
      { label: "银行", href: "/category/financial/banks" },
    ],
  },
  {
    label: "其他",
    href: "/category/other",
    icon: <PackageIcon className="h-4 w-4" />,
    children: [{ label: "集体诉讼", href: "/category/other/class-action-settlement" }],
  },
];

export function Header() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-b border-gray-100" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flex h-20 items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0" aria-label={`${SITE.name} 首页`}>
            <Logo className="h-11 w-11" />
            <span className="text-lg font-extrabold tracking-tight text-gray-800">
              {SITE.name}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <SearchBar />
            <Link
              href="/submit"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 active:scale-[0.98] gradient-brand"
            >
              <PlusIcon className="h-4 w-4" />
              <span>分享优惠</span>
            </Link>
            <UserMenu session={session} status={status} />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="菜单"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100/80"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 pb-4 pt-1" aria-label="主导航">
          <div className="flex items-center p-1 rounded-full bg-gray-100">
            <button
              type="button"
              onClick={() => setTab("latest")}
              className={
                "relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 " +
                (tab === "latest" ? "text-white gradient-brand" : "text-gray-500 hover:text-gray-700")
              }
            >
              最新
            </button>
            <button
              type="button"
              onClick={() => setTab("popular")}
              className={
                "relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 " +
                (tab === "popular" ? "text-white gradient-brand" : "text-gray-500 hover:text-gray-700")
              }
            >
              热门
            </button>
          </div>
          <span className="w-px h-6 mx-2 bg-gray-200" aria-hidden="true" />
          {NAV_GROUPS.map((g) => (
            <NavGroupItem key={g.label} group={g} />
          ))}
        </nav>

        {mobileOpen ? (
          <div className="md:hidden pb-4">
            <MobileTabSwitcher tab={tab} setTab={setTab} />
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {NAV_GROUPS.map((g) => (
                <li key={g.label}>
                  <Link
                    href={g.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-700"
                  >
                    <span className="text-gray-500">{g.icon}</span>
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function UserMenu({
  session,
  status,
}: {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // Don't render until client knows auth state to avoid hydration mismatch
  if (status === "loading") {
    return <div className="hidden md:block h-10 w-10 rounded-full bg-gray-100 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        aria-label="登录"
        className="hidden md:flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white border border-gray-200/60 hover:border-gray-300 rounded-xl transition-all duration-200 shadow-sm"
      >
        <UserIcon className="h-4 w-4" />
        <span>登录</span>
      </Link>
    );
  }

  const initials = (session.user.name ?? session.user.email ?? "U").slice(0, 1).toUpperCase();
  const avatar = session.user.image;

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="账户菜单"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:ring-[#F97316]"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={session.user.name ?? ""} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭菜单"
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {session.user.name ?? "用户"}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                账户设置
              </Link>
              <Link
                href="/account/favorites"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                我的收藏
              </Link>
              {session.user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <span>后台管理</span>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    admin
                  </span>
                </Link>
              ) : null}
            </div>
            <div className="border-t border-gray-100 py-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  start(async () => {
                    await signOut({ callbackUrl: "/" });
                  });
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {pending ? "退出中…" : "退出登录"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NavGroupItem({ group }: { group: NavGroup }) {
  const hasChildren = !!group.children;
  return (
    <div className="relative group/nav">
      <Link
        href={group.href ?? "#"}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
      >
        <span className="text-gray-500">{group.icon}</span>
        <span>{group.label}</span>
        {hasChildren ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" /> : null}
      </Link>
      {hasChildren ? (
        <div className="absolute top-full left-0 pt-2 transition-all duration-200 opacity-0 invisible -translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0">
          <div className="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">分类</span>
            </div>
            {group.children!.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileTabSwitcher({
  tab,
  setTab,
}: {
  tab: "latest" | "popular";
  setTab: (t: "latest" | "popular") => void;
}) {
  return (
    <div className="flex items-center p-1 rounded-full bg-gray-100 w-fit">
      {(["latest", "popular"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={
            "px-4 py-1.5 text-sm font-semibold rounded-full " +
            (tab === t ? "text-white gradient-brand" : "text-gray-500")
          }
        >
          {t === "latest" ? "最新" : "热门"}
        </button>
      ))}
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bunnyLogo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bunnyLogo)" />
      <ellipse cx="20" cy="14" rx="5" ry="11" fill="#fff" opacity="0.95" />
      <ellipse cx="44" cy="14" rx="5" ry="11" fill="#fff" opacity="0.95" />
      <circle cx="25" cy="34" r="3" fill="#fff" />
      <circle cx="39" cy="34" r="3" fill="#fff" />
      <path d="M25 44 Q32 50 39 44" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
function ZapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}
