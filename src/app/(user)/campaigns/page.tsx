"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { CampaignCard } from "@/components/user/campaign-card";
import { CampaignCardSkeleton } from "@/components/user/campaign-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { KOREA_REGIONS } from "@/constants/regions";
import { PLATFORMS } from "@/constants/platforms";
import type { Category } from "@/types/database";

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

type SortOption = "popular" | "deadline" | "latest";

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [campaigns, setCampaigns] = useState<CampaignWithCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 9;
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "all");
  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get("platform") || "all");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "popular");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCampaigns = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCampaigns([]);
    }

    let query = supabase
      .from("campaigns")
      .select(`*, applications(count)`)
      .eq("status", "active")
      .gte("application_deadline", new Date().toISOString());

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    // Region filter
    if (selectedRegion && selectedRegion !== "all") {
      query = query.eq("region", selectedRegion);
    }

    // Platform filter
    if (selectedPlatform && selectedPlatform !== "all") {
      query = query.contains("platforms", [selectedPlatform]);
    }

    // Search filter
    if (searchQuery) {
      query = query.or(`title_ko.ilike.%${searchQuery}%,title_zh_tw.ilike.%${searchQuery}%,brand_name_ko.ilike.%${searchQuery}%,brand_name_zh_tw.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching campaigns:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    let processedCampaigns = (data || []).map((campaign) => ({
      ...campaign,
      application_count: campaign.applications?.[0]?.count || 0,
      bonus_application_count: campaign.bonus_application_count || 0,
    }));

    // Sort
    switch (sortBy) {
      case "popular":
        processedCampaigns.sort((a, b) => {
          const aTotal = a.application_count + (a.bonus_application_count || 0);
          const bTotal = b.application_count + (b.bonus_application_count || 0);
          return bTotal - aTotal;
        });
        break;
      case "deadline":
        processedCampaigns.sort((a, b) => 
          new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()
        );
        break;
      case "latest":
        processedCampaigns.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    // Pagination
    const start = pageNum * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedCampaigns = processedCampaigns.slice(start, end);

    if (append) {
      setCampaigns((prev) => [...prev, ...paginatedCampaigns]);
    } else {
      setCampaigns(paginatedCampaigns);
    }

    setHasMore(end < processedCampaigns.length);
    setLoading(false);
    setLoadingMore(false);
  }, [selectedCategory, selectedRegion, selectedPlatform, searchQuery, sortBy]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchCampaigns(0, false);
  }, [selectedCategory, selectedRegion, selectedPlatform, searchQuery, sortBy]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCampaigns(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedRegion && selectedRegion !== "all") params.set("region", selectedRegion);
    if (selectedPlatform && selectedPlatform !== "all") params.set("platform", selectedPlatform);
    if (sortBy !== "popular") params.set("sort", sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/campaigns";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedCategory, selectedRegion, selectedPlatform, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedRegion("all");
    setSelectedPlatform("all");
    setSortBy("popular");
  };

  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== "all") || (selectedRegion && selectedRegion !== "all") || (selectedPlatform && selectedPlatform !== "all");
  const currentCategory = selectedCategory !== "all" ? categories.find((c) => c.id === selectedCategory) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentCategory ? currentCategory.name_zh : "體驗活動"}
          </h1>
          <p className="text-gray-500">
            探索並申請您感興趣的體驗團活動
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜尋活動名稱或品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-primary text-white" : ""}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 rounded-xl border bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  分類
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedCategory === "all" 
                        ? "全部分類" 
                        : categories.find((c) => c.id === selectedCategory)?.name_zh || "全部分類"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分類</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name_zh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  地區
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedRegion === "all"
                        ? "全部地區"
                        : KOREA_REGIONS.find((r) => r.value === selectedRegion)?.label_zh || "全部地區"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部地區</SelectItem>
                    {KOREA_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label_zh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  平台
                </label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedPlatform === "all"
                        ? "全部平台"
                        : PLATFORMS.find((p) => p.value === selectedPlatform)?.label_zh || "全部平台"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部平台</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label_zh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  排序
                </label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">人氣優先</SelectItem>
                    <SelectItem value="deadline">即將截止</SelectItem>
                    <SelectItem value="latest">最新上架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
                  <X className="h-4 w-4" />
                  清除篩選
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          共 {campaigns.length} 個活動
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : campaigns.length > 0 ? (
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
            <p className="mb-2 text-lg font-medium text-gray-900">
              找不到符合條件的活動
            </p>
            <p className="mb-4 text-gray-500">請嘗試其他搜尋條件</p>
            <Button variant="outline" onClick={clearFilters}>
              清除篩選條件
            </Button>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {!loading && hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>
        )}

        {!loading && !hasMore && campaigns.length > 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            已顯示所有活動
          </div>
        )}
      </div>
    </div>
  );
}
