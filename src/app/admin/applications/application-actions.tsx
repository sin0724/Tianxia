"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check, X, Calendar, ClipboardCheck, Trophy, Trash2, ExternalLink, FileText, Clock } from "lucide-react";
import type { ApplicationStatus } from "@/types/database";

interface ScheduleProposal {
  proposed_dates: string[];
  preferred_time: string | null;
  message: string | null;
  confirmed_date: string | null;
}

interface ReviewInfo {
  id: string;
  review_url: string;
  content: string | null;
  visited_at: string | null;
  submitted_at: string;
  status: string;
}

interface ApplicationActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  scheduleProposal: ScheduleProposal | null;
  review: ReviewInfo | null;
  isDelivery?: boolean;
  hotelPartnerId?: string | null;
  onStatusChange?: () => void;
}

export function ApplicationActions({
  applicationId,
  status,
  scheduleProposal,
  review,
  isDelivery,
  hotelPartnerId,
  onStatusChange,
}: ApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  const updateStatus = async (newStatus: ApplicationStatus, extra?: Record<string, unknown>) => {
    setIsLoading(true);

    // 방문완료 처리 시 정산 대상 자동 설정
    const completionFields =
      newStatus === "completed" && hotelPartnerId
        ? {
            visit_completed_at: new Date().toISOString(),
            is_settlement_target: true,
          }
        : newStatus === "completed"
        ? { visit_completed_at: new Date().toISOString() }
        : {};

    const { error } = await supabase
      .from("applications")
      .update({
        status: newStatus,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString(),
        ...completionFields,
      })
      .eq("id", applicationId);

    if (error) {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (extra && Object.keys(extra).length > 0) {
      // upsert: schedule_proposals 행이 없는 경우(stuck 건)에도 confirmed_date 저장
      const { error: extraError } = await supabase
        .from("schedule_proposals")
        .upsert(
          { application_id: applicationId, proposed_dates: [], ...extra },
          { onConflict: "application_id" }
        );

      if (extraError) {
        toast({ title: "오류 발생", description: extraError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    const labels: Partial<Record<ApplicationStatus, string>> = {
      approved: "승인 완료",
      rejected: "반려 완료",
      scheduled: "일정 확정",
      visit_confirmed: "예약 확정",
      completed: "완료 처리",
    };

    toast({ title: labels[newStatus] || "처리 완료" });
    setIsLoading(false);
    onStatusChange?.();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admin/applications/${applicationId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "삭제 실패", description: data.error ?? "서버 오류", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    toast({ title: "신청 삭제 완료", description: "사용자도 해당 캠페인에 재신청할 수 있습니다." });
    setIsLoading(false);
    setShowDeleteConfirm(false);
    onStatusChange?.();
  };

  const confirmSchedule = async () => {
    if (!selectedDate) {
      toast({ title: "날짜와 시간을 입력해주세요", variant: "destructive" });
      return;
    }
    // datetime-local gives "YYYY-MM-DDTHH:MM", store as "YYYY-MM-DD HH:MM"
    const formatted = selectedDate.replace("T", " ");
    await updateStatus("scheduled", { confirmed_date: formatted });
  };

  const deleteButton = (
    <div className="mt-3 border-t pt-3">
      {showDeleteConfirm ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="flex-1 text-sm text-red-700">정말 이 신청건을 삭제하시겠습니까?</p>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="gap-1 h-7 px-2.5 text-xs"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Trash2 className="h-3 w-3" />}
            삭제
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs"
          >
            취소
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          신청 삭제
        </Button>
      )}
    </div>
  );

  // 1단계: pending → 승인/반려
  if (status === "pending") {
    return (
      <div className="space-y-3 rounded-md border bg-muted/30 p-4">
        <div className="space-y-2">
          <Label htmlFor="admin_note">관리자 메모 (선택)</Label>
          <Input
            id="admin_note"
            placeholder="승인/반려 사유"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("approved")} disabled={isLoading} className="gap-2">
            {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
            승인 (프로필 컨펌)
          </Button>
          <Button variant="destructive" onClick={() => updateStatus("rejected")} disabled={isLoading} className="gap-2">
            {isLoading ? <LoadingSpinner size="sm" /> : <X className="h-4 w-4" />}
            반려
          </Button>
        </div>
        {deleteButton}
      </div>
    );
  }

  // 2단계: schedule_proposed 또는 approved + scheduleProposal 존재 (이전 RLS 버그로 stuck된 건)
  if (status === "schedule_proposed" || (status === "approved" && scheduleProposal)) {
    const selectDate = (date: string) => {
      // YYYY-MM-DD → datetime-local 기본값 (시간 00:00)
      setSelectedDate(date + "T00:00");
    };

    return (
      <div className="space-y-3 rounded-md border bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">
          <Calendar className="mr-1 inline h-4 w-4" />
          일정 확정 (날짜·시간 직접 입력)
          {status === "approved" && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              일정 제안 수신됨
            </span>
          )}
          {scheduleProposal?.message?.startsWith("[일정변경]") && (
            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
              🔄 일정 변경 요청
            </span>
          )}
        </p>
        {scheduleProposal && (
          <div className="rounded bg-blue-100 px-3 py-2">
            <p className="mb-1.5 text-xs font-medium text-blue-700">유저 제안 날짜 (클릭하면 자동 입력)</p>
            <div className="flex flex-wrap gap-1.5">
              {scheduleProposal.proposed_dates?.map((date, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDate(date)}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  {date}
                </button>
              ))}
            </div>
            {scheduleProposal.preferred_time && (
              <p className="mt-1 text-xs text-blue-600">선호시간: {scheduleProposal.preferred_time}</p>
            )}
            {scheduleProposal.message && (
              scheduleProposal.message.startsWith("[일정변경]") ? (
                <p className="mt-1.5 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
                  변경 사유: {scheduleProposal.message.replace("[일정변경]", "").trim()}
                </p>
              ) : (
                <p className="mt-1 text-xs text-blue-600">메시지: {scheduleProposal.message}</p>
              )
            )}
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-sm">확정 날짜 및 시간 입력 *</Label>
          <Input
            type="datetime-local"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white"
          />
          <p className="text-xs text-gray-500">입력한 날짜·시간이 유저에게 그대로 고지됩니다</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin_note_schedule">관리자 메모 (선택)</Label>
          <Input
            id="admin_note_schedule"
            placeholder="추가 안내사항"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={confirmSchedule} disabled={isLoading || !selectedDate} className="gap-2">
            {isLoading ? <LoadingSpinner size="sm" /> : <Calendar className="h-4 w-4" />}
            일정 확정 및 고지
          </Button>
          <Button variant="destructive" onClick={() => updateStatus("rejected")} disabled={isLoading} className="gap-2">
            <X className="h-4 w-4" />
            거절
          </Button>
        </div>
        {deleteButton}
      </div>
    );
  }

  // 3단계: reservation_submitted → 예약 확정/거절 (배송: 발송 완료 처리)
  if (status === "reservation_submitted") {
    return (
      <div className="space-y-3 rounded-md border bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">
          <ClipboardCheck className="mr-1 inline h-4 w-4" />
          {isDelivery ? "발송 처리" : "예약 확정"}
        </p>
        <div className="space-y-2">
          <Label htmlFor="admin_note_reservation">관리자 메모 (선택)</Label>
          <Input
            id="admin_note_reservation"
            placeholder={isDelivery ? "발송 확인 메모" : "예약 확정 안내 또는 거절 사유"}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("visit_confirmed")} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
            {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
            {isDelivery ? "발송 완료 처리" : "예약 확정"}
          </Button>
          <Button variant="destructive" onClick={() => updateStatus("rejected")} disabled={isLoading} className="gap-2">
            <X className="h-4 w-4" />
            거절
          </Button>
        </div>
        {deleteButton}
      </div>
    );
  }

  // 4단계: visit_confirmed → 후기 확인 후 완료 처리
  if (status === "visit_confirmed") {
    const approveAndComplete = async () => {
      setIsLoading(true);
      if (review?.id) {
        const { error: reviewError } = await supabase
          .from("reviews")
          .update({ status: "approved" })
          .eq("id", review.id);
        if (reviewError) {
          toast({ title: "오류 발생", description: reviewError.message, variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }
      await updateStatus("completed");
    };

    return (
      <div className="space-y-3 rounded-md border bg-purple-50 p-4">
        <p className="text-sm font-semibold text-purple-800">
          <FileText className="mr-1 inline h-4 w-4" />
          후기 확인
        </p>

        {review ? (
          <div className="rounded bg-purple-100 px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                review.status === "approved" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
              }`}>
                {review.status === "approved" ? "승인됨" : "제출됨"}
              </span>
              {review.visited_at && (
                <span className="text-xs text-purple-600">방문일: {review.visited_at}</span>
              )}
            </div>
            <a
              href={review.review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {review.review_url}
            </a>
            {review.content && (
              <p className="text-xs text-purple-700 rounded bg-purple-50 px-2 py-1">{review.content}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            아직 후기가 제출되지 않았습니다
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={approveAndComplete}
            disabled={isLoading}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Trophy className="h-4 w-4" />}
            {review ? "후기 승인 & 완료처리" : "완료처리"}
          </Button>
        </div>
        {deleteButton}
      </div>
    );
  }

  // approved / scheduled / completed / rejected → 상태 변경 액션 없음, 삭제만 가능
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      {deleteButton}
    </div>
  );
}
