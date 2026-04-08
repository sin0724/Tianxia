"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { CampaignCard } from "@/components/user/campaign-card";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KOREA_REGIONS } from "@/constants/regions";
import type { Category } from "@/types/database";

const CAMPAIGN_TYPES = [
  { value: "all", label_zh: "全部", icon: "📋" },
  { value: "experience", label_zh: "體驗型", icon: "🎯" },
  { value: "delivery", label_zh: "配送型", icon: "📦" },
] as const;

const FEATURED_REGIONS = [
  { value: "all", label_zh: "全部地區" },
  { value: "seoul", label_zh: "首爾" },
  { value: "gyeonggi", label_zh: "京畿道" },
  { value: "busan", label_zh: "釜山" },
  { value: "nationwide", label_zh: "全國" },
  { value: "online", label_zh: "線上" },
] as const;

const ALL_REGIONS = [
  { value: "all", label_zh: "全部地區" },
  ...KOREA_REGIONS.map((r) => ({ value: r.value, label_zh: r.label_zh })),
] as const;

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
  const [allCampaigns, setAllCampaigns] = useState<CampaignWithCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "latest">("latest");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (bannersData) setBanners(bannersData);

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);
      }

      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select(`*, applications(count)`)
        .eq("status", "active")
        .gte("application_deadline", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (campaignsData) {
        const campaignsWithCount = campaignsData.map((campaign) => ({
          ...campaign,
          application_count: (campaign as any).applications?.[0]?.count ?? 0,
          bonus_application_count: campaign.bonus_application_count ?? 0,
        }));
        setAllCampaigns(campaignsWithCount);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const deliveryCategoryId = useMemo(() => {
    const cat = categories.find(
      (c) => c.name_ko === "배송" || c.name_ko === "배송형"
    );
    return cat?.id || null;
  }, [categories]);

  const filteredCampaigns = useMemo(() => {
    let filtered = [...allCampaigns];

    if (selectedRegion !== "all") {
      filtered = filtered.filter((c) => c.region === selectedRegion);
    }

    if (selectedType === "delivery" && deliveryCategoryId) {
      filtered = filtered.filter((c) => c.category === deliveryCategoryId);
    } else if (selectedType === "experience" && deliveryCategoryId) {
      filtered = filtered.filter((c) => c.category !== deliveryCategoryId);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    if (sortBy === "latest") {
      filtered.sort(
        (a, b) =>
          new Date((b as any).created_at).getTime() -
          new Date((a as any).created_at).getTime()
      );
    } else {
      filtered.sort((a, b) => {
        const aTotal = a.application_count + (a.bonus_application_count || 0);
        const bTotal = b.application_count + (b.bonus_application_count || 0);
        return bTotal - aTotal;
      });
    }

    return filtered.slice(0, 6);
  }, [allCampaigns, selectedRegion, selectedType, selectedCategory, deliveryCategoryId, sortBy]);

  const featuredCategories = useMemo(
    () => categories.filter((c) => c.is_featured),
    [categories]
  );

  const displayCategories = showAllCategories ? categories : featuredCategories;

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
    <div className="min-h-screen bg-gray-50/50">
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

      {/* Filter Section */}
      <section className="border-b border-gray-100 bg-white shadow-sm">
        {/* 캠페인 유형 (배송형/체험형) */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
              {CAMPAIGN_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedType === type.value
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label_zh}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-1">
              <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-gray-400" />
              {(showAllRegions ? ALL_REGIONS : FEATURED_REGIONS).map((region) => (
                <button
                  key={region.value}
                  onClick={() => setSelectedRegion(region.value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedRegion === region.value
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {region.label_zh}
                </button>
              ))}
              <button
                onClick={() => setShowAllRegions(!showAllRegions)}
                className="shrink-0 flex items-center gap-0.5 rounded-full px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                {showAllRegions ? (
                  <>收起 <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>更多 <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
            {displayCategories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? "all" : category.id
                  )
                }
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-200 md:h-16 md:w-16 ${
                    selectedCategory === category.id
                      ? "bg-primary/10 ring-2 ring-primary scale-105"
                      : "bg-gray-50 border border-gray-100 group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:scale-105"
                  }`}
                >
                  {category.icon || "📦"}
                </div>
                <span
                  className={`text-xs font-medium transition-colors md:text-sm ${
                    selectedCategory === category.id
                      ? "text-primary font-semibold"
                      : "text-gray-600 group-hover:text-primary"
                  }`}
                >
                  {category.name_zh}
                </span>
              </button>
            ))}
          </div>
          {categories.length > featuredCategories.length && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-500 transition-all hover:border-primary hover:text-primary"
              >
                {showAllCategories ? (
                  <>收起 <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>全部分類 <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Campaign List Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-full bg-white border border-gray-100 p-1 shadow-sm">
              <button
                onClick={() => setSortBy("popular")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  sortBy === "popular"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                人氣活動
              </button>
              <button
                onClick={() => setSortBy("latest")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  sortBy === "latest"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                最新活動
              </button>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost" className="gap-1.5 text-sm text-gray-400 hover:text-primary px-3">
                查看全部
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {filteredCampaigns.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign as any}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
              <p className="mb-1 text-base font-semibold text-gray-900">找不到相關活動</p>
              <p className="text-sm text-gray-400">請嘗試其他篩選條件</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
