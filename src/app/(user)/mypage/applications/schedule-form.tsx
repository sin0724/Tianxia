"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";
import { DateMultiPicker } from "@/components/user/date-multi-picker";

interface ScheduleFormProps {
  applicationId: string;
  onSuccess: () => void;
}

const TIME_CHIPS = ["上午", "下午", "晚上", "皆可配合"];

export function ScheduleForm({ applicationId, onSuccess }: ScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [timeChips, setTimeChips] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState("");
  const [message, setMessage] = useState("");

  const toggleTimeChip = (chip: string) => {
    setTimeChips((prev) =>
      prev.includes(chip)
        ? prev.filter((c) => c !== chip)
        : chip === "皆可配合"
        ? ["皆可配合"]
        : [...prev.filter((c) => c !== "皆可配合"), chip]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dates.length === 0) {
      toast({ title: "請至少選擇一個希望日期", variant: "destructive" });
      return;
    }

    const preferredTime =
      [...timeChips, customTime.trim()].filter(Boolean).join("、") || null;

    setIsLoading(true);
    const supabase = createClient();

    // upsert: 이미 제안이 있으면 덮어씀 (unique constraint 오류 방지)
    const { error: upsertError } = await supabase
      .from("schedule_proposals")
      .upsert(
        {
          application_id: applicationId,
          proposed_dates: dates,
          preferred_time: preferredTime,
          message: message.trim() || null,
        },
        { onConflict: "application_id" }
      );

    if (upsertError) {
      toast({ title: "提案失敗", description: "請稍後再試", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "schedule_proposed" })
      .eq("id", applicationId);

    if (updateError) {
      toast({ title: "狀態更新失敗", description: "提案已送出，請重新整理頁面", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "日程提案完成！", description: "請等待管理員確認日程" });
    setIsLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-blue-50/50 p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-blue-800">提案到訪日期</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          希望日期 <span className="text-red-500">*</span>
        </Label>
        <DateMultiPicker selected={dates} onChange={setDates} maxDates={3} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">偏好時段（選填）</Label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_CHIPS.map((chip) => {
            const active = timeChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleTimeChip(chip)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <Input
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          placeholder="具體時間可在此補充，例：12:00-14:00"
          className="bg-white"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm">備註（選填）</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="其他需要告知的事項..."
          rows={2}
          className="bg-white"
        />
      </div>

      <Button type="submit" disabled={isLoading || dates.length === 0} className="w-full gap-2">
        {isLoading ? <LoadingSpinner size="sm" /> : <CalendarDays className="h-4 w-4" />}
        {dates.length === 0 ? "請先選擇日期" : `送出日程提案（已選 ${dates.length} 個日期）`}
      </Button>
    </form>
  );
}
