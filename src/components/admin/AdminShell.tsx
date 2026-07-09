"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconTag,
  IconStore,
  IconFolder,
  IconInbox,
  IconHistory,
  IconHome,
  IconBook,
} from "./AdminIcons";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const ITEMS: NavItem[] = [
  { href: "/admin", label: "仪表盘", icon: <IconDashboard className="h-4 w-4" /> },
  { href: "/admin/deals", label: "优惠", icon: <IconTag className="h-4 w-4" /> },
  { href: "/admin/brands", label: "商家", icon: <IconStore className="h-4 w-4" /> },
  { href: "/admin/categories", label: "分类", icon: <IconFolder className="h-4 w-4" /> },
  { href: "/admin/articles", label: "文章", icon: <IconBook className="h-4 w-4" /> },
  { href: "/admin/submissions", label: "投稿", icon: <IconInbox className="h-4 w-4" /> },
  { href: "/admin/audit", label: "审计日志", icon: <IconHistory className="h-4 w-4" /> },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#FAF9F7]">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] text-sm font-semibold text-white">
                  {email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{email}</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    管理员
                  </span>
                </div>
              </div>
            </div>

            <nav className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
              {ITEMS.map((it) => {
                const active =
                  it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors " +
                      (active
                        ? "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                    }
                  >
                    {it.icon}
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm transition hover:text-gray-800"
            >
              <IconHome className="h-4 w-4" />
              <span>返回前台</span>
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
