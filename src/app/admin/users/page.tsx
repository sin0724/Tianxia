import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getRegionLabel } from "@/constants/regions";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">회원 관리</h2>
        <p className="text-muted-foreground">
          플랫폼에 가입한 회원을 조회합니다
        </p>
      </div>

      {users && users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant="outline">
                        {getRegionLabel(user.region, "ko")}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>이메일: {user.email}</p>
                      <p>LINE ID: {user.line_id}</p>
                      <p>Instagram: @{user.instagram_handle}</p>
                      {user.instagram_url && (
                        <p>
                          Instagram URL:{" "}
                          <a
                            href={user.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {user.instagram_url}
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Additional SNS */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.threads_url && (
                        <a
                          href={user.threads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Threads</Badge>
                        </a>
                      )}
                      {user.facebook_url && (
                        <a
                          href={user.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Facebook</Badge>
                        </a>
                      )}
                      {user.youtube_url && (
                        <a
                          href={user.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">YouTube</Badge>
                        </a>
                      )}
                      {user.dcard_url && (
                        <a
                          href={user.dcard_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Dcard</Badge>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>가입일</p>
                    <p>{formatDate(user.created_at, "ko")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">등록된 회원이 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
