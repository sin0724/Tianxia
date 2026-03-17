"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import { ApplicationActions } from "./application-actions";

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
  status: string;
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
  } | null;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

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
      .select(
        `
        *,
        profiles (id, name, email, instagram_handle, region),
        campaigns (id, title_ko, brand_name_ko)
      `
      )
      .order("applied_at", { ascending: false });

    if (data) setApplications(data as unknown as Application[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel("applications-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => fetchApplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        return (
          name.includes(q) ||
          email.includes(q) ||
          instagram.includes(q) ||
          campaignTitle.includes(q) ||
          brandName.includes(q)
        );
      });
    }

    return filtered;
  }, [applications, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts = { all: applications.length, pending: 0, approved: 0, rejected: 0 };
    applications.forEach((a) => {
      if (a.status === "pending") counts.pending++;
      else if (a.status === "approved") counts.approved++;
      else if (a.status === "rejected") counts.rejected++;
    });
    return counts;
  }, [applications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">승인</Badge>;
      case "rejected":
        return <Badge variant="destructive">반려</Badge>;
      default:
        return <Badge variant="secondary">대기</Badge>;
    }
  };

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기" },
    { value: "approved", label: "승인" },
    { value: "rejected", label: "반려" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">신청 관리</h2>
        <p className="text-muted-foreground">캠페인 신청을 승인하거나 반려합니다</p>
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
              {statusCounts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="이름, 이메일, 인스타그램, 캠페인명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-muted-foreground">
        {filteredApplications.length}건의 신청
      </p>

      {/* 신청 목록 */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const profile = application.profiles;
            const campaign = application.campaigns;

            return (
              <Card key={application.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {campaign?.brand_name_ko || "알 수 없음"} -{" "}
                        {campaign?.title_ko || "알 수 없음"}
                      </p>
                      <CardTitle className="text-lg">
                        {profile?.name || "알 수 없음"}
                      </CardTitle>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">이메일: </span>
                      {profile?.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instagram: </span>
                      @{profile?.instagram_handle}
                    </div>
                    <div>
                      <span className="text-muted-foreground">지역: </span>
                      {profile?.region}
                    </div>
                    <div>
                      <span className="text-muted-foreground">신청일: </span>
                      {formatDate(application.applied_at, "ko")}
                    </div>
                  </div>

                  {application.message && (
                    <div className="mb-4 rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">신청 메시지:</p>
                      <p className="text-sm text-muted-foreground">
                        {application.message}
                      </p>
                    </div>
                  )}

                  <div className="mb-4 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Instagram: </span>
                      <a
                        href={application.applied_instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {application.applied_instagram_url}
                      </a>
                    </p>
                    {application.applied_threads_url && (
                      <p>
                        <span className="text-muted-foreground">Threads: </span>
                        <a
                          href={application.applied_threads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_threads_url}
                        </a>
                      </p>
                    )}
                    {application.applied_facebook_url && (
                      <p>
                        <span className="text-muted-foreground">Facebook: </span>
                        <a
                          href={application.applied_facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_facebook_url}
                        </a>
                      </p>
                    )}
                    {application.applied_youtube_url && (
                      <p>
                        <span className="text-muted-foreground">YouTube: </span>
                        <a
                          href={application.applied_youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_youtube_url}
                        </a>
                      </p>
                    )}
                    {application.applied_dcard_url && (
                      <p>
                        <span className="text-muted-foreground">Dcard: </span>
                        <a
                          href={application.applied_dcard_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {application.applied_dcard_url}
                        </a>
                      </p>
                    )}
                  </div>

                  {application.status === "pending" && (
                    <ApplicationActions applicationId={application.id} />
                  )}

                  {application.admin_note && (
                    <div className="mt-4 rounded-md border p-3">
                      <p className="text-sm font-medium">관리자 메모:</p>
                      <p className="text-sm text-muted-foreground">
                        {application.admin_note}
                      </p>
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
              {searchQuery || statusFilter !== "all"
                ? "검색 결과가 없습니다"
                : "신청 내역이 없습니다"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
