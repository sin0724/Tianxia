import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Gift, CheckCircle, Map } from "lucide-react";
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { getRegionLabel } from "@/constants/regions";
import { PLATFORMS } from "@/constants/platforms";
import { ApplicationForm } from "./application-form";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title_zh_tw, title_ko, summary_zh_tw, summary_ko")
    .eq("id", id)
    .single();

  if (!campaign) {
    return { title: "活動不存在 | 天下 Tianxia" };
  }

  return {
    title: `${campaign.title_zh_tw || campaign.title_ko} | 天下 Tianxia`,
    description: campaign.summary_zh_tw || campaign.summary_ko,
  };
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // 카테고리 정보 가져오기
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", campaign.category)
    .single();

  const categoryLabel = category ? `${category.icon || ""} ${category.name_zh}` : campaign.category;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingApplication = null;
  let userProfile = null;

  if (user) {
    const { data: application } = await supabase
      .from("applications")
      .select("*")
      .eq("campaign_id", id)
      .eq("user_id", user.id)
      .single();
    existingApplication = application;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  const daysRemaining = getDaysRemaining(campaign.application_deadline);
  const isDeadlinePassed = daysRemaining <= 0;

  const title = campaign.title_zh_tw || campaign.title_ko;
  const brandName = campaign.brand_name_zh_tw || campaign.brand_name_ko;
  const summary = campaign.summary_zh_tw || campaign.summary_ko;
  const description = campaign.description_zh_tw || campaign.description_ko;
  const benefits = campaign.benefits_zh_tw || campaign.benefits_ko;
  const requirements = campaign.requirements_zh_tw || campaign.requirements_ko;
  const precautions = campaign.precautions_zh_tw || campaign.precautions_ko;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Thumbnail */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-lg">
            {campaign.thumbnail_url ? (
              <Image
                src={campaign.thumbnail_url}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-6xl">🎁</span>
              </div>
            )}
          </div>

          {/* Title & Meta */}
          <div className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{categoryLabel}</Badge>
              {((campaign as any).platforms || ["instagram"]).map((p: string) => {
                const platform = PLATFORMS.find((pl) => pl.value === p);
                return (
                  <Badge key={p} variant="secondary">
                    {platform?.label_zh || p}
                  </Badge>
                );
              })}
              <span className="text-sm text-muted-foreground">{brandName}</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="text-lg text-muted-foreground">{summary}</p>
          </div>

          {/* Info Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">活動地點</p>
                  <p className="font-medium">{getRegionLabel(campaign.region)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">招募人數</p>
                  <p className="font-medium">{campaign.recruitment_count} 名</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">體驗日期</p>
                  <p className="font-medium">{formatDate(campaign.experience_date)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">後記截止</p>
                  <p className="font-medium">{formatDate(campaign.review_deadline)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 구글 지도 링크 */}
          {(campaign as any).map_url && (
            <div className="mb-8">
              <a
                href={(campaign as any).map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10"
              >
                <Map className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-primary">查看地圖位置</p>
                  <p className="text-sm text-muted-foreground">點擊在 Google 地圖中查看</p>
                </div>
              </a>
            </div>
          )}

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>活動介紹</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span>提供內容</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{benefits}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>參與條件</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{requirements}</p>
              </div>
            </CardContent>
          </Card>

          {/* Precautions */}
          {precautions && (
            <Card>
              <CardHeader>
                <CardTitle>注意事項</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{precautions}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Application */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardHeader>
                <CardTitle>申請活動</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>截止日期：{formatDate(campaign.application_deadline)}</span>
                </div>
                {!isDeadlinePassed && daysRemaining <= 3 && (
                  <Badge variant="destructive">剩餘 {daysRemaining} 天</Badge>
                )}
              </CardHeader>
              <CardContent>
                {isDeadlinePassed ? (
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-4">
                      已截止
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      此活動已截止申請
                    </p>
                  </div>
                ) : !user ? (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      登入後即可申請此活動
                    </p>
                    <Link href={`/login?redirect=/campaigns/${id}`}>
                      <Button className="w-full">登入申請</Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      還沒有帳戶？{" "}
                      <Link href="/signup" className="text-primary hover:underline">
                        立即註冊
                      </Link>
                    </p>
                  </div>
                ) : existingApplication ? (
                  <div className="text-center">
                    <Badge
                      variant={
                        existingApplication.status === "approved"
                          ? "success"
                          : existingApplication.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className="mb-4"
                    >
                      {existingApplication.status === "approved"
                        ? "已選中"
                        : existingApplication.status === "rejected"
                        ? "未選中"
                        : "審核中"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {existingApplication.status === "approved"
                        ? "恭喜您！請依照活動說明進行體驗"
                        : existingApplication.status === "rejected"
                        ? "很抱歉，您未被選中參加此活動"
                        : "您的申請正在審核中，請耐心等候"}
                    </p>
                    <Link href="/mypage/applications">
                      <Button variant="outline" className="mt-4 w-full">
                        查看申請狀態
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ApplicationForm
                    campaignId={campaign.id}
                    userProfile={userProfile}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
