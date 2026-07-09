export const SITE = {
  name: "省钱兔",
  tagline: "优惠精选",
  url: "https://buy.codestory.top",
  enUrl: "https://dealselected.com",
  description:
    "发现最新最好的优惠、折扣码和省钱技巧。每日更新，不错过任何优惠。",
  twitter: "https://x.com/DealSelected",
  facebook: "https://www.facebook.com/people/Deal-Selected/61585141210415/",
  email: "hello@buy.codestory.top",
  emailContact: "hello@buy.codestory.top",
  emailBusiness: "business@buy.codestory.top",
} as const;

export type SiteConfig = typeof SITE;
