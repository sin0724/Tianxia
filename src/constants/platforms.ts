export const PLATFORMS = [
  { value: "instagram", label_ko: "인스타그램", label_zh: "Instagram" },
  { value: "youtube", label_ko: "유튜브", label_zh: "YouTube" },
  { value: "threads", label_ko: "스레드", label_zh: "Threads" },
  { value: "facebook", label_ko: "페이스북", label_zh: "Facebook" },
  { value: "dcard", label_ko: "Dcard", label_zh: "Dcard" },
] as const;

export type Platform = (typeof PLATFORMS)[number]["value"];
