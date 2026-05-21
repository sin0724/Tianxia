"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getHotelCookie } from "@/lib/hotel-cookie";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const handleGoogleSignup = async () => {
    setSocialLoading("google");
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("Google 登入失敗，請稍後再試");
      setSocialLoading(null);
    }
  };

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      const msg = authError.message ?? "";
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("User already exists")
      ) {
        setError("이미 가입된 이메일입니다. 로그인해주세요.");
      } else {
        setError("가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError("가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    // Supabase는 이미 가입된 이메일로 signUp 시 에러 없이 동일 유저를 반환하는 경우가 있음.
    // identities 배열이 비어 있으면 이미 존재하는 이메일.
    if (!authData.user.identities || authData.user.identities.length === 0) {
      setError("이미 가입된 이메일입니다. 로그인해주세요.");
      setIsLoading(false);
      return;
    }

    const profileData = {
      id: authData.user.id,
      email: data.email,
      name: data.name,
      line_id: data.line_id || null,
      instagram_url: data.instagram_url,
      threads_url: data.threads_url || null,
      facebook_url: null,
      youtube_url: null,
      dcard_url: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase.from("profiles") as any).insert(profileData);

    if (profileError) {
      const isDuplicate =
        profileError.code === "23505" ||
        (profileError.message ?? "").includes("duplicate key");
      if (isDuplicate) {
        setError("이미 가입된 계정입니다. 로그인해주세요.");
      } else {
        setError("계정 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setIsLoading(false);
      return;
    }

    // 호텔 QR 유입 정보 연결 (쿠키에 있을 때만)
    const { hotelCode, hotelPartnerId } = getHotelCookie();
    if (hotelCode && hotelPartnerId && authData.user) {
      await Promise.all([
        // 프로필에 최초 유입 호텔 저장
        (supabase.from("profiles") as any).update({
          first_hotel_partner_id: hotelPartnerId,
          first_hotel_code: hotelCode,
          referred_at: new Date().toISOString(),
        }).eq("id", authData.user.id),
        // hotel_referrals 기록
        (supabase.from("hotel_referrals") as any).insert({
          hotel_partner_id: hotelPartnerId,
          hotel_code: hotelCode,
          user_id: authData.user.id,
        }),
      ]);
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-gray-200/60 ring-1 ring-gray-100">
        <div className="mb-7 text-center">
          <Image
            src="/티엔샤로고.png"
            alt="Tianxia"
            width={140}
            height={40}
            className="mx-auto mb-4 h-10 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">創建帳戶</h1>
          <p className="mt-1.5 text-sm text-gray-400">加入天下，探索韓國體驗活動</p>
        </div>

        {/* Google 快速註冊 */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-3 rounded-lg border-gray-200 font-medium"
            onClick={handleGoogleSignup}
            disabled={!!socialLoading || isLoading}
          >
            {socialLoading === "google" ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                使用 Google 快速註冊
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-gray-400">推薦！無需填寫密碼，快速開始</p>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">或使用電子郵件註冊</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-700">電子郵件 <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="h-11 rounded-lg border-gray-200"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-700">姓名 <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="您的中文姓名"
                className="h-11 rounded-lg border-gray-200"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-700">密碼 <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="含大寫字母+數字"
                className="h-11 rounded-lg border-gray-200"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-gray-700">確認密碼 <span className="text-red-500">*</span></Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-lg border-gray-200"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instagram_url" className="text-gray-700">
              Instagram 網址 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="instagram_url"
              placeholder="https://instagram.com/yourusername"
              className="h-11 rounded-lg border-gray-200"
              {...register("instagram_url")}
            />
            {errors.instagram_url && (
              <p className="text-xs text-red-500">{errors.instagram_url.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="line_id" className="text-gray-700">
              LINE ID <span className="text-xs font-normal text-gray-400">（選填，獲選後聯繫用）</span>
            </Label>
            <Input
              id="line_id"
              placeholder="您的LINE ID"
              className="h-11 rounded-lg border-gray-200"
              {...register("line_id")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700">
              Threads 網址 <span className="text-xs font-normal text-gray-400">（選填）</span>
            </Label>
            <Input
              placeholder="https://threads.net/@yourusername"
              className="h-11 rounded-lg border-gray-200"
              {...register("threads_url")}
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-lg bg-primary text-base font-medium hover:bg-primary/90"
            disabled={isLoading || !!socialLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "立即註冊"}
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
