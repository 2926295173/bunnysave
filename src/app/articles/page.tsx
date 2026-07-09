import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: `文章 - ${SITE.name}`,
  description: `阅读来自${SITE.name}的购物技巧、省钱指南和优惠资讯。`,
  authors: [{ name: SITE.name }],
  keywords: ["优惠", "折扣", "优惠券", "省钱", "特价"],
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE.url}/articles`,
    languages: {
      en: `${SITE.enUrl}/articles`,
      "zh-CN": `${SITE.url}/articles`,
      "x-default": `${SITE.enUrl}/articles`,
    },
    types: {
      "application/rss+xml": `${SITE.url}/articles/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    title: `文章 - ${SITE.name}`,
    description: `阅读来自${SITE.name}的购物技巧、省钱指南和优惠资讯。`,
    url: `${SITE.url}/articles`,
    siteName: SITE.name,
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: `文章 - ${SITE.name}`,
    description: `阅读来自${SITE.name}的购物技巧、省钱指南和优惠资讯。`,
  },
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "文章",
    url: `${SITE.url}/articles`,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      inLanguage: "zh-CN",
      numberOfItems: articles.length,
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/articles/${a.slug}`,
        name: a.title,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    inLanguage: "zh-CN",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首页",
        item: `${SITE.url}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "文章",
        item: `${SITE.url}/articles`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb band */}
      <div className="border-b border-gray-200 bg-white py-3">
        <div className="mx-auto max-w-4xl px-4">
          <nav aria-label="面包屑">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#F97316] transition-colors whitespace-nowrap"
                >
                  首页
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight />
                <span className="text-gray-900">文章</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">文章</h1>
        <div className="space-y-5">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.cover}
                  alt={a.title}
                  loading="lazy"
                  className="w-full sm:w-56 h-44 sm:h-auto object-cover flex-shrink-0"
                />
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-gray-400">
                      {formatChineseDate(a.publishedAt)}
                    </time>
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-[#F97316] transition-colors">
                    {a.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {a.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-block px-2.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function formatChineseDate(iso: string): string {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  if (!y || !m || !d) return iso;
  return `${y}年${m}月${d}日`;
}
