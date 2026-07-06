/**
 * Curated long-form articles shown on /articles and /articles/[slug].
 *
 * The page itself (bunnysave.com/articles) only ships two entries, so we
 * hard-code them here rather than building a DB-backed CMS. Each entry keeps
 * the exact cover image, tags, and publication metadata shown on the official
 * site, plus a light-weight markdown body for the detail page.
 */

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  tags: string[];
  publishedAt: string; // ISO 8601 (YYYY-MM-DD)
  body: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "best-time-to-buy-calendar",
    title: "一年中什么时候买什么最便宜：逐月购物日历",
    excerpt:
      "价格波动其实有章可循。这份逐月购物日历告诉你电子产品、家具、服装、家电等品类的最佳购买时机，让你提前规划、告别追着促销跑。",
    cover:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80",
    tags: ["购物日历", "省钱", "购物技巧"],
    publishedAt: "2026-07-05",
    body: `电子产品（电视、笔记本、手机、平板等）每年都会有几个价格低谷，最稳的两个时间点是 **1月** 和 **7月**：年初清掉去年库存，7月则是 Back to School（开学季）和 Prime Day（亚马逊会员日）的双重叠加。\n\n## 家电\n\n大型家电（冰箱、洗衣机、烘干机、洗碗机）最便宜的月份集中在 **5月**（阵亡将士纪念日大促）和 **9月**（Labor Day + 厂商出新款清库存）。\n\n- 空调：4–5 月底\n- 除湿机、电暖器：反季节买最划算（夏季尾声买电暖器、冬季买除湿机）\n- 吸尘器：3 月与 8 月\n\n## 服装\n\n服装是典型的"换季前后两周最便宜"。春装在 3 月初打折、夏装 7 月初、秋装 10 月初、冬装 12 月底到次年 1 月初。\n\n1. 关注品牌季末促销（End of Season Sale）\n2. 用价格曲线工具（如 camelcamelcamel）观察历史最低\n3. 节日（Memorial Day、Black Friday、Cyber Monday）叠加额外 7–8 折\n\n## 家具\n\n家具的黄金窗口是 **2 月**（总统日周末）和 **Labor Day 前后**（9 月初）。这两个时段大型家居电商几乎全年同步促销。\n\n## 旅行\n\n机票最早提前 6–8 周订阅价格曲线最划算；酒店的低价集中在 **1 月中–2 月初** 和 **8 月中下旬** 两次"逆峰"。\n\n## 美妆护肤\n\n- 节日礼盒（Holiday Sets）：11–12 月\n- Sephora/Ulta 春季促销：3 月\n- 礼品日叠加会员积分翻倍：4 月、11 月\n\n掌握这些节奏，加上节日叠加商家额外折扣，就能把"追着促销跑"变成"促销来找我"。`,
  },
  {
    slug: "smart-shopping-habits",
    title: "5 个每周都能帮你省钱的聪明购物习惯",
    excerpt:
      "一些简单又实用的购物习惯，帮你识别真正的优惠、避开营销陷阱，在日常消费中留住更多的钱。",
    cover:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    tags: ["购物技巧", "省钱", "优惠"],
    publishedAt: "2026-06-28",
    body: `日常消费里"被套路"的钱，往往比真正省下来的更多。下面 5 个习惯，能让你每周多省 5–15%。\n\n## 1. 设个"等待 24 小时"清单\n\n任何**非必需品**付款前先等 24 小时。放进购物车就不买，过 24 小时还想买再说。研究显示这样做能砍掉 30% 的冲动消费。\n\n## 2. 用价格曲线工具追历史最低\n\n无论 Amazon 还是 Best Buy、Target，几乎每个电商都有第三方价格历史插件（如 camelcamelcamel、PriceBlink）。\n\n- 当前价格 > 历史最低价 20%：等\n- 当前价格 ≤ 历史最低价 95%：直接下手\n\n## 3. 节日叠加礼品卡策略\n\n大型超市（Target、沃尔玛、Bath & Body Works）经常打折出售自家礼品卡或电子礼品卡，配合节日促销可拿到近 85 折。\n\n## 4. 订阅商品集中到日用类折扣季\n\n消耗品（卫生纸、洗衣液、纸尿裤、宠物粮）尽量囤在 **3 月**、**6 月**、**10 月** 这几个日用品促销季，避免日积月累贵了再买。\n\n## 5. 每周做一次"账单审计"\n\n周日花 15 分钟看一眼本周所有自动订阅：\n\n- 哪些不再用了？取消\n- 哪些有用但有更便宜的替代？对比迁移\n- 哪些可以拼车 / 拼账号？合并\n\n这一项平均一年能省几百到上千美元。\n\n---\n\n把上面 5 条慢慢养成习惯，半年后你再看自己的消费账单会发现，钱不知不觉就留下来了。`,
  },
];

export const ARTICLES_INDEX: Record<string, Article> = ARTICLES.reduce(
  (acc, a) => {
    acc[a.slug] = a;
    return acc;
  },
  {} as Record<string, Article>,
);
