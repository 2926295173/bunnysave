import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ensureArticlesSeeded, getArticlesAdmin } from "@/lib/articles";
import { IconPlus, IconEye } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";
export const metadata = { title: "文章管理 | 省钱兔 Admin", robots: { index: false } };

function fmt(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminArticlesPage() {
  await requireAdmin();
  await ensureArticlesSeeded();
  const rows = await getArticlesAdmin();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">文章</h1>
          <p className="text-sm text-gray-500">共 {rows.length} 篇</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          <IconPlus className="h-4 w-4" />
          新建文章
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["封面", "标题", "标签", "状态", "日期", ""].map((h, idx) => (
                <th
                  key={h}
                  className={
                    "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 " +
                    (idx === 5 ? "w-20" : "")
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-sm text-gray-400">
                  暂无文章
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.slug} className="transition hover:bg-gray-50/50">
                  <td className="px-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.cover}
                      alt=""
                      className="h-10 w-16 rounded-lg border border-gray-100 object-cover"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/articles/${a.slug}`}
                      className="block text-sm font-medium text-gray-800 hover:text-[#F97316]"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">/{a.slug}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                        >
                          {t}
                        </span>
                      ))}
                      {a.tags.length > 3 ? (
                        <span className="text-[10px] text-gray-400">+{a.tags.length - 3}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (a.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700")
                      }
                    >
                      {a.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{fmt(a.published_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/articles/${a.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#F97316]"
                    >
                      <IconEye className="h-3.5 w-3.5" />
                      预览
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
