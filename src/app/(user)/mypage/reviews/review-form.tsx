"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { reviewSchema, type ReviewInput } from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";

interface ExistingReview {
  id: string;
  review_url: string;
  content: string | null;
  visited_at: string | null;
}

interface ReviewFormProps {
  applicationId: string;
  /** 반려된 후기를 다시 제출하는 경우 기존 후기 정보 */
  existingReview?: ExistingReview | null;
}

export function ReviewForm({ applicationId, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isResubmission = !!existingReview;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      application_id: applicationId,
      review_url: existingReview?.review_url || "",
      content: existingReview?.content || "",
      visited_at: existingReview?.visited_at || "",
    },
  });

  const onSubmit = async (data: ReviewInput) => {
    setIsLoading(true);

    const supabase = createClient();

    const reviewData = {
      review_url: data.review_url,
      content: data.content || null,
      visited_at: data.visited_at || null,
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };

    // 재제출: 기존 행 업데이트 / 첫 제출: 새 행 생성
    const { error } = isResubmission
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("reviews") as any)
          .update(reviewData)
          .eq("id", existingReview.id)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("reviews") as any)
          .insert({ application_id: data.application_id, ...reviewData });

    if (error) {
      toast({
        title: "提交失敗",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: isResubmission ? "重新提交成功" : "提交成功",
      description: isResubmission
        ? "修改後的後記已送出，請等待管理員再次審核"
        : "您的後記已提交",
    });

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("application_id")} />

      <div className="space-y-2">
        <Label htmlFor="review_url">後記連結 *</Label>
        <Input
          id="review_url"
          placeholder="https://instagram.com/p/..."
          {...register("review_url")}
        />
        {errors.review_url && (
          <p className="text-sm text-destructive">{errors.review_url.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          請貼上您在社群媒體發布的後記連結
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visited_at">體驗日期</Label>
        <Input id="visited_at" type="date" {...register("visited_at")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">補充說明</Label>
        <Textarea
          id="content"
          placeholder="有任何需要補充說明的內容..."
          rows={3}
          {...register("content")}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" /> : isResubmission ? "重新提交後記" : "提交後記"}
      </Button>
    </form>
  );
}
