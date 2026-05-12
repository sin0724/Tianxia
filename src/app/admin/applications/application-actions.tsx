"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check, X, Calendar, ClipboardCheck, Trophy } from "lucide-react";
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
  onStatusChange?: () => void;
}

export function ApplicationActions({
  applicationId,
  status,
  scheduleProposal,
  onStatusChange,
}: ApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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

  const confirmSchedule = async () => {
    if (!selectedDate) {
      toast({ title: "날짜와 시간을 입력해주세요", variant: "destructive" });
      return;
    }
    // datetime-local gives "YYYY-MM-DDTHH:MM", store as "YYYY-MM-DD HH:MM"
    const formatted = selectedDate.replace("T", " ");
    await updateStatus("scheduled", { confirmed_date: formatted });
  };

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
        {/* 유저가 제안한 날짜 참고 표시 */}
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
      </div>
    );
  }

  // 3단계: reservation_submitted → 예약 확정/거절
  if (status === "reservation_submitted") {
    return (
      <div className="space-y-3 rounded-md border bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">
          <ClipboardCheck className="mr-1 inline h-4 w-4" />
          예약 확정
        </p>
        <div className="space-y-2">
          <Label htmlFor="admin_note_reservation">관리자 메모 (선택)</Label>
          <Input
            id="admin_note_reservation"
            placeholder="예약 확정 안내 또는 거절 사유"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("visit_confirmed")} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
            {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
            예약 확정
          </Button>
          <Button variant="destructive" onClick={() => updateStatus("rejected")} disabled={isLoading} className="gap-2">
            <X className="h-4 w-4" />
            거절
          </Button>
        </div>
      </div>
    );
  }

  // 4단계: visit_confirmed → 완료 처리
  if (status === "visit_confirmed") {
    return (
      <div className="flex gap-2">
        <Button onClick={() => updateStatus("completed")} disabled={isLoading} variant="outline" className="gap-2">
          {isLoading ? <LoadingSpinner size="sm" /> : <Trophy className="h-4 w-4" />}
          완료 처리
        </Button>
      </div>
    );
  }

  return null;
}
