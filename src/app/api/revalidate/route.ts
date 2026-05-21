import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const campaignId = body?.campaignId as string | undefined;

  // 캐시 태그로 홈 데이터 즉시 무효화 (Next.js 16 - profile 인자 필요)
  revalidateTag("home-data", "default");
  revalidatePath("/");
  revalidatePath("/campaigns");

  if (campaignId) {
    revalidatePath(`/campaigns/${campaignId}`);
  }

  return NextResponse.json({ revalidated: true });
}
