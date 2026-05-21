import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") || "/";
  // 내부 경로만 허용 (오픈 리다이렉트 방지)
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // OAuth 유저는 profiles 레코드가 없을 수 있으므로 없으면 자동 생성
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        const metadata = data.user.user_metadata ?? {};
        const name =
          metadata.full_name ||
          metadata.name ||
          (data.user.email ?? "").split("@")[0];

        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email ?? "",
          name,
        });
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
