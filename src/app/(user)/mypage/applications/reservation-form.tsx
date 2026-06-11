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
import { ClipboardList, User, Phone, MessageSquare, Calendar, Star, Users, Sparkles } from "lucide-react";
import type { ReservationPrefill } from "@/components/user/applications-list-client";

interface ReservationFormProps {
  applicationId: string;
  confirmedDate: string;
  onSuccess: () => void;
  userName?: string;
  userLineId?: string;
  serviceOptions?: string[];
  prefill?: ReservationPrefill | null;
}

export function ReservationForm({
  applicationId,
  confirmedDate,
  onSuccess,
  userName,
  userLineId,
  serviceOptions,
  prefill,
}: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasPrefill = !!prefill?.passport_name;

  const { register, handleSubmit, formState: { errors } } = useForm<ReservationInfoInput>({
    resolver: zodResolver(reservationInfoSchema),
    defaultValues: {
      application_id: applicationId,
      passport_name: prefill?.passport_name || "",
      date_of_birth: prefill?.date_of_birth || "",
      visitor_count: prefill?.visitor_count || 1,
      emergency_contact: prefill?.emergency_contact || "",
      line_id: prefill?.line_id || userLineId || "",
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
          passport_name: data.passport_name,
          date_of_birth: data.date_of_birth,
          visitor_count: data.visitor_count,
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

      {/* 이전 예약 정보 자동 입력 안내 */}
      {hasPrefill && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          已自動帶入您上次填寫的資料，確認無誤後即可直接送出
        </div>
      )}

      {/* 1. 護照英文姓名 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <User className="h-3.5 w-3.5 text-gray-500" />
          護照英文姓名<span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("passport_name")}
          placeholder="請輸入護照上的英文姓名（如：HONG GILDONG）"
          className="bg-white uppercase"
        />
        {errors.passport_name && (
          <p className="text-xs text-red-500">{errors.passport_name.message}</p>
        )}
      </div>

      {/* 2. 出生日期 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          出生日期<span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("date_of_birth")}
          type="date"
          className="bg-white"
        />
        {errors.date_of_birth && (
          <p className="text-xs text-red-500">{errors.date_of_birth.message}</p>
        )}
      </div>

      {/* 3. 方문 인원 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="h-3.5 w-3.5 text-gray-500" />
          到訪人數<span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-3">
          <Input
            {...register("visitor_count")}
            type="number"
            min={1}
            max={20}
            className="w-24 bg-white"
          />
          <span className="text-sm text-gray-500">人</span>
        </div>
        {errors.visitor_count && (
          <p className="text-xs text-red-500">{errors.visitor_count.message}</p>
        )}
      </div>

      {/* 4. 緊急聯絡方式 */}
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

      {/* 5. LINE ID */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">LINE ID</Label>
        <Input
          {...register("line_id")}
          placeholder="選填"
          className="bg-white"
        />
      </div>

      {/* 6. 서비스 선택 (옵션이 있는 캠페인만 표시) */}
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

      {/* 7. 其他備註 */}
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
