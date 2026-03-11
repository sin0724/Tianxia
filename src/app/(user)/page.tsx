"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { CampaignCard } from "@/components/user/campaign-card";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/database";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
}

interface CampaignWithCount {
  id: string;
  category: string;
  region: string;
  platforms: string[];
  thumbnail_url: string | null;
  recruitment_count: number;
  application_deadline: string;
  title_ko: string;
  title_zh_tw: string | null;
  brand_name_ko: string;
  brand_name_zh_tw: string | null;
  status: string;
  application_count: number;
  bonus_application_count: number;
}

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [campaigns, setCampaigns] = useState<CampaignWithCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      // 배너 가져오기
      const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (bannersData) setBanners(bannersData);

      // 카테고리 가져오기
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);
        setFeaturedCategories(categoriesData.filter((c) => c.is_featured));
      }

      // 캠페인 가져오기
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select(`*, applications(count)`)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (campaignsData) {
        const campaignsWithCount = campaignsData
          .map((campaign) => ({
            ...campaign,
            application_count: campaign.applications?.[0]?.count || 0,
            bonus_application_count: campaign.bonus_application_count || 0,
          }))
          .sort((a, b) => {
            const aTotal = a.application_count + (a.bonus_application_count || 0);
            const bTotal = b.application_count + (b.bonus_application_count || 0);
            return bTotal - aTotal;
          })
          .slice(0, 6);
        setCampaigns(campaignsWithCount);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // 배너 자동 슬라이드
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section */}
      <section className="relative bg-white">
        <div className="relative h-[280px] w-full overflow-hidden md:h-[400px]">
          {banners.length > 0 ? (
            <>
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentBannerIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {banner.link_url ? (
                    <Link href={banner.link_url}>
                      <Image
                        src={banner.image_url}
                        alt={banner.title || "배너"}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={banner.image_url}
                      alt={banner.title || "배너"}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  )}
                </div>
              ))}

              {/* 좌우 화살표 */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={goToPrevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={goToNextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* 인디케이터 */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentBannerIndex
                          ? "w-8 bg-primary"
                          : "w-2 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-400">배너 이미지 영역</p>
                <p className="mt-1 text-xs text-gray-400">관리자에서 배너를 추가하세요</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Category Section */}
      {featuredCategories.length > 0 && (
        <section className="border-b bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 md:gap-10">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/campaigns?category=${category.id}`}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-2xl transition-all group-hover:bg-primary/10 md:h-16 md:w-16">
                    {category.icon || "📦"}
                  </div>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-primary md:text-sm">
                    {category.name_zh}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Campaign List Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">熱門活動</h2>
            <Link href="/campaigns">
              <Button variant="ghost" className="gap-2 text-gray-500 hover:text-primary">
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {campaigns.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign as any}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
              <p className="text-gray-500">目前沒有進行中的活動</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
