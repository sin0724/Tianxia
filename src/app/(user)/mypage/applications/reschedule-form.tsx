"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, X } from "lucide-react";

interface RescheduleFormProps {
  applicationId: string;
  currentConfirmedDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RescheduleForm({
  applicationId,
  currentConfirmedDate,
  onSuccess,
  onCancel,
}: RescheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<string[]>(["", "", ""]);
  const [reason, setReason] = useState("");

  const updateDate = (index: number, value: string) => {
    const updated = [...dates];
    updated[index] = value;
    setDates(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDates = dates.filter(Boolean);
    if (!reason.trim()) {
      toast({ title: "請填寫變更原因", variant: "destructive" });
      return;
    }
    if (validDates.length === 0) {
      toast({ title: "請至少選擇一個希望日期", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { error: upsertError } = await supabase
      .from("schedule_proposals")
      .upsert(
        {
          application_id: applicationId,
          proposed_dates: validDates,
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

      <div className="space-y-1.5">
        <Label className="text-sm">
          變更原因 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="請說明無法按原定日程到訪的原因..."
          rows={2}
          className="bg-white text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">新希望日期（最多3個）<span className="text-red-500">*</span></Label>
        {dates.map((date, i) => (
          <Input
            key={i}
            type="date"
            value={date}
            onChange={(e) => updateDate(i, e.target.value)}
            className="bg-white"
            min={new Date().toISOString().split("T")[0]}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="gap-2 bg-orange-500 hover:bg-orange-600">
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
