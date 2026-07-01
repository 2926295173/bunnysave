import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Deal, Brand, Category } from "@/lib/types";

export type { Deal, Brand, Category };

/**
 * Neon Postgres client. Drops the previous SQLite/better-sqlite3 code so the
 * app can run on Vercel serverless where the filesystem is read-only.
 *
 * Schema bootstrap runs lazily on first call.
 */

declare global {
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

type Bound = NeonQueryFunction<false, false>["query"];

let _sql: NeonQueryFunction<false, false> | null = null;
let _query: Bound | null = null;

function client(): Bound {
  if (_query) return _query;
  const url = process.env.DATABASE_URL ?? process.env.AUTH_DB_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL (or AUTH_DB_URL) is not set. Add your Neon connection string " +
        "to .env.development.local (via `vercel env pull`) and to Vercel project settings.",
    );
  }
  if (typeof WebSocket === "undefined" && process.env.NODE_ENV === "production") {
    neonConfig.fetchConnectionCache = true;
  }
  _sql = neon(url);
  _query = _sql.query.bind(_sql) as Bound;
  return _query;
}

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password_hash: string | null;
  provider: string;
  created_at: number;
};

async function ensureSchema() {
  const sql = client();
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT,
      image         TEXT,
      password_hash TEXT,
      provider      TEXT NOT NULL DEFAULT 'credentials',
      created_at    BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`);
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS magic_links (
      token       TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      expires_at  BIGINT NOT NULL,
      consumed_at BIGINT
    )`);
  await sql(Neonql`CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email)`);

  // ---------- Deal catalog (categories / brands / deals / join) ----------
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS categories (
      slug        TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order  INT  NOT NULL DEFAULT 0,
      parent_slug TEXT REFERENCES categories(slug) ON DELETE CASCADE
    )`);
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS brands (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      logo        TEXT NOT NULL,
      deal_count  INT  NOT NULL DEFAULT 0,
      sort_order  INT  NOT NULL DEFAULT 0
    )`);
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS deals (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      brand_id     TEXT REFERENCES brands(id) ON DELETE SET NULL,
      cover        TEXT NOT NULL,
      cta          TEXT,
      source       TEXT NOT NULL DEFAULT 'bunnysave.com',
      price        TEXT,
      discount     TEXT,
      description  TEXT,
      is_free      BOOLEAN NOT NULL DEFAULT FALSE,
      is_hot       BOOLEAN NOT NULL DEFAULT FALSE,
      heat         INT     NOT NULL DEFAULT 0,
      published_at BIGINT  NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`);
  await sql(Neonql`
    CREATE TABLE IF NOT EXISTS deal_categories (
      deal_id      TEXT NOT NULL REFERENCES deals(id)   ON DELETE CASCADE,
      category_slug TEXT NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
      PRIMARY KEY (deal_id, category_slug)
    )`);
  await sql(Neonql`CREATE INDEX IF NOT EXISTS idx_deals_brand_id ON deals(brand_id)`);
  await sql(Neonql`CREATE INDEX IF NOT EXISTS idx_deals_published_at ON deals(published_at DESC)`);
  await sql(Neonql`CREATE INDEX IF NOT EXISTS idx_deal_categories_slug ON deal_categories(category_slug)`);
  await sql(Neonql`CREATE INDEX IF NOT EXISTS idx_brands_sort ON brands(sort_order, name)`);
}

// Wrapper const so we can use tagged-template syntax.
const Neonql = (s: TemplateStringsArray, ...v: unknown[]) =>
  String.raw({ raw: s.map((x, i) => x + (v[i] ?? "")) }, ...v);

export async function db() {
  // Mirror the better-sqlite3 sync handle with a thin awaitable wrapper.
  // Callers now `await db().prepare(...)` or `await db().exec(...)`.
  if (!global.__schemaReady) {
    global.__schemaReady = ensureSchema();
  }
  await global.__schemaReady;
  return client();
}

/** Convenience helper — equivalent to better-sqlite3's `prepare(s).get(...)`. */
export async function fetchOne<T = unknown>(
  sqlText: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = (await client()(sqlText, params)) as T[];
  return rows[0] ?? null;
}

/** Convenience helper — equivalent to better-sqlite3's `prepare(s).all(...)`. */
export async function fetchAll<T = unknown>(
  sqlText: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await client()(sqlText, params)) as T[];
}

/** Convenience helper — equivalent to better-sqlite3's `prepare(s).run(...)`. */
export async function exec(
  sqlText: string,
  params: unknown[] = [],
): Promise<void> {
  await client()(sqlText, params);
}
