"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import { ApplicationActions } from "./application-actions";
import type { ApplicationStatus } from "@/types/database";

interface ScheduleProposal {
  proposed_dates: string[];
  preferred_time: string | null;
  message: string | null;
  confirmed_date: string | null;
}

interface ReservationInfo {
  visitor_name: string;
  visitor_count: number;
  reservation_datetime: string;
  emergency_contact: string;
  line_id: string | null;
  selected_service: string | null;
  special_requests: string | null;
}

interface DeliveryAddress {
  recipient_name: string;
  country: string;
  city_state: string;
  zipcode: string;
  address: string;
  mobile: string;
  email: string;
}

interface ReviewInfo {
  id: string;
  review_url: string;
  content: string | null;
  visited_at: string | null;
  submitted_at: string;
  status: string;
}

interface Application {
  id: string;
  campaign_id: string;
  user_id: string;
  message: string | null;
  applied_instagram_url: string;
  applied_threads_url: string | null;
  applied_facebook_url: string | null;
  applied_youtube_url: string | null;
  applied_dcard_url: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  applied_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
    instagram_handle: string;
    region: string;
  } | null;
  campaigns: {
    id: string;
    title_ko: string;
    brand_name_ko: string;
    is_delivery: boolean;
  } | null;
  schedule_proposals: ScheduleProposal | null;
  reservation_info: ReservationInfo | null;
  delivery_addresses: DeliveryAddress | null;
  reviews: ReviewInfo | null;
  hotel_partner_id: string | null;
  hotel_code: string | null;
  is_settlement_target: boolean;
}

type StatusFilter = "all" | ApplicationStatus;

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:               { label: "대기",       color: "bg-gray-100 text-gray-700" },
  approved:              { label: "승인",       color: "bg-green-100 text-green-700" },
  schedule_proposed:     { label: "일정제안",   color: "bg-blue-100 text-blue-700" },
  scheduled:             { label: "일정확정",   color: "bg-indigo-100 text-indigo-700" },
  reservation_submitted: { label: "예약접수",   color: "bg-orange-100 text-orange-700" },
  visit_confirmed:       { label: "예약확정",   color: "bg-teal-100 text-teal-700" },
  completed:             { label: "완료",       color: "bg-purple-100 text-purple-700" },
  rejected:              { label: "반려",       color: "bg-red-100 text-red-700" },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",                label: "전체" },
  { value: "pending",            label: "대기" },
  { value: "approved",           label: "승인" },
  { value: "schedule_proposed",  label: "일정제안" },
  { value: "scheduled",          label: "일정확정" },
  { value: "reservation_submitted", label: "예약접수" },
  { value: "visit_confirmed",    label: "예약확정" },
  { value: "completed",          label: "완료" },
  { value: "rejected",           label: "반려" },
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select(`
        *,
        profiles (id, name, email, instagram_handle, region),
        campaigns (id, title_ko, brand_name_ko, is_delivery),
        schedule_proposals (proposed_dates, preferred_time, message, confirmed_date),
        reservation_info (visitor_name, visitor_count, reservation_datetime, emergency_contact, line_id, selected_service, special_requests),
        delivery_addresses (recipient_name, country, city_state, zipcode, address, mobile, email),
        reviews (id, review_url, content, visited_at, submitted_at, status)
      `)
      .order("applied_at", { ascending: false });

    if (data) {
      setApplications(data.map((a) => ({
        ...a,
        schedule_proposals: Array.isArray(a.schedule_proposals) ? a.schedule_proposals[0] ?? null : a.schedule_proposals,
        reservation_info: Array.isArray(a.reservation_info) ? a.reservation_info[0] ?? null : a.reservation_info,
        delivery_addresses: Array.isArray(a.delivery_addresses) ? a.delivery_addresses[0] ?? null : a.delivery_addresses,
        reviews: Array.isArray(a.reviews) ? a.reviews[0] ?? null : a.reviews,
      })) as unknown as Application[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel("applications-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => fetchApplications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredApplications = useMemo(() => {
    let filtered = applications;
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const name = a.profiles?.name?.toLowerCase() || "";
        const email = a.profiles?.email?.toLowerCase() || "";
        const instagram = a.profiles?.instagram_handle?.toLowerCase() || "";
        const campaignTitle = a.campaigns?.title_ko?.toLowerCase() || "";
        const brandName = a.campaigns?.brand_name_ko?.toLowerCase() || "";
        return name.includes(q) || email.includes(q) || instagram.includes(q) || campaignTitle.includes(q) || brandName.includes(q);
      });
    }
    return filtered;
  }, [applications, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">신청 관리</h2>
        <p className="text-muted-foreground">캠페인 신청 전체 플로우를 관리합니다</p>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {statusCounts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="이름, 이메일, 인스타그램, 캠페인명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">{filteredApplications.length}건의 신청</p>

      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const profile = application.profiles;
            const campaign = application.campaigns;
            const config = STATUS_CONFIG[application.status];

            return (
              <Card key={application.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign?.brand_name_ko || "알 수 없음"} - {campaign?.title_ko || "알 수 없음"}
                      </p>
                      <CardTitle className="text-lg">{profile?.name || "알 수 없음"}</CardTitle>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <div><span className="text-muted-foreground">이메일: </span>{profile?.email}</div>
                    <div><span className="text-muted-foreground">Instagram: </span>@{profile?.instagram_handle}</div>
                    <div><span className="text-muted-foreground">지역: </span>{profile?.region}</div>
                    <div><span className="text-muted-foreground">신청일: </span>{formatDate(application.applied_at, "ko")}</div>
                  </div>

                  {application.message && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">신청 메시지:</p>
                      <p className="text-sm text-muted-foreground">{application.message}</p>
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <a href={application.applied_instagram_url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                      Instagram: {application.applied_instagram_url}
                    </a>
                    {application.applied_threads_url && (
                      <a href={application.applied_threads_url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                        Threads: {application.applied_threads_url}
                      </a>
                    )}
                    {application.applied_youtube_url && (
                      <a href={application.applied_youtube_url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                        YouTube: {application.applied_youtube_url}
                      </a>
                    )}
                  </div>

                  {/* 일정 제안 / 확정 표시 */}
                  {application.schedule_proposals && (
                    <div className="rounded-md bg-blue-50 p-3 text-sm space-y-2">
                      {/* 확정 날짜 - 있으면 최상단에 강조 표시 */}
                      {application.schedule_proposals.confirmed_date && (
                        <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-2">
                          <span className="text-base">📅</span>
                          <div>
                            <p className="text-xs font-medium text-green-700">확정 일정</p>
                            <p className="font-bold text-green-900">{application.schedule_proposals.confirmed_date}</p>
                          </div>
                        </div>
                      )}
                      {/* 제안 날짜 목록 */}
                      {application.schedule_proposals.proposed_dates?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-1">유저 제안 날짜</p>
                          <div className="flex flex-wrap gap-2">
                            {application.schedule_proposals.proposed_dates.map((d, i) => (
                              <span key={i} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {application.schedule_proposals.preferred_time && (
                        <p className="text-blue-700">선호시간: {application.schedule_proposals.preferred_time}</p>
                      )}
                      {application.schedule_proposals.message && (
                        application.schedule_proposals.message.startsWith("[취소요청]") ? (
                          <p className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                            🚫 취소 사유: {application.schedule_proposals.message.replace("[취소요청]", "").trim() || "사유 없음"}
                          </p>
                        ) : application.schedule_proposals.message.startsWith("[일정변경]") ? (
                          <p className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
                            변경 사유: {application.schedule_proposals.message.replace("[일정변경]", "").trim()}
                          </p>
                        ) : (
                          <p className="text-blue-700">메시지: {application.schedule_proposals.message}</p>
                        )
                      )}
                    </div>
                  )}

                  {/* 예약 정보 표시 */}
                  {application.reservation_info && (
                    <div className="rounded-md bg-green-50 p-3 text-sm">
                      <p className="font-medium text-green-800">예약 정보</p>
                      <div className="mt-1 space-y-1 text-green-700">
                        <div className="grid grid-cols-2 gap-1">
                          <span>성명: {application.reservation_info.visitor_name}</span>
                          <span>방문인원: {application.reservation_info.visitor_count}명</span>
                          <span>일시: {application.reservation_info.reservation_datetime}</span>
                          <span>긴급연락: {application.reservation_info.emergency_contact}</span>
                          {application.reservation_info.line_id && (
                            <span>LINE ID: {application.reservation_info.line_id}</span>
                          )}
                          {application.reservation_info.selected_service && (
                            <span className="col-span-2 font-medium text-green-800">
                              선택 서비스: {application.reservation_info.selected_service}
                            </span>
                          )}
                        </div>
                        {application.reservation_info.special_requests && (
                          <p className="mt-1 rounded bg-green-100 px-2 py-1">
                            비고: {application.reservation_info.special_requests}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 배송 주소 표시 */}
                  {application.delivery_addresses && (
                    <div className="rounded-md bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-800">배송 주소</p>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-blue-700">
                        <span>수령인: {application.delivery_addresses.recipient_name}</span>
                        <span>연락처: {application.delivery_addresses.mobile}</span>
                        <span>국가: {application.delivery_addresses.country}</span>
                        <span>우편번호: {application.delivery_addresses.zipcode}</span>
                        <span className="col-span-2">주소: {application.delivery_addresses.city_state} {application.delivery_addresses.address}</span>
                        <span className="col-span-2">이메일: {application.delivery_addresses.email}</span>
                      </div>
                    </div>
                  )}

                  {application.hotel_code && (
                    <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                      <span className="font-mono font-semibold">{application.hotel_code}</span>
                      <span className="text-blue-400">호텔 유입</span>
                      {application.is_settlement_target && (
                        <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">정산대상</span>
                      )}
                    </div>
                  )}
                  <ApplicationActions
                    applicationId={application.id}
                    status={application.status}
                    scheduleProposal={application.schedule_proposals}
                    review={application.reviews}
                    isDelivery={application.campaigns?.is_delivery ?? false}
                    hotelPartnerId={application.hotel_partner_id}
                    onStatusChange={fetchApplications}
                  />

                  {application.admin_note && (
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium">관리자 메모:</p>
                      <p className="text-sm text-muted-foreground">{application.admin_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "검색 결과가 없습니다" : "신청 내역이 없습니다"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
