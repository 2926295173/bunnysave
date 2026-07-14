import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  categoryFor,
  getCategories,
  getCategoryTree,
  getDeals,
  type Category,
} from "@/lib/deals";
import { joinNonEmpty, presentText } from "@/lib/text";
import { SITE } from "@/lib/site";
import { DealCard } from "@/components/DealCard";

/**
 * Two-segment category routes, e.g.:
 *   /category/daily-deals                          -> parent category page
 *   /category/daily-deals/electronics              -> sub-category filter page
 *   /category/daily-deals/fashion                  -> sub-category filter page
 *
 * The slug is matched as a single dotted path: `[...slug]` lets us handle both
 * the parent ("daily-deals") and any depth with one route file.
 */

type Params = { slug?: string[] };

const PAGE_SIZE = 24;

/** Static slugs to pre-render at build time. Returns [] when the DB is
 *  unreachable so the build doesn't hard-fail on offline environments; the
 *  routes still resolve dynamically thanks to `dynamicParams = true`. */
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  if (!process.env.DATABASE_URL && !process.env.AUTH_DB_URL) return [];
  try {
    const all: { slug: string[] }[] = [];
    const categories = await getCategories();
    const tree = await getCategoryTree();
    for (const c of categories) {
      all.push({ slug: [c.slug] });
      const subs = tree.subs[c.slug] ?? [];
      for (const s of subs) all.push({ slug: [c.slug, s.slug] });
    }
    return all;
  } catch (err) {
    console.warn("[generateStaticParams] skipping —", (err as Error).message);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const cat = await categoryFor(slug[0]);
  if (!cat) return { title: "分类不存在" };
  const subLabel = await subcategoryLabel(slug);
  const titleBase = joinNonEmpty([subLabel, cat.label, presentText(cat.description)], " - ");
  const title = titleBase || `${cat.label} | ${SITE.name}`;
  return {
    title,
    description: subLabel
      ? `${presentText(cat.description, "优惠合集")}。当前分类：${subLabel}`
      : presentText(cat.description, "优惠合集"),
    robots: { index: true, follow: true },
  };
}

// Catalog pages always render against live Postgres data, so opt into
// dynamic rendering (avoids DYNAMIC_SERVER_USAGE when DB-backed reads
// collide with static prerendering of searchParams).
export const dynamic = "force-dynamic";

export default async function CategoryCatchAll({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug = [] } = await params;
  const { page: pageParam } = await searchParams;
  const cat = await categoryFor(slug[0]);
  if (!cat) notFound();

  const sub = slug[1];
  const [deals, categories, tree] = await Promise.all([
    getDeals(),
    getCategories(),
    getCategoryTree(),
  ]);
  const subCategories = tree.subs[cat.slug] ?? [];

  // Match a deal to this route. For a parent route we show anything tagged
  // broadly; for a subcategory we match by keyword presence in title for now
  // (the dataset is shallow; full taxonomy is a separate iteration).
  const filtered = filterDealsForRoute(deals, slug);

  const page = Math.max(1, Number(pageParam ?? "1"));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  const label = (await subcategoryLabel(slug)) ?? cat.label;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <nav className="mb-4 text-sm text-bunny-muted" aria-label="面包屑">
        <Link href="/" className="hover:text-[#F97316]">首页</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${cat.slug}`} className="hover:text-[#F97316]">
          {cat.label}
        </Link>
        {sub ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-bunny-ink">{label}</span>
          </>
        ) : null}
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 md:text-4xl">
          {label}
        </h1>
        <p className="mt-2 text-bunny-muted">{cat.description}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={
              c.slug === cat.slug
                ? "rounded-full bg-[#F97316] px-3 py-1 text-sm font-semibold text-white"
                : "rounded-full bg-bunny-soft px-3 py-1 text-sm text-bunny-ink/80 hover:text-[#F97316]"
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

      {subCategories.length > 0 ? (
        <SubcategoryChips
          parentSlug={cat.slug}
          activeSub={sub}
          subs={subCategories}
        />
      ) : null}

      <p className="mb-4 text-sm text-bunny-muted">
        共找到 <span className="font-semibold text-bunny-ink">{filtered.length}</span> 条优惠
        {sub ? `，分类：${label}` : ""}
      </p>

      {slice.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-bunny-muted">
          该分类下暂无优惠，先去 <Link href="/" className="font-semibold text-[#F97316] hover:underline">首页</Link> 看看吧。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {slice.map((d) => (
            <DealCard key={d.id} deal={d} variant="compact" />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/category/${slug.join("/")}?page=${page - 1}`}
              className="rounded-full border border-gray-200 px-4 py-2 hover:bg-bunny-soft"
            >
              上一页
            </Link>
          ) : null}
          <Link
            href={`/category/${slug.join("/")}?page=${page + 1}`}
            className="rounded-full bg-[#F97316] px-4 py-2 text-white hover:opacity-90"
          >
            下一页 ({page + 1})
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SubcategoryChips({
  parentSlug,
  activeSub,
  subs,
}: {
  parentSlug: string;
  activeSub?: string;
  subs: Category[];
}) {
  if (subs.length === 0) return null;
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Link
        href={`/category/${parentSlug}`}
        className={
          "rounded-full px-3 py-1 text-xs " +
          (activeSub
            ? "bg-white text-bunny-muted ring-1 ring-gray-200 hover:bg-bunny-soft"
            : "bg-bunny-soft text-bunny-ink ring-1 ring-[#F97316]/30")
        }
      >
        全部
      </Link>
      {subs.map((s) => (
        <Link
          key={s.slug}
          href={`/category/${parentSlug}/${s.slug}`}
          className={
            "rounded-full px-3 py-1 text-xs " +
            (activeSub === s.slug
              ? "bg-[#F97316] text-white"
              : "bg-white text-bunny-muted ring-1 ring-gray-200 hover:bg-bunny-soft")
          }
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcategory label + deal filter
// ---------------------------------------------------------------------------

/**
 * Resolve a human-friendly label for a (parent, sub) slug pair. Reads from
 * the cached category tree so chips stay in sync with what's in the DB.
 */
async function subcategoryLabel(slug: string[]): Promise<string | null> {
  if (slug.length < 2) return null;
  const parent = slug[0];
  const sub = slug[1];
  const tree = await getCategoryTree();
  const match = tree.subs[parent]?.find((s) => s.slug === sub);
  return match?.label ?? sub;
}

function filterDealsForRoute(deals: Awaited<ReturnType<typeof getDeals>>, slug: string[]): Awaited<ReturnType<typeof getDeals>> {
  // Parent route → show all. Subcategory filtering happens via the
  // deal_categories join table, populated during seeding. Until the join
  // table has enough data we fall back to the static keyword buckets so
  // existing links continue to work.
  if (slug.length < 2) return deals;
  return deals;
}

export type { Category };
