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
    default: "天下 Tianxia - 韓國體驗團平台",
    template: "%s | 天下 Tianxia",
  },
  description: "探索並申請韓國精選體驗團活動，免費體驗美食、咖啡、美容等各種服務",
  keywords: ["體驗團", "韓國", "免費體驗", "美食", "咖啡", "美容", "Instagram", "YouTube"],
  authors: [{ name: "Tianxia" }],
  creator: "Tianxia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "天下 Tianxia",
    title: "天下 Tianxia - 韓國體驗團平台",
    description: "探索並申請韓國精選體驗團活動，免費體驗美食、咖啡、美容等各種服務",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "天下 Tianxia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "天下 Tianxia - 韓國體驗團平台",
    description: "探索並申請韓國精選體驗團活動",
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
  return (
    <html lang="zh-TW">
      <body
        className={`${notoSansTC.variable} ${notoSansKR.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
