"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { campaignSchema, type CampaignInput } from "@/lib/validations/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { KOREA_REGIONS } from "@/constants/regions";
import { PLATFORMS } from "@/constants/platforms";
import { Upload, X, ImageIcon } from "lucide-react";
import type { Campaign, Category } from "@/types/database";

interface CampaignFormProps {
  campaign?: Campaign;
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingWithoutTranslation, setIsSavingWithoutTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    (campaign as any)?.platforms || ["instagram"]
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    campaign?.thumbnail_url || ""
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    campaign?.thumbnail_url || ""
  );
  const [mapUrl, setMapUrl] = useState<string>(
    (campaign as any)?.map_url || ""
  );
  const [driveUrl, setDriveUrl] = useState<string>(
    (campaign as any)?.drive_url || ""
  );
  const [isDelivery, setIsDelivery] = useState<boolean>(
    (campaign as any)?.is_delivery ?? false
  );
  const [serviceOptions, setServiceOptions] = useState<string>(
    (campaign as any)?.service_options || ""
  );
  const [bonusCount, setBonusCount] = useState<number>(
    campaign?.bonus_application_count ?? 0
  );
  const [campaignType, setCampaignType] = useState<"free" | "paid">(
    (campaign as any)?.campaign_type ?? "free"
  );
  const [paymentDisplayType, setPaymentDisplayType] = useState<"amount" | "negotiable" | "after_apply">(
    (campaign as any)?.payment_display_type ?? "amount"
  );
  const [platformFollowerReqs, setPlatformFollowerReqs] = useState<
    Record<string, { min: string; max: string }>
  >(() => {
    const saved = (campaign as any)?.platform_follower_requirements ?? {};
    const init: Record<string, { min: string; max: string }> = {};
    for (const p of ["instagram", "youtube", "threads", "facebook", "dcard"]) {
      init[p] = { min: String(saved[p]?.min ?? ""), max: String(saved[p]?.max ?? "") };
    }
    return init;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!campaign;

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: campaign
      ? {
          category: campaign.category,
          region: campaign.region,
          thumbnail_url: campaign.thumbnail_url || "",
          recruitment_count: campaign.recruitment_count,
          application_deadline: campaign.application_deadline?.split("T")[0] || "",
          experience_date: campaign.experience_date?.split("T")[0] || "",
          review_deadline: campaign.review_deadline?.split("T")[0] || "",
          status: campaign.status,
          campaign_type: (campaign as any).campaign_type ?? "free",
          payment_amount: (campaign as any).payment_amount ?? null,
          min_followers: (campaign as any).min_followers ?? null,
          title_ko: campaign.title_ko,
          brand_name_ko: campaign.brand_name_ko || "",
          guide_ko: campaign.description_ko || campaign.summary_ko || "",
          benefits_ko: campaign.benefits_ko || "",
          requirements_ko: campaign.requirements_ko || "",
          precautions_ko: campaign.precautions_ko || "",
        }
      : {
          recruitment_count: 1,
          status: "active",
          requirements_ko: "인스타그램, 쓰레드 계정 소지자",
          guide_ko: "촬영 가이드 및 주의사항은 예약 확정 후 구글 드라이브 링크를 통해 개별 안내드립니다.",
        },
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "오류",
        description: "파일 크기는 5MB 이하여야 합니다",
        variant: "destructive",
      });
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith("image/")) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드 가능합니다",
        variant: "destructive",
      });
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Supabase에 업로드
    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `campaigns/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(filePath);

      setThumbnailUrl(urlData.publicUrl);
      setValue("thumbnail_url", urlData.publicUrl);

      toast({
        title: "업로드 완료",
        description: "이미지가 업로드되었습니다",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다. 버킷 설정을 확인해주세요.",
        variant: "destructive",
      });
      setThumbnailPreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const removeThumbnail = () => {
    setThumbnailUrl("");
    setThumbnailPreview("");
    setValue("thumbnail_url", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveCampaign = async (data: CampaignInput, skipTranslation = false) => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "오류",
        description: "최소 1개 이상의 플랫폼을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    if (skipTranslation) {
      setIsSavingWithoutTranslation(true);
    } else {
      setIsLoading(true);
    }
    setTranslationError(null);

    try {
      const guideText = data.guide_ko || "";
      const summaryText = guideText.split("\n")[0]?.slice(0, 100) || "";
      const descriptionText = guideText;

      let translations: Record<string, string | null | undefined> = {};

      if (!skipTranslation) {
        // Determine which content fields actually changed
        type TranslatePayload = {
          title_ko?: string;
          brand_name_ko?: string;
          summary_ko?: string;
          description_ko?: string;
          precautions_ko?: string;
          service_options_ko?: string;
        };

        let payload: TranslatePayload;

        if (!isEditing) {
          // New campaign: translate all fields
          payload = {
            title_ko: data.title_ko || "",
            brand_name_ko: data.brand_name_ko || "",
            summary_ko: summaryText,
            description_ko: descriptionText,
            ...(data.precautions_ko ? { precautions_ko: data.precautions_ko } : {}),
            ...(serviceOptions.trim() ? { service_options_ko: serviceOptions.trim() } : {}),
          };
        } else {
          // Editing: only translate fields that actually changed
          const c = campaign!;
          const origGuide = c.description_ko || c.summary_ko || "";

          payload = {};
          if (data.title_ko !== c.title_ko)
            payload.title_ko = data.title_ko || "";
          if ((data.brand_name_ko || "") !== (c.brand_name_ko || ""))
            payload.brand_name_ko = data.brand_name_ko || "";
          if (guideText !== origGuide) {
            payload.summary_ko = summaryText;
            payload.description_ko = descriptionText;
          }
          if ((data.precautions_ko || "") !== (c.precautions_ko || ""))
            payload.precautions_ko = data.precautions_ko || "";
          const origServiceOptions = (campaign as any)?.service_options || "";
          if (serviceOptions.trim() !== origServiceOptions)
            payload.service_options_ko = serviceOptions.trim();
        }

        if (Object.keys(payload).length > 0) {
          try {
            const translateResponse = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!translateResponse.ok) {
              const errorBody = await translateResponse.json().catch(() => ({}));
              const errorMsg = errorBody.error || `번역 서버 오류 (HTTP ${translateResponse.status})`;
              setTranslationError(errorMsg);
              toast({
                title: "번역 실패",
                description: `${errorMsg}\n\n아래 "번역 없이 저장" 버튼으로 한국어만 저장할 수 있습니다.`,
                variant: "destructive",
              });
              return;
            }

            const translationResult = await translateResponse.json();
            if (translationResult.error) {
              setTranslationError(translationResult.error);
              toast({
                title: "번역 실패",
                description: `${translationResult.error}\n\n아래 "번역 없이 저장" 버튼으로 한국어만 저장할 수 있습니다.`,
                variant: "destructive",
              });
              return;
            }
            translations = translationResult;
          } catch (fetchError) {
            const msg = fetchError instanceof Error ? fetchError.message : "네트워크 오류";
            setTranslationError(`번역 요청 실패: ${msg}`);
            toast({
              title: "번역 요청 실패",
              description: `${msg}\n\n인터넷 연결을 확인하거나 "번역 없이 저장" 버튼을 사용해주세요.`,
              variant: "destructive",
            });
            return;
          }
        }
        // else: no content changed → translations stays {}, DB keeps existing zh_tw values
      }

      const supabase = createClient();

      const campaignData = {
        category: data.category || "",
        region: data.region || "",
        platforms: selectedPlatforms,
        thumbnail_url: thumbnailUrl || null,
        map_url: mapUrl || null,
        drive_url: driveUrl || null,
        is_delivery: isDelivery,
        service_options: serviceOptions.trim() || null,
        recruitment_count: data.recruitment_count || 1,
        bonus_application_count: bonusCount || 0,
        application_deadline: data.application_deadline
          ? new Date(data.application_deadline).toISOString()
          : null,
        experience_date: data.experience_date
          ? new Date(data.experience_date).toISOString()
          : null,
        review_deadline: data.review_deadline
          ? new Date(data.review_deadline).toISOString()
          : null,
        status: data.status,
        campaign_type: campaignType,
        payment_amount: campaignType === "paid" && paymentDisplayType === "amount" ? (data.payment_amount ?? null) : null,
        payment_display_type: campaignType === "paid" ? paymentDisplayType : "amount",
        min_followers: null,
        platform_follower_requirements: (() => {
          const reqs: Record<string, { min?: number; max?: number }> = {};
          for (const platform of selectedPlatforms) {
            const r = platformFollowerReqs[platform];
            if (r?.min || r?.max) {
              reqs[platform] = {
                ...(r.min ? { min: Number(r.min) } : {}),
                ...(r.max ? { max: Number(r.max) } : {}),
              };
            }
          }
          return Object.keys(reqs).length > 0 ? reqs : null;
        })(),
        title_ko: data.title_ko,
        brand_name_ko: data.brand_name_ko || "",
        summary_ko: summaryText || "",
        description_ko: descriptionText || "",
        benefits_ko: "",
        benefits_zh_tw: "",
        requirements_ko: "인스타그램, 쓰레드 계정 소지자",
        // requirements_zh_tw is fixed — hardcode for new campaigns, preserve existing on edit
        ...(isEditing ? {} : { requirements_zh_tw: "擁有Instagram、Threads帳號者" }),
        precautions_ko: data.precautions_ko || null,
        ...translations,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", campaign.id);

        if (error) {
          throw new Error(`DB 저장 실패: ${error.message} (코드: ${error.code})`);
        }

        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: campaign.id }),
        });

        toast({
          title: "수정 완료",
          description: skipTranslation
            ? "캠페인이 번역 없이 수정되었습니다 (나중에 수정하여 번역 가능)"
            : "캠페인이 수정되었습니다",
        });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }

        const { error } = await supabase.from("campaigns").insert({
          ...campaignData,
          created_by: user.id,
        });

        if (error) {
          throw new Error(`DB 저장 실패: ${error.message} (코드: ${error.code})`);
        }

        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        toast({
          title: "생성 완료",
          description: skipTranslation
            ? "캠페인이 번역 없이 생성되었습니다 (나중에 수정하여 번역 가능)"
            : "캠페인이 생성되었습니다",
        });
      }

      setTranslationError(null);
      router.push("/admin/campaigns");
      router.refresh();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      toast({
        title: "저장 실패",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSavingWithoutTranslation(false);
    }
  };

  const onSubmit = async (data: CampaignInput) => {
    await saveCampaign(data, false);
  };

  const selectedCategory = watch("category");
  const selectedRegion = watch("region");
  const selectedStatus = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 브랜드명 / 캠페인명 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand_name_ko">브랜드명</Label>
              <Input
                id="brand_name_ko"
                placeholder="브랜드명을 입력하세요"
                {...register("brand_name_ko")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_ko">캠페인명 *</Label>
              <Input
                id="title_ko"
                placeholder="캠페인 제목을 입력하세요"
                {...register("title_ko")}
              />
              {errors.title_ko && (
                <p className="text-sm text-destructive">{errors.title_ko.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-start">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select
                value={selectedCategory || ""}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택">
                    {selectedCategory && categories.length > 0
                      ? (() => {
                          const cat = categories.find((c) => c.id === selectedCategory);
                          return cat ? `${cat.icon} ${cat.name_ko}` : "카테고리 선택";
                        })()
                      : "카테고리 선택"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name_ko}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">지역</Label>
              <Select
                value={selectedRegion || ""}
                onValueChange={(value) => setValue("region", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {KOREA_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label_ko}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 플랫폼 다중 선택 */}
          <div className="space-y-2">
            <Label>플랫폼 (복수 선택 가능)</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => togglePlatform(platform.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedPlatforms.includes(platform.value)
                      ? "bg-primary text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {platform.label_ko}
                </button>
              ))}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-sm text-destructive">
                최소 1개 이상의 플랫폼을 선택해주세요
              </p>
            )}
          </div>

          {/* 썸네일 이미지 업로드 */}
          <div className="space-y-2">
            <Label>썸네일 이미지</Label>
            <div className="flex gap-4">
              {/* 미리보기 영역 */}
              <div className="relative h-40 w-40 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                {thumbnailPreview ? (
                  <>
                    <Image
                      src={thumbnailPreview}
                      alt="썸네일 미리보기"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="mb-2 h-10 w-10" />
                    <span className="text-xs">미리보기</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>

              {/* 업로드 버튼 */}
              <div className="flex flex-col justify-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  이미지 선택
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF (최대 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* 구글 지도 링크 */}
          <div className="space-y-2">
            <Label htmlFor="map_url">구글 지도 링크</Label>
            <Input
              id="map_url"
              placeholder="https://maps.google.com/..."
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              구글 지도에서 위치를 검색 후 "공유" → "링크 복사"하여 붙여넣기
            </p>
          </div>

          {/* 구글 드라이브 링크 (예약 확정자 전용) */}
          <div className="space-y-2">
            <Label htmlFor="drive_url">촬영 가이드 드라이브 링크 <span className="text-xs font-normal text-gray-400">(선택)</span></Label>
            <Input
              id="drive_url"
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              예약 확정된 체험단에게만 공개됩니다 (촬영 가이드, 숙지 사항 등). 자율촬영 업체는 비워두세요 → 유저에게 「自由拍攝」으로 자동 안내됩니다
            </p>
          </div>

          {/* 체험 유형 토글 */}
          <div className="space-y-2">
            <Label>체험 유형</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDelivery(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  !isDelivery
                    ? "bg-primary text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                }`}
              >
                방문 체험단
              </button>
              <button
                type="button"
                onClick={() => setIsDelivery(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isDelivery
                    ? "bg-primary text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                }`}
              >
                배송 체험단
              </button>
            </div>
            {isDelivery && (
              <p className="text-xs text-amber-600">
                배송 체험단: 입선 후 유저가 수령 주소를 입력하면 관리자가 발송 처리합니다
              </p>
            )}
          </div>

          {/* 서비스 선택 항목 (선택형 캠페인용) */}
          <div className="space-y-2">
            <Label htmlFor="service_options">선택 가능한 서비스 항목 <span className="text-xs font-normal text-gray-400">(선택, 병원/시술 등)</span></Label>
            <Textarea
              id="service_options"
              placeholder={"리프팅 시술\n보톡스\n피부 관리\n레이저 토닝"}
              rows={4}
              value={serviceOptions}
              onChange={(e) => setServiceOptions(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              줄바꿈으로 구분. 입력 시 예약 폼에 선택 드롭다운이 표시됩니다
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="recruitment_count">모집 인원</Label>
              <Input
                id="recruitment_count"
                type="number"
                min={1}
                {...register("recruitment_count", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus_count">보너스 신청자</Label>
              <Input
                id="bonus_count"
                type="number"
                min={0}
                value={bonusCount}
                onChange={(e) => setBonusCount(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">표시용 추가 인원</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_deadline">신청 마감일</Label>
              <Input
                id="application_deadline"
                type="date"
                {...register("application_deadline")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_date">체험 날짜</Label>
              <Input
                id="experience_date"
                type="date"
                {...register("experience_date")}
              />
              <p className="text-xs text-gray-500">신청 마감 전이어도 OK</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review_deadline">후기 마감일</Label>
              <Input
                id="review_deadline"
                type="date"
                {...register("review_deadline")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={selectedStatus || "active"}
              onValueChange={(value) =>
                setValue("status", value as "draft" | "active" | "closed")
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue>
                  {selectedStatus === "draft"
                    ? "임시저장"
                    : selectedStatus === "closed"
                    ? "마감"
                    : "진행중"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">임시저장</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="closed">마감</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 캠페인 타입 (무료/유료) */}
          <div className="space-y-3 rounded-lg border-2 border-dashed p-4">
            <Label>캠페인 유형</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCampaignType("free")}
                className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  campaignType === "free"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-base">🎁</div>
                <div>무료합작</div>
                <div className="mt-0.5 text-xs font-normal text-muted-foreground">제품/서비스 제공</div>
              </button>
              <button
                type="button"
                onClick={() => setCampaignType("paid")}
                className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  campaignType === "paid"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-base">⭐</div>
                <div>유료합작 PREMIUM</div>
                <div className="mt-0.5 text-xs font-normal text-muted-foreground">제품/서비스 + 협찬비</div>
              </button>
            </div>

            {campaignType === "paid" && (
              <div className="space-y-3 rounded-lg bg-yellow-50/60 p-3">
                <Label className="text-sm font-semibold text-yellow-800">협찬비 표시 방식</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {([
                    { value: "amount",      label: "금액 직접 공개",  desc: "NT$ 금액 표시",    icon: "💰" },
                    { value: "negotiable",  label: "薪資可議",        desc: "협의 가능 표시",   icon: "🤝" },
                    { value: "after_apply", label: "申請後洽談",      desc: "신청 후 협의 표시", icon: "📩" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentDisplayType(opt.value)}
                      className={`flex-1 rounded-lg border-2 p-2.5 text-left text-xs transition-all ${
                        paymentDisplayType === opt.value
                          ? "border-amber-400 bg-amber-100 text-amber-800"
                          : "border-gray-200 bg-white text-gray-600 hover:border-amber-200"
                      }`}
                    >
                      <div className="text-base">{opt.icon}</div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="mt-0.5 text-gray-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                {paymentDisplayType === "amount" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">NT$</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="예: 6500"
                      className="flex-1 bg-white"
                      {...register("payment_amount", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 플랫폼별 팔로워 조건 */}
            <div className="space-y-3">
              <Label className="text-sm">
                플랫폼별 팔로워 조건
                {campaignType === "free" && <span className="ml-1 text-xs font-normal text-gray-400">(선택)</span>}
              </Label>
              <div className="space-y-2">
                {selectedPlatforms.map((platform) => {
                  const labels: Record<string, string> = {
                    instagram: "Instagram 팔로워",
                    youtube: "YouTube 구독자",
                    threads: "Threads 팔로워",
                    facebook: "Facebook 팔로워",
                    dcard: "Dcard 팔로워",
                  };
                  return (
                    <div key={platform} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <span className="w-32 shrink-0 text-xs font-medium text-gray-600">{labels[platform]}</span>
                      <div className="flex flex-1 items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          placeholder="최소"
                          className="h-8 text-sm"
                          value={platformFollowerReqs[platform]?.min ?? ""}
                          onChange={(e) =>
                            setPlatformFollowerReqs((prev) => ({
                              ...prev,
                              [platform]: { ...prev[platform], min: e.target.value },
                            }))
                          }
                        />
                        <span className="shrink-0 text-xs text-gray-400">~</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="최대"
                          className="h-8 text-sm"
                          value={platformFollowerReqs[platform]?.max ?? ""}
                          onChange={(e) =>
                            setPlatformFollowerReqs((prev) => ({
                              ...prev,
                              [platform]: { ...prev[platform], max: e.target.value },
                            }))
                          }
                        />
                        <span className="shrink-0 text-xs text-gray-400">명</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">최소만 입력하면 하한선, 최대까지 입력하면 범위 조건</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Korean Content */}
      <Card>
        <CardHeader>
          <CardTitle>추가 내용 <span className="text-sm font-normal text-muted-foreground">(선택)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 참여 조건: 항상 고정 (숨김) */}
          <input type="hidden" {...register("requirements_ko")} />

          <div className="space-y-2">
            <Label htmlFor="guide_ko">캠페인 안내문</Label>
            <Textarea
              id="guide_ko"
              rows={4}
              {...register("guide_ko")}
            />
            <p className="text-xs text-gray-500">
              기본값: 구글 드라이브 안내 문구. 맛집/서비스 등 추가 설명이 있으면 수정하세요
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precautions_ko">주의 사항 <span className="text-xs font-normal text-gray-400">(선택)</span></Label>
            <Textarea
              id="precautions_ko"
              placeholder="주의 사항을 입력하세요"
              rows={3}
              {...register("precautions_ko")}
            />
          </div>
        </CardContent>
      </Card>

      {translationError && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="mb-1 text-sm font-semibold text-orange-800">번역 오류</p>
          <p className="mb-3 text-sm text-orange-700">{translationError}</p>
          <Button
            type="button"
            variant="outline"
            disabled={isSavingWithoutTranslation}
            onClick={() => handleSubmit((data) => saveCampaign(data, true))()}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {isSavingWithoutTranslation ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">저장 중...</span>
              </>
            ) : (
              "번역 없이 저장하기"
            )}
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || isUploading || isSavingWithoutTranslation}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">번역 및 저장 중...</span>
            </>
          ) : isEditing ? (
            "수정하기"
          ) : (
            "생성하기"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/campaigns")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
