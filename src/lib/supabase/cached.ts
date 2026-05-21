import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export const HOME_CACHE_TAG = "home-data";

// 공개 데이터 전용 클라이언트 — 쿠키/세션 없음, anon key만 사용
// RLS 정책이 공개 데이터만 노출하므로 보안 이슈 없음
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getCachedHomeData = unstable_cache(
  async () => {
    const supabase = publicClient();

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
