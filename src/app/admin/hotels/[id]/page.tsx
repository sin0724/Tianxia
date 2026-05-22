import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft } from "lucide-react";
import { CopyCodeButton } from "@/components/admin/hotels/copy-code-button";
import { getRegionLabel } from "@/constants/regions";
import { formatDate } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  schedule_proposed: "일정제안",
  scheduled: "일정확정",
  reservation_submitted: "예약접수",
  visit_confirmed: "예약확정",
  completed: "방문완료",
  rejected: "반려",
};

export default async function HotelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from("hotel_partners")
    .select("*")
    .eq("id", id)
    .single();

  if (!hotel) notFound();

  // 통계 쿼리 병렬 실행
  const [
    { count: referralCount },
    { count: applicationCount },
    { count: completedCount },
    { data: recentApplications },
    { data: settlements },
    { data: referralsRaw },
  ] = await Promise.all([
    supabase
      .from("hotel_referrals")
      .select("*", { count: "exact", head: true })
      .eq("hotel_partner_id", id),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("hotel_partner_id", id),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("hotel_partner_id", id)
      .eq("is_settlement_target", true),
    supabase
      .from("applications")
      .select(
        "id, status, applied_at, hotel_code, is_settlement_target, profiles(name, email), campaigns(title_ko, brand_name_ko)"
      )
      .eq("hotel_partner_id", id)
      .order("applied_at", { ascending: false })
      .limit(10),
    supabase
      .from("hotel_settlements")
      .select("*")
      .eq("hotel_partner_id", id)
      .order("settlement_month", { ascending: false })
      .limit(6),
    supabase
      .from("hotel_referrals")
      .select("id, user_id, hotel_code, created_at")
      .eq("hotel_partner_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // 추천인 가입자 프로필 조회
  const referralUserIds = referralsRaw?.map((r) => r.user_id) ?? [];
  const { data: referralProfiles } = referralUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email, instagram_url, instagram_handle")
        .in("id", referralUserIds)
    : { data: [] };

  const referralProfileMap = new Map(
    (referralProfiles ?? []).map((p) => [p.id, p])
  );
  const referrals = (referralsRaw ?? []).map((r) => ({
    ...r,
    profile: referralProfileMap.get(r.user_id) ?? null,
  }));

  const totalSettlementAmount = settlements
    ?.filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.total_amount, 0) ?? 0;

  const pendingSettlementAmount =
    (completedCount ?? 0) * hotel.incentive_per_completion;

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    pending: "bg-yellow-100 text-yellow-700",
  };
  const statusLabel: Record<string, string> = {
    active: "활성",
    inactive: "비활성",
    pending: "보류",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/hotels">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              목록
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColor[hotel.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {statusLabel[hotel.status] ?? hotel.status}
              </span>
            </div>
            {(hotel as any).name_en && (
              <p className="text-sm text-gray-400">{(hotel as any).name_en}</p>
            )}
          </div>
        </div>
        <Link href={`/admin/hotels/${id}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            수정
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "추천인 가입", value: referralCount ?? 0, unit: "명" },
          { label: "신청", value: applicationCount ?? 0, unit: "건" },
          { label: "방문 완료", value: completedCount ?? 0, unit: "건" },
          {
            label: "정산 완료",
            value: totalSettlementAmount.toLocaleString(),
            unit: "원",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stat.value}
              <span className="ml-1 text-sm font-normal text-gray-400">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 호텔 기본 정보 */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">기본 정보</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-gray-400">추천인 코드</dt>
              <dd className="font-mono font-medium text-blue-700">
                {hotel.partner_code}
              </dd>
            </div>
            {(hotel as any).region && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">지역</dt>
                <dd>{getRegionLabel((hotel as any).region, "ko")}</dd>
              </div>
            )}
            {hotel.address && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">주소</dt>
                <dd>{hotel.address}</dd>
              </div>
            )}
            {hotel.contact_name && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">담당자</dt>
                <dd>{hotel.contact_name}</dd>
              </div>
            )}
            {hotel.contact_phone && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">연락처</dt>
                <dd>{hotel.contact_phone}</dd>
              </div>
            )}
            {hotel.contact_email && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">이메일</dt>
                <dd>{hotel.contact_email}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-gray-400">인센티브</dt>
              <dd className="font-semibold text-gray-900">
                {hotel.incentive_per_completion.toLocaleString()}원/건
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-gray-400">정산 예정</dt>
              <dd className="font-semibold text-orange-600">
                {pendingSettlementAmount.toLocaleString()}원
              </dd>
            </div>
            {hotel.notes && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-400">메모</dt>
                <dd className="text-gray-500">{hotel.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* 추천인 코드 안내 */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">추천인 코드 안내</h3>
          <p className="mb-4 text-sm text-gray-500">
            이 코드를 호텔에 전달하세요. 가입자가 회원가입 시 추천인 코드를 입력하면
            이 호텔의 추천인으로 자동 등록됩니다.
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-5 py-4">
            <span className="flex-1 font-mono text-2xl font-bold tracking-widest text-blue-700">
              {hotel.partner_code}
            </span>
            <CopyCodeButton code={hotel.partner_code} />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            가입 페이지 URL: <span className="font-mono">tianxia.com/signup</span>
          </p>
        </div>
      </div>

      {/* 정산 내역 */}
      {settlements && settlements.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">정산 내역</h3>
            <Link href="/admin/hotel-settlements">
              <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                전체 보기 →
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">정산월</th>
                  <th className="pb-2 font-medium">방문완료</th>
                  <th className="pb-2 font-medium">정산금액</th>
                  <th className="pb-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {settlements.map((s) => (
                  <tr key={s.id} className="py-2">
                    <td className="py-2.5">{s.settlement_month}</td>
                    <td className="py-2.5">{s.completed_count}건</td>
                    <td className="py-2.5 font-medium">
                      {s.total_amount.toLocaleString()}원
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : s.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : s.status === "on_hold"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status === "completed"
                          ? "정산완료"
                          : s.status === "processing"
                          ? "정산대기"
                          : s.status === "on_hold"
                          ? "보류"
                          : "미정산"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 추천인 가입자 목록 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">
          추천인 가입자{" "}
          <span className="ml-1 text-sm font-normal text-gray-400">
            ({referralCount ?? 0}명)
          </span>
        </h3>
        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">이름</th>
                  <th className="pb-2 font-medium">이메일</th>
                  <th className="pb-2 font-medium">인스타그램</th>
                  <th className="pb-2 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-medium text-gray-900">
                      {r.profile?.name ?? "-"}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {r.profile?.email ?? "-"}
                    </td>
                    <td className="py-2.5">
                      {r.profile?.instagram_url ? (
                        <a
                          href={r.profile.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {r.profile.instagram_handle || "@링크"}
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {formatDate(r.created_at, "ko")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(referralCount ?? 0) > 30 && (
              <p className="mt-3 text-center text-xs text-gray-400">
                최근 30명 표시 중 (전체 {referralCount}명)
              </p>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            추천인 코드로 가입한 회원이 없습니다
          </p>
        )}
      </div>

      {/* 최근 신청 목록 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">
          호텔 유입 신청 목록{" "}
          <span className="ml-1 text-sm font-normal text-gray-400">
            (최근 10건)
          </span>
        </h3>
        {recentApplications && recentApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">신청자</th>
                  <th className="pb-2 font-medium">캠페인</th>
                  <th className="pb-2 font-medium">신청일</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 font-medium">정산대상</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentApplications.map((app) => {
                  const profile = app.profiles as unknown as {
                    name: string;
                    email: string;
                  } | null;
                  const campaign = app.campaigns as unknown as {
                    title_ko: string;
                    brand_name_ko: string;
                  } | null;
                  return (
                    <tr key={app.id}>
                      <td className="py-2.5">
                        <div>{profile?.name ?? "-"}</div>
                        <div className="text-xs text-gray-400">{profile?.email}</div>
                      </td>
                      <td className="py-2.5">
                        <div className="text-xs text-gray-400">
                          {campaign?.brand_name_ko}
                        </div>
                        <div className="max-w-[180px] truncate">
                          {campaign?.title_ko ?? "-"}
                        </div>
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {formatDate(app.applied_at, "ko")}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {STATUS_LABEL[app.status as string] ?? app.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {app.is_settlement_target ? (
                          <span className="text-xs font-medium text-green-600">
                            ✓ 대상
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            호텔 유입 신청이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
