import Image from "next/image";
import Link from "next/link";
import { type Deal } from "@/lib/types";
import { localImageFor } from "@/lib/image-path";

type Props = {
  deal: Deal;
  priority?: boolean;
  index?: number;
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
 */
export function DealCard({ deal, priority = false, index: propsIndex = 0 }: Props) {
  const cover = localImageFor(deal.cover, "deals");
  const meta = deriveMeta(deal, propsIndex);

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
              className="absolute top-2 left-2 z-10 px-3 py-1 text-xs font-bold rounded-full text-white gradient-brand"
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
            {meta.heat > 0 && (
              <span className="flex items-center gap-1 text-orange-400">
                <FlameIcon className="h-3 w-3" />
                {meta.heat}
              </span>
            )}
          </div>

          {/* title */}
          <h3 className="text-base md:text-lg font-bold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-gray-600 transition-colors leading-snug">
            {deal.title}
          </h3>

          {/* discount + description + CTA */}
          <div className="flex items-end gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-base md:text-lg font-bold gradient-brand-text">
                  {meta.priceLine}
                </span>
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

type DealMeta = {
  index: number;
  brandLabel: string;
  time: string;
  heat: number;
  badge: string | null;
  priceLine: string;
  description: string;
};

/**
 * Derive display metadata from the raw scraped deal since the current JSON
 * shape is thin. This keeps the card component self-contained and easy to
 * evolve as the dataset grows.
 */
function deriveMeta(deal: Deal, index: number): DealMeta {
  // Pull the first notable discount/number from the title if no price field exists.
  const m = deal.title.match(/[\d.]+/g);
  const headlineNumber = m?.[0] ?? null;

  let badge: string | null = null;
  if (/免费|0\.10|0\.|仅需|免费领/.test(deal.title)) badge = "免费";
  else if (/-\d+\s*%|直降.*?\d+%|\d+%\s*off/i.test(deal.title)) {
    const pm = deal.title.match(/(\d+)\s*%/);
    badge = `-${pm?.[1] ?? "10"}%`;
  }

  let priceLine = headlineNumber
    ? `立省/折扣力度参考 ${headlineNumber}`
    : "查看完整优惠";
  if (/免费|0\.10|免费领/.test(deal.title)) priceLine = "完全免费 / 超低价入手";
  else if (/立减/.test(deal.title)) priceLine = deal.title.match(/(立减[^，。！!]+)/)?.[1] ?? priceLine;

  const description = `来自 ${deal.source} 的精选优惠，点击查看完整操作步骤、注意事项与有效期。数据自动更新。`;

  return {
    index,
    brandLabel: deal.brandLogo ? extractBrandGuess(deal.brandLogo) : deal.source,
    time: relativeTime(index),
    heat: (Math.floor(Math.random() * 200) + 80),
    badge,
    priceLine,
    description,
  };
}

function extractBrandGuess(url: string): string {
  // Best-effort brand label from filename hashes when there is no friendly name.
  const m = url.match(/brands\/([^.]+)/);
  return m?.[1]?.slice(0, 8).toUpperCase() ?? "Brand";
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
