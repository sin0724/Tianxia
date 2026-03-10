import { z } from "zod";

export const campaignSchema = z.object({
  category: z.string().min(1, "카테고리를 선택해 주세요"),
  region: z.string().min(1, "지역을 선택해 주세요"),
  thumbnail_url: z.string().optional(),
  recruitment_count: z.number().min(1, "모집 인원을 입력해 주세요"),
  application_deadline: z.string().min(1, "신청 마감일을 선택해 주세요"),
  experience_date: z.string().min(1, "체험 날짜를 선택해 주세요"),
  review_deadline: z.string().min(1, "후기 마감일을 선택해 주세요"),
  status: z.enum(["draft", "active", "closed"]).default("active"),

  // Korean content (required)
  title_ko: z.string().min(1, "캠페인 제목을 입력해 주세요"),
  brand_name_ko: z.string().min(1, "브랜드명을 입력해 주세요"),
  summary_ko: z.string().min(1, "캠페인 요약을 입력해 주세요"),
  description_ko: z.string().min(1, "캠페인 상세 설명을 입력해 주세요"),
  benefits_ko: z.string().min(1, "제공 혜택을 입력해 주세요"),
  requirements_ko: z.string().min(1, "참여 조건을 입력해 주세요"),
  precautions_ko: z.string().optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
