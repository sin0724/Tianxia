import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: { userId?: string; hotelCode?: string; hotelPartnerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, hotelCode, hotelPartnerId } = body;
  if (!userId || !hotelCode || !hotelPartnerId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // userId가 실제로 존재하는 유저인지 검증
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  // 이미 호텔 유입 기록이 있으면 중복 등록 방지
  const { data: profile } = await admin
    .from("profiles")
    .select("first_hotel_partner_id")
    .eq("id", userId)
    .single();

  if (profile?.first_hotel_partner_id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await Promise.all([
    admin
      .from("profiles")
      .update({
        first_hotel_partner_id: hotelPartnerId,
        first_hotel_code: hotelCode,
        referred_at: new Date().toISOString(),
      })
      .eq("id", userId),
    admin.from("hotel_referrals").insert({
      hotel_partner_id: hotelPartnerId,
      hotel_code: hotelCode,
      user_id: userId,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
