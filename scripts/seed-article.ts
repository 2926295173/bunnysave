import "dotenv/config";
import { fetchOne, exec, asStringArray } from "../src/lib/db";
import { ARTICLES } from "../src/data/articles";

/**
 * One-off seed: insert or update a curated blog article directly into the
 * `articles` table. Used when we cannot reach the admin UI (e.g. local
 * automation, CI) or to backfill content curated outside the dashboard.
 *
 * Usage:
 *   pnpm tsx scripts/seed-article.ts
 *   pnpm tsx scripts/seed-article.ts --slug=foo --force
 */

const ARTICLES_BY_SLUG = ARTICLES.reduce<Record<string, (typeof ARTICLES)[number]>>(
  (acc, a) => {
    acc[a.slug] = a;
    return acc;
  },
  {},
);

type CliFlags = { slug?: string; force: boolean };

function parseArgs(): CliFlags {
  const out: CliFlags = { force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") out.force = true;
    else if (arg.startsWith("--slug=")) out.slug = arg.slice("--slug=".length).trim();
  }
  return out;
}

async function main() {
  const flags = parseArgs();
  const article = SEED_ARTICLE;
  if (flags.slug && flags.slug !== article.slug) {
    throw new Error(`This seed script only inserts slug "${article.slug}"`);
  }

  // Refuse to overwrite an existing row unless --force is passed.
  const existing = await fetchOne<{ slug: string }>(
    "SELECT slug FROM articles WHERE slug = $1",
    [article.slug],
  );
  if (existing && !flags.force) {
    console.log(`[seed-article] ${article.slug} already exists — pass --force to overwrite`);
    return;
  }

  const epoch = Math.floor(new Date(`${article.publishedAt}T00:00:00.000Z`).getTime() / 1000);

  if (existing) {
    await exec(
      `UPDATE articles SET
         title = $2,
         excerpt = $3,
         cover = $4,
         tags = $5::text[],
         body = $6,
         status = 'published',
         published_at = $7,
         updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT
       WHERE slug = $1`,
      [article.slug, article.title, article.excerpt, article.cover, article.tags, article.body, epoch],
    );
    console.log(`[seed-article] updated ${article.slug}`);
  } else {
    await exec(
      `INSERT INTO articles (slug, title, excerpt, cover, tags, body, status, published_at)
       VALUES ($1, $2, $3, $4, $5::text[], $6, 'published', $7)`,
      [article.slug, article.title, article.excerpt, article.cover, article.tags, article.body, epoch],
    );
    console.log(`[seed-article] inserted ${article.slug}`);
  }
  // Smoke check that the array column round-trips.
  const row = await fetchOne<{ tags: unknown }>(
    "SELECT tags FROM articles WHERE slug = $1",
    [article.slug],
  );
  console.log(`[seed-article] tags round-trip = ${JSON.stringify(asStringArray(row?.tags))}`);
  // Helpful reminder if you also want to know which slug this came from.
  void ARTICLES_BY_SLUG;
}

const SEED_ARTICLE = {
  slug: "back-to-school-savings-2026",
  title: "2026 返校季省钱全攻略：买什么、什么时候买、怎么把折扣叠到最满",
  excerpt:
    "返校季是全年仅次于年末假日的第二大购物季——也是最容易花冤枉钱的一个。把七月和八月当成一个滚动窗口，每个品类都挑它最便宜的时机下手，并且能叠的折扣一个不落。",
  cover:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/School_Supplies.jpg/1280px-School_Supplies.jpg",
  tags: ["返校季", "省钱", "购物技巧", "电子产品"],
  publishedAt: "2026-07-08",
  body: `返校季是全年仅次于年末假日的第二大购物季——也是最容易花冤枉钱的一个：如果你赶在开学前一周慌慌张张一次买齐，几乎注定多付钱。真正会省的家庭，会把七月和八月当成一个滚动窗口，每个品类都挑它最便宜的时机下手，并且能叠的折扣一个不落。

下面是 2026 返校季的完整攻略。

## 时间线：该买还是该等

返校季的价格不是一次性见底，而是在大约八周里分批放出：

- **七月初到七月中** —— 电子产品，尤其是 **笔记本电脑和平板**。商家在 Prime Day 之后紧接着推出学生促销，而且（下面细说）今年价格是往上走、不是往下走的。这就是窗口期。
- **七月底到八月** —— **服装、鞋子和学习用品**。免税周末集中在这段时间，书包、笔记本、基础款的价格战打得最凶。
- **八月底到九月** —— **剩余用品和宿舍用品** 随着抢购潮结束进入清仓。只要不是急着用，等上几周就有回报。

## 买笔记本之前，先读这一段

平时的建议都是"等黑五"。 **但在 2026 年，这条建议对电脑可能是错的。** 内存价格（DRAM 和 SSD）正在大幅上涨，业内分析师预计到年底会把 PC 均价明显推高。多家商家已经在返校季促销中大力度降价清现款——这意味着七、八月的学生优惠很可能是你近期能见到的最好价格，甚至比假日季还划算。

如果今年你的清单上有笔记本，别干等到十一月。查一下价格历史、确认配置（16GB 内存 + 1TB 固态是能用得久的学生机甜点配置），现在看到真降价就出手。

## 免税周末：全季最大的省钱杠杆

大约 17 个州会举办返校季 **免税周末**——在这个周末，服装、学习用品、有些州甚至连电脑都免征销售税。买大件时，这相当于在促销价基础上再立减 4–9%，是整个返校季最被低估的省钱工具。

绝大多数免税周末落在 **2026 年七月底和八月的第一个周末**。几个例子：

- **密西西比州** —— 7 月 25–26 日
- **田纳西州** —— 7 月 31 日 – 8 月 2 日
- **得州、南卡、密苏里州** —— 八月第一个周末（约 8 月 7–9 日）；南卡尤其大方，电脑甚至床品都免税，且多数商品没有价格上限
- **佛州** —— 贯穿八月大半个月的长窗口
- **康涅狄格州** —— 八月中下旬（约 8 月 16–22 日）

**各州的规则和价格上限差别很大**——得州每件封顶 100 美元，康州封顶 300 美元，佛州学习用品封顶 50 美元。围绕免税周末计划大额采购前，一定先查清楚你所在州的确切日期和适用商品清单。

## 分品类攻略

**电子产品** —— 笔记本、平板、耳机。百思买、Target、沃尔玛以及各品牌官网（戴尔、联想、苹果教育优惠）会在同几周里打对台学生促销。按上面的预警，现在就买。

**服装鞋履** —— 如果你所在州有免税周末，等到那时再叠一层商家促销。夏末清仓也在这段时间重叠，基础款很便宜。

**学习用品** —— 大卖场和药妆连锁整个八月都会有引流特价（笔记本几美分、文件夹和笔白菜价）。无聊的通用品趁早买，别等挑到没货；等确定了具体课程要求，再买专用的那些。

**宿舍与家居** —— 收纳、床品、小家电、整理用品，和夏末家居清仓重叠。必需品现在买；不急的等八月底那波降价再入。

## 把折扣叠满

最大的省钱空间来自层层叠加，而不是任何单张优惠券：

1. **学生／教师折扣** —— 用 \`.edu\` 邮箱在 UNiDAYS 或 Student Beans 认证，很多品牌常年悄悄给 10–20%。
2. **免税周末** —— 把大额采购卡在这个时点。
3. **商家促销或清仓价** —— 基础折扣。
4. **结账优惠码** —— 可叠加的概率比你想的高。
5. **返现** —— 通过返利平台或合适的信用卡。

叠上三四层，一次普通促销就能变成真正划算的好交易。

## 现在该跳过什么

别囤那些九月清仓能更便宜买到的用品；任何电子产品，不先查价格历史就别按原价买——一个其实就是日常价的"返校特价"，那还是原价。`,
};

main().catch((err) => {
  console.error("[seed-article] failed:", err);
  process.exit(1);
});