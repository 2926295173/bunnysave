import { SITE } from "@/lib/site";

type Crumb = { name: string; url: string };

export function ProductJsonLd({
  name,
  description,
  image,
  url,
  sellerName,
  sellerUrl,
  validThroughIso,
  publishedIso,
}: {
  name: string;
  description: string;
  image: string;
  url: string;
  sellerName: string;
  sellerUrl: string;
  validThroughIso: string | null;
  publishedIso: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    inLanguage: "zh-CN",
    datePublished: publishedIso,
    offers: {
      "@type": "Offer",
      url,
      availability: validThroughIso
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: sellerName,
        url: sellerUrl,
      },
      ...(validThroughIso ? { validThrough: validThroughIso } : {}),
    },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const baseUrl = SITE.url;
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    inLanguage: "zh-CN",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${baseUrl}${it.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
