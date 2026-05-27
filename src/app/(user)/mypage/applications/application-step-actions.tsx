"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, CalendarDays, ClipboardList, FileText, BookOpen, X } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { ReservationForm } from "./reservation-form";
import { DeliveryAddressForm } from "./delivery-address-form";
import { RescheduleForm } from "./reschedule-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
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
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [guideRead, setGuideRead] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`guide_read_${applicationId}`) === "true") {
      setGuideRead(true);
    }
  }, [applicationId]);

  const reload = () => window.location.reload();

  const handleCancellationRequest = async () => {
    setIsCancelling(true);
    const supabase = createClient();
    const reason = cancellationReason.trim();
    const { error } = await supabase
      .from("schedule_proposals")
      .upsert(
        {
          application_id: applicationId,
          proposed_dates: [],
          message: `[취소요청] ${reason}`,
          confirmed_date: null,
        },
        { onConflict: "application_id" }
      );
    if (error) {
      toast({ title: "提交失敗", description: "請稍後再試", variant: "destructive" });
      setIsCancelling(false);
      return;
    }
    toast({ title: "取消申請已送出", description: "請等待管理員處理" });
    setIsCancelling(false);
    reload();
  };

  const cancellationForm = showCancellationForm ? (
    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-red-700">申請取消</p>
        <button type="button" onClick={() => setShowCancellationForm(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Textarea
        value={cancellationReason}
        onChange={(e) => setCancellationReason(e.target.value)}
        placeholder="請輸入取消原因（選填）"
        rows={2}
        className="bg-white text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleCancellationRequest}
          disabled={isCancelling}
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          {isCancelling ? <LoadingSpinner size="sm" /> : null}
          確認取消申請
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCancellationForm(false)}
          disabled={isCancelling}
          className="h-7 px-2.5 text-xs"
        >
          返回
        </Button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setShowCancellationForm(true)}
      className="block text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
    >
      無法配合，取消此申請
    </button>
  );

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
        {showRescheduleForm ? (
          <RescheduleForm
            applicationId={applicationId}
            currentConfirmedDate={confirmedDate}
            onSuccess={reload}
            onCancel={() => setShowRescheduleForm(false)}
          />
        ) : showReservationForm ? (
          <ReservationForm
            applicationId={applicationId}
            confirmedDate={confirmedDate}
            onSuccess={reload}
            userName={userName}
            userLineId={userLineId}
            serviceOptions={serviceOptions}
          />
        ) : (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => setShowReservationForm(true)}
            >
              <ClipboardList className="h-4 w-4" />
              填寫預約資訊
            </Button>
            <button
              type="button"
              onClick={() => setShowRescheduleForm(true)}
              className="block text-xs text-gray-400 hover:text-orange-500 underline underline-offset-2 transition-colors"
            >
              日程有變動，申請更改日程
            </button>
            {cancellationForm}
          </div>
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
      <div className="space-y-2">
        {showRescheduleForm ? (
          <RescheduleForm
            applicationId={applicationId}
            currentConfirmedDate={confirmedDate ?? ""}
            onSuccess={reload}
            onCancel={() => setShowRescheduleForm(false)}
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              ⏳ 預約資訊已送出，請等待廣告主確認
            </p>
            <button
              type="button"
              onClick={() => setShowRescheduleForm(true)}
              className="text-xs text-gray-400 hover:text-orange-500 underline underline-offset-2 transition-colors"
            >
              日程有變動，申請更改日程
            </button>
            {cancellationForm}
          </>
        )}
      </div>
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
