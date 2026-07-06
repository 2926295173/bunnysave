export type Deal = {
  id: string;
  title: string;
  brandId: string | null;
  brandName: string | null;
  brandLogo: string | null;
  cover: string;
  cta: string | null;
  source: string;
  price: string | null;
  originalPrice: string | null;
  discount: string | null;
  description: string | null;
  isFree: boolean;
  isHot: boolean;
  heat: number;
  publishedAt: number;
  validThrough: number | null;
};

export type Brand = {
  id: string;
  name: string;
  logo: string;
  dealCount?: number;
};

export type Category = {
  slug: string;
  label: string;
  description: string;
};