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

export const scheduleProposalSchema = z.object({
  application_id: z.string().uuid(),
  proposed_dates: z.array(z.string().min(1)).min(1, "最少提案一個日期").max(3, "最多提案三個日期"),
  preferred_time: z.string().optional(),
  message: z.string().optional(),
});

export const reservationInfoSchema = z.object({
  application_id: z.string().uuid(),
  visitor_name: z.string().min(1, "請輸入中文姓名"),
  reservation_datetime: z.string().min(1, "請選擇預約日期與時間"),
  emergency_contact: z.string().min(1, "請輸入緊急聯絡方式"),
  line_id: z.string().optional(),
  special_requests: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ScheduleProposalInput = z.infer<typeof scheduleProposalSchema>;
export type ReservationInfoInput = z.infer<typeof reservationInfoSchema>;

