"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { getRegionLabel, KOREA_REGIONS } from "@/constants/regions";
import { Search } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  line_id: string;
  region: string;
  instagram_handle: string;
  instagram_url: string | null;
  threads_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  dcard_url: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")
        .order("created_at", { ascending: false });

      if (data) setUsers(data as UserProfile[]);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (selectedRegion !== "all") {
      filtered = filtered.filter((u) => u.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => {
        const name = u.name?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const instagram = u.instagram_handle?.toLowerCase() || "";
        const lineId = u.line_id?.toLowerCase() || "";
        return (
          name.includes(q) ||
          email.includes(q) ||
          instagram.includes(q) ||
          lineId.includes(q)
        );
      });
    }

    return filtered;
  }, [users, searchQuery, selectedRegion]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length };
    users.forEach((u) => {
      counts[u.region] = (counts[u.region] || 0) + 1;
    });
    return counts;
  }, [users]);

  const REGION_TABS = [
    { value: "all", label: "전체" },
    ...KOREA_REGIONS.filter((r) => regionCounts[r.value]).map((r) => ({
      value: r.value,
      label: r.label_ko,
    })),
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
        <h2 className="text-2xl font-bold">회원 관리</h2>
        <p className="text-muted-foreground">
          플랫폼에 가입한 회원을 조회합니다
        </p>
      </div>

      {/* 지역 필터 */}
      <div className="flex flex-wrap gap-2">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedRegion(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedRegion === tab.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {regionCounts[tab.value] !== undefined && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {regionCounts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="이름, 이메일, 인스타그램, LINE ID로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-muted-foreground">
        {filteredUsers.length}명의 회원
      </p>

      {/* 회원 목록 */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant="outline">
                        {getRegionLabel(user.region, "ko")}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>이메일: {user.email}</p>
                      <p>LINE ID: {user.line_id}</p>
                      <p>Instagram: @{user.instagram_handle}</p>
                      {user.instagram_url && (
                        <p>
                          Instagram URL:{" "}
                          <a
                            href={user.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {user.instagram_url}
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.threads_url && (
                        <a
                          href={user.threads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Threads</Badge>
                        </a>
                      )}
                      {user.facebook_url && (
                        <a
                          href={user.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Facebook</Badge>
                        </a>
                      )}
                      {user.youtube_url && (
                        <a
                          href={user.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">YouTube</Badge>
                        </a>
                      )}
                      {user.dcard_url && (
                        <a
                          href={user.dcard_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="secondary">Dcard</Badge>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>가입일</p>
                    <p>{formatDate(user.created_at, "ko")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedRegion !== "all"
                ? "검색 결과가 없습니다"
                : "등록된 회원이 없습니다"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
