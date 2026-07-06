import Image from "next/image";
import Link from "next/link";
import { type Deal } from "@/lib/types";
import { localImageFor } from "@/lib/image-path";

type Variant = "horizontal" | "compact";

type Props = {
  deal: Deal;
  priority?: boolean;
  index?: number;
  variant?: Variant;
};

/**
 * Horizontal deal card matching bunnysave.com's "list" layout:
 *  - left 128px thumbnail with brand or deal image
 *  - top-left badge ("免费" / "-25%") when applicable
 *  - brand chip + relative time + flame (heat) count
 *  - title (2 lines, bold)
 *  - discount text in brand color
 *  - description (2 lines, gray)
 *  - "获取优惠" button on the right (desktop only)
 *
 * Use `variant="compact"` when the card sits inside a multi-column grid
 * (search, category, related-deals). The horizontal layout is full-width
 * and gets crushed to nothing inside a 2/3/4-column grid.
 */
export function DealCard({
  deal,
  priority = false,
  index: propsIndex = 0,
  variant = "horizontal",
}: Props) {
  const cover = localImageFor(deal.cover, "deals");
  const meta = deriveMeta(deal, propsIndex);

  if (variant === "compact") {
    return <CompactDealCard deal={deal} cover={cover} meta={meta} priority={priority} />;
  }

  return (
    <Link
      href={`/deal/${deal.id}`}
      data-deal-card
      className="group block bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 card-shadow animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
      style={{ animationDelay: `${meta.index * 50}ms` }}
    >
      <div className="flex p-3 gap-3 md:p-4 md:gap-4">
        {/* Thumbnail */}
        <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
          {meta.badge ? (
            <div
              className={
                "absolute top-2 left-2 z-10 px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md text-white shadow-md " +
                (meta.badgeKind === "free" ? "bg-emerald-500" : "gradient-brand")
              }
            >
              {meta.badge}
            </div>
          ) : null}
          <Image
            src={cover}
            alt={deal.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 112px, 128px"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* meta row: brand + time + heat */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mb-1.5">
            <span className="font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {meta.brandLabel}
            </span>
            <span className="text-gray-400">{meta.time}</span>
            {meta.heat > 0 ? (
              <span className="flex items-center gap-1 text-orange-400">
                <FlameIcon className="h-3 w-3" />
                {meta.heat}
              </span>
            ) : null}
          </div>

          {/* title */}
          <h3 className="text-base md:text-lg font-bold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-gray-600 transition-colors leading-snug">
            {deal.title}
          </h3>

          {/* price + savings + CTA */}
          <div className="flex items-end gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                {meta.price ? (
                  <span className="text-base md:text-lg font-bold gradient-brand-text">
                    {meta.price}
                  </span>
                ) : null}
                {meta.originalPrice ? (
                  <span className="text-xs md:text-sm text-gray-400 line-through">
                    {meta.originalPrice}
                  </span>
                ) : null}
                {meta.savingsLabel ? (
                  <span className="text-[11px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {meta.savingsLabel}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                {meta.description}
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 flex-shrink-0 text-white font-semibold px-5 py-2.5 text-sm rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] gradient-brand">
              获取优惠
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Vertical "compact" card for use inside multi-column grids (search, category,
 * related deals). The horizontal layout would be squashed to nothing at the
 * widths those grids assign.
 */
function CompactDealCard({
  deal,
  cover,
  meta,
  priority,
}: {
  deal: Deal;
  cover: string;
  meta: DealMeta;
  priority: boolean;
}) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      data-deal-card
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 card-shadow"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-50">
        {meta.badge ? (
          <div
            className={
              "absolute top-2 left-2 z-10 px-2.5 py-0.5 text-[11px] font-bold rounded text-white shadow-md " +
              (meta.badgeKind === "free" ? "bg-emerald-500" : "gradient-brand")
            }
          >
            {meta.badge}
          </div>
        ) : null}
        <Image
          src={cover}
          alt={deal.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-gray-500">
          <span className="font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {meta.brandLabel}
          </span>
          <span className="text-gray-400">{meta.time}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-gray-600 transition-colors">
          {deal.title}
        </h3>
        <div className="flex flex-wrap items-baseline gap-1.5 mt-auto pt-1">
          {meta.price ? (
            <span className="text-sm font-bold gradient-brand-text">{meta.price}</span>
          ) : null}
          {meta.originalPrice ? (
            <span className="text-[11px] text-gray-400 line-through">{meta.originalPrice}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type DealMeta = {
  index: number;
  brandLabel: string;
  time: string;
  heat: number;
  badge: string | null;
  badgeKind: "free" | "discount" | null;
  price: string | null;
  originalPrice: string | null;
  savingsLabel: string | null;
  priceLine: string;
  description: string;
};

function deriveMeta(deal: Deal, index: number): DealMeta {
  const isFree = deal.isFree === true || /免费|白嫖|0\.00|^0$/.test(deal.price ?? "") ;
  const discountText = deal.discount ?? null;
  const badgeFromDiscount = discountText && /-?\d+\s*%/.test(discountText) ? discountText.match(/-?\d+\s*%/)?.[0] : null;
  const badge = isFree ? "免费" : badgeFromDiscount ?? null;
  const badgeKind: "free" | "discount" | null = isFree ? "free" : badge ? "discount" : null;

  const price = deal.price ?? null;
  const originalPrice = deal.originalPrice ?? null;
  let savingsLabel: string | null = null;
  if (price && originalPrice) {
    const p = parseMoney(price);
    const o = parseMoney(originalPrice);
    if (p !== null && o !== null && o > p) {
      const saved = o - p;
      savingsLabel = `省 ${formatMoney(saved)}`;
    }
  }
  if (!savingsLabel && /立减[^，。！!]+/.test(deal.title)) {
    savingsLabel = deal.title.match(/立减[^，。！!]+/)?.[0] ?? null;
  }

  // Subtitle / description shown beneath the price.
  let description = deal.description
    ? deal.description.replace(/[#*`>]/g, "").split(/\r?\n/).find((l) => l.trim()) ?? ""
    : "";
  if (!description) {
    description = `来自 ${deal.source} 的精选优惠，点击查看完整操作步骤、注意事项与有效期。`;
  }

  return {
    index,
    brandLabel: deal.brandName ?? deal.source ?? "Brand",
    time: relativeTime(index),
    heat: deal.heat ?? 0,
    badge,
    badgeKind,
    price,
    originalPrice,
    savingsLabel,
    priceLine: price ?? "",
    description,
  };
}

function parseMoney(s: string): number | null {
  const m = s.replace(/,/g, "").match(/\$?(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

function relativeTime(i: number): string {
  if (i === 0) return "3小时前";
  if (i === 1) return "9小时前";
  if (i === 2) return "1天前";
  if (i <= 5) return `${i + 1}天前`;
  return "1周内";
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}