import { Suspense } from "react";
import type { Metadata } from "next";
import CampaignsClient from "./campaigns-client";
import { CampaignCardSkeleton } from "@/components/user/campaign-card-skeleton";
import { HotelRefTracker } from "@/components/shared/hotel-ref-tracker";

export const metadata: Metadata = {
  title: "韓國體驗團活動列表 | 天下 Tianxia",
  description: "瀏覽最新韓國體驗團活動！美食、咖啡廳、美容等免費體驗機會，用 Instagram 分享你的首爾打卡體驗。立即申請，讓品牌看見你！",
  keywords: ["韓國體驗團", "首爾美食體驗", "韓國免費活動", "Instagram合作", "網紅合作", "KOL", "打卡", "首爾咖啡廳", "韓國美容", "체험단"],
  alternates: {
    canonical: "/campaigns",
  },
  openGraph: {
    title: "韓國體驗團活動列表 | 天下 Tianxia",
    description: "瀏覽最新韓國體驗團活動！美食、咖啡廳、美容等免費體驗機會，立即申請。",
    type: "website",
  },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <HotelRefTracker />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <CampaignsClient />
      </Suspense>
    </>
  );
}
