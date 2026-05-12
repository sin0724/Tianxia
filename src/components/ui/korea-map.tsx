"use client";

interface RegionDef {
  value: string;
  label: string;
  points: string;
  labelX: number;
  labelY: number;
  fontSize?: number;
}

const REGIONS: RegionDef[] = [
  {
    value: "gangwon",
    label: "江原道",
    points: "162,20 295,20 298,25 298,178 190,178 175,155 165,100 162,40",
    labelX: 240, labelY: 90,
  },
  {
    value: "gyeonggi",
    label: "京畿道",
    points: "68,68 162,68 162,82 190,92 190,178 162,178 138,178 112,178 88,172 65,163 58,148 60,108 68,82",
    labelX: 118, labelY: 135,
  },
  {
    value: "seoul",
    label: "首爾",
    points: "112,90 155,90 155,128 112,128",
    labelX: 133, labelY: 112, fontSize: 7,
  },
  {
    value: "incheon",
    label: "仁川",
    points: "55,90 112,90 112,128 55,128 44,112",
    labelX: 75, labelY: 112, fontSize: 7,
  },
  {
    value: "sejong",
    label: "世宗",
    points: "122,180 140,180 140,198 122,198",
    labelX: 131, labelY: 192, fontSize: 5,
  },
  {
    value: "chungnam",
    label: "忠南",
    points: "58,178 122,178 122,180 140,180 148,242 118,247 75,242 55,222",
    labelX: 90, labelY: 210,
  },
  {
    value: "daejeon",
    label: "大田",
    points: "132,195 158,195 158,218 132,218",
    labelX: 145, labelY: 210, fontSize: 6,
  },
  {
    value: "chungbuk",
    label: "忠北",
    points: "162,178 240,178 248,242 210,247 188,232 162,210",
    labelX: 205, labelY: 208,
  },
  {
    value: "jeonbuk",
    label: "全北",
    points: "55,247 210,247 215,292 75,292 55,272",
    labelX: 128, labelY: 268,
  },
  {
    value: "gwangju",
    label: "光州",
    points: "85,305 120,305 120,334 85,334",
    labelX: 102, labelY: 322, fontSize: 6,
  },
  {
    value: "jeonnam",
    label: "全南",
    points: "48,292 215,292 218,318 162,323 162,370 78,370 48,345",
    labelX: 100, labelY: 348,
  },
  {
    value: "gyeongbuk",
    label: "慶北",
    points: "240,178 298,178 300,285 268,292 255,282 238,268 210,268 210,247 240,247",
    labelX: 262, labelY: 225,
  },
  {
    value: "daegu",
    label: "大邱",
    points: "208,247 240,247 240,270 208,270",
    labelX: 224, labelY: 262, fontSize: 6,
  },
  {
    value: "gyeongnam",
    label: "慶南",
    points: "162,285 255,285 265,355 205,360 162,338 148,320",
    labelX: 205, labelY: 325,
  },
  {
    value: "ulsan",
    label: "蔚山",
    points: "255,268 298,268 300,305 255,305",
    labelX: 278, labelY: 290, fontSize: 6,
  },
  {
    value: "busan",
    label: "釜山",
    points: "238,340 270,340 272,365 238,365",
    labelX: 254, labelY: 356, fontSize: 6,
  },
  {
    value: "jeju",
    label: "濟州島",
    points: "88,392 195,392 195,418 88,418",
    labelX: 142, labelY: 408,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  gangwon:  "#4ade80",
  gyeonggi: "#60a5fa",
  seoul:    "#f472b6",
  incheon:  "#a78bfa",
  sejong:   "#fb923c",
  chungnam: "#34d399",
  daejeon:  "#f87171",
  chungbuk: "#38bdf8",
  jeonbuk:  "#fbbf24",
  gwangju:  "#f472b6",
  jeonnam:  "#4ade80",
  gyeongbuk:"#818cf8",
  daegu:    "#fb7185",
  gyeongnam:"#2dd4bf",
  ulsan:    "#f97316",
  busan:    "#e879f9",
  jeju:     "#22d3ee",
};

interface KoreaMapProps {
  selected: string;
  onSelect: (value: string) => void;
}

export function KoreaMap({ selected, onSelect }: KoreaMapProps) {
  return (
    <div className="w-full">
      <svg
        viewBox="0 0 320 435"
        className="w-full max-w-[320px] mx-auto drop-shadow-sm"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
      >
        {REGIONS.map((region) => {
          const isSelected = selected === region.value;
          const baseColor = CATEGORY_COLORS[region.value] || "#94a3b8";

          return (
            <g key={region.value} onClick={() => onSelect(region.value)} className="cursor-pointer">
              <polygon
                points={region.points}
                fill={isSelected ? baseColor : "#f1f5f9"}
                stroke={isSelected ? baseColor : "#cbd5e1"}
                strokeWidth={isSelected ? 1.5 : 0.8}
                className="transition-all duration-150"
                style={{
                  filter: isSelected ? `drop-shadow(0 0 4px ${baseColor}80)` : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.target as SVGPolygonElement).setAttribute("fill", `${baseColor}40`);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.target as SVGPolygonElement).setAttribute("fill", "#f1f5f9");
                  }
                }}
              />
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={region.fontSize ?? 8}
                fontWeight={isSelected ? "700" : "500"}
                fill={isSelected ? "#ffffff" : "#475569"}
                className="pointer-events-none select-none"
                style={{ fontFamily: "sans-serif" }}
              >
                {region.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
