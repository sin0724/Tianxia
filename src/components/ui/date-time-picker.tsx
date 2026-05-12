"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
];

interface DateTimePickerProps {
  value?: string;
  onChange: (datetime: string) => void;
  minDate?: string;
  preselectedDate?: string;
}

export function DateTimePicker({ value, onChange, minDate, preselectedDate }: DateTimePickerProps) {
  const today = new Date();
  const initialDate = value
    ? new Date(value.split(" ")[0])
    : preselectedDate
    ? new Date(preselectedDate)
    : today;

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    value ? value.split(" ")[0] : preselectedDate || ""
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? value.split(" ")[1] || "" : ""
  );

  useEffect(() => {
    if (selectedDate && selectedTime) {
      onChange(`${selectedDate} ${selectedTime}`);
    } else if (selectedDate) {
      onChange(selectedDate);
    }
  }, [selectedDate, selectedTime]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const min = minDate ? new Date(minDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < min;
  };

  const isSelected = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedDate;
  };

  const isToday = (year: number, month: number, day: number) => {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  };

  const selectDay = (day: number) => {
    if (isDisabled(viewYear, viewMonth, day)) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const displayDate = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })
    : "請選擇日期";

  return (
    <div className="space-y-4">
      {/* 달력 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between bg-primary px-4 py-3">
          <button type="button" onClick={prevMonth} className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">
            {viewYear}年 {MONTHS_ZH[viewMonth]}
          </span>
          <button type="button" onClick={nextMonth} className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS_ZH.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 p-2">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const disabled = isDisabled(viewYear, viewMonth, day);
            const selected = isSelected(viewYear, viewMonth, day);
            const todayMark = isToday(viewYear, viewMonth, day);
            const col = i % 7;

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                disabled={disabled}
                className={`relative mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  selected
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : disabled
                    ? "cursor-not-allowed text-gray-200"
                    : todayMark
                    ? "border border-primary/40 text-primary hover:bg-primary/10"
                    : col === 0
                    ? "text-red-400 hover:bg-red-50"
                    : col === 6
                    ? "text-blue-400 hover:bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {day}
                {todayMark && !selected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 날짜 표시 */}
        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-gray-700">{displayDate}</span>
        </div>
      </div>

      {/* 시간 선택 */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-gray-700">到訪時間</span>
          <span className="text-xs text-gray-400">(請選擇)</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTime(t)}
              className={`rounded-lg py-2 text-xs font-medium transition-all ${
                selectedTime === t
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 선택 결과 요약 */}
      {selectedDate && selectedTime && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary">
          <Calendar className="h-4 w-4" />
          <span>{displayDate} {selectedTime}</span>
        </div>
      )}
    </div>
  );
}
