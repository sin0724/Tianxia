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

interface ReviewFormProps {
  applicationId: string;
}

export function ReviewForm({ applicationId }: ReviewFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      application_id: applicationId,
    },
  });

  const onSubmit = async (data: ReviewInput) => {
    setIsLoading(true);

    const supabase = createClient();

    const reviewData = {
      application_id: data.application_id,
      review_url: data.review_url,
      content: data.content || null,
      visited_at: data.visited_at || null,
      status: "submitted" as const,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("reviews") as any).insert(reviewData);

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
      title: "提交成功",
      description: "您的後記已提交",
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
        {isLoading ? <LoadingSpinner size="sm" /> : "提交後記"}
      </Button>
    </form>
  );
}
