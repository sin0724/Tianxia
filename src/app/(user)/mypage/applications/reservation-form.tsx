"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { reservationInfoSchema, type ReservationInfoInput } from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, User, Phone, MessageSquare } from "lucide-react";

interface ReservationFormProps {
  applicationId: string;
  confirmedDate: string;
  onSuccess: () => void;
}

export function ReservationForm({ applicationId, confirmedDate, onSuccess }: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<ReservationInfoInput>({
    resolver: zodResolver(reservationInfoSchema),
    defaultValues: {
      application_id: applicationId,
    },
  });

  const onSubmit = async (data: ReservationInfoInput) => {
    if (!data.reservation_datetime.includes(" ")) {
      toast({ title: "請選擇到訪時間", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("reservation_info")
      .insert({
        application_id: applicationId,
        visitor_name: data.visitor_name,
        reservation_datetime: data.reservation_datetime,
        emergency_contact: data.emergency_contact,
        line_id: data.line_id || null,
        special_requests: data.special_requests || null,
      });

    if (insertError) {
      toast({ title: "發生錯誤", description: insertError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "reservation_submitted" })
      .eq("id", applicationId);

    if (updateError) {
      toast({ title: "發生錯誤", description: updateError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "預約資訊已提交", description: "請等待廣告主確認預約" });
    setIsLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-green-200 bg-green-50/50 p-5">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-green-600" />
        <p className="text-sm font-semibold text-green-800">填寫預約資訊</p>
      </div>

      {/* 1. 姓名（中文） */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <User className="h-3.5 w-3.5 text-gray-500" />
          姓名（中文）<span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("visitor_name")}
          placeholder="請輸入您的中文姓名"
          className="bg-white"
        />
        {errors.visitor_name && (
          <p className="text-xs text-red-500">{errors.visitor_name.message}</p>
        )}
      </div>

      {/* 2. 預約日期與時間 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          預約日期與時間<span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500">
          管理員確認日期：<span className="font-medium text-green-700">{confirmedDate}</span>
        </p>
        <Controller
          name="reservation_datetime"
          control={control}
          render={({ field }) => (
            <DateTimePicker
              value={field.value}
              onChange={field.onChange}
              preselectedDate={confirmedDate}
              minDate={new Date().toISOString().split("T")[0]}
            />
          )}
        />
        {errors.reservation_datetime && (
          <p className="text-xs text-red-500">{errors.reservation_datetime.message}</p>
        )}
      </div>

      {/* 3. 緊急聯絡方式 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Phone className="h-3.5 w-3.5 text-gray-500" />
          緊急聯絡方式<span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("emergency_contact")}
          placeholder="電話號碼或其他聯絡方式"
          className="bg-white"
        />
        {errors.emergency_contact && (
          <p className="text-xs text-red-500">{errors.emergency_contact.message}</p>
        )}
      </div>

      {/* 4. LINE ID */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">LINE ID</Label>
        <Input
          {...register("line_id")}
          placeholder="選填"
          className="bg-white"
        />
      </div>

      {/* 5. 其他備註 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
          其他備註
        </Label>
        <Textarea
          {...register("special_requests")}
          placeholder="過敏食材、特殊需求、無障礙設施等..."
          rows={3}
          className="bg-white"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full gap-2">
        {isLoading ? <LoadingSpinner size="sm" /> : <ClipboardList className="h-4 w-4" />}
        提交預約資訊
      </Button>
    </form>
  );
}
