import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const platform = searchParams.get("platform");
  const q = searchParams.get("q");

  const supabase = createAdminClient();

  let query = supabase
    .from("campaigns")
    .select(
      `id, category, region, platforms, thumbnail_url, recruitment_count,
       application_deadline, title_ko, title_zh_tw, brand_name_ko, brand_name_zh_tw,
       status, bonus_application_count, campaign_type, payment_amount, payment_display_type,
       min_followers, platform_follower_requirements, created_at,
       applications(count)`
    )
    .eq("status", "active")
    .gte("application_deadline", new Date().toISOString());

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (region && region !== "all") {
    query = query.eq("region", region);
  }
  if (platform && platform !== "all") {
    query = query.contains("platforms", [platform]);
  }
  if (q) {
    query = query.or(
      `title_ko.ilike.%${q}%,title_zh_tw.ilike.%${q}%,brand_name_ko.ilike.%${q}%,brand_name_zh_tw.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const campaigns = (data ?? []).map((c) => ({
    ...c,
    application_count: (c as any).applications?.[0]?.count ?? 0,
    bonus_application_count: c.bonus_application_count ?? 0,
    campaign_type: (c as any).campaign_type ?? "free",
    payment_amount: (c as any).payment_amount ?? null,
    min_followers: (c as any).min_followers ?? null,
  }));

  return NextResponse.json(campaigns);
}
