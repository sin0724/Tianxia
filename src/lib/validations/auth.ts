import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要6個字符"),
});

export const signupSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要6個字符"),
  confirmPassword: z.string(),
  name: z.string().min(1, "請輸入姓名"),
  line_id: z.string().min(1, "請輸入LINE ID"),
  instagram_url: z.string().url("請輸入有效的Instagram網址").min(1, "請輸入Instagram網址"),
  threads_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  facebook_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  youtube_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  dcard_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  line_id: z.string().min(1, "請輸入LINE ID"),
  instagram_url: z.string().url("請輸入有效的Instagram網址").min(1, "請輸入Instagram網址"),
  threads_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  facebook_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  youtube_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
  dcard_url: z.string().url("請輸入有效的網址").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
