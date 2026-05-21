import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// QR 접속 시 호텔 코드를 쿠키에 저장하고 캠페인 페이지로 리다이렉트
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelCode: string }> }
) {
  const { hotelCode } = await params;
  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from("hotel_partners")
    .select("id, partner_code, status")
    .eq("partner_code", hotelCode.toUpperCase())
    .eq("status", "active")
    .single();

  const destination = request.nextUrl.clone();
  destination.pathname = "/campaigns";
  destination.search = "";
  const response = NextResponse.redirect(destination);

  if (hotel) {
    const cookieOpts = {
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: "/",
      sameSite: "lax" as const,
      httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
    };
    response.cookies.set("_hc", hotel.partner_code, cookieOpts);
    response.cookies.set("_hid", hotel.id, cookieOpts);
  }

  return response;
}
