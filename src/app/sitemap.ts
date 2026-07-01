import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getDeals, getCategories } from "@/lib/deals";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL && !process.env.AUTH_DB_URL) {
    return [{ url: `${SITE.url}/`, lastModified: new Date() }];
  }
  try {
    const [deals, categories] = await Promise.all([getDeals(), getCategories()]);
    const now = new Date();
    return [
      { url: `${SITE.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
      ...categories.map((c) => ({
        url: `${SITE.url}/category/${c.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...deals.map((d) => ({
        url: `${SITE.url}/deal/${d.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    console.warn("[sitemap] falling back —", (err as Error).message);
    return [{ url: `${SITE.url}/`, lastModified: new Date() }];
  }
}
