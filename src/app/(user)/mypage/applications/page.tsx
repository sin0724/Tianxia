import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
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

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      campaigns (
        id, title_zh_tw, title_ko,
        brand_name_zh_tw, brand_name_ko,
        thumbnail_url, experience_date, review_deadline
      ),
      schedule_proposals (
        proposed_dates, preferred_time, message, confirmed_date
      ),
      reservation_info (
        visitor_name, reservation_datetime, emergency_contact, line_id, special_requests
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

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const campaign = application.campaigns as unknown as {
              id: string;
              title_zh_tw: string | null;
              title_ko: string;
              brand_name_zh_tw: string | null;
              brand_name_ko: string;
              thumbnail_url: string | null;
              experience_date: string;
              review_deadline: string;
            };

            const scheduleProposal = Array.isArray(application.schedule_proposals)
              ? application.schedule_proposals[0]
              : application.schedule_proposals;

            const reservationInfo = Array.isArray(application.reservation_info)
              ? (application.reservation_info[0] as { visitor_name: string; reservation_datetime: string; emergency_contact: string; line_id: string | null; special_requests: string | null } | undefined)
              : application.reservation_info as { visitor_name: string; reservation_datetime: string; emergency_contact: string; line_id: string | null; special_requests: string | null } | null;

            const status = application.status as ApplicationStatus;
            const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };

            return (
              <Card key={application.id}>
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
