import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchAll, fetchOne } from "@/lib/db";
import { IconTag, IconStore, IconFolder, IconInbox, IconBook } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";
export const metadata = { title: "仪表盘 | 省钱兔 Admin", robots: { index: false } };

type Counts = {
  deals: number;
  brands: number;
  categories: number;
  articles: number;
  submissions_pending: number;
  recent_deals: number; // last 7 days
  hot_deals: number;
  free_deals: number;
};

async function loadCounts(): Promise<Counts & { recent: { id: string; title: string; created: number }[] }> {
  const now = Math.floor(Date.now() / 1000);
  const weekAgo = now - 7 * 24 * 3600;
  const [
    deals,
    brands,
    categories,
    articles,
    submissions,
    recent,
  ] = await Promise.all([
    fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM deals", []),
    fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM brands", []),
    fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM categories", []),
    fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM articles WHERE status = 'published'", []),
    fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM deal_submissions WHERE status = 'pending'", []),
    fetchAll<{ id: string; title: string; created: number }>(
      "SELECT id, title, published_at::BIGINT AS created FROM deals ORDER BY published_at DESC LIMIT 8",
    ),
  ]);
  const recentDeals = (await fetchOne<{ n: number }>(
    "SELECT COUNT(*)::INT AS n FROM deals WHERE published_at >= $1",
    [weekAgo],
  )) ?? { n: 0 };
  const hot = await fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM deals WHERE is_hot = true", []);
  const free = await fetchOne<{ n: number }>("SELECT COUNT(*)::INT AS n FROM deals WHERE is_free = true", []);
  return {
    deals: deals?.n ?? 0,
    brands: brands?.n ?? 0,
    categories: categories?.n ?? 0,
    articles: articles?.n ?? 0,
    submissions_pending: submissions?.n ?? 0,
    recent_deals: recentDeals?.n ?? 0,
    hot_deals: hot?.n ?? 0,
    free_deals: free?.n ?? 0,
    recent,
  };
}

function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
  accent: "orange" | "blue" | "green" | "purple";
}) {
  const colorMap = {
    orange: "from-orange-50 to-orange-100/40 text-[#F97316]",
    blue: "from-blue-50 to-blue-100/40 text-blue-600",
    green: "from-emerald-50 to-emerald-100/40 text-emerald-600",
    purple: "from-violet-50 to-violet-100/40 text-violet-600",
  } as const;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {hint ? <p className="text-sm text-gray-400">{hint}</p> : null}
      </div>
    </Link>
  );
}

function fmtDate(epoch: number): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AdminHomePage() {
  await requireAdmin();
  const data = await loadCounts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">仪表盘</h1>
        <p className="mt-1 text-sm text-gray-500">
          快速浏览当前商品、商家、待审稿数量，并直达编辑入口。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="总优惠数"
          value={data.deals}
          hint={`近 7 天 +${data.recent_deals}`}
          href="/admin/deals"
          icon={<IconTag className="h-5 w-5" />}
          accent="orange"
        />
        <StatCard
          label="商家"
          value={data.brands}
          href="/admin/brands"
          icon={<IconStore className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="分类"
          value={data.categories}
          href="/admin/categories"
          icon={<IconFolder className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="文章"
          value={data.articles}
          href="/admin/articles"
          icon={<IconBook className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="待审稿"
          value={data.submissions_pending}
          href="/admin/submissions"
          icon={<IconInbox className="h-5 w-5" />}
          accent="green"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">状态</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="热门优惠" value={data.hot_deals} />
            <Row label="免费 / 超低价" value={data.free_deals} />
            <Row label="近 7 天新增" value={data.recent_deals} />
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">最新优惠</h2>
            <Link href="/admin/deals" className="text-xs font-medium text-[#F97316] hover:underline">
              查看全部 →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-gray-100">
            {data.recent.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-400">暂无优惠</li>
            ) : (
              data.recent.map((r) => (
                <li key={r.id} className="py-2.5">
                  <Link
                    href={`/admin/deals/${r.id}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-gray-700 hover:text-[#F97316]">{r.title}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">{fmtDate(r.created)}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
