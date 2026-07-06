import "server-only";
import type { Deal, Brand, Category } from "@/lib/types";
import { fetchAll, fetchOne, db } from "@/lib/db";

export type { Deal, Brand, Category };

export { localImageFor as localImageForServer, localImageExists } from "@/lib/image-path";

export { localImageFor } from "@/lib/image-path";

import { localImageFor } from "@/lib/image-path";

type DealRow = {
  id: string;
  title: string;
  brand_id: string | null;
  cover: string;
  cta: string | null;
  source: string;
  price: string | null;
  original_price: string | null;
  discount: string | null;
  description: string | null;
  is_free: boolean;
  is_hot: boolean;
  heat: number;
  published_at: number | string;
};

type BrandRow = {
  id: string;
  name: string;
  logo: string;
  deal_count: number;
  sort_order: number;
};

type CategoryRow = {
  slug: string;
  label: string;
  description: string;
  sort_order: number;
  parent_slug: string | null;
};

function rowToDeal(row: DealRow, brand: BrandRow | null): Deal {
  const publishedAt =
    typeof row.published_at === "string" ? Number(row.published_at) : row.published_at;
  return {
    id: row.id,
    title: row.title,
    brandId: row.brand_id,
    brandName: brand?.name ?? null,
    brandLogo: brand?.logo ?? null,
    cover: row.cover,
    cta: row.cta,
    source: row.source,
    price: row.price,
    originalPrice: row.original_price,
    discount: row.discount,
    description: row.description,
    isFree: row.is_free,
    isHot: row.is_hot,
    heat: row.heat,
    publishedAt,
  };
}

function rowToBrand(row: BrandRow): Brand {
  return { id: row.id, name: row.name, logo: row.logo, dealCount: row.deal_count };
}

function rowToCategory(row: CategoryRow): Category {
  return { slug: row.slug, label: row.label, description: row.description };
}

/**
 * All catalog reads go through the database now. The previous file-based
 * `src/data/*.json` files are kept as seed input — re-run `pnpm db:seed` to
 * (re)populate Postgres from them. Loaders cache `CATEGORIES` for the
 * lifetime of the server instance because the table rarely changes.
 */
let categoriesCache: { data: Category[]; loadedAt: number } | null = null;
const CATEGORY_TTL_MS = 60_000;

async function loadCategories(): Promise<Category[]> {
  const now = Date.now();
  if (categoriesCache && now - categoriesCache.loadedAt < CATEGORY_TTL_MS) {
    return categoriesCache.data;
  }
  await db();
  const rows = await fetchAll<CategoryRow>(
    "SELECT slug, label, description, sort_order, parent_slug FROM categories ORDER BY sort_order ASC, label ASC",
  );
  const data = rows.map(rowToCategory);
  categoriesCache = { data, loadedAt: now };
  return data;
}

/** Top-level categories (no parent). */
export async function getCategories(): Promise<Category[]> {
  await db();
  const rows = await fetchAll<CategoryRow>(
    "SELECT slug, label, description, sort_order, parent_slug FROM categories WHERE parent_slug IS NULL ORDER BY sort_order ASC, label ASC",
  );
  return rows.map(rowToCategory);
}

export async function categoryFor(slug: string): Promise<Category | null> {
  const all = await loadCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

const DEAL_SELECT = `
  SELECT d.id, d.title, d.brand_id, d.cover, d.cta, d.source,
         d.price, d.original_price, d.discount, d.description,
         d.is_free, d.is_hot, d.heat, d.published_at,
         b.name  AS brand_name,
         b.logo  AS brand_logo
  FROM deals d
  LEFT JOIN brands b ON b.id = d.brand_id
`;

type JoinedDealRow = DealRow & { brand_name: string | null; brand_logo: string | null };

export async function getDeals(): Promise<Deal[]> {
  await db();
  const rows = await fetchAll<JoinedDealRow>(
    `${DEAL_SELECT} ORDER BY d.published_at DESC`,
  );
  return rows.map((r) =>
    rowToDeal(r, r.brand_id ? { id: r.brand_id, name: r.brand_name ?? "", logo: r.brand_logo ?? "", deal_count: 0, sort_order: 0 } : null),
  );
}

export async function getDeal(id: string): Promise<Deal | null> {
  await db();
  const rows = await fetchAll<JoinedDealRow>(
    `${DEAL_SELECT} WHERE d.id = $1 LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return rowToDeal(
    row,
    row.brand_id ? { id: row.brand_id, name: row.brand_name ?? "", logo: row.brand_logo ?? "", deal_count: 0, sort_order: 0 } : null,
  );
}

export type DealFull = Deal;

/** Full record used by the deal detail page (same as base Deal — kept for compatibility). */
export async function getDealFull(id: string): Promise<DealFull | null> {
  return getDeal(id);
}

export async function getBrands(): Promise<Brand[]> {
  await db();
  const rows = await fetchAll<BrandRow>(
    "SELECT id, name, logo, deal_count, sort_order FROM brands ORDER BY sort_order ASC, name ASC",
  );
  return rows.map(rowToBrand);
}

/** Cached category list (sync flavor for components that need a constant). */
export async function CATEGORIES(): Promise<Category[]> {
  return loadCategories();
}

/**
 * Returns parent + sub-categories as a single map. Used by the category page
 * to render chip navigation without a second round-trip.
 */
export async function getCategoryTree(): Promise<{
  parents: Category[];
  subs: Record<string, Category[]>;
}> {
  await db();
  const rows = await fetchAll<CategoryRow>(
    "SELECT slug, label, description, sort_order, parent_slug FROM categories ORDER BY sort_order ASC, label ASC",
  );
  const parents: Category[] = [];
  const subs: Record<string, Category[]> = {};
  for (const r of rows) {
    const c = rowToCategory(r);
    if (r.parent_slug) {
      (subs[r.parent_slug] ??= []).push(c);
    } else {
      parents.push(c);
    }
  }
  return { parents, subs };
}