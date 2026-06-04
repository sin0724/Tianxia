"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CalendarDays, ClipboardList, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ApplicationStepActions } from "@/app/(user)/mypage/applications/application-step-actions";
import type { ApplicationStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }
> = {
  pending:               { label: "審核中",    variant: "secondary" },
  approved:              { label: "已選中",    variant: "success" },
  schedule_proposed:     { label: "日程提案中", variant: "default" },
  scheduled:             { label: "日程已確定", variant: "success" },
  reservation_submitted: { label: "預約審核中", variant: "default" },
  visit_confirmed:       { label: "預約已確定", variant: "success" },
  completed:             { label: "已完成",    variant: "success" },
  rejected:              { label: "未選中",    variant: "destructive" },
};

const ACTIVE_STATUSES: ApplicationStatus[] = [
  "pending",
  "approved",
  "schedule_proposed",
  "scheduled",
  "reservation_submitted",
  "visit_confirmed",
];

type TabFilter = "all" | "active" | "completed" | "rejected";

const TAB_LABELS: Record<TabFilter, string> = {
  all:       "全部",
  active:    "進行中",
  completed: "已完成",
  rejected:  "未選中",
};

type CampaignInfo = {
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
  service_options_zh_tw: string | null;
  is_delivery: boolean;
} | null;

type ScheduleProposalData = {
  proposed_dates: string[];
  preferred_time: string | null;
  message: string | null;
  confirmed_date: string | null;
} | null;

type ReservationInfoData = {
  passport_name: string;
  date_of_birth: string;
  reservation_datetime: string;
  emergency_contact: string;
  line_id: string | null;
  selected_service: string | null;
  special_requests: string | null;
} | null;

type DeliveryAddressData = {
  recipient_name: string;
  country: string;
  city_state: string;
  zipcode: string;
  address: string;
  mobile: string;
  email: string;
} | null;

export type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  admin_note: string | null;
  campaigns: CampaignInfo;
  schedule_proposals: ScheduleProposalData;
  reservation_info: ReservationInfoData;
  delivery_addresses: DeliveryAddressData;
};

interface ApplicationsListClientProps {
  applications: ApplicationItem[];
  profile: { name: string | null; email: string | null; line_id: string | null } | null;
}

function StepProgress({ status, isDelivery }: { status: ApplicationStatus; isDelivery?: boolean }) {
  const steps = isDelivery
    ? [
        { key: "pending",               label: "申請" },
        { key: "approved",              label: "選中" },
        { key: "reservation_submitted", label: "等待寄出" },
        { key: "visit_confirmed",       label: "已寄出" },
        { key: "completed",             label: "完成" },
      ]
    : [
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
    <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5">
      {steps.map((step, i) => (
        <div key={step.key} className="flex shrink-0 items-center gap-0.5">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
              i < currentOrder
                ? "bg-primary text-white"
                : i === currentOrder
                ? "border-2 border-primary bg-primary/10 text-primary"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < currentOrder ? "✓" : i + 1}
          </div>
          <span
            className={`text-[9px] ${
              i <= currentOrder ? "font-medium text-gray-700" : "text-gray-400"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-3 shrink-0 ${
                i < currentOrder ? "bg-primary" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ApplicationCard({
  application,
  profile,
}: {
  application: ApplicationItem;
  profile: ApplicationsListClientProps["profile"];
}) {
  const [expanded, setExpanded] = useState(false);
  const [autoOpenForm, setAutoOpenForm] = useState(false);

  const campaign = application.campaigns;

  // campaign이 null이면 데이터 오류 카드 표시
  if (!campaign) {
    return (
      <Card className="border-red-100">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>活動資料載入失敗，請聯繫管理員</span>
        </CardContent>
      </Card>
    );
  }

  const scheduleProposal = Array.isArray(application.schedule_proposals)
    ? ((application.schedule_proposals[0] as ScheduleProposalData) ?? null)
    : (application.schedule_proposals as ScheduleProposalData);
  const reservationInfo = Array.isArray(application.reservation_info)
    ? ((application.reservation_info[0] as ReservationInfoData) ?? null)
    : (application.reservation_info as ReservationInfoData);
  const deliveryAddress = Array.isArray(application.delivery_addresses)
    ? ((application.delivery_addresses[0] as DeliveryAddressData) ?? null)
    : (application.delivery_addresses as DeliveryAddressData);

  const status = application.status;
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  const isActionRequired = status === "approved" || status === "scheduled";

  const rawOpts = campaign.service_options_zh_tw || campaign.service_options;
  const serviceOptions = rawOpts
    ? rawOpts.split("\n").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoOpenForm(true);
    setExpanded(true);
  };

  const getCompactActionButton = () => {
    if (status === "approved") {
      return (
        <Button
          size="sm"
          className="mt-2 w-full gap-2 rounded-lg bg-blue-600 text-xs hover:bg-blue-700"
          onClick={handleActionClick}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {campaign.is_delivery ? "填寫收件資訊 →" : "提案到訪日期 →"}
        </Button>
      );
    }
    if (status === "scheduled") {
      return (
        <Button
          size="sm"
          className="mt-2 w-full gap-2 rounded-lg bg-green-600 text-xs hover:bg-green-700"
          onClick={handleActionClick}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          填寫預約資訊 →
        </Button>
      );
    }
    return null;
  };

  return (
    <Card className={isActionRequired ? "ring-2 ring-offset-1 ring-amber-400" : ""}>
      {/* Action needed banner */}
      {isActionRequired && (
        <div className="flex items-center gap-2 rounded-t-lg border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          需要您的操作
        </div>
      )}

      {/* Card header — tappable to expand */}
      <button
        type="button"
        className="w-full px-4 pb-2 pt-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {campaign.brand_name_zh_tw || campaign.brand_name_ko}
            </p>
            <p className="truncate text-sm font-semibold leading-snug text-gray-900">
              {campaign.title_zh_tw || campaign.title_ko}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant={config.variant} className="text-[10px]">
              {config.label}
            </Badge>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Compact info row */}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>申請：{formatDate(application.applied_at)}</span>
          <span>體驗：{formatDate(campaign.experience_date)}</span>
        </div>

        {/* Compact step progress */}
        <div className="mt-2">
          <StepProgress status={status} isDelivery={campaign.is_delivery} />
        </div>
      </button>

      {/* Compact action button — visible without expanding */}
      {isActionRequired && !expanded && (
        <div className="px-4 pb-3">
          {getCompactActionButton()}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <CardContent className="space-y-4 border-t border-gray-50 pt-3">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>後記截止：{formatDate(campaign.review_deadline)}</span>
          </div>

          {/* 일정 제안 */}
          {scheduleProposal && (
            <div className="rounded-md bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-800">提案日期</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {scheduleProposal.proposed_dates?.map((d: string, i: number) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      scheduleProposal.confirmed_date === d
                        ? "bg-green-200 text-green-800"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {d}
                    {scheduleProposal.confirmed_date === d && " ✓ 確定"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 예약 정보 */}
          {reservationInfo && (
            <div className="rounded-md bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-800">預約資訊</p>
              <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-green-700">
                <span>護照姓名：{reservationInfo.passport_name}</span>
                <span>出生日期：{reservationInfo.date_of_birth}</span>
                <span>日期時間：{reservationInfo.reservation_datetime}</span>
                <span>緊急聯絡：{reservationInfo.emergency_contact}</span>
                {reservationInfo.line_id && <span>LINE：{reservationInfo.line_id}</span>}
                {reservationInfo.selected_service && (
                  <span className="col-span-2">
                    選擇項目：{reservationInfo.selected_service}
                  </span>
                )}
              </div>
              {reservationInfo.special_requests && (
                <p className="mt-1 text-xs text-green-600">
                  備註：{reservationInfo.special_requests}
                </p>
              )}
            </div>
          )}

          {/* 배송 주소 */}
          {deliveryAddress && (
            <div className="rounded-md bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-800">收件資訊</p>
              <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-blue-700">
                <span>姓名：{deliveryAddress.recipient_name}</span>
                <span>手機：{deliveryAddress.mobile}</span>
                <span>國家：{deliveryAddress.country}</span>
                <span>郵遞區號：{deliveryAddress.zipcode}</span>
                <span className="col-span-2">
                  地址：{deliveryAddress.city_state} {deliveryAddress.address}
                </span>
                <span className="col-span-2">Email：{deliveryAddress.email}</span>
              </div>
            </div>
          )}

          {/* 단계별 액션 */}
          <ApplicationStepActions
            applicationId={application.id}
            status={status}
            confirmedDate={scheduleProposal?.confirmed_date ?? null}
            campaignId={campaign.id}
            userName={profile?.name ?? undefined}
            userEmail={profile?.email ?? undefined}
            userLineId={profile?.line_id ?? undefined}
            serviceOptions={serviceOptions}
            driveUrl={campaign.drive_url ?? undefined}
            isDelivery={campaign.is_delivery}
            autoOpenForm={autoOpenForm}
          />

          {application.admin_note && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">管理員備註：</p>
              <p className="text-xs text-muted-foreground">{application.admin_note}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function ApplicationsListClient({
  applications,
  profile,
}: ApplicationsListClientProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("active");

  const actionNeededCount = applications.filter(
    (a) => a.status === "approved" || a.status === "scheduled"
  ).length;

  const filtered = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ACTIVE_STATUSES.includes(app.status);
    if (activeTab === "completed") return app.status === "completed";
    if (activeTab === "rejected") return app.status === "rejected";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const priority = (s: ApplicationStatus) =>
      s === "approved" || s === "scheduled" ? 0 : 1;
    return priority(a.status) - priority(b.status);
  });

  const countByTab: Record<TabFilter, number> = {
    all: applications.length,
    active: applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length,
    completed: applications.filter((a) => a.status === "completed").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">您還沒有申請任何活動</p>
          <Link href="/campaigns">
            <Button>瀏覽活動</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 액션 필요 요약 배너 */}
      {actionNeededCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="relative flex h-5 w-5 shrink-0 mt-0.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              {actionNeededCount}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              您有 {actionNeededCount} 個申請需要操作
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              請點選下方「已選中」或「日程已確定」的申請，點擊藍色/綠色按鈕提交資訊
            </p>
          </div>
        </div>
      )}

      {/* Status Tab Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(Object.keys(TAB_LABELS) as TabFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {TAB_LABELS[tab]}
            {countByTab[tab] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${
                  activeTab === tab ? "bg-white/30 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {countByTab[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center">
          <p className="text-sm text-muted-foreground">此分類沒有申請記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
