import { getArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await getArticles();
  const buildDate = new Date(
    Math.max(
      ...articles.map((a) => new Date(a.publishedAt).getTime()),
      Date.now(),
    ),
  ).toUTCString();

  const items = articles
    .map((a) => {
      const link = `${SITE.url}/articles/${a.slug}`;
      const pubDate = new Date(a.publishedAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(a.excerpt)}</description>
      <category>${escapeXml(a.tags.join(", "))}</category>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)} - 文章</title>
    <link>${SITE.url}/articles</link>
    <description>阅读来自${escapeXml(SITE.name)}的购物技巧、省钱指南和优惠资讯。</description>
    <language>zh-CN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE.url}/articles/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
