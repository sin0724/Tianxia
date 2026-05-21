"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Download } from "lucide-react";

interface Settlement {
  id: string;
  hotel_partner_id: string;
  settlement_month: string;
  completed_count: number;
  incentive_per_count: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  memo: string | null;
  hotel_partners?: { name: string; partner_code: string } | null;
}

interface SettlementActionsProps {
  settlement: Settlement;
}

export function SettlementActions({ settlement }: SettlementActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [memo, setMemo] = useState(settlement.memo ?? "");
  const [showMemoEdit, setShowMemoEdit] = useState(false);

  const supabase = createClient();

  const updateStatus = async (
    status: string,
    extra?: Record<string, unknown>
  ) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("hotel_settlements")
      .update({ status, ...extra })
      .eq("id", settlement.id);

    if (error) {
      alert("상태 변경 중 오류: " + error.message);
    }
    setIsLoading(false);
    router.refresh();
  };

  const handleComplete = () => {
    if (!confirm("정산을 완료 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;
    updateStatus("completed", { paid_at: new Date().toISOString() });
  };

  const handleMemoSave = async () => {
    setIsLoading(true);
    await supabase
      .from("hotel_settlements")
      .update({ memo })
      .eq("id", settlement.id);
    setIsLoading(false);
    setShowMemoEdit(false);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {/* 상태 변경 버튼 */}
      <div className="flex flex-wrap gap-2">
        {settlement.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-blue-600 hover:text-blue-700"
            onClick={() => updateStatus("processing")}
            disabled={isLoading}
          >
            정산대기로 변경
          </Button>
        )}
        {(settlement.status === "pending" ||
          settlement.status === "processing") && (
          <Button
            size="sm"
            className="gap-1.5 bg-green-600 hover:bg-green-700"
            onClick={handleComplete}
            disabled={isLoading}
          >
            <Check className="h-3.5 w-3.5" />
            정산 완료 처리
          </Button>
        )}
        {settlement.status !== "on_hold" &&
          settlement.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="text-yellow-600 hover:text-yellow-700"
              onClick={() => updateStatus("on_hold")}
              disabled={isLoading}
            >
              보류
            </Button>
          )}
        {settlement.status === "on_hold" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("pending")}
            disabled={isLoading}
          >
            보류 해제
          </Button>
        )}
      </div>

      {/* 메모 */}
      {showMemoEdit ? (
        <div className="space-y-2">
          <Label>메모</Label>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="정산 메모 입력"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleMemoSave} disabled={isLoading}>
              저장
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMemoEdit(false)}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        <button
          className="text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setShowMemoEdit(true)}
        >
          {settlement.memo ? `메모: ${settlement.memo}` : "+ 메모 추가"}
        </button>
      )}
    </div>
  );
}

// CSV 다운로드 (정산 목록 전체)
export function SettlementCSVDownload({
  settlements,
}: {
  settlements: Settlement[];
}) {
  const handleDownload = () => {
    const headers = [
      "정산월",
      "호텔명",
      "파트너코드",
      "방문완료건수",
      "건당인센티브",
      "총정산금액",
      "상태",
      "정산완료일",
      "메모",
    ];

    const statusLabel: Record<string, string> = {
      pending: "미정산",
      processing: "정산대기",
      completed: "정산완료",
      on_hold: "보류",
    };

    const rows = settlements.map((s) => [
      s.settlement_month,
      s.hotel_partners?.name ?? "",
      s.hotel_partners?.partner_code ?? "",
      s.completed_count,
      s.incentive_per_count,
      s.total_amount,
      statusLabel[s.status] ?? s.status,
      s.paid_at ? new Date(s.paid_at).toLocaleDateString("ko-KR") : "",
      s.memo ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hotel-settlements-${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      CSV 다운로드
    </Button>
  );
}
