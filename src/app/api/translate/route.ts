import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  translateCampaignToZhTw,
  type CampaignTranslationInput,
} from "@/lib/claude/translate";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    let body: CampaignTranslationInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 데이터가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const translations = await translateCampaignToZhTw(body);

    return NextResponse.json(translations);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 번역 오류가 발생했습니다.";
    console.error("Translation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
