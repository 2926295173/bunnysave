"use client";

import { useState } from "react";

export function DealTabs({
  description,
  info,
}: {
  description: string | null;
  info: {
    brand: string | null;
    source: string;
    price: string | null;
    discount: string | null;
    isFree: boolean;
    isHot: boolean;
    cta: string | null;
  };
}) {
  const [tab, setTab] = useState<"details" | "info">("details");
  return (
    <>
      <div className="border-b border-gray-100">
        <div className="flex" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            onClick={() => setTab("details")}
            className={
              "px-6 py-3 text-sm font-medium transition-colors " +
              (tab === "details"
                ? "text-[#F97316] border-b-2 border-[#F97316]"
                : "text-gray-500 hover:text-gray-800")
            }
          >
            优惠详情
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            onClick={() => setTab("info")}
            className={
              "px-6 py-3 text-sm font-medium transition-colors " +
              (tab === "info"
                ? "text-[#F97316] border-b-2 border-[#F97316]"
                : "text-gray-500 hover:text-gray-800")
            }
          >
            产品信息
          </button>
        </div>
      </div>

      {tab === "details" ? (
        <DetailsBody description={description} />
      ) : (
        <InfoBody deal={info} />
      )}
    </>
  );
}

function DetailsBody({ description }: { description: string | null }) {
  return (
    <div className="p-6">
      <MarkdownBody source={description} />
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="font-semibold text-bunny-ink mb-3">注意：</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>价格和库存可能随时变动，恕不另行通知</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>请访问零售商网站获取最新价格</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function InfoBody({
  deal,
}: {
  deal: { brand: string | null; source: string; price: string | null; discount: string | null; isFree: boolean; isHot: boolean; cta: string | null };
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "品牌", value: deal.brand ?? "—" },
    { label: "零售商", value: deal.source },
    { label: "分类", value: deal.isFree ? "免费 / 超低价" : deal.isHot ? "热门优惠" : "常规优惠" },
  ];
  if (deal.price) rows.push({ label: "价格", value: <span className="font-mono">{deal.price}</span> });
  if (deal.discount) rows.push({ label: "折扣", value: <span className="font-mono">{deal.discount}</span> });
  if (deal.cta) {
    rows.push({
      label: "商家链接",
      value: (
        <a
          href={deal.cta}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="break-all text-[#F97316] hover:underline"
        >
          {deal.cta}
        </a>
      ),
    });
  }
  rows.push({
    label: "数据来源",
    value: <span className="text-gray-500">bunnysave.com 自动采集</span>,
  });

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-gray-500">
        以下是该优惠的元数据。具体规格 / 保修 / 配送等信息请通过商家页面查看。
      </p>
      <dl className="divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-4 py-2.5 text-sm">
            <dt className="w-20 flex-shrink-0 text-gray-500">{r.label}</dt>
            <dd className="flex-1 break-words text-gray-800">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Minimal markdown: paragraphs, **bold**, lists, headings. */
function MarkdownBody({ source }: { source: string | null }) {
  if (!source || !source.trim()) {
    return (
      <div className="prose prose-base max-w-none prose-gray prose-p:text-gray-800 prose-p:leading-relaxed">
        <p>
          这是一条来自 {`bunnysave.com`} 的精选优惠。点击上方&ldquo;点击前往商家&rdquo;按钮查看完整优惠信息。
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

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Order matters: markdown links [text](url) → bold/code/em → bare http(s):// links.
  const regex =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="text-bunny-ink font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code key={key++} className="rounded bg-gray-100 px-1 text-sm">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("*")) {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        parts.push(
          <LinkAuto key={key++} href={href}>
            {label}
          </LinkAuto>,
        );
      } else {
        parts.push(tok);
      }
    } else if (/^https?:\/\//.test(tok)) {
      parts.push(
        <LinkAuto key={key++} href={tok}>
          {tok}
        </LinkAuto>,
      );
    } else {
      parts.push(tok);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function LinkAuto({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="text-[#F97316] no-underline hover:underline"
    >
      {children}
    </a>
  );
}
