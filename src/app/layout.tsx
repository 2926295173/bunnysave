import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

const notoSC = Noto_Sans_SC({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sc",
  weight: ["400", "500", "700"],
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} - 每日精选优惠、折扣和优惠券 | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.tagline,
  authors: [{ name: SITE.name }],
  keywords: ["优惠", "折扣", "优惠券", "省钱", "特价", "deals", "coupons"],
  alternates: {
    canonical: SITE.url,
    languages: {
      "zh-CN": SITE.url,
      en: SITE.enUrl,
      "x-default": SITE.enUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE.url,
    siteName: SITE.tagline,
    title: `${SITE.name} - 每日精选优惠、折扣和优惠券`,
    description: SITE.description,
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} - 每日精选优惠、折扣和优惠券`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${jakarta.variable} ${notoSC.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" hrefLang="en" href={SITE.enUrl} />
        <link rel="alternate" hrefLang="zh" href={SITE.url} />
        <link rel="alternate" hrefLang="x-default" href={SITE.enUrl} />
        {GA_ID ? (
          <>
            <link
              rel="preload"
              href={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              as="script"
            />
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { transport_type: 'beacon' });`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <SessionProvider>
          <SiteConfigProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer />
          </SiteConfigProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
