import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = {
  title: "我的申請 | 天下 Tianxia",
};

export default async function MyApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mypage/applications");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      *,
      campaigns (
        id,
        title_zh_tw,
        title_ko,
        brand_name_zh_tw,
        brand_name_ko,
        thumbnail_url,
        experience_date,
        review_deadline
      )
    `
    )
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">已選中</Badge>;
      case "rejected":
        return <Badge variant="destructive">未選中</Badge>;
      default:
        return <Badge variant="secondary">審核中</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">我的申請</h1>
        <p className="text-muted-foreground">查看您的活動申請狀態</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const campaign = application.campaigns as unknown as {
              id: string;
              title_zh_tw: string | null;
              title_ko: string;
              brand_name_zh_tw: string | null;
              brand_name_ko: string;
              thumbnail_url: string | null;
              experience_date: string;
              review_deadline: string;
            };

            return (
              <Card key={application.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.brand_name_zh_tw || campaign.brand_name_ko}
                      </p>
                      <CardTitle className="text-lg">
                        {campaign.title_zh_tw || campaign.title_ko}
                      </CardTitle>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>申請日期：{formatDate(application.applied_at)}</span>
                    <span>體驗日期：{formatDate(campaign.experience_date)}</span>
                    <span>後記截止：{formatDate(campaign.review_deadline)}</span>
                  </div>

                  {application.status === "approved" && (
                    <div className="flex gap-2">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          查看活動
                        </Button>
                      </Link>
                      <Link href="/mypage/reviews">
                        <Button size="sm">提交後記</Button>
                      </Link>
                    </div>
                  )}

                  {application.admin_note && (
                    <div className="mt-4 rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">管理員備註：</p>
                      <p className="text-sm text-muted-foreground">
                        {application.admin_note}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">您還沒有申請任何活動</p>
            <Link href="/campaigns">
              <Button>瀏覽活動</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
