import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Star, LogOut } from "lucide-react";

export const metadata = {
  title: "我的帳戶 | 天下 Tianxia",
};

export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mypage");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { count: applicationCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: approvedCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "approved");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">我的帳戶</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">活動統計</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{applicationCount || 0}</p>
                  <p className="text-sm text-gray-500">總申請數</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{approvedCount || 0}</p>
                  <p className="text-sm text-gray-500">已選中</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">快速連結</h2>
              <div className="space-y-2">
                <Link href="/mypage/applications">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900">
                    <FileText className="h-4 w-4" />
                    我的申請
                  </Button>
                </Link>
                <Link href="/mypage/reviews">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900">
                    <Star className="h-4 w-4" />
                    後記管理
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600"
                    type="submit"
                  >
                    <LogOut className="h-4 w-4" />
                    登出
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-semibold text-gray-900">個人資料</h2>
              <ProfileForm profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
