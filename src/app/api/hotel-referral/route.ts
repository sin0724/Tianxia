import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // 인증된 세션에서 사용자 식별 — body 의 userId 를 신뢰하지 않음 (IDOR 방지)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { referralCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = body.referralCode?.trim().toUpperCase();
  const userId = user.id;

  if (!referralCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 추천인 코드로 호텔 파트너 조회 (대소문자 구분 없이)
  const { data: hotel } = await admin
    .from("hotel_partners")
    .select("id, partner_code, status")
    .ilike("partner_code", referralCode)
    .single();

  if (!hotel) {
    return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다" }, { status: 404 });
  }

  if (hotel.status !== "active") {
    return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다" }, { status: 404 });
  }

  // 이미 추천인 기록이 있으면 스킵
  const { data: profile } = await admin
    .from("profiles")
    .select("first_hotel_partner_id")
    .eq("id", userId)
    .single();

  if (profile?.first_hotel_partner_id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const [profileResult, referralResult] = await Promise.all([
    admin.from("profiles").update({
      first_hotel_partner_id: hotel.id,
      first_hotel_code: hotel.partner_code,
      referred_at: new Date().toISOString(),
    }).eq("id", userId),
    admin.from("hotel_referrals").insert({
      hotel_partner_id: hotel.id,
      hotel_code: hotel.partner_code,
      user_id: userId,
    }),
  ]);

  if (profileResult.error || referralResult.error) {
    return NextResponse.json(
      { error: profileResult.error?.message ?? referralResult.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
