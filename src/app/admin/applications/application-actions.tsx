"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check, X, Calendar, ClipboardCheck, Trophy, Trash2 } from "lucide-react";
import type { ApplicationStatus } from "@/types/database";

interface ScheduleProposal {
  proposed_dates: string[];
  preferred_time: string | null;
  message: string | null;
  confirmed_date: string | null;
}

interface ApplicationActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  scheduleProposal: ScheduleProposal | null;
  isDelivery?: boolean;
  onStatusChange?: () => void;
}

export function ApplicationActions({
  applicationId,
  status,
  scheduleProposal,
  isDelivery,
  onStatusChange,
}: ApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  const updateStatus = async (newStatus: ApplicationStatus, extra?: Record<string, unknown>) => {
    setIsLoading(true);

    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus, admin_note: adminNote || null, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (extra && Object.keys(extra).length > 0) {
      const { error: extraError } = await supabase
        .from("schedule_proposals")
        .update(extra)
        .eq("application_id", applicationId);

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

  // 2단계: schedule_proposed → 관리자가 정확한 날짜+시간 직접 입력
  if (status === "schedule_proposed" && scheduleProposal) {
    return (
      <div className="space-y-3 rounded-md border bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">
          <Calendar className="mr-1 inline h-4 w-4" />
          일정 확정 (날짜·시간 직접 입력)
        </p>
        <div className="rounded bg-blue-100 px-3 py-2">
          <p className="mb-1 text-xs font-medium text-blue-700">유저 제안 날짜</p>
          <div className="flex flex-wrap gap-1.5">
            {scheduleProposal.proposed_dates?.map((date, i) => (
              <span key={i} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {date}
              </span>
            ))}
          </div>
          {scheduleProposal.preferred_time && (
            <p className="mt-1 text-xs text-blue-600">선호시간: {scheduleProposal.preferred_time}</p>
          )}
        </div>
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

  // 4단계: visit_confirmed → 완료 처리
  if (status === "visit_confirmed") {
    return (
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("completed")} disabled={isLoading} variant="outline" className="gap-2">
            {isLoading ? <LoadingSpinner size="sm" /> : <Trophy className="h-4 w-4" />}
            완료 처리
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
