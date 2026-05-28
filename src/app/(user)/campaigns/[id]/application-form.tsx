"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { applicationSchema, type ApplicationInput } from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, ClipboardList, Bell, ArrowRight } from "lucide-react";
import type { Profile } from "@/types/database";

interface ApplicationFormProps {
  campaignId: string;
  userProfile: Profile | null;
}

export function ApplicationForm({ campaignId, userProfile }: ApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      campaign_id: campaignId,
      applied_instagram_url: userProfile?.instagram_url || "",
      applied_threads_url: userProfile?.threads_url || "",
    },
  });

  const onSubmit = async (data: ApplicationInput) => {
    setIsLoading(true);

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: "錯誤", description: "請先登入", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const hotelPartnerId = (userProfile as any)?.first_hotel_partner_id ?? null;
    const hotelCode = (userProfile as any)?.first_hotel_code ?? null;

    const applicationData = {
      campaign_id: data.campaign_id,
      user_id: user.id,
      message: data.message || null,
      applied_instagram_url: data.applied_instagram_url,
      applied_threads_url: data.applied_threads_url || null,
      ...(hotelPartnerId ? { hotel_partner_id: hotelPartnerId, hotel_code: hotelCode } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("applications") as any).insert(applicationData);

    if (error) {
      toast({ title: "申請失敗", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    fetch("/api/revalidate-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });

    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">申請已送出！</h3>
          <p className="mt-1 text-sm text-gray-500">我們已收到您的申請，感謝您的參與</p>
        </div>

        {/* 다음 단계 안내 */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
          <p className="mb-3 text-xs font-bold text-blue-800">📋 接下來請注意：</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">1</div>
              <p className="text-xs text-blue-700">保持 Instagram 帳號<span className="font-semibold">公開狀態</span>，方便廣告主審核</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">2</div>
              <p className="text-xs text-blue-700">審核通常需要 <span className="font-semibold">3〜7 個工作天</span></p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">3</div>
              <p className="text-xs text-blue-700">獲選後狀態更新為「已選中」，<span className="font-semibold">記得回來查看</span></p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-2">
          <Link href="/mypage/applications" className="block">
            <Button className="w-full gap-2 rounded-full">
              <ClipboardList className="h-4 w-4" />
              查看我的申請
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/campaigns" className="block">
            <Button variant="outline" className="w-full rounded-full gap-2 text-gray-600">
              <Bell className="h-4 w-4" />
              繼續瀏覽活動
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("campaign_id")} />

      {/* 저장된 신청자 정보 */}
      {userProfile && (userProfile.name || userProfile.line_id) && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
          <p className="mb-2 text-xs font-semibold text-gray-500">申請者資訊（已儲存）</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {userProfile.name && (
              <span className="text-gray-700">
                <span className="text-gray-400">姓名：</span>{userProfile.name}
              </span>
            )}
            {userProfile.line_id && (
              <span className="text-gray-700">
                <span className="text-gray-400">LINE：</span>{userProfile.line_id}
              </span>
            )}
          </div>
          <a href="/mypage" className="mt-1.5 block text-[11px] text-primary hover:underline">
            修改資料 →
          </a>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="applied_instagram_url">
          Instagram 網址 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="applied_instagram_url"
          placeholder="https://instagram.com/yourusername"
          {...register("applied_instagram_url")}
        />
        {errors.applied_instagram_url && (
          <p className="text-sm text-destructive">
            {errors.applied_instagram_url.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="applied_threads_url">
          Threads 網址 <span className="text-xs font-normal text-gray-400">（選填）</span>
        </Label>
        <Input
          id="applied_threads_url"
          placeholder="https://threads.net/@yourusername"
          {...register("applied_threads_url")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          申請留言 <span className="text-xs font-normal text-gray-400">（選填）</span>
        </Label>
        <Textarea
          id="message"
          placeholder="簡短介紹自己，說明為什麼想參加這個活動..."
          rows={3}
          {...register("message")}
        />
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" /> : "立即提交申請"}
      </Button>
    </form>
  );
}
