import "server-only";
import { ARTICLES, type Article } from "@/data/articles";
import { asStringArray, exec, fetchAll, fetchOne } from "@/lib/db";

export type { Article };

type ArticleRow = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  tags: unknown;
  body: string;
  status: string;
  published_at: number;
  updated_at: number;
  created_at: number;
};

type AdminArticle = Article & {
  status: string;
  published_at: number;
  updatedAt: string;
};

type PublicArticle = Article;

function rowToAdminArticle(row: ArticleRow): AdminArticle {
  // published_at is stored as a unix epoch (seconds). Convert to YYYY-MM-DD so
  // the existing client rendering (which expects ISO date strings) keeps working.
  const publishedAt = new Date(Number(row.published_at) * 1000)
    .toISOString()
    .slice(0, 10);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: row.cover,
    tags: asStringArray(row.tags),
    body: row.body,
    publishedAt,
    status: row.status,
    published_at: Number(row.published_at),
    updatedAt: new Date(Number(row.updated_at ?? row.published_at) * 1000).toISOString(),
  };
}

function rowToPublicArticle(row: ArticleRow): PublicArticle {
  const publishedAt = new Date(Number(row.published_at) * 1000)
    .toISOString()
    .slice(0, 10);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: row.cover,
    tags: asStringArray(row.tags),
    body: row.body,
    publishedAt,
  };
}

async function loadFromDbAdmin(includeDrafts: boolean): Promise<AdminArticle[] | null> {
  try {
    const rows = await fetchAll<ArticleRow>(
      includeDrafts
        ? "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles ORDER BY published_at DESC"
        : "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles WHERE status = 'published' ORDER BY published_at DESC",
    );
    return rows.map(rowToAdminArticle);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] falling back to static seed:", (err as Error).message);
    }
    return null;
  }
}

async function loadFromDbPublic(includeDrafts: boolean): Promise<PublicArticle[] | null> {
  try {
    const rows = await fetchAll<ArticleRow>(
      includeDrafts
        ? "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles ORDER BY published_at DESC"
        : "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles WHERE status = 'published' ORDER BY published_at DESC",
    );
    return rows.map(rowToPublicArticle);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] falling back to static seed:", (err as Error).message);
    }
    return null;
  }
}

/**
 * Public articles used by the public-facing pages. Falls back to the bundled
 * `src/data/articles.ts` seed when no database is available so the site can
 * still build / render without `DATABASE_URL` being set.
 */
export async function getArticles(): Promise<PublicArticle[]> {
  const dbArticles = await loadFromDbPublic(false);
  if (dbArticles) return dbArticles;
  return [...ARTICLES].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

export async function getArticle(slug: string): Promise<PublicArticle | null> {
  try {
    const row = await fetchOne<ArticleRow>(
      "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles WHERE slug = $1 AND status = 'published'",
      [slug],
    );
    if (row) return rowToPublicArticle(row);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] getArticle DB read failed:", (err as Error).message);
    }
  }
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export async function getArticleSlugs(): Promise<string[]> {
  try {
    const rows = await fetchAll<{ slug: string }>(
      "SELECT slug FROM articles WHERE status = 'published'",
    );
    if (rows.length > 0) return rows.map((r) => r.slug);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] getArticleSlugs DB read failed:", (err as Error).message);
    }
  }
  return ARTICLES.map((a) => a.slug);
}

/**
 * Admin-only fetcher that includes drafts.
 */
export async function getArticlesAdmin(): Promise<AdminArticle[]> {
  const list = await loadFromDbAdmin(true);
  if (list) return list;
  // Static fallback: surface the seed as drafts so the admin UI is never empty
  // when running without a DB.
  return ARTICLES.map((a) => ({
    ...a,
    status: "published",
    published_at: Math.floor(new Date(`${a.publishedAt}T00:00:00.000Z`).getTime() / 1000),
    updatedAt: `${a.publishedAt}T00:00:00.000Z`,
  })).sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

export async function getArticleAdmin(slug: string): Promise<AdminArticle | null> {
  try {
    const row = await fetchOne<ArticleRow>(
      "SELECT slug, title, excerpt, cover, tags, body, status, published_at::BIGINT AS published_at, updated_at::BIGINT AS updated_at, created_at::BIGINT AS created_at FROM articles WHERE slug = $1",
      [slug],
    );
    if (row) return rowToAdminArticle(row);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] getArticleAdmin DB read failed:", (err as Error).message);
    }
  }
  const seed = ARTICLES.find((a) => a.slug === slug);
  if (!seed) return null;
  return {
    ...seed,
    status: "published",
    published_at: Math.floor(new Date(`${seed.publishedAt}T00:00:00.000Z`).getTime() / 1000),
    updatedAt: `${seed.publishedAt}T00:00:00.000Z`,
  };
}

export async function getArticleCount(): Promise<number> {
  try {
    const row = await fetchOne<{ n: number }>(
      "SELECT COUNT(*)::INT AS n FROM articles WHERE status = 'published'",
    );
    if (row) return row.n;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[articles] getArticleCount DB read failed:", (err as Error).message);
    }
  }
  return ARTICLES.length;
}

declare global {
  // eslint-disable-next-line no-var
  var __articlesSeeded: Promise<void> | undefined;
}

/**
 * Copy the bundled `src/data/articles.ts` seed into the database the first
 * time admin code touches the table. This keeps the editorial experience
 * working out-of-the-box without requiring a separate migration step.
 * No-op if at least one article row already exists or the DB is unavailable.
 */
export function ensureArticlesSeeded(): Promise<void> {
  if (globalThis.__articlesSeeded) return globalThis.__articlesSeeded;
  globalThis.__articlesSeeded = (async () => {
    try {
      const existing = await fetchOne<{ n: number }>(
        "SELECT COUNT(*)::INT AS n FROM articles",
      );
      if (existing && existing.n > 0) return;
      for (const a of ARTICLES) {
        const epoch = Math.floor(new Date(`${a.publishedAt}T00:00:00.000Z`).getTime() / 1000);
        await exec(
          `INSERT INTO articles (slug, title, excerpt, cover, tags, body, status, published_at)
           VALUES ($1, $2, $3, $4, $5::text[], $6, 'published', $7)
           ON CONFLICT (slug) DO NOTHING`,
          [a.slug, a.title, a.excerpt, a.cover, a.tags, a.body, epoch],
        );
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[articles] ensureArticlesSeeded skipped:", (err as Error).message);
      }
    }
  })();
  return globalThis.__articlesSeeded;
}
