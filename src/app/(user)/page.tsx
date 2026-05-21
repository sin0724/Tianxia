import { HomeClient } from "./home-client";
import { getCachedHomeData } from "@/lib/supabase/cached";

export default async function HomePage() {
  const { banners, categories, campaigns } = await getCachedHomeData();

  return (
    <HomeClient
      initialBanners={banners}
      initialCategories={categories}
      initialCampaigns={campaigns as any}
    />
  );
}
