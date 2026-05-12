"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, CalendarDays, ClipboardList, FileText } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { ReservationForm } from "./reservation-form";
import type { ApplicationStatus } from "@/types/database";

interface ApplicationStepActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  confirmedDate: string | null;
  campaignId: string;
  userName?: string;
  userLineId?: string;
  serviceOptions?: string[];
}

export function ApplicationStepActions({
  applicationId,
  status,
  confirmedDate,
  campaignId,
  userName,
  userLineId,
  serviceOptions,
}: ApplicationStepActionsProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const reload = () => window.location.reload();

  if (status === "approved") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-blue-700 font-medium">
          🎉 恭喜入選！請提案您的希望到訪日期
        </p>
        {showScheduleForm ? (
          <ScheduleForm applicationId={applicationId} onSuccess={reload} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => setShowScheduleForm(true)}
          >
            <CalendarDays className="h-4 w-4" />
            提案到訪日期
          </Button>
        )}
      </div>
    );
  }

  if (status === "schedule_proposed") {
    return (
      <p className="text-sm text-muted-foreground">
        ⏳ 日程提案已送出，請等待管理員確認
      </p>
    );
  }

  if (status === "scheduled" && confirmedDate) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
          <span className="text-base">📅</span>
          <div>
            <p className="text-sm font-semibold text-green-800">日程已確定</p>
            <p className="text-sm font-bold text-green-700">{confirmedDate}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">請在下方填寫預約資訊以確認到訪</p>
        {showReservationForm ? (
          <ReservationForm
            applicationId={applicationId}
            confirmedDate={confirmedDate}
            onSuccess={reload}
            userName={userName}
            userLineId={userLineId}
            serviceOptions={serviceOptions}
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => setShowReservationForm(true)}
          >
            <ClipboardList className="h-4 w-4" />
            填寫預約資訊
          </Button>
        )}
      </div>
    );
  }

  if (status === "reservation_submitted") {
    return (
      <p className="text-sm text-muted-foreground">
        ⏳ 預約資訊已送出，請等待廣告主確認
      </p>
    );
  }

  if (status === "visit_confirmed" || status === "completed") {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href={`/campaigns/${campaignId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            查看活動
          </Button>
        </Link>
        <Link href="/mypage/reviews">
          <Button size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            提交後記
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
