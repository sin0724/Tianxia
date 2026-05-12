import { z } from "zod";

const nanToNull = z.preprocess(
  (v) => (typeof v === "number" && isNaN(v) ? null : v),
  z.number().int().min(0).nullable().optional()
);

const nanToOne = z.preprocess(
  (v) => (typeof v === "number" && isNaN(v) ? 1 : v),
  z.number().min(1).default(1)
);

export const campaignSchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  thumbnail_url: z.string().optional(),
  recruitment_count: nanToOne,
  application_deadline: z.string().optional(),
  experience_date: z.string().optional(),
  review_deadline: z.string().optional(),
  status: z.enum(["draft", "active", "closed"]).default("active"),
  campaign_type: z.enum(["free", "paid"]).default("free"),
  payment_amount: nanToNull,
  min_followers: nanToNull,

  // Korean content (all optional except title)
  title_ko: z.string().min(1, "캠페인 제목을 입력해 주세요"),
  brand_name_ko: z.string().optional(),
  guide_ko: z.string().optional(),
  benefits_ko: z.string().optional(),
  requirements_ko: z.string().optional(),
  precautions_ko: z.string().optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
