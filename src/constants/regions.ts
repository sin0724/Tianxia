export const KOREA_REGIONS = [
  { value: "seoul", label_ko: "서울", label_zh: "首爾" },
  { value: "busan", label_ko: "부산", label_zh: "釜山" },
  { value: "jeju", label_ko: "제주", label_zh: "濟州島" },
  { value: "other", label_ko: "타지역", label_zh: "其他地區" },
] as const;

export type KoreaRegion = (typeof KOREA_REGIONS)[number]["value"];

export function getRegionLabel(value: string, lang: "ko" | "zh" = "zh"): string {
  const region = KOREA_REGIONS.find((r) => r.value === value);
  if (!region) return value;
  return lang === "ko" ? region.label_ko : region.label_zh;
}
