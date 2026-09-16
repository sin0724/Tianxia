"use client";

import { useEffect, useState } from "react";
import { X, MessageCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

// 모집 채널을 LINE 단체방으로 통일 — 플랫폼은 약 3개월 후 종료 예정
export const LINE_GROUP_URL = "https://line.me/R/ti/g/6RqzJvk9-m";
const CLOSE_DATE_TEXT = "2026 年 12 月底";

const NOTICE_KEY = "line_migration_notice_dismissed_at";
const SNOOZE_MS = 24 * 60 * 60 * 1000; // 하루에 한 번만 표시

export function LineMigrationNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissedAt = Number(localStorage.getItem(NOTICE_KEY) ?? 0);
      if (Date.now() - dismissedAt > SNOOZE_MS) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(NOTICE_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="關閉"
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-md shadow-[#06C755]/20">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">重要公告：體驗團改由 LINE 群組招募</h2>
            <p className="text-xs text-gray-400">天下 Tianxia 平台服務調整</p>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm leading-relaxed text-gray-700">
          <p>
            感謝大家一直以來的支持！為了讓招募與聯繫更即時，
            <span className="font-semibold text-gray-900">今後所有體驗團活動將統一在 LINE 群組公告與招募</span>
            ，本網站將不再更新新活動。
          </p>
          <p>
            請加入我們的 LINE 群組，才不會錯過最新的韓國體驗團機會！
          </p>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            本網站預計於 <span className="font-semibold">{CLOSE_DATE_TEXT}</span> 停止服務。
            進行中的活動與後記提交仍可正常使用，請於期限前完成。
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={dismiss} variant="outline" className="flex-1">
            稍後再說
          </Button>
          <a
            href={LINE_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            onClick={dismiss}
          >
            <Button className="w-full bg-[#06C755] text-white hover:bg-[#05b34c]">
              加入 LINE 群組
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
