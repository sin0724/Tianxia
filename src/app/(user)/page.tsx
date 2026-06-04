import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { HomeClient } from "./home-client";
import { getCachedHomeData } from "@/lib/supabase/cached";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { banners, categories, campaigns } = await getCachedHomeData();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let actionCount = 0;
  if (user) {
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["approved", "scheduled"]);
    actionCount = count ?? 0;
  }

  return (
    <>
      {actionCount > 0 && (
        <Link href="/mypage/applications" className="block">
          <div className="bg-amber-500 px-4 py-3 text-white transition-colors hover:bg-amber-600">
            <div className="container mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 font-bold">
                  <span className="relative flex h-5 w-5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-amber-600">
                      {actionCount > 9 ? "9+" : actionCount}
                    </span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {actionCount}個申請需要您的操作
                  </p>
                  <p className="text-[11px] text-amber-100">
                    請提案到訪日期或填寫預約資訊
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                <CalendarDays className="h-4 w-4" />
                立即確認 →
              </div>
            </div>
          </div>
        </Link>
      )}
      <HomeClient
        initialBanners={banners}
        initialCategories={categories}
        initialCampaigns={campaigns as any}
      />
    </>
  );
}
