import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { ReviewForm } from "./review-form";

export const metadata = {
  title: "後記管理 | 天下 Tianxia",
};

export default async function MyReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mypage/reviews");
  }

  // Get approved applications that need reviews
  const { data: approvedApplications } = await supabase
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
        review_deadline
      ),
      reviews (
        id,
        review_url,
        status,
        submitted_at
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["approved", "visit_confirmed", "completed"])
    .order("applied_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">後記管理</h1>
        <p className="text-sm text-muted-foreground">體驗完成後，請在截止日前貼上社群貼文連結提交</p>
      </div>

      {approvedApplications && approvedApplications.length > 0 ? (
        <div className="space-y-6">
          {[...approvedApplications]
            .sort((a, b) => {
              // 미제출 우선, 그 안에서는 마감일 빠른 순
              const aHasReview = Array.isArray(a.reviews) ? a.reviews.length > 0 : !!a.reviews;
              const bHasReview = Array.isArray(b.reviews) ? b.reviews.length > 0 : !!b.reviews;
              if (aHasReview !== bHasReview) return aHasReview ? 1 : -1;
              const aDeadline = (a.campaigns as any)?.review_deadline ?? "";
              const bDeadline = (b.campaigns as any)?.review_deadline ?? "";
              return aDeadline.localeCompare(bDeadline);
            })
            .map((application) => {
            const campaign = application.campaigns as unknown as {
              id: string;
              title_zh_tw: string | null;
              title_ko: string;
              brand_name_zh_tw: string | null;
              brand_name_ko: string;
              review_deadline: string;
            };

            const review = application.reviews as unknown as {
              id: string;
              review_url: string;
              status: string;
              submitted_at: string;
            } | null;

            const reviewArray = Array.isArray(application.reviews)
              ? application.reviews
              : application.reviews
              ? [application.reviews]
              : [];
            const existingReview = reviewArray[0] as typeof review;

            const deadlineDays = getDaysRemaining(campaign.review_deadline);
            const isOverdue = !existingReview && deadlineDays <= 0;
            const isUrgent = !existingReview && deadlineDays > 0 && deadlineDays <= 3;

            return (
              <Card key={application.id} className={isUrgent || isOverdue ? "border-red-200" : ""}>
                {(isUrgent || isOverdue) && (
                  <div className="flex items-center gap-2 rounded-t-lg border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {isOverdue
                      ? "後記提交期限已過，請盡快提交或聯繫管理員"
                      : `後記截止倒數 ${deadlineDays} 天，請盡快提交`}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.brand_name_zh_tw || campaign.brand_name_ko}
                      </p>
                      <CardTitle className="text-lg">
                        {campaign.title_zh_tw || campaign.title_ko}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        後記截止：{formatDate(campaign.review_deadline)}
                        {!existingReview && deadlineDays > 3 && (
                          <span className="ml-1.5 text-xs text-gray-400">（剩餘 {deadlineDays} 天）</span>
                        )}
                      </p>
                    </div>
                    {existingReview ? (
                      <Badge
                        variant={
                          existingReview.status === "approved"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {existingReview.status === "approved"
                          ? "已審核"
                          : "已提交"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">待提交</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {existingReview ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">後記連結：</span>
                        <a
                          href={existingReview.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {existingReview.review_url}
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        提交時間：{formatDate(existingReview.submitted_at)}
                      </p>
                    </div>
                  ) : (
                    <ReviewForm applicationId={application.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              您目前沒有需要提交後記的活動
            </p>
            <Link href="/campaigns">
              <Button>瀏覽活動</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
