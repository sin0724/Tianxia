import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const HOME_CACHE_TAG = "home-data";

export const getCachedHomeData = unstable_cache(
  async () => {
    // 서비스 롤 클라이언트 사용: applications 테이블 RLS를 우회해 신청자 수를 정확히 집계
    const supabase = createAdminClient();

    const [bannersRes, categoriesRes, campaignsRes] = await Promise.all([
      supabase
        .from("banners")
        .select("id, image_url, link_url, title")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),

      supabase
        .from("categories")
        .select("id, name_ko, name_zh, icon, is_featured, display_order")
        .order("display_order", { ascending: true }),

      supabase
        .from("campaigns")
        .select(
          `id, category, region, platforms, thumbnail_url, recruitment_count,
           application_deadline, title_ko, title_zh_tw, brand_name_ko, brand_name_zh_tw,
           status, bonus_application_count, campaign_type, payment_amount, payment_display_type,
           min_followers, platform_follower_requirements, created_at,
           applications(count)`
        )
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    const campaigns = (campaignsRes.data ?? []).map((c) => ({
      ...c,
      application_count: (c as any).applications?.[0]?.count ?? 0,
      bonus_application_count: c.bonus_application_count ?? 0,
      campaign_type: (c as any).campaign_type ?? "free",
      payment_amount: (c as any).payment_amount ?? null,
      min_followers: (c as any).min_followers ?? null,
    }));

    return {
      banners: bannersRes.data ?? [],
      categories: categoriesRes.data ?? [],
      campaigns,
    };
  },
  ["home-data"],
  { revalidate: 900, tags: [HOME_CACHE_TAG] } // 15분 캐시, 관리자 액션 시 수동 무효화 가능
);
