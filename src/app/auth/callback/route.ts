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
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      // 신규 가입자인 경우 프로필 생성 + 호텔 유입 처리
      if (!existingProfile) {
        const metadata = data.user.user_metadata ?? {};
        const name =
          metadata.full_name ||
          metadata.name ||
          (data.user.email ?? "").split("@")[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any).insert({
          id: data.user.id,
          email: data.user.email ?? "",
          name,
        });

        // QR 유입 쿠키가 있으면 호텔 유입 기록
        const hotelCode = request.cookies.get("_hc")?.value;
        const hotelPartnerId = request.cookies.get("_hid")?.value;
        if (hotelCode && hotelPartnerId) {
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
