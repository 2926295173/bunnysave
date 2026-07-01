export type Deal = {
  id: string;
  title: string;
  brandLogo: string | null;
  cover: string;
  cta: string | null;
  source: string;
};

export type Brand = {
  id: string;
  name: string;
  logo: string;
};

export type Category = {
  slug: string;
  label: string;
  description: string;
};
