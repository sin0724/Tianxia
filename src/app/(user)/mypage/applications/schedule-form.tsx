"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { scheduleProposalSchema, type ScheduleProposalInput } from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Plus, X, CalendarDays } from "lucide-react";

interface ScheduleFormProps {
  applicationId: string;
  onSuccess: () => void;
}

export function ScheduleForm({ applicationId, onSuccess }: ScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<string[]>(["", "", ""]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ScheduleProposalInput>({
    resolver: zodResolver(scheduleProposalSchema),
    defaultValues: { application_id: applicationId, proposed_dates: [] },
  });

  const updateDate = (index: number, value: string) => {
    const updated = [...dates];
    updated[index] = value;
    setDates(updated);
    setValue("proposed_dates", updated.filter(Boolean));
  };

  const onSubmit = async (data: ScheduleProposalInput) => {
    const validDates = dates.filter(Boolean);
    if (validDates.length === 0) {
      toast({ title: "請至少選擇一個希望日期", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    // upsert: 이미 제안이 있으면 덮어씀 (unique constraint 오류 방지)
    const { error: upsertError } = await supabase
      .from("schedule_proposals")
      .upsert(
        {
          application_id: applicationId,
          proposed_dates: validDates,
          preferred_time: data.preferred_time || null,
          message: data.message || null,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-blue-50/50 p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-blue-800">提案到訪日期</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">希望日期 (最多3個)</Label>
        {dates.map((date, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => updateDate(i, e.target.value)}
              className="flex-1 bg-white"
              min={new Date().toISOString().split("T")[0]}
            />
            {i > 0 && (
              <button
                type="button"
                onClick={() => updateDate(i, "")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {errors.proposed_dates && (
          <p className="text-xs text-red-500">{errors.proposed_dates.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-sm">偏好時段 (選填)</Label>
        <Input
          {...register("preferred_time")}
          placeholder="例：12:00-14:00 / 晚上7點後"
          className="bg-white"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm">備註 (選填)</Label>
        <Textarea
          {...register("message")}
          placeholder="其他需要告知的事項..."
          rows={2}
          className="bg-white"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full gap-2">
        {isLoading ? <LoadingSpinner size="sm" /> : <CalendarDays className="h-4 w-4" />}
        送出日程提案
      </Button>
    </form>
  );
}
