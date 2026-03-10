import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ApplicationActions } from "./application-actions";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      *,
      profiles (id, name, email, instagram_handle, region),
      campaigns (id, title_ko, brand_name_ko)
    `
    )
    .order("applied_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">승인</Badge>;
      case "rejected":
        return <Badge variant="destructive">반려</Badge>;
      default:
        return <Badge variant="secondary">대기</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">신청 관리</h2>
        <p className="text-muted-foreground">캠페인 신청을 승인하거나 반려합니다</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const profile = application.profiles as unknown as {
              id: string;
              name: string;
              email: string;
              instagram_handle: string;
              region: string;
            } | null;

            const campaign = application.campaigns as unknown as {
              id: string;
              title_ko: string;
              brand_name_ko: string;
            } | null;

            return (
              <Card key={application.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign?.brand_name_ko || "알 수 없음"} - {campaign?.title_ko || "알 수 없음"}
                      </p>
                      <CardTitle className="text-lg">
                        {profile?.name || "알 수 없음"}
                      </CardTitle>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">이메일: </span>
                      {profile?.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instagram: </span>
                      @{profile?.instagram_handle}
                    </div>
                    <div>
                      <span className="text-muted-foreground">지역: </span>
                      {profile?.region}
                    </div>
                    <div>
                      <span className="text-muted-foreground">신청일: </span>
                      {formatDate(application.applied_at, "ko")}
                    </div>
                  </div>

                  {application.message && (
                    <div className="mb-4 rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">신청 메시지:</p>
                      <p className="text-sm text-muted-foreground">
                        {application.message}
                      </p>
                    </div>
                  )}

                  <div className="mb-4 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Instagram: </span>
                      <a
                        href={application.applied_instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {application.applied_instagram_url}
                      </a>
                    </p>
                    {application.applied_threads_url && (
                      <p>
                        <span className="text-muted-foreground">Threads: </span>
                        <a
                          href={application.applied_threads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_threads_url}
                        </a>
                      </p>
                    )}
                    {application.applied_facebook_url && (
                      <p>
                        <span className="text-muted-foreground">Facebook: </span>
                        <a
                          href={application.applied_facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_facebook_url}
                        </a>
                      </p>
                    )}
                    {application.applied_youtube_url && (
                      <p>
                        <span className="text-muted-foreground">YouTube: </span>
                        <a
                          href={application.applied_youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_youtube_url}
                        </a>
                      </p>
                    )}
                    {application.applied_dcard_url && (
                      <p>
                        <span className="text-muted-foreground">Dcard: </span>
                        <a
                          href={application.applied_dcard_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_dcard_url}
                        </a>
                      </p>
                    )}
                  </div>

                  {application.status === "pending" && (
                    <ApplicationActions applicationId={application.id} />
                  )}

                  {application.admin_note && (
                    <div className="mt-4 rounded-md border p-3">
                      <p className="text-sm font-medium">관리자 메모:</p>
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
            <p className="text-muted-foreground">신청 내역이 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
