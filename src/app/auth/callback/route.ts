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

      // QR 유입 쿠키가 있고 아직 호텔 유입 기록이 없으면 처리
      const hotelCode = request.cookies.get("_hc")?.value;
      const hotelPartnerId = request.cookies.get("_hid")?.value;
      if (hotelCode && hotelPartnerId) {
        // first_hotel_partner_id가 없는 유저에게만 기록 (중복 방지)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("first_hotel_partner_id")
          .eq("id", data.user.id)
          .single();

        if (!profile?.first_hotel_partner_id) {
          await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from("profiles") as any).update({
              first_hotel_partner_id: hotelPartnerId,
              first_hotel_code: hotelCode,
              referred_at: new Date().toISOString(),
            }).eq("id", data.user.id),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from("hotel_referrals") as any).insert({
              hotel_partner_id: hotelPartnerId,
              hotel_code: hotelCode,
              user_id: data.user.id,
            }),
          ]);
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
