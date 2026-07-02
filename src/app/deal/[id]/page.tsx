import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getDeal, localImageFor } from "@/lib/deals";
import { DealCard } from "@/components/DealCard";
import { getDeals } from "@/lib/deals";

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
  const deal = await getDeal(id);
  if (!deal) return { title: "优惠不存在" };
  return {
    title: deal.title,
    description: `${deal.title} — 来自${deal.source}的精选优惠`,
    openGraph: { title: deal.title, images: [localImageFor(deal.cover, "deals")] },
  };
}

export default async function DealDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const all = await getDeals();
  const related = all.filter((d) => d.id !== deal.id).slice(0, 4);

  return (
    <article className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <nav className="mb-4 text-sm text-bunny-muted" aria-label="面包屑">
        <Link href="/" className="hover:text-bunny-accent">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/category/daily-deals" className="hover:text-bunny-accent">每日精选</Link>
        <span className="mx-2">/</span>
        <span className="text-bunny-ink">{deal.title.slice(0, 30)}{deal.title.length > 30 ? "…" : ""}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight text-bunny-ink md:text-4xl">{deal.title}</h1>
        <p className="mt-2 text-sm text-bunny-muted">来源：{deal.source}</p>
      </header>

      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl bg-bunny-soft">
        <Image
          src={localImageFor(deal.cover, "deals")}
          alt={deal.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />
        {deal.brandLogo ? (
          <Image
            src={localImageFor(deal.brandLogo, "brands")}
            alt=""
            width={64}
            height={64}
            className="absolute left-4 top-4 h-14 w-14 rounded-full bg-white p-1 object-contain ring-2 ring-white/70"
          />
        ) : null}
      </div>

      <div className="prose prose-slate max-w-none rounded-2xl border border-bunny-line bg-white p-6">
        <h2 className="text-xl font-bold">优惠详情</h2>
        <p>这是一条来自 {deal.source} 的精选优惠。请通过下方按钮查看原始优惠信息。</p>
        <p>
          <a
            href={deal.cta ?? "https://www.bunnysave.com/"}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="inline-flex items-center gap-2 rounded-full bg-bunny-accent px-5 py-2 font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            查看完整优惠 →
          </a>
        </p>
        <h3>使用说明</h3>
        <ul>
          <li>部分优惠为限时或限地区，请仔细阅读商家页面条款。</li>
          <li>我们与商家可能有联盟合作关系 —— 通过我们的链接下单，商家会向我们支付佣金，<strong>不会</strong>增加你的任何费用。</li>
          <li>价格以结算页为准。如优惠失效，欢迎反馈。</li>
        </ul>
      </div>

      <section aria-labelledby="related-heading" className="mt-12">
        <h2 id="related-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-bunny-ink">相关优惠</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {related.map((d) => (
            <DealCard key={d.id} deal={d} variant="compact" />
          ))}
        </div>
      </section>
    </article>
  );
}

export const dynamic = "force-dynamic";
