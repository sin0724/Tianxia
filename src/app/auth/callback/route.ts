import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  // Railway 등 리버스 프록시 환경에서 실제 공개 도메인 사용
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = forwardedHost ?? request.headers.get("host") ?? "";
  const origin = host ? `${forwardedProto}://${host}` : new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Migration 017 트리거가 auth.users 생성 시 profiles를 자동 생성함
      // 트리거가 만든 profile에 이름/이메일이 없으면 업데이트
      const metadata = data.user.user_metadata ?? {};
      const name =
        metadata.full_name ||
        metadata.name ||
        (data.user.email ?? "").split("@")[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ name, email: data.user.email ?? "" })
        .eq("id", data.user.id);

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
