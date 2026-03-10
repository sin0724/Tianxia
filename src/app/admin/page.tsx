import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, FileText, Users, Star } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: campaignCount },
    { count: activeCampaignCount },
    { count: applicationCount },
    { count: pendingApplicationCount },
    { count: userCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user"),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
  ]);

  const { data: recentApplications } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      applied_at,
      profiles (name, email),
      campaigns (title_ko)
    `
    )
    .order("applied_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      title: "전체 캠페인",
      value: campaignCount || 0,
      subValue: `${activeCampaignCount || 0} 진행중`,
      icon: Megaphone,
    },
    {
      title: "전체 신청",
      value: applicationCount || 0,
      subValue: `${pendingApplicationCount || 0} 대기중`,
      icon: FileText,
    },
    {
      title: "전체 회원",
      value: userCount || 0,
      icon: Users,
    },
    {
      title: "전체 후기",
      value: reviewCount || 0,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500">Tianxia 플랫폼 현황</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subValue && (
                    <p className="mt-1 text-xs text-gray-400">{stat.subValue}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">최근 신청</CardTitle>
        </CardHeader>
        <CardContent>
          {recentApplications && recentApplications.length > 0 ? (
            <div className="space-y-3">
              {recentApplications.map((app) => {
                const profile = app.profiles as unknown as { name: string; email: string } | null;
                const campaign = app.campaigns as unknown as { title_ko: string } | null;

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {profile?.name || "알 수 없음"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {campaign?.title_ko || "알 수 없음"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-3 py-1 text-xs font-medium",
                          app.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : app.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        {app.status === "approved"
                          ? "승인"
                          : app.status === "rejected"
                          ? "반려"
                          : "대기"}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(app.applied_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">최근 신청이 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
