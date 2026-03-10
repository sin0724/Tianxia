import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ReviewActions } from "./review-actions";

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      *,
      applications (
        id,
        profiles (name, email),
        campaigns (title_ko, brand_name_ko)
      )
    `
    )
    .order("submitted_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">승인</Badge>;
      case "submitted":
        return <Badge variant="secondary">제출됨</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">후기 관리</h2>
        <p className="text-muted-foreground">제출된 후기를 확인합니다</p>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => {
            const application = review.applications as unknown as {
              id: string;
              profiles: { name: string; email: string } | null;
              campaigns: { title_ko: string; brand_name_ko: string } | null;
            } | null;

            return (
              <Card key={review.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {application?.campaigns?.brand_name_ko} -{" "}
                        {application?.campaigns?.title_ko}
                      </p>
                      <CardTitle className="text-lg">
                        {application?.profiles?.name || "알 수 없음"}
                      </CardTitle>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">이메일: </span>
                      {application?.profiles?.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">후기 링크: </span>
                      <a
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {review.review_url}
                      </a>
                    </p>
                    {review.visited_at && (
                      <p>
                        <span className="text-muted-foreground">방문일: </span>
                        {formatDate(review.visited_at, "ko")}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">제출일: </span>
                      {formatDate(review.submitted_at, "ko")}
                    </p>
                  </div>

                  {review.content && (
                    <div className="mb-4 rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">보충 설명:</p>
                      <p className="text-sm text-muted-foreground">
                        {review.content}
                      </p>
                    </div>
                  )}

                  {review.status === "submitted" && (
                    <ReviewActions reviewId={review.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">제출된 후기가 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
