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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 데이터가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 각 필드 최대 길이 검증 (Claude API 과금 남용 방지)
    const MAX_FIELD_LENGTH = 5000;
    const textFields = ["title_ko", "brand_name_ko", "summary_ko", "description_ko", "benefits_ko", "requirements_ko", "precautions_ko", "service_options_ko"] as const;
    const body = rawBody as Record<string, unknown>;
    for (const field of textFields) {
      const val = body[field];
      if (val !== undefined && val !== null && typeof val !== "string") {
        return NextResponse.json({ error: `${field} 필드는 문자열이어야 합니다.` }, { status: 400 });
      }
      if (typeof val === "string" && val.length > MAX_FIELD_LENGTH) {
        return NextResponse.json({ error: `${field} 필드가 너무 깁니다 (최대 ${MAX_FIELD_LENGTH}자).` }, { status: 400 });
      }
    }

    const translations = await translateCampaignToZhTw(rawBody as CampaignTranslationInput);

    return NextResponse.json(translations);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 번역 오류가 발생했습니다.";
    console.error("Translation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
