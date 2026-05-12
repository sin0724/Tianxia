"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, CalendarDays, ClipboardList, FileText, BookOpen } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { ReservationForm } from "./reservation-form";
import { DeliveryAddressForm } from "./delivery-address-form";
import type { ApplicationStatus } from "@/types/database";

interface ApplicationStepActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  confirmedDate: string | null;
  campaignId: string;
  userName?: string;
  userEmail?: string;
  userLineId?: string;
  serviceOptions?: string[];
  driveUrl?: string;
  isDelivery?: boolean;
}

export function ApplicationStepActions({
  applicationId,
  status,
  confirmedDate,
  campaignId,
  userName,
  userEmail,
  userLineId,
  serviceOptions,
  driveUrl,
  isDelivery,
}: ApplicationStepActionsProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [guideRead, setGuideRead] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`guide_read_${applicationId}`) === "true") {
      setGuideRead(true);
    }
  }, [applicationId]);

  const reload = () => window.location.reload();

  if (status === "approved") {
    if (isDelivery) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-blue-700 font-medium">
            🎉 恭喜入選！請填寫收件資訊，商品將寄送至您的地址
          </p>
          {showScheduleForm ? (
            <DeliveryAddressForm
              applicationId={applicationId}
              onSuccess={reload}
              defaultName={userName}
              defaultEmail={userEmail}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setShowScheduleForm(true)}
            >
              <ClipboardList className="h-4 w-4" />
              填寫收件資訊
            </Button>
          )}
        </div>
      );
    }

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
    if (isDelivery) {
      return (
        <p className="text-sm text-muted-foreground">
          📦 收件資訊已提交，廠商確認後將寄出商品，請耐心等待
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        ⏳ 預約資訊已送出，請等待廣告主確認
      </p>
    );
  }

  if (status === "visit_confirmed" || status === "completed") {
    if (isDelivery) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <span className="text-base">📦</span>
            <span>商品已寄出！收到商品後請發布體驗相關內容，再提交後記</span>
          </div>
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
        </div>
      );
    }
  }

  if (status === "visit_confirmed" || status === "completed") {
    const handleGuideClick = () => {
      if (driveUrl) window.open(driveUrl, "_blank");
      localStorage.setItem(`guide_read_${applicationId}`, "true");
      setGuideRead(true);
    };

    return (
      <div className="space-y-3">
        {!driveUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-700">
            <span className="text-base">📷</span>
            <span>此活動為自由拍攝，無需拍攝指南，可直接提交後記</span>
          </div>
        )}
        {driveUrl && (
          <button
            type="button"
            onClick={handleGuideClick}
            className={`flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
              guideRead
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">
              {guideRead ? "✓ 拍攝指南已確認" : "📌 查看拍攝指南（提交後記前必看）"}
            </span>
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/campaigns/${campaignId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              查看活動
            </Button>
          </Link>
          {!driveUrl || guideRead ? (
            <Link href="/mypage/reviews">
              <Button size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                提交後記
              </Button>
            </Link>
          ) : (
            <Button size="sm" disabled className="gap-2">
              <FileText className="h-4 w-4" />
              提交後記（請先確認指南）
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
