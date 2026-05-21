import { createClient } from "@/lib/supabase/server";
import { SettlementGenerator } from "@/components/admin/hotel-settlements/settlement-generator";
import {
  SettlementActions,
  SettlementCSVDownload,
} from "@/components/admin/hotel-settlements/settlement-actions";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "미정산",
  processing: "정산대기",
  completed: "정산완료",
  on_hold: "보류",
};

export default async function HotelSettlementsPage() {
  const supabase = await createClient();

  const [{ data: hotels }, { data: settlements }] = await Promise.all([
    supabase
      .from("hotel_partners")
      .select("id, name, partner_code, incentive_per_completion, status")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("hotel_settlements")
      .select(
        "*, hotel_partners(name, partner_code)"
      )
      .order("settlement_month", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const totalCompleted =
    settlements
      ?.filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.total_amount, 0) ?? 0;

  const totalPending =
    settlements
      ?.filter((s) => s.status !== "completed")
      .reduce((sum, s) => sum + s.total_amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">호텔 정산 관리</h1>
          <p className="text-sm text-gray-500">
            방문완료 기준 월별 인센티브 정산을 관리합니다
          </p>
        </div>
        {settlements && settlements.length > 0 && (
          <SettlementCSVDownload settlements={settlements as any} />
        )}
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "전체 정산 건수", value: settlements?.length ?? 0, unit: "건" },
          {
            label: "정산 완료",
            value: (settlements?.filter((s) => s.status === "completed").length ?? 0),
            unit: "건",
          },
          {
            label: "누적 지급액",
            value: totalCompleted.toLocaleString(),
            unit: "원",
          },
          {
            label: "미지급 예정액",
            value: totalPending.toLocaleString(),
            unit: "원",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {stat.value}
              <span className="ml-1 text-xs font-normal text-gray-400">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 정산 생성 */}
      <SettlementGenerator hotels={(hotels ?? []) as any} />

      {/* 정산 목록 */}
      {settlements && settlements.length > 0 ? (
        <div className="space-y-4">
          {settlements.map((s) => {
            const hotel = s.hotel_partners as
              | { name: string; partner_code: string }
              | null;
            return (
              <div key={s.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                      <span className="font-mono text-xs text-blue-700">
                        {hotel?.partner_code}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {s.settlement_month}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {hotel?.name ?? "알 수 없음"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>방문완료 {s.completed_count}건</span>
                      <span>
                        건당 {s.incentive_per_count.toLocaleString()}원
                      </span>
                      <span className="font-semibold text-gray-800">
                        총 {s.total_amount.toLocaleString()}원
                      </span>
                      {s.paid_at && (
                        <span className="text-gray-400">
                          완료일:{" "}
                          {new Date(s.paid_at).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                    </div>
                    {s.memo && (
                      <p className="mt-1 text-xs text-gray-400">
                        메모: {s.memo}
                      </p>
                    )}
                  </div>
                  <SettlementActions settlement={s as any} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">생성된 정산이 없습니다</p>
          <p className="mt-1 text-sm text-gray-300">
            위에서 호텔과 정산월을 선택해 정산을 생성하세요
          </p>
        </div>
      )}
    </div>
  );
}
