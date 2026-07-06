import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDealFull, getDeals, getBrands, localImageFor } from "@/lib/deals";
import { fetchAll } from "@/lib/db";
import { DealCard } from "@/components/DealCard";
import { Sidebar } from "@/components/Sidebar";
import { CoverLightbox } from "@/components/deal/CoverLightbox";
import { DealTabs } from "@/components/deal/DealTabs";
import { ShoppingGuide } from "@/components/deal/ShoppingGuide";
import { MobileCtaBar } from "@/components/deal/MobileCtaBar";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/deal/JsonLd";

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
    other: deal.validThrough
      ? { "product:availability": "out of stock" }
      : {},
  };
}

export default async function DealDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const deal = await getDealFull(id);
  if (!deal) notFound();

  const [allDeals, brands, cats] = await Promise.all([
    getDeals(),
    getBrands(),
    fetchAll<{ slug: string }>(
      "SELECT category_slug AS slug FROM deal_categories WHERE deal_id = $1",
      [id],
    ),
  ]);
  const related = allDeals.filter((d) => d.id !== deal.id).slice(0, 5);

  const ctaHref = deal.cta ?? `https://www.google.com/search?q=${encodeURIComponent(deal.brandName ?? deal.title)}`;
  const parentCat = pickParent(cats.map((c) => c.slug));
  const parentHref = parentCat ? `/category/${parentCat}` : "/";
  const parentLabel = parentCat ? parentLabelFor(parentCat) : "优惠";
  const subCats = cats.filter((c) => c.slug !== parentCat).map((c) => c.slug);
  const subLabel = subCats[0] ? subLabelFor(subCats[0]) : null;

  const isAmazon = (deal.brandName ?? "").toLowerCase() === "amazon";
  const discountPct = deal.discount?.match(/(\d+)\s*%/)?.[0] ?? null;
  const priceNum = parseMoney(deal.price);
  const origNum = parseMoney(deal.originalPrice);
  const savings = priceNum !== null && origNum !== null && origNum > priceNum ? origNum - priceNum : null;
  const dealDate = formatDate(deal.publishedAt);
  const validThroughSec = deal.validThrough;
  const validThroughMs = validThroughSec !== null ? validThroughSec * 1000 : null;
  const isExpired = validThroughMs !== null && validThroughMs < Date.now();
  const validThroughDate = validThroughSec !== null ? formatFullDate(validThroughSec) : null;
  const offerJsonLdUrl = `/deal/${deal.id}`;
  const validThroughIso = validThroughSec !== null ? new Date(validThroughSec * 1000).toISOString() : null;

  return (
    <>
      <ProductJsonLd
        name={deal.title}
        description={deal.description ?? deal.title}
        image={localImageFor(deal.cover, "deals")}
        url={offerJsonLdUrl}
        sellerName={deal.brandName ?? deal.source}
        sellerUrl={ctaHref}
        validThroughIso={validThroughIso}
        publishedIso={new Date(deal.publishedAt * 1000).toISOString()}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", url: "/" },
          ...(parentCat
            ? [{ name: parentLabelFor(parentCat), url: `/category/${parentCat}` }]
            : []),
          ...(subCats[0]
            ? [{ name: subLabelFor(subCats[0]), url: `/category/${parentCat ?? "daily-deals"}/${subCats[0]}` }]
            : []),
          { name: deal.title, url: `/deal/${deal.id}` },
        ]}
      />

      {/* Breadcrumb band */}
      <div className="border-b border-gray-200 bg-white py-3 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          <nav aria-label="面包屑">
            <ol className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden">
              <li className="flex items-center gap-2 min-w-0 flex-shrink-0">
                <Link href="/" className="hover:text-[#F97316] transition-colors whitespace-nowrap">首页</Link>
              </li>
              {parentCat ? (
                <li className="flex items-center gap-2 min-w-0 flex-shrink-0">
                  <ChevronRight />
                  <Link href={parentHref} className="hover:text-[#F97316] transition-colors whitespace-nowrap">
                    {parentLabel}
                  </Link>
                </li>
              ) : null}
              {subLabel ? (
                <li className="flex items-center gap-2 min-w-0 flex-shrink-0">
                  <ChevronRight />
                  <Link
                    href={parentCat ? `/category/${parentCat}/${subCats[0]}` : "#"}
                    className="hover:text-[#F97316] transition-colors whitespace-nowrap"
                  >
                    {subLabel}
                  </Link>
                </li>
              ) : null}
              <li className="flex items-center gap-2 min-w-0 flex-shrink-0 last:min-w-0">
                <ChevronRight />
                <span className="text-gray-900 truncate">{deal.title}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Expired banner */}
      {isExpired ? (
        <div className="bg-red-50 border-b border-red-100">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangleIcon className="h-5 w-5" />
              <span className="font-medium">此优惠已过期</span>
              <span className="text-sm text-red-600">- 此优惠可能已失效</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                {/* Square image */}
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

                  <h1 className="text-xl lg:text-2xl font-bold text-bunny-ink mb-3 leading-snug">
                    {deal.title}
                  </h1>

                  {/* Price block — mimics bunnysave.com layout */}
                  <div className="mb-4 flex flex-wrap items-baseline gap-3">
                    {deal.price ? (
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {deal.price}
                      </span>
                    ) : null}
                    {deal.originalPrice ? (
                      <span className="text-lg text-gray-400 line-through">{deal.originalPrice}</span>
                    ) : null}
                    {discountPct ? (
                      <span
                        className="inline-flex items-center px-2.5 py-1 text-white text-sm font-semibold rounded-full"
                        style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
                      >
                        {discountPct}
                      </span>
                    ) : null}
                    {savings !== null ? (
                      <span className="inline-flex items-center px-2.5 py-1 text-emerald-700 text-sm font-semibold bg-emerald-50 rounded-full">
                        您节省了 ${savings.toFixed(2).replace(/\.00$/, "")}!
                      </span>
                    ) : null}
                  </div>

                  {/* Subtitle = discount description */}
                  {deal.discount && !/^\s*-?\d+\s*%\s*$/.test(deal.discount) ? (
                    <p className="text-base font-semibold mb-5" style={{ color: "#F97316" }}>
                      {deal.discount}
                    </p>
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
                        点击前往 {deal.brandName ?? "商家"}!
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

                  {/* Expired line under CTA */}
                  {isExpired && validThroughDate ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        已过期：<>{validThroughDate}</>
                      </span>
                    </div>
                  ) : null}

                  {/* Amazon Prime hint */}
                  {isAmazon ? (
                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                      <span className="text-2xl" aria-hidden="true">📦</span>
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold text-bunny-ink">Amazon 购物提示</p>
                        <p className="mt-1">
                          还没有 Prime 会员？
                          <a
                            href="https://amzn.to/4p9c8xk"
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="ml-1 font-semibold text-[#F97316] hover:underline"
                          >
                            点击这里
                          </a>
                          免费试用 30 天，随时可取消。Prime 会员享免费快递、流媒体等多项权益。
                        </p>
                      </div>
                    </div>
                  ) : null}
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

          {/* Related deals */}
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

          {/* Shopping guide */}
          <ShoppingGuide />
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24">
            <Sidebar latestDeals={allDeals} brands={brands} showFollowUs />
          </div>
        </aside>
      </div>
    </div>

      <MobileCtaBar href={ctaHref} label={`点击前往 ${deal.brandName ?? "商家"}`} />
    </>
  );
}

function pickParent(slugs: string[]): string | null {
  // Prefer the known parent slugs.
  const parents = ["daily-deals", "freebies", "financial", "other"];
  for (const p of parents) if (slugs.includes(p)) return p;
  return slugs[0] ?? null;
}

function parentLabelFor(slug: string): string {
  switch (slug) {
    case "daily-deals": return "每日优惠";
    case "freebies": return "免费薅羊毛";
    case "financial": return "金融理财";
    case "other": return "其他";
    default: return slug;
  }
}

function subLabelFor(slug: string): string {
  switch (slug) {
    case "electronics": return "电子产品";
    case "household": return "家居";
    case "fashion": return "服饰";
    case "beauty": return "美妆";
    case "food-grocery": return "美食杂货";
    case "travel": return "旅行";
    case "coupons": return "优惠券";
    case "credit-cards": return "信用卡";
    case "banks": return "银行";
    case "class-action-settlement": return "集体诉讼";
    default: return slug;
  }
}

function parseMoney(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/\$?(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function formatDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatFullDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}