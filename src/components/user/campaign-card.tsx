import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { getRegionLabel } from "@/constants/regions";
import type { Campaign, Category } from "@/types/database";

interface CampaignCardProps {
  campaign: Campaign & { application_count?: number };
  categories?: Category[];
}

function PlatformIcon({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  
  switch (platform) {
    case "instagram":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case "threads":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.108-1.146 3.456-1.17 1.005-.018 1.92.112 2.755.39-.07-.472-.192-.898-.374-1.282-.345-.726-.94-1.28-1.771-1.648-.857-.38-1.934-.572-3.199-.572h-.032l-.03.001c-1.17.007-2.139.182-2.882.52l-.823-1.665c.965-.437 2.169-.668 3.578-.687h.058c1.528 0 2.882.252 4.025.749 1.175.51 2.063 1.27 2.64 2.26.548.94.83 2.066.839 3.346l.002.096-.001.087c-.015 2.067-.497 3.628-1.434 4.644-.867.94-2.07 1.506-3.577 1.683.475.467.817 1.065 1.001 1.754.224.836.208 1.768-.046 2.697-.356 1.303-1.143 2.408-2.276 3.198-1.243.866-2.822 1.343-4.577 1.384z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "dcard":
      return (
        <span className={size === "sm" ? "text-xs font-bold" : "text-sm font-bold"}>D</span>
      );
    default:
      return null;
  }
}

function getPlatformColor(platform: string) {
  switch (platform) {
    case "instagram":
      return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400";
    case "youtube":
      return "bg-red-600";
    case "threads":
      return "bg-black";
    case "facebook":
      return "bg-blue-600";
    case "dcard":
      return "bg-sky-500";
    default:
      return "bg-gray-500";
  }
}

function getProgressColor(percentage: number) {
  if (percentage >= 100) return "bg-gradient-to-r from-purple-500 to-pink-500";
  if (percentage >= 80) return "bg-gradient-to-r from-red-500 to-orange-500";
  if (percentage >= 50) return "bg-gradient-to-r from-orange-400 to-yellow-400";
  return "bg-gradient-to-r from-emerald-400 to-teal-400";
}

function getStatusBadge(percentage: number, remaining: number) {
  if (percentage >= 100) {
    return { text: "競爭激烈", icon: "🔥", bgColor: "bg-purple-100", textColor: "text-purple-600" };
  }
  if (remaining <= 3 && remaining > 0) {
    return { text: `僅剩 ${remaining} 名額`, icon: "⚡", bgColor: "bg-red-100", textColor: "text-red-600" };
  }
  if (percentage >= 70) {
    return { text: "人氣活動", icon: "🔥", bgColor: "bg-orange-100", textColor: "text-orange-600" };
  }
  return null;
}

export function CampaignCard({ campaign, categories }: CampaignCardProps) {
  const daysRemaining = getDaysRemaining(campaign.application_deadline);
  const category = categories?.find((c) => c.id === campaign.category);
  const categoryLabel = category ? category.name_zh : "";
  const realCount = campaign.application_count ?? 0;
  const bonusCount = campaign.bonus_application_count ?? 0;
  const displayCount = realCount + bonusCount;
  const platforms: string[] = (campaign as any).platforms || ["instagram"];
  
  const recruitmentCount = campaign.recruitment_count || 1;
  const percentage = Math.round((displayCount / recruitmentCount) * 100);
  const remaining = recruitmentCount - displayCount;
  const statusBadge = getStatusBadge(percentage, remaining);

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:shadow-gray-200/70 hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          {campaign.thumbnail_url ? (
            <Image
              src={campaign.thumbnail_url}
              alt={campaign.title_zh_tw || campaign.title_ko}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <span className="text-5xl opacity-60">🎁</span>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Platform Badges */}
          <div className="absolute left-3 top-3 flex gap-1">
            {platforms.map((platform) => (
              <div
                key={platform}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm ${getPlatformColor(platform)}`}
              >
                <PlatformIcon platform={platform} size="sm" />
              </div>
            ))}
          </div>

          {/* D-Day Badge */}
          {daysRemaining <= 3 && daysRemaining > 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
              D-{daysRemaining}
            </div>
          )}
          {daysRemaining <= 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              已截止
            </div>
          )}
        </div>
        <div className="p-4">
          {/* 모집 현황 프로그레스 바 */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {statusBadge && (
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                    <span>{statusBadge.icon}</span>
                    <span>{statusBadge.text}</span>
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold">
                <span className="text-primary">{displayCount}</span>
                <span className="text-gray-200">/</span>
                <span className="text-gray-400">{recruitmentCount}名</span>
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="mb-1.5 flex items-center gap-2">
            {category && (
              <span className="rounded-full bg-gray-50 border border-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                {category.icon} {categoryLabel}
              </span>
            )}
          </div>
          <p className="mb-0.5 text-xs font-medium text-gray-400">
            {campaign.brand_name_zh_tw || campaign.brand_name_ko}
          </p>
          <h3 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors">
            {campaign.title_zh_tw || campaign.title_ko}
          </h3>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getRegionLabel(campaign.region)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              ~{formatDate(campaign.application_deadline)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
