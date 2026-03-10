"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import type { Profile } from "@/types/database";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name,
      line_id: profile.line_id,
      instagram_url: profile.instagram_url || "",
      threads_url: profile.threads_url || "",
      facebook_url: profile.facebook_url || "",
      youtube_url: profile.youtube_url || "",
      dcard_url: profile.dcard_url || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateInput) => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        line_id: data.line_id,
        instagram_url: data.instagram_url || null,
        threads_url: data.threads_url || null,
        facebook_url: data.facebook_url || null,
        youtube_url: data.youtube_url || null,
        dcard_url: data.dcard_url || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "更新失敗",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "更新成功",
      description: "您的個人資料已更新",
    });

    router.refresh();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-gray-700">電子郵件</Label>
        <Input value={profile.email} disabled className="h-11 rounded-lg bg-gray-50" />
        <p className="text-xs text-gray-400">電子郵件無法變更</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">姓名 *</Label>
          <Input id="name" className="h-11 rounded-lg border-gray-200" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="line_id" className="text-gray-700">LINE ID *</Label>
          <Input id="line_id" className="h-11 rounded-lg border-gray-200" {...register("line_id")} />
          {errors.line_id && (
            <p className="text-sm text-red-500">{errors.line_id.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram_url" className="text-gray-700">Instagram 網址 *</Label>
        <Input id="instagram_url" className="h-11 rounded-lg border-gray-200" {...register("instagram_url")} />
        {errors.instagram_url && (
          <p className="text-sm text-red-500">{errors.instagram_url.message}</p>
        )}
      </div>

      <div className="border-t pt-5">
        <p className="mb-4 text-sm text-gray-500">其他社群媒體 (選填)</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threads_url" className="text-gray-700">Threads</Label>
            <Input id="threads_url" className="h-11 rounded-lg border-gray-200" {...register("threads_url")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url" className="text-gray-700">Facebook</Label>
            <Input id="facebook_url" className="h-11 rounded-lg border-gray-200" {...register("facebook_url")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube_url" className="text-gray-700">YouTube</Label>
            <Input id="youtube_url" className="h-11 rounded-lg border-gray-200" {...register("youtube_url")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dcard_url" className="text-gray-700">Dcard</Label>
            <Input id="dcard_url" className="h-11 rounded-lg border-gray-200" {...register("dcard_url")} />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="h-11 rounded-lg bg-primary px-8 hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner size="sm" /> : "儲存變更"}
      </Button>
    </form>
  );
}
