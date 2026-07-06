#!/usr/bin/env bun
/**
 * Seed the Postgres deal catalog from `src/data/deals.json` + `src/data/brands.json`.
 *
 * Idempotent: re-running upserts brands and deals. Categories are inserted on
 * first run only; remove rows from the `categories` table if you need to reseed.
 *
 * Usage:
 *   pnpm db:seed                     # default — read from src/data/*.json
 *   pnpm db:seed -- --fresh          # truncate the catalog first
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

type DealSeed = {
  id: string;
  title: string;
  brandId?: string | null;
  brandName?: string | null;
  brandLogo?: string | null;
  cover: string;
  cta?: string | null;
  source: string;
  price?: string | null;
  originalPrice?: string | null;
  discount?: string | null;
  description?: string | null;
  isFree?: boolean;
  isHot?: boolean;
  heat?: number;
  categories?: string[];
};

type BrandSeed = {
  id: string;
  name: string;
  logo: string;
};

type CategorySeed = {
  slug: string;
  label: string;
  description: string;
  parentSlug?: string | null;
  sortOrder?: number;
  keywords?: string[];
  subs?: CategorySeed[];
};

const ROOT = process.cwd();

const CATEGORY_TREE: CategorySeed[] = [
  { slug: "freebies", label: "免费薅羊毛", description: "完全免费的好东西、限时领取与返利活动", sortOrder: 1, keywords: ["免费", "0.", "仅需", "白嫖", "羊毛"] },
  {
    slug: "daily-deals",
    label: "每日优惠",
    description: "今日最值得入手的精选优惠",
    sortOrder: 2,
    keywords: ["Amazon", "Best Buy", "Walmart", "Target", "deal"],
    subs: [
      { slug: "electronics", label: "电子产品", description: "数码、3C、家电", keywords: ["iphone", "tv", "macbook", "laptop", "camera", "耳机", "显卡", "drone", "无人机", "kindle", "ps5", "xbox", "monitor", "ssd", "switch"] },
      { slug: "household", label: "家居", description: "家具、家居、家电", keywords: ["扫地", "吸尘", "家具", "ikea", "厨房", "bissell", "kitchen", "家居"] },
      { slug: "fashion", label: "服饰", description: "服装鞋包配饰", keywords: ["衣服", "鞋", "包包", "服装", "tshirt", "nike", "adidas", "shirt", "pants", "dress"] },
      { slug: "beauty", label: "美妆", description: "护肤、彩妆、香氛", keywords: ["化妆品", "护肤", "口红", "粉底", "睫毛膏", "面膜", "香水"] },
      { slug: "food-grocery", label: "美食杂货", description: "食品、零食、饮料", keywords: ["food", "snack", "零食", "grocery", "meat", "牛肉", "鸡肉", "pizza", "咖啡", "coffee"] },
      { slug: "travel", label: "旅行", description: "机票、酒店、租车", keywords: ["hotel", "flight", "airline", "酒店", "机票", "旅行"] },
      { slug: "coupons", label: "优惠券", description: "可叠加的优惠码合集", keywords: ["coupon", "折扣码", "code", "优惠码", "promo"] },
    ],
  },
  {
    slug: "financial",
    label: "金融理财",
    description: "信用卡、开户奖励与高息账户",
    sortOrder: 3,
    keywords: ["银行", "信用卡", "开户"],
    subs: [
      { slug: "credit-cards", label: "信用卡", description: "信用卡开卡奖励与返利", keywords: ["信用卡", "amex", "chase", "citi", "card 申请"] },
      { slug: "banks", label: "银行", description: "银行开户奖励与高息账户", keywords: ["银行", "开户", "boa", "wells fargo", "高利息"] },
    ],
  },
  {
    slug: "other",
    label: "其他",
    description: "集体诉讼、和解金与其他省钱机会",
    sortOrder: 4,
    keywords: ["集体诉讼", "和解金"],
    subs: [
      { slug: "class-action-settlement", label: "集体诉讼", description: "集体诉讼和解金申领", keywords: ["集体诉讼", "settlement", "和解金", "class action"] },
    ],
  },
];

function inferIsFree(title: string): boolean {
  return /免费|0\.10|0\.|仅需|白嫖|领取/.test(title);
}

function inferIsHot(title: string): boolean {
  return /史低|仅需|限时|直降|薅羊毛/.test(title);
}

function inferHeat(title: string): number {
  // Deterministic pseudo-heat so re-runs don't shuffle ordering.
  let h = 80;
  if (/免费/.test(title)) h += 220;
  if (/史低|最低价/.test(title)) h += 120;
  if (/限时|截止/.test(title)) h += 60;
  if (/羊毛|薅/.test(title)) h += 40;
  return h;
}

function inferDiscount(title: string): string | null {
  const m = title.match(/(?:直降|立省|立减)[^，。！!]*?(\$?\d+(?:\.\d+)?)/);
  if (m) return m[0];
  const pct = title.match(/(\d+)\s*%/);
  if (pct) return `-${pct[1]}%`;
  return null;
}

function inferPrice(title: string): string | null {
  const m = title.match(/\$(\d+(?:\.\d+)?)/);
  return m ? `$${m[1]}` : null;
}

function classifyDeal(title: string, allCategories: CategorySeed[]): string[] {
  const t = title.toLowerCase();
  const matched = new Set<string>();
  const visit = (cat: CategorySeed, parents: string[] = []) => {
    const haystacks = [...(cat.keywords ?? []), cat.label];
    if (haystacks.some((k) => t.includes(k.toLowerCase()))) {
      for (const p of parents) matched.add(p);
      matched.add(cat.slug);
    }
    for (const sub of cat.subs ?? []) {
      visit(sub, [...parents, cat.slug]);
    }
  };
  for (const c of allCategories) visit(c);
  if (matched.size === 0) matched.add("daily-deals");
  return Array.from(matched);
}

async function readSeed(): Promise<{ deals: DealSeed[]; brands: BrandSeed[] }> {
  const dataDir = path.join(ROOT, "src", "data");
  const [dealsRaw, brandsRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "deals.json"), "utf8"),
    fs.readFile(path.join(dataDir, "brands.json"), "utf8"),
  ]);
  return {
    deals: JSON.parse(dealsRaw) as DealSeed[],
    brands: JSON.parse(brandsRaw) as BrandSeed[],
  };
}

async function main() {
  const url = process.env.DATABASE_URL ?? process.env.AUTH_DB_URL;
  if (!url) {
    console.error("DATABASE_URL (or AUTH_DB_URL) is not set; aborting seed.");
    process.exit(1);
  }
  const fresh = process.argv.includes("--fresh");
  const sql = neon(url).query.bind(neon(url));

  if (fresh) {
    console.log("Truncating catalog tables…");
    await sql("TRUNCATE deal_categories, deals, brands, categories RESTART IDENTITY CASCADE", []);
  }

  console.log("Seeding categories…");
  // Walk the tree and upsert parents then children.
  for (const c of CATEGORY_TREE) {
    await sql(
      "INSERT INTO categories (slug, label, description, sort_order, parent_slug) VALUES ($1, $2, $3, $4, NULL) ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, parent_slug = EXCLUDED.parent_slug",
      [c.slug, c.label, c.description, c.sortOrder ?? 0],
    );
    for (const s of c.subs ?? []) {
      await sql(
        "INSERT INTO categories (slug, label, description, sort_order, parent_slug) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, parent_slug = EXCLUDED.parent_slug",
        [s.slug, s.label, s.description, 0, c.slug],
      );
    }
  }

  const { deals, brands } = await readSeed();
  console.log(`Seeding ${brands.length} brands…`);
  for (const b of brands) {
    await sql(
      "INSERT INTO brands (id, name, logo, deal_count, sort_order) VALUES ($1, $2, $3, 0, 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo",
      [b.id, b.name, b.logo],
    );
  }

  // Map brandId or logo filename to brand row.
  const idToBrand = new Map<string, BrandSeed>();
  const logoToBrand = new Map<string, string>();
  for (const b of brands) {
    idToBrand.set(b.id, b);
    try {
      const url = new URL(b.logo);
      const file = url.pathname.split("/").pop() ?? "";
      logoToBrand.set(file, b.id);
    } catch {
      /* ignore */
    }
  }

  console.log(`Seeding ${deals.length} deals…`);
  for (const d of deals) {
    let brandId: string | null = null;
    if (d.brandId && idToBrand.has(d.brandId)) {
      brandId = d.brandId;
    } else if (d.brandLogo) {
      try {
        const file = new URL(d.brandLogo).pathname.split("/").pop() ?? "";
        brandId = logoToBrand.get(file) ?? null;
      } catch {
        brandId = null;
      }
    }
    const brandRow = brandId ? idToBrand.get(brandId) ?? null : null;
    const slugFallback = inferPrice(d.title);
    const slugDiscFallback = inferDiscount(d.title);
    const cats = d.categories && d.categories.length > 0 ? d.categories : classifyDeal(d.title, CATEGORY_TREE);

    await sql(
      `INSERT INTO deals
         (id, title, brand_id, cover, cta, source, price, original_price, discount, description, is_free, is_hot, heat, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, EXTRACT(EPOCH FROM NOW())::BIGINT)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         brand_id = EXCLUDED.brand_id,
         cover = EXCLUDED.cover,
         cta = EXCLUDED.cta,
         source = EXCLUDED.source,
         price = EXCLUDED.price,
         original_price = EXCLUDED.original_price,
         discount = EXCLUDED.discount,
         description = EXCLUDED.description,
         is_free = EXCLUDED.is_free,
         is_hot = EXCLUDED.is_hot,
         heat = EXCLUDED.heat`,
      [
        d.id,
        d.title,
        brandId,
        d.cover,
        d.cta ?? null,
        d.source,
        d.price ?? slugFallback,
        d.originalPrice ?? null,
        d.discount ?? slugDiscFallback,
        d.description ?? null,
        d.isFree ?? inferIsFree(d.title),
        d.isHot ?? inferIsHot(d.title),
        d.heat ?? inferHeat(d.title),
      ],
    );

    // Backfill brandName/logo for the join (logo only used if brand row missing).
    void brandRow;
    void d.brandName;

    for (const slug of cats) {
      await sql(
        "INSERT INTO deal_categories (deal_id, category_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [d.id, slug],
      );
    }
  }

  console.log("Refreshing brand deal counts…");
  await sql(
    `UPDATE brands SET deal_count = sub.c FROM (
       SELECT brand_id, COUNT(*)::INT AS c FROM deals WHERE brand_id IS NOT NULL GROUP BY brand_id
     ) sub WHERE brands.id = sub.brand_id`,
    [],
  );

  const counts = (await sql(
    `SELECT 'categories' AS table_name, COUNT(*)::INT AS n FROM categories
     UNION ALL SELECT 'brands', COUNT(*)::INT FROM brands
     UNION ALL SELECT 'deals', COUNT(*)::INT FROM deals
     UNION ALL SELECT 'deal_categories', COUNT(*)::INT FROM deal_categories`,
    [],
  )) as { table_name: string; n: number }[];
  for (const row of counts) console.log(`  ${row.table_name}: ${row.n}`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});