"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Hotel {
  id: string;
  name: string;
  partner_code: string;
  incentive_per_completion: number;
}

interface SettlementGeneratorProps {
  hotels: Hotel[];
}

export function SettlementGenerator({ hotels }: SettlementGeneratorProps) {
  const router = useRouter();
  const [hotelId, setHotelId] = useState("");
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [preview, setPreview] = useState<{
    count: number;
    amount: number;
    incentive: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const selectedHotel = hotels.find((h) => h.id === hotelId);

  const handlePreview = async () => {
    if (!hotelId || !month) {
      alert("호텔과 정산월을 선택해주세요.");
      return;
    }
    setIsLoading(true);
    const supabase = createClient();

    // 이미 정산된 application_id 조회
    const { data: alreadySettled } = await supabase
      .from("hotel_settlement_items")
      .select("application_id");
    const settledIds = (alreadySettled ?? []).map((r) => r.application_id);

    // 정산 대상 건수 조회
    const startDate = `${month}-01T00:00:00.000Z`;
    const endDate = new Date(
      parseInt(month.slice(0, 4)),
      parseInt(month.slice(5, 7)),
      1
    )
      .toISOString()
      .replace(/T.*/, "T00:00:00.000Z");

    let query = supabase
      .from("applications")
      .select("id", { count: "exact" })
      .eq("hotel_partner_id", hotelId)
      .eq("is_settlement_target", true)
      .gte("visit_completed_at", startDate)
      .lt("visit_completed_at", endDate);

    if (settledIds.length > 0) {
      query = query.not("id", "in", `(${settledIds.join(",")})`);
    }

    const { count } = await query;
    const cnt = count ?? 0;
    const incentive = selectedHotel?.incentive_per_completion ?? 20000;

    setPreview({ count: cnt, amount: cnt * incentive, incentive });
    setShowModal(true);
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    if (!hotelId || !month || !preview) return;
    setIsLoading(true);
    const supabase = createClient();

    // 중복 확인
    const { data: existing } = await supabase
      .from("hotel_settlements")
      .select("id")
      .eq("hotel_partner_id", hotelId)
      .eq("settlement_month", month)
      .single();

    if (existing) {
      alert(`${month} 정산이 이미 존재합니다.`);
      setIsLoading(false);
      setShowModal(false);
      return;
    }

    // 정산 레코드 생성
    const { data: settlement, error: settlementError } = await supabase
      .from("hotel_settlements")
      .insert({
        hotel_partner_id: hotelId,
        settlement_month: month,
        completed_count: preview.count,
        incentive_per_count: preview.incentive,
        total_amount: preview.amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (settlementError || !settlement) {
      alert("정산 생성 중 오류: " + settlementError?.message);
      setIsLoading(false);
      return;
    }

    // 이미 정산된 ID 조회
    const { data: alreadySettled } = await supabase
      .from("hotel_settlement_items")
      .select("application_id");
    const settledIds = (alreadySettled ?? []).map((r) => r.application_id);

    const startDate = `${month}-01T00:00:00.000Z`;
    const endDate = new Date(
      parseInt(month.slice(0, 4)),
      parseInt(month.slice(5, 7)),
      1
    )
      .toISOString()
      .replace(/T.*/, "T00:00:00.000Z");

    let appQuery = supabase
      .from("applications")
      .select("id")
      .eq("hotel_partner_id", hotelId)
      .eq("is_settlement_target", true)
      .gte("visit_completed_at", startDate)
      .lt("visit_completed_at", endDate);

    if (settledIds.length > 0) {
      appQuery = appQuery.not("id", "in", `(${settledIds.join(",")})`);
    }

    const { data: apps } = await appQuery;

    if (apps && apps.length > 0) {
      // settlement_items 생성
      await supabase.from("hotel_settlement_items").insert(
        apps.map((a) => ({
          settlement_id: settlement.id,
          application_id: a.id,
          hotel_partner_id: hotelId,
          amount: preview.incentive,
        }))
      );

      // applications.settlement_id 업데이트
      await supabase
        .from("applications")
        .update({ settlement_id: settlement.id })
        .in(
          "id",
          apps.map((a) => a.id)
        );
    }

    setShowModal(false);
    setIsLoading(false);
    router.refresh();
    alert("정산이 생성되었습니다.");
  };

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">월별 정산 생성</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>정산 호텔</Label>
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">호텔 선택</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.partner_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>정산월</Label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handlePreview}
              disabled={isLoading || !hotelId || !month}
            >
              {isLoading ? "조회 중..." : "정산 미리보기"}
            </Button>
          </div>
        </div>
      </div>

      {/* 정산 확인 모달 */}
      {showModal && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">정산 생성 확인</h3>
            <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">호텔</span>
                <span className="font-medium">{selectedHotel?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">정산월</span>
                <span className="font-medium">{month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">방문완료 건수</span>
                <span className="font-medium">{preview.count}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">건당 인센티브</span>
                <span className="font-medium">
                  {preview.incentive.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-700">총 정산 금액</span>
                <span className="font-bold text-primary">
                  {preview.amount.toLocaleString()}원
                </span>
              </div>
            </div>
            {preview.count === 0 && (
              <p className="mb-3 text-sm text-amber-600">
                정산 대상 건수가 0건입니다. 정산을 생성하시겠습니까?
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "생성 중..." : "정산 생성"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
