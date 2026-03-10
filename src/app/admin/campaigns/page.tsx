import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getRegionLabel } from "@/constants/regions";
import { PLATFORMS } from "@/constants/platforms";
import { CampaignActions } from "./campaign-actions";
import { CampaignSearch } from "./campaign-search";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminCampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const categoryFilter = typeof params.category === "string" ? params.category : "";

  const supabase = await createClient();

  let query = supabase.from("campaigns").select("*");

  if (search) {
    query = query.or(`title_ko.ilike.%${search}%,brand_name_ko.ilike.%${search}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (categoryFilter && categoryFilter !== "all") {
    query = query.eq("category", categoryFilter);
  }

  const { data: campaigns } = await query.order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  const getCategoryName = (categoryId: string) => {
    const cat = categories?.find((c) => c.id === categoryId);
    return cat ? `${cat.icon || ""} ${cat.name_ko}` : categoryId;
  };

  const getPlatformNames = (platforms: string[] | null) => {
    if (!platforms || platforms.length === 0) return "인스타그램";
    return platforms
      .map((p) => PLATFORMS.find((pl) => pl.value === p)?.label_ko || p)
      .join(", ");
  };

  const totalCount = campaigns?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">캠페인 관리</h1>
          <p className="text-sm text-gray-500">캠페인을 생성하고 관리합니다</p>
        </div>
        <Link href="/admin/campaigns/new">
          <Button className="gap-2 rounded-lg bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            새 캠페인
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <Suspense fallback={<div className="h-10 animate-pulse bg-gray-100 rounded" />}>
          <CampaignSearch categories={categories || []} />
        </Suspense>
        <p className="mt-3 text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{totalCount}</span>개의 캠페인
        </p>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-700"
                          : campaign.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {campaign.status === "active"
                        ? "진행중"
                        : campaign.status === "closed"
                        ? "마감"
                        : "임시저장"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {getCategoryName(campaign.category)}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {getPlatformNames((campaign as any).platforms)}
                    </span>
                    <span className="text-sm text-gray-400">
                      {campaign.brand_name_ko}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {campaign.title_ko}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>지역: {getRegionLabel(campaign.region, "ko")}</span>
                    <span>모집: {campaign.recruitment_count}명</span>
                    <span>마감: {formatDate(campaign.application_deadline, "ko")}</span>
                  </div>
                  {campaign.title_zh_tw && (
                    <p className="mt-2 text-sm text-gray-400">
                      번체: {campaign.title_zh_tw}
                    </p>
                  )}
                </div>
                <CampaignActions
                  campaign={{
                    id: campaign.id,
                    title_ko: campaign.title_ko,
                    application_deadline: campaign.application_deadline,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <p className="mb-4 text-gray-500">등록된 캠페인이 없습니다</p>
          <Link href="/admin/campaigns/new">
            <Button className="rounded-lg bg-primary hover:bg-primary/90">첫 캠페인 만들기</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
