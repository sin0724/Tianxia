import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: { referralCode?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = body.referralCode?.trim().toUpperCase();
  const { userId } = body;

  if (!referralCode || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 추천인 코드로 활성 호텔 파트너 조회
  const { data: hotel } = await admin
    .from("hotel_partners")
    .select("id, partner_code")
    .eq("partner_code", referralCode)
    .eq("status", "active")
    .single();

  if (!hotel) {
    return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다" }, { status: 404 });
  }

  // userId 유효성 검증
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
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

  await Promise.all([
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

  return NextResponse.json({ ok: true });
}
