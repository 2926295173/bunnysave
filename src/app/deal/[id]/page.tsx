import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getDealFull, getDeals, getBrands, localImageFor } from "@/lib/deals";
import { DealCard } from "@/components/DealCard";
import { Sidebar } from "@/components/Sidebar";
import { CoverLightbox } from "@/components/deal/CoverLightbox";
import { DealTabs } from "@/components/deal/DealTabs";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  if (!process.env.DATABASE_URL && !process.env.AUTH_DB_URL) return [];
  try {
    const deals = await getDeals();
    return deals.map((d) => ({ id: d.id }));
  } catch (err) {
    console.warn("[generateStaticParams] skipping —", (err as Error).message);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDealFull(id);
  if (!deal) return { title: "优惠不存在" };
  const desc = deal.description
    ? deal.description.replace(/\*\*|`/g, "").slice(0, 160)
    : deal.title;
  return {
    title: deal.title,
    description: desc,
    openGraph: { title: deal.title, description: desc, images: [localImageFor(deal.cover, "deals")] },
  };
}

export default async function DealDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const deal = await getDealFull(id);
  if (!deal) notFound();

  const [allDeals, brands] = await Promise.all([
    getDeals(),
    getBrands(),
  ]);
  const related = allDeals.filter((d) => d.id !== deal.id).slice(0, 5);

  const ctaHref = deal.cta ?? "https://www.bunnysave.com/";
  const discountBadge = deal.discount?.match(/(\d+)\s*%/)?.[0] ?? null;
  const subline = deal.discount?.replace(/-/, "").replace(/\d+\s*%/, "").trim() || null;
  const dealDate = formatDate(deal.publishedAt);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="面包屑" className="mb-4 text-sm text-bunny-muted">
            <ol className="flex items-center gap-2 overflow-hidden">
              <li>
                <Link href="/" className="hover:text-bunny-accent whitespace-nowrap">首页</Link>
              </li>
              <li>
                <ChevronRight />
                <Link
                  href={`/category/daily-deals`}
                  className="ml-2 hover:text-bunny-accent whitespace-nowrap"
                >
                  每日优惠
                </Link>
              </li>
              <li className="min-w-0">
                <ChevronRight />
                <span className="ml-2 text-bunny-ink truncate">{deal.title}</span>
              </li>
            </ol>
          </nav>

          {/* Hero card */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Square image (288px on lg) */}
                <div className="lg:w-72 flex-shrink-0">
                  <CoverLightbox
                    src={localImageFor(deal.cover, "deals")}
                    alt={deal.title}
                    sizes="(max-width: 1024px) 100vw, 288px"
                  />
                </div>

                {/* Title + CTA */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-sm text-bunny-muted mb-3">
                    {deal.brandName ? (
                      <Link
                        href={deal.brandId ? `/search?q=${encodeURIComponent(deal.brandName)}` : "#"}
                        className="font-medium hover:underline"
                        style={{ color: "#F97316" }}
                      >
                        {deal.brandName}
                      </Link>
                    ) : (
                      <span className="font-medium" style={{ color: "#F97316" }}>{deal.source}</span>
                    )}
                    <span>•</span>
                    <span>{dealDate}</span>
                  </div>

                  <h1 className="text-xl lg:text-2xl font-bold text-bunny-ink mb-2">{deal.title}</h1>

                  {deal.price ? (
                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                      {deal.price}
                    </p>
                  ) : null}

                  {subline ? (
                    <p className="text-base font-semibold mb-4" style={{ color: "#F97316" }}>
                      {subline}
                    </p>
                  ) : null}

                  {discountBadge ? (
                    <div className="mb-5">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span
                          className="inline-flex items-center px-3 py-1 text-white text-sm font-semibold rounded-full"
                          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
                        >
                          -{discountBadge}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 sm:gap-3">
                    <a
                      href={ctaHref}
                      rel="sponsored nofollow noopener noreferrer"
                      target="_blank"
                      className="flex-1 min-w-0"
                    >
                      <button
                        className="w-full text-sm sm:text-base py-4 text-white font-semibold rounded-2xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] truncate"
                        style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
                      >
                        点击前往{deal.brandName ? ` ${deal.brandName}` : "商家"}!
                      </button>
                    </a>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="分享"
                        aria-label="分享"
                        className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <ShareIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        title="收藏此优惠"
                        aria-label="收藏此优惠"
                        className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-500"
                      >
                        <BookmarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-100">
              <DealTabs
                description={deal.description}
                info={{
                  brand: deal.brandName,
                  source: deal.source,
                  price: deal.price,
                  discount: deal.discount,
                  isFree: deal.isFree,
                  isHot: deal.isHot,
                  cta: deal.cta,
                }}
              />
            </div>
          </div>

          {/* Related deals — single column, horizontal cards */}
          <section aria-labelledby="related-heading" className="mt-8 md:mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 id="related-heading" className="text-xl md:text-2xl font-bold text-bunny-ink">
                相关优惠
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {related.map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24">
            <Sidebar latestDeals={allDeals} brands={brands} showFollowUs />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Minimal markdown: paragraphs, **bold**, lists (`-` and `1.`), headings. */
function MarkdownBody({ source }: { source: string | null }) {
  if (!source || !source.trim()) {
    return (
      <div className="prose prose-base max-w-none prose-gray prose-p:text-gray-800 prose-p:leading-relaxed">
        <p>
          这是一条来自 {`bunnysave.com`} 的精选优惠。点击上方"点击前往商家"按钮查看完整优惠信息。
        </p>
      </div>
    );
  }

  const blocks: React.ReactElement[] = [];
  const lines = source.split(/\r?\n/);
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Heading
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = (trimmed.match(/^#+/) ?? [""])[0].length;
      const text = trimmed.replace(/^#+\s+/, "");
      const Tag = (`h${Math.min(level + 1, 6)}`) as "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <Tag key={key++} className={level === 1 ? "text-xl font-bold mt-4 mb-2" : "text-base font-bold mt-3 mb-1"}>
          {renderInline(text)}
        </Tag>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-6 my-2 space-y-0.5 text-gray-800">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-6 my-2 space-y-0.5 text-gray-800">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (collect until blank or block start)
    const para: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (!cur || /^#{1,3}\s+/.test(cur) || /^[-*]\s+/.test(cur) || /^\d+\.\s+/.test(cur)) {
        break;
      }
      para.push(cur);
      i++;
    }
    if (para.length > 0) {
      blocks.push(
        <p key={key++} className="text-gray-800 leading-relaxed my-2">
          {renderInline(para.join(" "))}
        </p>,
      );
    }
  }

  return <div className="prose prose-base max-w-none prose-gray">{blocks}</div>;
}

/** Render `**bold**`, `*italic*`, and `inline code` as React nodes. */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={key++} className="text-bunny-ink font-semibold">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      parts.push(<code key={key++} className="rounded bg-gray-100 px-1 text-sm">{tok.slice(1, -1)}</code>);
    } else {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function formatDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
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
      className="inline h-4 w-4 text-gray-300"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
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
      className={className}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

export const dynamic = "force-dynamic";
