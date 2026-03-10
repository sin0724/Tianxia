export const CAMPAIGN_CATEGORIES = [
  { value: "restaurant", label_zh: "餐廳", label_ko: "레스토랑" },
  { value: "cafe", label_zh: "咖啡廳", label_ko: "카페" },
  { value: "beauty", label_zh: "美容", label_ko: "뷰티" },
  { value: "fashion", label_zh: "時尚", label_ko: "패션" },
  { value: "travel", label_zh: "旅遊", label_ko: "여행" },
  { value: "hotel", label_zh: "住宿", label_ko: "숙박" },
  { value: "fitness", label_zh: "健身", label_ko: "피트니스" },
  { value: "tech", label_zh: "科技", label_ko: "테크" },
  { value: "lifestyle", label_zh: "生活", label_ko: "라이프스타일" },
  { value: "food", label_zh: "食品", label_ko: "식품" },
  { value: "entertainment", label_zh: "娛樂", label_ko: "엔터테인먼트" },
  { value: "other", label_zh: "其他", label_ko: "기타" },
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number]["value"];

export function getCategoryLabel(
  value: string,
  locale: "zh" | "ko" = "zh"
): string {
  const category = CAMPAIGN_CATEGORIES.find((c) => c.value === value);
  if (!category) return value;
  return locale === "zh" ? category.label_zh : category.label_ko;
}
