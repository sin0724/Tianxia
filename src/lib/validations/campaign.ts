import { z } from "zod";

export const campaignSchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  thumbnail_url: z.string().optional(),
  recruitment_count: z.number().min(1).default(1),
  application_deadline: z.string().optional(),
  experience_date: z.string().optional(),
  review_deadline: z.string().optional(),
  status: z.enum(["draft", "active", "closed"]).default("active"),

  // Korean content (all optional except title)
  title_ko: z.string().min(1, "캠페인 제목을 입력해 주세요"),
  brand_name_ko: z.string().optional(),
  guide_ko: z.string().optional(),
  benefits_ko: z.string().optional(),
  requirements_ko: z.string().optional(),
  precautions_ko: z.string().optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
