"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MAX_MONTHS_AHEAD = 12;

interface DateMultiPickerProps {
  selected: string[]; // "YYYY-MM-DD", 선택 순서 유지
  onChange: (dates: string[]) => void;
  maxDates?: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function formatDateLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日（${weekday}）`;
}

export function DateMultiPicker({ selected, onChange, maxDates = 3 }: DateMultiPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [limitHit, setLimitHit] = useState(false);

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const monthsAhead =
    (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());

  const moveMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toggleDate = (key: string, disabled: boolean) => {
    if (disabled) return;
    if (selected.includes(key)) {
      onChange(selected.filter((d) => d !== key));
      setLimitHit(false);
      return;
    }
    if (selected.length >= maxDates) {
      setLimitHit(true);
      return;
    }
    onChange([...selected, key]);
    setLimitHit(false);
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {/* 월 네비게이션 */}
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="上個月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-gray-800">
            {viewYear}年 {viewMonth + 1}月
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={monthsAhead >= MAX_MONTHS_AHEAD}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="下個月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={cn(
                "py-1 text-[11px] font-medium",
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              )}
            >
              {w}
            </span>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const key = toKey(viewYear, viewMonth, day);
            const date = new Date(viewYear, viewMonth, day);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const selectedIndex = selected.indexOf(key);
            const isSelected = selectedIndex >= 0;

            return (
              <button
                key={key}
                type="button"
                disabled={isPast}
                onClick={() => toggleDate(key, isPast)}
                className={cn(
                  "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                  isPast && "text-gray-300",
                  !isPast && !isSelected && "text-gray-700 hover:bg-gray-100",
                  isToday && !isSelected && "font-bold text-primary",
                  isSelected && "bg-primary font-bold text-white"
                )}
              >
                {day}
                {isSelected && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-primary shadow ring-1 ring-primary/30">
                    {selectedIndex + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className={cn("text-xs", limitHit ? "font-medium text-red-500" : "text-gray-400")}>
        {limitHit
          ? `最多只能選 ${maxDates} 個日期，請先點擊已選日期取消`
          : `點擊日曆選擇日期（最多 ${maxDates} 個），再點一次可取消`}
      </p>

      {/* 선택된 날짜 칩 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((key, i) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary"
            >
              <span className="font-bold">第{i + 1}志願</span>
              {formatDateLabel(key)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((d) => d !== key))}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                aria-label="移除日期"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
