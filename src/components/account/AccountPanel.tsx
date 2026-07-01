"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function AccountPanel() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />;
  }
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center card-shadow">
        <h1 className="text-2xl font-extrabold text-gray-800">未登录</h1>
        <p className="mt-2 text-sm text-gray-500">登录后可查看账户信息、收藏的优惠等。</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          立即登录
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">账户</h1>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 card-shadow">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-xl font-semibold text-gray-600">
              {(session.user.name ?? session.user.email ?? "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-800 truncate">{session.user.name ?? "用户"}</p>
            <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 card-shadow">
        <h2 className="text-sm font-semibold text-gray-800">快速操作</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <Link href="/account/favorites" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
              我的收藏
            </Link>
          </li>
          <li>
            <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
              浏览最新优惠
            </Link>
          </li>
        </ul>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          退出登录
        </button>
      </section>
    </div>
  );
}
