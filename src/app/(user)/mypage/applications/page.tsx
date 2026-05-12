import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { ApplicationStepActions } from "./application-step-actions";
import type { ApplicationStatus } from "@/types/database";

export const metadata = {
  title: "我的申請 | 天下 Tianxia",
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  pending:               { label: "審核中",    variant: "secondary" },
  approved:              { label: "已選中",    variant: "success" },
  schedule_proposed:     { label: "日程提案中", variant: "default" },
  scheduled:             { label: "日程已確定", variant: "success" },
  reservation_submitted: { label: "預約審核中", variant: "default" },
  visit_confirmed:       { label: "預約已確定", variant: "success" },
  completed:             { label: "已完成",    variant: "success" },
  rejected:              { label: "未選中",    variant: "destructive" },
};

export default async function MyApplicationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/mypage/applications");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, line_id")
    .eq("id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      campaigns (
        id, title_zh_tw, title_ko,
        brand_name_zh_tw, brand_name_ko,
        thumbnail_url, experience_date, review_deadline,
        drive_url, service_options
      ),
      schedule_proposals (
        proposed_dates, preferred_time, message, confirmed_date
      ),
      reservation_info (
        visitor_name, reservation_datetime, emergency_contact, line_id, selected_service, special_requests
      )
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">我的申請</h1>
        <p className="text-muted-foreground">查看申請狀態並完成各階段流程</p>
      </div>

      {/* 진행 플로우 가이드 */}
      <FlowGuide />

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {[...applications]
            .sort((a, b) => {
              const priority = (s: string) => (s === "approved" || s === "scheduled" ? 0 : 1);
              return priority(a.status) - priority(b.status);
            })
            .map((application) => {
            const campaign = application.campaigns as unknown as {
              id: string;
              title_zh_tw: string | null;
              title_ko: string;
              brand_name_zh_tw: string | null;
              brand_name_ko: string;
              thumbnail_url: string | null;
              experience_date: string;
              review_deadline: string;
              drive_url: string | null;
              service_options: string | null;
            };

            const scheduleProposal = Array.isArray(application.schedule_proposals)
              ? application.schedule_proposals[0]
              : application.schedule_proposals;

            const reservationInfo = Array.isArray(application.reservation_info)
              ? (application.reservation_info[0] as { visitor_name: string; reservation_datetime: string; emergency_contact: string; line_id: string | null; selected_service: string | null; special_requests: string | null } | undefined)
              : application.reservation_info as { visitor_name: string; reservation_datetime: string; emergency_contact: string; line_id: string | null; selected_service: string | null; special_requests: string | null } | null;

            const serviceOptions = campaign.service_options
              ? campaign.service_options.split("\n").map((s) => s.trim()).filter(Boolean)
              : undefined;

            const status = application.status as ApplicationStatus;
            const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
            const isActionRequired = status === "approved" || status === "scheduled";

            return (
              <Card key={application.id}>
                {isActionRequired && (
                  <div className="flex items-center gap-2 rounded-t-lg bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                    需要您的操作
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.brand_name_zh_tw || campaign.brand_name_ko}
                      </p>
                      <CardTitle className="text-lg">
                        {campaign.title_zh_tw || campaign.title_ko}
                      </CardTitle>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>申請日期：{formatDate(application.applied_at)}</span>
                    <span>體驗日期：{formatDate(campaign.experience_date)}</span>
                    <span>後記截止：{formatDate(campaign.review_deadline)}</span>
                  </div>

                  {/* 단계별 진행 상황 표시 */}
                  <StepProgress status={status} />

                  {/* 일정 제안 내용 표시 */}
                  {scheduleProposal && (
                    <div className="rounded-md bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-800">提案日期</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {scheduleProposal.proposed_dates?.map((d: string, i: number) => (
                          <span key={i} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            scheduleProposal.confirmed_date === d
                              ? "bg-green-200 text-green-800"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {d}
                            {scheduleProposal.confirmed_date === d && " ✓ 確定"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 예약 정보 표시 */}
                  {reservationInfo && (
                    <div className="rounded-md bg-green-50 p-3 text-sm">
                      <p className="font-medium text-green-800">預約資訊</p>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-green-700">
                        <span>姓名：{reservationInfo.visitor_name}</span>
                        <span>日期時間：{reservationInfo.reservation_datetime}</span>
                        <span>緊急聯絡：{reservationInfo.emergency_contact}</span>
                        {reservationInfo.line_id && <span>LINE：{reservationInfo.line_id}</span>}
                        {reservationInfo.selected_service && (
                          <span className="col-span-2">選擇項目：{reservationInfo.selected_service}</span>
                        )}
                      </div>
                      {reservationInfo.special_requests && (
                        <p className="mt-1 text-green-600">備註：{reservationInfo.special_requests}</p>
                      )}
                    </div>
                  )}

                  {/* 단계별 액션 버튼 */}
                  <ApplicationStepActions
                    applicationId={application.id}
                    status={status}
                    confirmedDate={scheduleProposal?.confirmed_date ?? null}
                    campaignId={campaign.id}
                    userName={profile?.name ?? undefined}
                    userLineId={profile?.line_id ?? undefined}
                    serviceOptions={serviceOptions}
                    driveUrl={campaign.drive_url ?? undefined}
                  />

                  {application.admin_note && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">管理員備註：</p>
                      <p className="text-sm text-muted-foreground">{application.admin_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">您還沒有申請任何活動</p>
            <Link href="/campaigns">
              <Button>瀏覽活動</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FlowGuide() {
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
    <details className="mb-2 rounded-xl border border-gray-100 bg-white shadow-sm">
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

function StepProgress({ status }: { status: ApplicationStatus }) {
  const steps = [
    { key: "pending",               label: "申請" },
    { key: "approved",              label: "選中" },
    { key: "scheduled",             label: "日程確定" },
    { key: "visit_confirmed",       label: "預約確定" },
    { key: "completed",             label: "完成" },
  ];

  const ORDER: Record<ApplicationStatus, number> = {
    pending: 0,
    approved: 1,
    schedule_proposed: 1,
    scheduled: 2,
    reservation_submitted: 3,
    visit_confirmed: 3,
    completed: 4,
    rejected: -1,
  };

  if (status === "rejected") return null;

  const currentOrder = ORDER[status] ?? 0;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
            i < currentOrder
              ? "bg-primary text-white"
              : i === currentOrder
              ? "border-2 border-primary bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-400"
          }`}>
            {i < currentOrder ? "✓" : i + 1}
          </div>
          <span className={`text-[10px] ${i <= currentOrder ? "text-gray-700 font-medium" : "text-gray-400"}`}>
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`h-px w-4 ${i < currentOrder ? "bg-primary" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
