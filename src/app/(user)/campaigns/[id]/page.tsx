import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Gift, CheckCircle, Map, Camera, DollarSign } from "lucide-react";
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { getRegionLabel } from "@/constants/regions";
import { PLATFORMS } from "@/constants/platforms";
import { ApplicationForm } from "./application-form";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title_zh_tw, title_ko, summary_zh_tw, summary_ko, thumbnail_url, brand_name_zh_tw, brand_name_ko")
    .eq("id", id)
    .single();

  if (!campaign) {
    return { title: "活動不存在 | 天下 Tianxia" };
  }

  const title = campaign.title_zh_tw || campaign.title_ko;
  const brandName = campaign.brand_name_zh_tw || campaign.brand_name_ko;
  const description = campaign.summary_zh_tw || campaign.summary_ko
    || `${brandName} 韓國體驗團活動 — 免費體驗並在 Instagram 分享打卡心得`;
  const thumbnailUrl = campaign.thumbnail_url;

  return {
    title: `${title} | 天下 Tianxia`,
    description,
    keywords: [title, brandName, "韓國體驗團", "免費體驗", "網紅合作", "KOL", "Instagram打卡", "首爾"],
    alternates: {
      canonical: `/campaigns/${id}`,
    },
    openGraph: {
      title: `${title} | 天下 Tianxia`,
      description,
      type: "article",
      ...(thumbnailUrl && {
        images: [{ url: thumbnailUrl, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 天下 Tianxia`,
      description,
      ...(thumbnailUrl && { images: [thumbnailUrl] }),
    },
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
  const rawServiceOptions = (campaign as any).service_options_zh_tw || (campaign as any).service_options;
  const isPremium = (campaign as any).campaign_type === "paid";
  const paymentDisplayType = (campaign as any).payment_display_type as "amount" | "negotiable" | "after_apply" | undefined;
  const paymentAmount = (campaign as any).payment_amount as number | null;
  const paymentLabel = isPremium
    ? paymentDisplayType === "negotiable" ? "薪資可議"
    : paymentDisplayType === "after_apply" ? "申請後洽談"
    : paymentAmount ? `NT$${paymentAmount.toLocaleString()}` : null
    : null;
  const platformFollowerReqs = (campaign as any).platform_follower_requirements as Record<string, { min?: number; max?: number }> | null;
  const platforms: string[] = (campaign as any).platforms || ["instagram"];
  const followerLines: string[] = [];
  if (platformFollowerReqs) {
    const platformNames: Record<string, string> = { instagram: "Instagram", youtube: "YouTube", threads: "Threads", facebook: "Facebook", dcard: "Dcard" };
    for (const p of platforms) {
      const req = platformFollowerReqs[p];
      if (req?.min) followerLines.push(`${platformNames[p] ?? p} ${req.min >= 10000 ? `${req.min / 10000}萬` : req.min.toLocaleString()}+ 追蹤`);
    }
  }
  const serviceOptions = rawServiceOptions
    ? (rawServiceOptions as string).split("\n").map((s: string) => s.trim()).filter(Boolean)
    : null;
  const requirements = campaign.requirements_zh_tw || campaign.requirements_ko;
  const precautions = campaign.precautions_zh_tw || campaign.precautions_ko;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const campaignJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description: summary || description,
    image: campaign.thumbnail_url || undefined,
    url: `${siteUrl}/campaigns/${campaign.id}`,
    organizer: {
      "@type": "Organization",
      name: brandName,
    },
    location: {
      "@type": "Place",
      name: getRegionLabel(campaign.region),
      address: {
        "@type": "PostalAddress",
        addressCountry: "KR",
      },
    },
    startDate: campaign.experience_date,
    endDate: campaign.review_deadline,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    offers: {
      "@type": "Offer",
      price: isPremium ? (paymentAmount ?? 0) : 0,
      priceCurrency: isPremium ? "TWD" : "TWD",
      availability: isDeadlinePassed
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      validThrough: campaign.application_deadline,
      url: `${siteUrl}/campaigns/${campaign.id}`,
    },
    inLanguage: "zh-TW",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(campaignJsonLd) }}
      />
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
      {/* 모바일 고정 하단 CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
            {!isDeadlinePassed && daysRemaining > 0 && daysRemaining <= 7 && (
              <p className="text-xs text-red-500">⚡ 剩餘 {daysRemaining} 天截止</p>
            )}
            {!isDeadlinePassed && daysRemaining > 7 && (
              <p className="text-xs text-gray-400">截止：{formatDate(campaign.application_deadline)}</p>
            )}
          </div>
          {isDeadlinePassed ? (
            <Button size="sm" disabled className="rounded-full px-5">已截止</Button>
          ) : !user ? (
            <Link href={`/login?redirect=/campaigns/${campaign.id}`}>
              <Button size="sm" className="rounded-full px-5">登入申請</Button>
            </Link>
          ) : existingApplication ? (
            <Link href="/mypage/applications">
              <Button size="sm" variant="outline" className="rounded-full px-5">查看申請</Button>
            </Link>
          ) : (
            <a href="#apply-section">
              <Button size="sm" className="rounded-full px-5">立即申請 →</Button>
            </a>
          )}
        </div>
      </div>

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
            <Card className={(campaign as any).drive_url ? "" : "border-sky-200 bg-sky-50"}>
              <CardContent className="flex items-center gap-3 p-4">
                <Camera className={(campaign as any).drive_url ? "h-5 w-5 text-primary" : "h-5 w-5 text-sky-500"} />
                <div>
                  <p className="text-sm text-muted-foreground">拍攝方式</p>
                  <p className={(campaign as any).drive_url ? "font-medium" : "font-medium text-sky-700"}>
                    {(campaign as any).drive_url ? "提供拍攝指南" : "✓ 自由拍攝"}
                  </p>
                </div>
              </CardContent>
            </Card>
            {paymentLabel && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">合作費用</p>
                    <p className="font-semibold text-yellow-700">{paymentLabel}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {followerLines.length > 0 && (
              <Card className="sm:col-span-2">
                <CardContent className="flex items-start gap-3 p-4">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">追蹤人數條件</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {followerLines.map((line) => (
                        <span key={line} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-sm font-semibold text-blue-700">
                          {line}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 구글 지도 링크 (복수 지원) */}
          {(() => {
            const mapUrlsRaw = (campaign as any).map_urls as { label?: string; url: string }[] | null;
            const entries = mapUrlsRaw && mapUrlsRaw.length > 0
              ? mapUrlsRaw
              : (campaign as any).map_url
              ? [{ url: (campaign as any).map_url as string }]
              : [];
            if (entries.length === 0) return null;
            return (
              <div className="mb-8 space-y-2">
                {entries.map((entry, idx) => (
                  <a
                    key={idx}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10"
                  >
                    <Map className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-primary">
                        {entry.label || (entries.length > 1 ? `地點 ${idx + 1}` : "查看地圖位置")}
                      </p>
                      <p className="text-sm text-muted-foreground">點擊在 Google 地圖中查看</p>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}

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

          {/* Benefits / Service Options */}
          {serviceOptions && serviceOptions.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span>提供內容</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {serviceOptions.map((opt, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {opt}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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
        <div className="lg:col-span-1" id="apply-section">
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
    </>
  );
}
