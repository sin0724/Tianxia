"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, X } from "lucide-react";
import { DateMultiPicker } from "@/components/user/date-multi-picker";

interface RescheduleFormProps {
  applicationId: string;
  currentConfirmedDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const REASON_CHIPS = [
  "行程衝突",
  "個人因素",
  "緊急情況",
  "健康問題",
  "交通問題",
];

export function RescheduleForm({
  applicationId,
  currentConfirmedDate,
  onSuccess,
  onCancel,
}: RescheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  const selectChip = (chip: string) => {
    setReason((prev) =>
      prev === chip ? "" : prev ? `${prev}、${chip}` : chip
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({ title: "請填寫變更原因", variant: "destructive" });
      return;
    }
    if (dates.length === 0) {
      toast({ title: "請至少選擇一個希望日期", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error: upsertError } = await supabase
      .from("schedule_proposals")
      .upsert(
        {
          application_id: applicationId,
          proposed_dates: dates,
          preferred_time: null,
          message: `[일정변경] ${reason.trim()}`,
          confirmed_date: null,
        },
        { onConflict: "application_id" }
      );

    if (upsertError) {
      toast({ title: "提交失敗", description: "請稍後再試", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "schedule_proposed" })
      .eq("id", applicationId);

    if (updateError) {
      toast({ title: "狀態更新失敗", description: "請重新整理頁面", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "日程變更申請已送出", description: "請等待管理員確認新日程" });
    setIsLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-orange-600" />
          <p className="text-sm font-semibold text-orange-800">申請變更日程</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg bg-orange-100 px-3 py-2 text-xs text-orange-700">
        目前確定日程：<span className="font-semibold">{currentConfirmedDate}</span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          變更原因 <span className="text-red-500">*</span>
        </Label>
        {/* 사유 선택 칩 */}
        <div className="flex flex-wrap gap-1.5">
          {REASON_CHIPS.map((chip) => {
            const selected = reason.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => selectChip(chip)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "border-orange-400 bg-orange-400 text-white"
                    : "border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="可直接點選上方原因，或在此補充說明..."
          rows={2}
          className="bg-white text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          新希望日期 <span className="text-red-500">*</span>
        </Label>
        <DateMultiPicker selected={dates} onChange={setDates} maxDates={3} />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="gap-2 bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <CalendarDays className="h-4 w-4" />}
          送出變更申請
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
      </div>
    </form>
  );
}
