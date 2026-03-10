import { z } from "zod";

export const applicationSchema = z.object({
  campaign_id: z.string().uuid(),
  message: z.string().optional(),
  applied_instagram_url: z.string().url("請輸入有效的Instagram網址"),
  applied_threads_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  applied_facebook_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  applied_youtube_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  applied_dcard_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  application_id: z.string().uuid(),
  review_url: z.string().url("請輸入有效的網址"),
  content: z.string().optional(),
  visited_at: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
