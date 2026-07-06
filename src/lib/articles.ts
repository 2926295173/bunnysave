import "server-only";
import { ARTICLES, ARTICLES_INDEX, type Article } from "@/data/articles";

export type { Article };

/**
 * Server-side helpers for the static `/articles` pages. Articles live in
 * `src/data/articles.ts` (hard-coded to mirror the official site, which only
 * ships two entries) — no DB or filesystem reads are required.
 */

export function getArticles(): Article[] {
  // Newest first.
  return [...ARTICLES].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

export function getArticle(slug: string): Article | null {
  return ARTICLES_INDEX[slug] ?? null;
}

export function getArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}
