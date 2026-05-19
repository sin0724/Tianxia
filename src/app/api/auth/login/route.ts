import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

const WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_ATTEMPTS = 5;

// IP+이메일 조합으로 시도 횟수 추적
// 단일 인스턴스용 — Vercel 같은 멀티 인스턴스 환경에서는 @upstash/ratelimit + Redis 권장
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isBlocked(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now > record.resetAt) return false;
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count++;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(request);
  const key = `${ip}:${email.toLowerCase()}`;

  if (isBlocked(key)) {
    return NextResponse.json(
      { error: "로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    recordFailure(key);
    return NextResponse.json({ error: "電子郵件或密碼錯誤" }, { status: 401 });
  }

  attempts.delete(key);
  return NextResponse.json({ success: true });
}
