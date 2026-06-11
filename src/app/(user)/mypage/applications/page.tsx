import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ApplicationsListClient } from "@/components/user/applications-list-client";
import type { ApplicationItem } from "@/components/user/applications-list-client";
import type { ApplicationStatus } from "@/types/database";

export const metadata = {
  title: "我的申請 | 天下 Tianxia",
};

export default async function MyApplicationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/mypage/applications");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, line_id")
    .eq("id", user.id)
    .single();

  const { data: rawApplications } = await supabase
    .from("applications")
    .select(`
      *,
      campaigns (
        id, title_zh_tw, title_ko,
        brand_name_zh_tw, brand_name_ko,
        thumbnail_url, experience_date, review_deadline,
        drive_url, service_options, service_options_zh_tw, is_delivery
      ),
      schedule_proposals (
        proposed_dates, preferred_time, message, confirmed_date
      ),
      reservation_info (
        passport_name, date_of_birth, visitor_count, reservation_datetime, emergency_contact, line_id, selected_service, special_requests
      ),
      delivery_addresses (
        recipient_name, country, city_state, zipcode, address, mobile, email
      )
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  const applications = (rawApplications ?? []) as unknown as ApplicationItem[];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5">
        <Link href="/mypage">
          <Button variant="ghost" size="sm" className="mb-3 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">我的申請</h1>
        <p className="text-sm text-muted-foreground">查看申請狀態並完成各階段流程</p>
      </div>

      {/* 진행 플로우 가이드 — 첫 신청 사용자는 자동으로 펼침 */}
      <FlowGuide defaultOpen={applications.length <= 1} />

      <ApplicationsListClient
        applications={applications}
        profile={profile ? { name: profile.name, email: (profile as any).email ?? null, line_id: profile.line_id } : null}
      />
    </div>
  );
}

function FlowGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const steps = [
    {
      num: "01",
      title: "申請活動",
      desc: "瀏覽活動後填寫Instagram等社群帳號送出申請，等待廣告主審核。",
      color: "bg-blue-50 border-blue-100 text-blue-700",
    },
    {
      num: "02",
      title: "獲選通知",
      desc: "入選後狀態變為「已選中」。請在我的申請頁面提案您希望到訪的日期（最多3個）。",
      color: "bg-purple-50 border-purple-100 text-purple-700",
    },
    {
      num: "03",
      title: "日程確定",
      desc: "管理員確認後會直接告知精確的到訪日期與時間。請填寫預約資訊（姓名、緊急聯絡）送出確認。",
      color: "bg-green-50 border-green-100 text-green-700",
    },
    {
      num: "04",
      title: "預約確定 & 拍攝指南",
      desc: "預約確定後可下載拍攝指南（Google Drive），熟悉拍攝要求後前往體驗。",
      color: "bg-amber-50 border-amber-100 text-amber-700",
    },
    {
      num: "05",
      title: "提交後記",
      desc: "體驗完成後在社群媒體發布後記，至「後記管理」頁面貼上連結提交即完成。",
      color: "bg-rose-50 border-rose-100 text-rose-700",
    },
  ];

  return (
    <details open={defaultOpen} className="mb-4 rounded-xl border border-gray-100 bg-white shadow-sm">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-700 hover:text-primary">
        📋 如何進行？查看完整流程說明
      </summary>
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.num} className={`flex items-start gap-3 rounded-lg border p-3 ${step.color}`}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">
                {step.num}
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-xs opacity-80">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">如有疑問請透過LINE聯繫管理員</p>
      </div>
    </details>
  );
}
