import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticleSlugs, getArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "文章不存在" };
  return {
    title: `${article.title} - ${SITE.name}`,
    description: article.excerpt,
    authors: [{ name: SITE.name }],
    keywords: article.tags,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${SITE.url}/articles/${article.slug}`,
      languages: {
        en: `${SITE.enUrl}/articles/${article.slug}`,
        "zh-CN": `${SITE.url}/articles/${article.slug}`,
        "x-default": `${SITE.enUrl}/articles/${article.slug}`,
      },
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `${SITE.url}/articles/${article.slug}`,
      images: [article.cover],
      siteName: SITE.name,
      locale: "zh_CN",
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.cover],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const all = await getArticles();
  const others = all.filter((a) => a.slug !== article.slug);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    inLanguage: "zh-CN",
    datePublished: `${article.publishedAt}T00:00:00.000Z`,
    dateModified: `${article.publishedAt}T00:00:00.000Z`,
    image: article.cover,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE.url}/articles/${article.slug}`,
    },
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    keywords: article.tags.join(", "),
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
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${SITE.url}/articles/${article.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb band */}
      <div className="border-b border-gray-200 bg-white py-3">
        <div className="mx-auto max-w-3xl px-4">
          <nav aria-label="面包屑">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link
                href="/"
                className="hover:text-[#F97316] transition-colors"
              >
                首页
              </Link>
              <ChevronRight />
              <Link
                href="/articles"
                className="hover:text-[#F97316] transition-colors"
              >
                文章
              </Link>
              <ChevronRight />
              <span className="text-gray-900 truncate">{article.title}</span>
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover}
            alt={article.title}
            className="w-full h-56 sm:h-72 object-cover"
          />

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {article.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
              <time
                dateTime={`${article.publishedAt}T00:00:00.000Z`}
              >
                {formatChineseDate(article.publishedAt)}
              </time>
            </div>

            {article.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-block px-2.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 prose prose-slate max-w-none prose-headings:text-gray-900 prose-a:text-[#F97316] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
              {renderArticleBody(article.body)}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F97316] transition-colors"
              >
                <ArrowLeft />
                返回文章列表
              </Link>

              {others.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    更多文章
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {others.map((o) => (
                      <li key={o.slug}>
                        <Link
                          href={`/articles/${o.slug}`}
                          className="group flex flex-col gap-0.5"
                        >
                          <span className="text-sm font-medium text-gray-800 group-hover:text-[#F97316] transition-colors">
                            {o.title}
                          </span>
                          <time
                            dateTime={`${o.publishedAt}T00:00:00.000Z`}
                            className="text-xs text-gray-400"
                          >
                            {formatChineseDate(o.publishedAt)}
                          </time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </article>
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

function ArrowLeft() {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function formatChineseDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  if (!y || !m || !d) return iso;
  return `${y}年${m}月${d}日`;
}

function renderArticleBody(body: string): React.ReactNode {
  const blocks: React.ReactNode[] = [];
  const lines = body.split(/\r?\n/);
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, "");
      blocks.push(
        <h2
          key={key++}
          className="text-xl font-bold text-gray-900 mt-8 mb-3"
        >
          {renderInline(text)}
        </h2>,
      );
      i++;
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      const text = trimmed.replace(/^#\s+/, "");
      blocks.push(
        <h1
          key={key++}
          className="text-2xl font-bold text-gray-900 mt-8 mb-3"
        >
          {renderInline(text)}
        </h1>,
      );
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul
          key={key++}
          className="list-disc pl-6 my-3 space-y-1 text-gray-800"
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={key++}
          className="list-decimal pl-6 my-3 space-y-1 text-gray-800"
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-8 border-gray-200" />);
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (
        !cur ||
        /^#{1,3}\s+/.test(cur) ||
        /^[-*]\s+/.test(cur) ||
        /^\d+\.\s+/.test(cur) ||
        /^---+$/.test(cur)
      )
        break;
      para.push(cur);
      i++;
    }
    if (para.length > 0) {
      blocks.push(
        <p
          key={key++}
          className="text-gray-800 leading-relaxed my-3"
        >
          {renderInline(para.join(" "))}
        </p>,
      );
    }
  }
  return <>{blocks}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="text-gray-900 font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-gray-100 px-1 text-sm"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}