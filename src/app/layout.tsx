import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "天下 Tianxia - 台灣人的韓國體驗團平台",
    template: "%s | 天下 Tianxia",
  },
  description: "天下 Tianxia 是專為台灣人打造的韓國體驗團平台。免費體驗首爾美食、咖啡廳、美容等精選活動，用 Instagram 分享打卡體驗，讓品牌看見你！",
  keywords: [
    "韓國體驗團", "首爾打卡", "台灣網紅", "KOL合作", "免費體驗", "韓國美食",
    "首爾咖啡廳", "韓國美容", "Instagram合作", "體驗報告", "Threads合作",
    "韓國旅遊", "首爾旅遊", "去韓國", "韓國自由行", "체험단",
  ],
  authors: [{ name: "Tianxia" }],
  creator: "Tianxia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "天下 Tianxia",
    title: "天下 Tianxia - 台灣人的韓國體驗團平台",
    description: "免費體驗首爾美食、咖啡廳、美容等精選活動，用 Instagram 分享打卡體驗！",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "天下 Tianxia - 韓國體驗團平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "天下 Tianxia - 台灣人的韓國體驗團平台",
    description: "免費體驗首爾美食、咖啡廳、美容！台灣網紅 KOL 韓國體驗團平台",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#DC2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "天下 Tianxia",
    alternateName: "天下體驗團平台",
    url: siteUrl,
    description: "專為台灣人打造的韓國體驗團平台，提供首爾美食、咖啡廳、美容等免費體驗機會。",
    inLanguage: "zh-TW",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/campaigns?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="zh-TW">
      <body
        className={`${notoSansTC.variable} ${notoSansKR.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
