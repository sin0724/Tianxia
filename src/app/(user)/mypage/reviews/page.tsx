import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, MessageSquareWarning } from "lucide-react";
import { ReviewForm } from "./review-form";

export const metadata = {
  title: "後記管理 | 天下 Tianxia",
};

type ReviewRow = {
  id: string;
  review_url: string;
  content: string | null;
  visited_at: string | null;
  status: string;
  submitted_at: string;
  admin_feedback: string | null;
};

// 정렬 우선순위: 반려(수정 필요) > 미제출 > 심사중 > 승인완료
function reviewPriority(review: ReviewRow | undefined) {
  if (review?.status === "rejected") return 0;
  if (!review) return 1;
  if (review.status === "submitted") return 2;
  return 3;
}

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
        content,
        visited_at,
        status,
        submitted_at,
        admin_feedback
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
              const aReview = (Array.isArray(a.reviews) ? a.reviews[0] : a.reviews) as ReviewRow | undefined;
              const bReview = (Array.isArray(b.reviews) ? b.reviews[0] : b.reviews) as ReviewRow | undefined;
              const pa = reviewPriority(aReview ?? undefined);
              const pb = reviewPriority(bReview ?? undefined);
              if (pa !== pb) return pa - pb;
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

            const reviewArray = Array.isArray(application.reviews)
              ? application.reviews
              : application.reviews
              ? [application.reviews]
              : [];
            const existingReview = (reviewArray[0] ?? null) as ReviewRow | null;

            const isRejected = existingReview?.status === "rejected";
            const isApproved = existingReview?.status === "approved";
            const isSubmitted = existingReview?.status === "submitted";

            const deadlineDays = getDaysRemaining(campaign.review_deadline);
            const needsAction = !existingReview || isRejected;
            const isOverdue = needsAction && deadlineDays <= 0;
            const isUrgent = needsAction && deadlineDays > 0 && deadlineDays <= 3;

            return (
              <Card
                key={application.id}
                className={
                  isRejected
                    ? "border-red-300 ring-1 ring-red-200"
                    : isUrgent || isOverdue
                    ? "border-red-200"
                    : ""
                }
              >
                {/* 반려 배너 — 최우선 표시 */}
                {isRejected && (
                  <div className="flex items-center gap-2 rounded-t-lg border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                    <MessageSquareWarning className="h-3.5 w-3.5 shrink-0" />
                    後記未通過審核，請依下方說明修改後重新提交
                  </div>
                )}
                {!isRejected && (isUrgent || isOverdue) && (
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
                        {needsAction && deadlineDays > 3 && (
                          <span className="ml-1.5 text-xs text-gray-400">（剩餘 {deadlineDays} 天）</span>
                        )}
                      </p>
                    </div>
                    {isApproved ? (
                      <Badge variant="success">已通過</Badge>
                    ) : isRejected ? (
                      <Badge variant="destructive">需要修改</Badge>
                    ) : isSubmitted ? (
                      <Badge variant="secondary">審核中</Badge>
                    ) : (
                      <Badge variant="outline">待提交</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isApproved && existingReview ? (
                    /* 승인 완료 — 명확한 완료 상태 */
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            後記已通過審核，此次合作全部完成！
                          </p>
                          <p className="mt-0.5 text-xs text-green-700">
                            感謝您的參與，歡迎繼續申請其他活動 🎉
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">後記連結：</span>
                          <a
                            href={existingReview.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-primary hover:underline"
                          >
                            {existingReview.review_url}
                          </a>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          提交時間：{formatDate(existingReview.submitted_at)}
                        </p>
                      </div>
                    </div>
                  ) : isRejected && existingReview ? (
                    /* 반려 — 사유 표시 + 재제출 폼 */
                    <div className="space-y-4">
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="mb-1 text-xs font-bold text-red-700">管理員修改要求：</p>
                        <p className="whitespace-pre-wrap text-sm text-red-800">
                          {existingReview.admin_feedback || "請聯繫管理員確認修改內容"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                        <p>原提交連結：
                          <a
                            href={existingReview.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-primary hover:underline"
                          >
                            {existingReview.review_url}
                          </a>
                        </p>
                        <p className="mt-0.5">提交時間：{formatDate(existingReview.submitted_at)}</p>
                      </div>
                      <div>
                        <p className="mb-3 text-sm font-semibold text-gray-800">
                          修改完成後，請重新提交：
                        </p>
                        <ReviewForm
                          applicationId={application.id}
                          existingReview={{
                            id: existingReview.id,
                            review_url: existingReview.review_url,
                            content: existingReview.content,
                            visited_at: existingReview.visited_at,
                          }}
                        />
                      </div>
                    </div>
                  ) : isSubmitted && existingReview ? (
                    /* 심사 중 */
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">後記審核中</p>
                          <p className="mt-0.5 text-xs text-blue-700">
                            管理員確認後會更新狀態。若需修改會在此通知您，請留意此頁面。
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">後記連結：</span>
                          <a
                            href={existingReview.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-primary hover:underline"
                          >
                            {existingReview.review_url}
                          </a>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          提交時間：{formatDate(existingReview.submitted_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* 미제출 — 첫 제출 폼 */
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
