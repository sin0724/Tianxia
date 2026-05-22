"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { reservationInfoSchema, type ReservationInfoInput } from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, User, Phone, MessageSquare, Calendar, Star } from "lucide-react";

interface ReservationFormProps {
  applicationId: string;
  confirmedDate: string;
  onSuccess: () => void;
  userName?: string;
  userLineId?: string;
  serviceOptions?: string[];
}

export function ReservationForm({
  applicationId,
  confirmedDate,
  onSuccess,
  userName,
  userLineId,
  serviceOptions,
}: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ReservationInfoInput>({
    resolver: zodResolver(reservationInfoSchema),
    defaultValues: {
      application_id: applicationId,
      visitor_name: userName || "",
      line_id: userLineId || "",
      reservation_datetime: confirmedDate,
    },
  });

  const onSubmit = async (data: ReservationInfoInput) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("reservation_info")
      .upsert(
        {
          application_id: applicationId,
          visitor_name: data.visitor_name,
          reservation_datetime: confirmedDate,
          emergency_contact: data.emergency_contact,
          line_id: data.line_id || null,
          selected_service: data.selected_service || null,
          special_requests: data.special_requests || null,
        },
        { onConflict: "application_id" }
      );

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

      {/* 관리자 확정 날짜+시간 표시 */}
      <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2.5">
        <Calendar className="h-4 w-4 shrink-0 text-green-700" />
        <div>
          <p className="text-xs font-medium text-green-700">管理員確認的到訪時間</p>
          <p className="text-sm font-bold text-green-900">{confirmedDate}</p>
        </div>
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

      {/* 2. 緊急聯絡方式 */}
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

      {/* 3. LINE ID */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">LINE ID</Label>
        <Input
          {...register("line_id")}
          placeholder="選填"
          className="bg-white"
        />
      </div>

      {/* 4. 서비스 선택 (옵션이 있는 캠페인만 표시) */}
      {serviceOptions && serviceOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            選擇服務項目<span className="text-red-500">*</span>
          </Label>
          <select
            {...register("selected_service")}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">請選擇服務項目</option>
            {serviceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

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
