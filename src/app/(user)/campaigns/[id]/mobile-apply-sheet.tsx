"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar } from "lucide-react";
import { ApplicationForm } from "./application-form";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface MobileApplySheetProps {
  campaignId: string;
  userProfile: Profile | null;
  campaignTitle: string;
  applicationDeadline: string;
  daysRemaining: number;
  isDeadlinePassed: boolean;
  existingApplication: { status: string } | null;
  isLoggedIn: boolean;
}

export function MobileApplySheet({
  campaignId,
  userProfile,
  campaignTitle,
  applicationDeadline,
  daysRemaining,
  isDeadlinePassed,
  existingApplication,
  isLoggedIn,
}: MobileApplySheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderAction = () => {
    if (isDeadlinePassed) {
      return (
        <Button size="sm" disabled className="rounded-full px-5 shrink-0">
          已截止
        </Button>
      );
    }
    if (!isLoggedIn) {
      return (
        <Link href={`/login?redirect=/campaigns/${campaignId}`} className="shrink-0">
          <Button size="sm" className="rounded-full px-5">登入申請</Button>
        </Link>
      );
    }
    if (existingApplication) {
      const actionNeeded =
        existingApplication.status === "approved" ||
        existingApplication.status === "scheduled";
      return (
        <Link href="/mypage/applications" className="shrink-0">
          <Button
            size="sm"
            variant={actionNeeded ? "default" : "outline"}
            className="rounded-full px-5"
          >
            {actionNeeded ? "前往操作 →" : "查看申請"}
          </Button>
        </Link>
      );
    }
    return (
      <Button
        size="sm"
        className="rounded-full px-5 shrink-0"
        onClick={() => setIsOpen(true)}
      >
        立即申請 →
      </Button>
    );
  };

  return (
    <>
      {/* Fixed Bottom CTA — sits above the bottom tab bar (tab bar = 3.5rem) */}
      <div
        className="fixed inset-x-0 z-30 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden"
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{campaignTitle}</p>
            {!isDeadlinePassed && daysRemaining > 0 && daysRemaining <= 7 ? (
              <p className="text-xs text-red-500">⚡ 剩餘 {daysRemaining} 天截止</p>
            ) : !isDeadlinePassed ? (
              <p className="text-xs text-gray-400">截止：{formatDate(applicationDeadline)}</p>
            ) : null}
          </div>
          {renderAction()}
        </div>
      </div>

      {/* Bottom Sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet Panel */}
          <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h3 className="text-base font-semibold">申請活動</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 pb-8">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>截止日期：{formatDate(applicationDeadline)}</span>
                {daysRemaining <= 3 && daysRemaining > 0 && (
                  <Badge variant="destructive">剩餘 {daysRemaining} 天</Badge>
                )}
              </div>
              <ApplicationForm campaignId={campaignId} userProfile={userProfile} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
