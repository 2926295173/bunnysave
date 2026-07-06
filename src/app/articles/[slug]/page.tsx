import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getArticle, getArticleSlugs, getArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
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
  const article = getArticle(slug);
  if (!article) notFound();

  const all = getArticles();
  const others = all.filter((a) => a.slug !== article.slug).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.cover,
    inLanguage: "zh-CN",
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/images/site/icon.png`,
      },
    },
    mainEntityOfPage: `${SITE.url}/articles/${article.slug}`,
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
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
                <Link
                  href="/articles"
                  className="hover:text-[#F97316] transition-colors whitespace-nowrap"
                >
                  文章
                </Link>
              </li>
              <li className="flex items-center gap-2 min-w-0">
                <ChevronRight />
                <span className="text-gray-900 truncate">
                  {article.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8">
        {/* Cover */}
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gray-100 mb-6">
          <Image
            src={article.cover}
            alt={article.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <time>{formatChineseDate(article.publishedAt)}</time>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            {article.excerpt}
          </p>
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
        </header>

        {/* Body */}
        <div className="prose prose-base max-w-none prose-gray prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-a:text-[#F97316] prose-a:no-underline hover:prose-a:underline prose-li:text-gray-800 prose-strong:text-gray-900">
          {renderArticleBody(article.body)}
        </div>

        {/* Related */}
        {others.length > 0 ? (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              更多文章
            </h2>
            <div className="space-y-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/articles/${o.slug}`}
                  className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.cover}
                    alt={o.title}
                    loading="lazy"
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#F97316] transition-colors">
                      {o.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatChineseDate(o.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
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
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  if (!y || !m || !d) return iso;
  return `${y}年${m}月${d}日`;
}

function renderArticleBody(body: string): React.ReactNode {
  // Render the article markdown body. Supports: paragraphs, ## headings,
  // ordered + unordered lists, **bold**, `code`, and blank-line separation —
  // matching what the curated articles need without pulling in remark.
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
    if (/^---+$/.test(trimmed)) {
      blocks.push(
        <hr
          key={key++}
          className="my-8 border-gray-200"
        />,
      );
      continue;
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
  return parts;
}
