import "server-only";
import type { Deal, Brand, Category } from "@/lib/types";
import { fetchAll, fetchOne, db } from "@/lib/db";

export type { Deal, Brand, Category };

// Re-export the pure helpers so client components can import them from
// `localImageFor` via this module — these helpers don't pull server-only deps.
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

function rowToDeal(row: DealRow): Deal {
  return {
    id: row.id,
    title: row.title,
    brandLogo: row.brand_id ? null : null,
    cover: row.cover,
    cta: row.cta,
    source: row.source,
  };
}

function rowToBrand(row: BrandRow): Brand {
  return { id: row.id, name: row.name, logo: row.logo };
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

export async function getDeals(): Promise<Deal[]> {
  await db();
  const rows = await fetchAll<DealRow>(
    "SELECT id, title, brand_id, cover, cta, source, price, discount, description, is_free, is_hot, heat, published_at FROM deals ORDER BY published_at DESC",
  );
  // Resolve brand logos via a second cheap lookup.
  const brandIds = Array.from(new Set(rows.map((r) => r.brand_id).filter(Boolean) as string[]));
  const brandById = new Map<string, BrandRow>();
  if (brandIds.length > 0) {
    const placeholders = brandIds.map((_, i) => `$${i + 1}`).join(",");
    const brandRows = await fetchAll<BrandRow>(
      `SELECT id, name, logo, deal_count, sort_order FROM brands WHERE id IN (${placeholders})`,
      brandIds,
    );
    for (const b of brandRows) brandById.set(b.id, b);
  }
  return rows.map((r) => {
    const brand = r.brand_id ? brandById.get(r.brand_id) : null;
    return {
      id: r.id,
      title: r.title,
      brandLogo: brand?.logo ?? null,
      cover: r.cover,
      cta: r.cta,
      source: r.source,
    };
  });
}

export async function getDeal(id: string): Promise<Deal | null> {
  await db();
  const row = await fetchOne<DealRow>(
    "SELECT id, title, brand_id, cover, cta, source, price, discount, description, is_free, is_hot, heat, published_at FROM deals WHERE id = $1 LIMIT 1",
    [id],
  );
  if (!row) return null;
  let brand: BrandRow | null = null;
  if (row.brand_id) {
    brand = await fetchOne<BrandRow>(
      "SELECT id, name, logo, deal_count, sort_order FROM brands WHERE id = $1 LIMIT 1",
      [row.brand_id],
    );
  }
  return {
    id: row.id,
    title: row.title,
    brandLogo: brand?.logo ?? null,
    cover: row.cover,
    cta: row.cta,
    source: row.source,
  };
}

export type DealFull = Deal & {
  brandName: string | null;
  brandId: string | null;
  price: string | null;
  discount: string | null;
  description: string | null;
  isFree: boolean;
  isHot: boolean;
  heat: number;
  publishedAt: number;
};

/** Full record used by the deal detail page (includes brand name + price/desc). */
export async function getDealFull(id: string): Promise<DealFull | null> {
  await db();
  const row = await fetchOne<DealRow>(
    "SELECT id, title, brand_id, cover, cta, source, price, discount, description, is_free, is_hot, heat, published_at FROM deals WHERE id = $1 LIMIT 1",
    [id],
  );
  if (!row) return null;
  let brand: BrandRow | null = null;
  if (row.brand_id) {
    brand = await fetchOne<BrandRow>(
      "SELECT id, name, logo, deal_count, sort_order FROM brands WHERE id = $1 LIMIT 1",
      [row.brand_id],
    );
  }
  const publishedAt =
    typeof row.published_at === "string"
      ? Number(row.published_at)
      : row.published_at;
  return {
    id: row.id,
    title: row.title,
    brandLogo: brand?.logo ?? null,
    cover: row.cover,
    cta: row.cta,
    source: row.source,
    brandName: brand?.name ?? null,
    brandId: brand?.id ?? null,
    price: row.price,
    discount: row.discount,
    description: row.description,
    isFree: row.is_free,
    isHot: row.is_hot,
    heat: row.heat,
    publishedAt,
  };
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