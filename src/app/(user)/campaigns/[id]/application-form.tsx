"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Profile } from "@/types/database";

interface ApplicationFormProps {
  campaignId: string;
  userProfile: Profile | null;
}

export function ApplicationForm({ campaignId, userProfile }: ApplicationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      applied_facebook_url: userProfile?.facebook_url || "",
      applied_youtube_url: userProfile?.youtube_url || "",
      applied_dcard_url: userProfile?.dcard_url || "",
    },
  });

  const onSubmit = async (data: ApplicationInput) => {
    setIsLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "錯誤",
        description: "請先登入",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const applicationData = {
      campaign_id: data.campaign_id,
      user_id: user.id,
      message: data.message || null,
      applied_instagram_url: data.applied_instagram_url,
      applied_threads_url: data.applied_threads_url || null,
      applied_facebook_url: data.applied_facebook_url || null,
      applied_youtube_url: data.applied_youtube_url || null,
      applied_dcard_url: data.applied_dcard_url || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("applications") as any).insert(applicationData);

    if (error) {
      toast({
        title: "申請失敗",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "申請成功",
      description: "您的申請已提交，請等待審核結果",
    });

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("campaign_id")} />

      <div className="space-y-2">
        <Label htmlFor="applied_instagram_url">Instagram 網址 *</Label>
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
        <Label htmlFor="applied_threads_url">Threads 網址</Label>
        <Input
          id="applied_threads_url"
          placeholder="https://threads.net/@yourusername"
          {...register("applied_threads_url")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="applied_facebook_url">Facebook 網址</Label>
        <Input
          id="applied_facebook_url"
          placeholder="https://facebook.com/yourusername"
          {...register("applied_facebook_url")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="applied_youtube_url">YouTube 網址</Label>
        <Input
          id="applied_youtube_url"
          placeholder="https://youtube.com/@yourchannel"
          {...register("applied_youtube_url")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="applied_dcard_url">Dcard 網址</Label>
        <Input
          id="applied_dcard_url"
          placeholder="https://dcard.tw/@yourusername"
          {...register("applied_dcard_url")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">申請留言</Label>
        <Textarea
          id="message"
          placeholder="請簡短介紹自己，說明為什麼想參加這個活動..."
          rows={4}
          {...register("message")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" /> : "提交申請"}
      </Button>
    </form>
  );
}
