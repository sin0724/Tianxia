export const KOREA_REGIONS = [
  { value: "seoul", label_ko: "서울", label_zh: "首爾" },
  { value: "gyeonggi", label_ko: "경기", label_zh: "京畿道" },
  { value: "incheon", label_ko: "인천", label_zh: "仁川" },
  { value: "busan", label_ko: "부산", label_zh: "釜山" },
  { value: "daegu", label_ko: "대구", label_zh: "大邱" },
  { value: "daejeon", label_ko: "대전", label_zh: "大田" },
  { value: "gwangju", label_ko: "광주", label_zh: "光州" },
  { value: "ulsan", label_ko: "울산", label_zh: "蔚山" },
  { value: "sejong", label_ko: "세종", label_zh: "世宗" },
  { value: "gangwon", label_ko: "강원", label_zh: "江原道" },
  { value: "chungbuk", label_ko: "충북", label_zh: "忠清北道" },
  { value: "chungnam", label_ko: "충남", label_zh: "忠清南道" },
  { value: "jeonbuk", label_ko: "전북", label_zh: "全羅北道" },
  { value: "jeonnam", label_ko: "전남", label_zh: "全羅南道" },
  { value: "gyeongbuk", label_ko: "경북", label_zh: "慶尚北道" },
  { value: "gyeongnam", label_ko: "경남", label_zh: "慶尚南道" },
  { value: "jeju", label_ko: "제주", label_zh: "濟州島" },
  { value: "nationwide", label_ko: "전국", label_zh: "全國" },
  { value: "online", label_ko: "온라인", label_zh: "線上" },
] as const;

export type KoreaRegion = (typeof KOREA_REGIONS)[number]["value"];

export function getRegionLabel(value: string, lang: "ko" | "zh" = "zh"): string {
  const region = KOREA_REGIONS.find((r) => r.value === value);
  if (!region) return value;
  return lang === "ko" ? region.label_ko : region.label_zh;
}
