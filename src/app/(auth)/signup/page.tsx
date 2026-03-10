"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || "註冊失敗，請稍後再試");
      setIsLoading(false);
      return;
    }

    const profileData = {
      id: authData.user.id,
      email: data.email,
      name: data.name,
      line_id: data.line_id,
      instagram_url: data.instagram_url,
      threads_url: data.threads_url || null,
      facebook_url: data.facebook_url || null,
      youtube_url: data.youtube_url || null,
      dcard_url: data.dcard_url || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase.from("profiles") as any).insert(profileData);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      setError(`建立個人資料失敗: ${profileError.message}`);
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold">
            天
          </div>
          <h1 className="text-2xl font-bold text-gray-900">註冊</h1>
          <p className="mt-2 text-sm text-gray-500">建立您的天下帳戶</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">電子郵件 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="h-11 rounded-lg border-gray-200"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">姓名 *</Label>
              <Input
                id="name"
                placeholder="您的姓名"
                className="h-11 rounded-lg border-gray-200"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">密碼 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-lg border-gray-200"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">確認密碼 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-lg border-gray-200"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line_id" className="text-gray-700">LINE ID *</Label>
            <Input
              id="line_id"
              placeholder="您的LINE ID"
              className="h-11 rounded-lg border-gray-200"
              {...register("line_id")}
            />
            {errors.line_id && (
              <p className="text-sm text-red-500">{errors.line_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_url" className="text-gray-700">Instagram 網址 *</Label>
            <Input
              id="instagram_url"
              placeholder="https://instagram.com/yourusername"
              className="h-11 rounded-lg border-gray-200"
              {...register("instagram_url")}
            />
            {errors.instagram_url && (
              <p className="text-sm text-red-500">{errors.instagram_url.message}</p>
            )}
          </div>

          <div className="border-t pt-5">
            <p className="mb-4 text-sm text-gray-500">其他社群媒體 (選填)</p>
            <div className="space-y-4">
              <Input
                placeholder="Threads 網址"
                className="h-11 rounded-lg border-gray-200"
                {...register("threads_url")}
              />
              <Input
                placeholder="Facebook 網址"
                className="h-11 rounded-lg border-gray-200"
                {...register("facebook_url")}
              />
              <Input
                placeholder="YouTube 網址"
                className="h-11 rounded-lg border-gray-200"
                {...register("youtube_url")}
              />
              <Input
                placeholder="Dcard 網址"
                className="h-11 rounded-lg border-gray-200"
                {...register("dcard_url")}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-lg bg-primary text-base font-medium hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "註冊"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            已有帳戶？{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              立即登入
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
