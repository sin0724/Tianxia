import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Megaphone, FileText, Users, Star, Hotel,
  Clock, CalendarCheck, ClipboardList, CheckCircle2,
  AlertCircle, ArrowRight, TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const thisMonth = new Date().toISOString().slice(0, 7);

  const [
    { count: campaignCount },
    { count: activeCampaignCount },
    { count: applicationCount },
    { count: pendingCount },
    { count: scheduleProposedCount },
    { count: reservationSubmittedCount },
    { count: visitConfirmedCount },
    { count: userCount },
    { count: reviewSubmittedCount },
    { count: completedThisMonthCount },
    { count: activeHotelCount },
    { count: hotelReferralCount },
    { count: hotelApplicationCount },
    { count: hotelCompletedCount },
    { data: pendingSettlements },
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "schedule_proposed"),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "reservation_submitted"),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "visit_confirmed"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("applications").select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", `${thisMonth}-01`),
    supabase.from("hotel_partners").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("hotel_referrals").select("*", { count: "exact", head: true })
      .gte("created_at", `${thisMonth}-01`),
    supabase.from("applications").select("*", { count: "exact", head: true })
      .not("hotel_partner_id", "is", null),
    supabase.from("applications").select("*", { count: "exact", head: true })
      .eq("is_settlement_target", true)
      .is("settlement_id", null),
    supabase.from("hotel_settlements").select("total_amount").neq("status", "completed"),
  ]);

  const pendingSettlementAmount =
    pendingSettlements?.reduce((sum, s) => sum + (s.total_amount ?? 0), 0) ?? 0;

  const totalActionRequired =
    (pendingCount ?? 0) +
    (scheduleProposedCount ?? 0) +
    (reservationSubmittedCount ?? 0) +
    (visitConfirmedCount ?? 0) +
    (reviewSubmittedCount ?? 0);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        {totalActionRequired > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" />
            처리 필요 {totalActionRequired}건
          </div>
        )}
      </div>

      {/* 즉시 처리 필요 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          <AlertCircle className="h-4 w-4" />
          즉시 처리 필요
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ActionCard
            href="/admin/applications"
            label="승인 대기"
            count={pendingCount ?? 0}
            icon={Clock}
            color="yellow"
          />
          <ActionCard
            href="/admin/applications"
            label="일정제안 수신"
            count={scheduleProposedCount ?? 0}
            icon={CalendarCheck}
            color="blue"
          />
          <ActionCard
            href="/admin/applications"
            label="예약접수 확인"
            count={reservationSubmittedCount ?? 0}
            icon={ClipboardList}
            color="indigo"
          />
          <ActionCard
            href="/admin/applications"
            label="후기 확인 대기"
            count={visitConfirmedCount ?? 0}
            icon={Star}
            color="purple"
          />
          <ActionCard
            href="/admin/reviews"
            label="후기 미승인"
            count={reviewSubmittedCount ?? 0}
            icon={FileText}
            color="orange"
          />
        </div>
      </section>

      {/* 전체 현황 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          <TrendingUp className="h-4 w-4" />
          전체 현황
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="캠페인"
            value={campaignCount ?? 0}
            sub={`진행중 ${activeCampaignCount ?? 0}개`}
            icon={Megaphone}
            href="/admin/campaigns"
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="전체 신청"
            value={applicationCount ?? 0}
            sub={`이달 완료 ${completedThisMonthCount ?? 0}건`}
            icon={FileText}
            href="/admin/applications"
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="회원"
            value={userCount ?? 0}
            icon={Users}
            href="/admin/users"
            accent="bg-violet-50 text-violet-600"
          />
          <StatCard
            title="후기"
            value={(reviewSubmittedCount ?? 0) + (applicationCount ?? 0 - (pendingCount ?? 0))}
            sub={`미승인 ${reviewSubmittedCount ?? 0}건`}
            icon={Star}
            href="/admin/reviews"
            accent="bg-amber-50 text-amber-600"
          />
        </div>
      </section>

      {/* 호텔 파트너 */}
      <section>
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Hotel className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-blue-900">호텔 파트너 현황</h2>
            </div>
            <Link href="/admin/hotels" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
              파트너 관리 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "활성 파트너", value: activeHotelCount ?? 0, unit: "개", color: "text-blue-900" },
              { label: "이달 추천 가입", value: hotelReferralCount ?? 0, unit: "명", color: "text-indigo-900" },
              { label: "파트너 유입 신청", value: hotelApplicationCount ?? 0, unit: "건", color: "text-blue-900" },
              { label: "정산 완료 대기", value: hotelCompletedCount ?? 0, unit: "건", color: "text-orange-700" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/80 p-3.5 shadow-sm">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>
                  {s.value}
                  <span className="ml-1 text-xs font-normal text-gray-400">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {pendingSettlementAmount > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5">
              <p className="text-sm text-gray-600">
                미정산 예정액
                <span className="ml-2 font-bold text-gray-900">
                  {pendingSettlementAmount.toLocaleString()}원
                </span>
              </p>
              <Link href="/admin/hotel-settlements" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                정산 관리 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 빠른 이동 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">빠른 이동</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: "/admin/campaigns/new", label: "캠페인 등록", icon: Megaphone },
            { href: "/admin/applications", label: "신청 관리", icon: FileText },
            { href: "/admin/users", label: "회원 관리", icon: Users },
            { href: "/admin/hotels", label: "파트너 관리", icon: Hotel },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  label,
  count,
  icon: Icon,
  color,
}: {
  href: string;
  label: string;
  count: number;
  icon: React.ElementType;
  color: "yellow" | "blue" | "indigo" | "purple" | "orange";
}) {
  const palette = {
    yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-700",  num: "text-yellow-900",  icon: "text-yellow-500" },
    blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    num: "text-blue-900",    icon: "text-blue-500" },
    indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  num: "text-indigo-900",  icon: "text-indigo-500" },
    purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  num: "text-purple-900",  icon: "text-purple-500" },
    orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  num: "text-orange-900",  icon: "text-orange-500" },
  };
  const p = palette[color];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-xl border ${p.border} ${p.bg} p-4 transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${p.icon}`} />
        {count > 0 && (
          <span className={`rounded-full bg-white px-2 py-0.5 text-xs font-bold ${p.num} shadow-sm`}>
            {count}
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold ${p.num}`}>{count}<span className="ml-0.5 text-sm font-normal">건</span></p>
      <p className={`mt-0.5 text-xs font-medium ${p.text}`}>{label}</p>
      {count === 0 && (
        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-gray-300" />
      )}
    </Link>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  value: number;
  sub?: string;
  icon: React.ElementType;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </Link>
  );
}
