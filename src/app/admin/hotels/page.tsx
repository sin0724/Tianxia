import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HotelActions } from "@/components/admin/hotels/hotel-actions";

export default async function AdminHotelsPage() {
  const supabase = await createClient();
  const { data: hotels } = await supabase
    .from("hotel_partners")
    .select("*")
    .order("created_at", { ascending: false });

  const totalCount = hotels?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">호텔 파트너 관리</h1>
          <p className="text-sm text-gray-500">
            제휴 호텔을 등록하고 QR 코드를 관리합니다
          </p>
        </div>
        <Link href="/admin/hotels/new">
          <Button className="gap-2 rounded-lg bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            호텔 등록
          </Button>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          총{" "}
          <span className="font-medium text-gray-900">{totalCount}</span>개의
          호텔 파트너
        </p>
      </div>

      {hotels && hotels.length > 0 ? (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        hotel.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {hotel.status === "active" ? "활성" : "비활성"}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-medium text-blue-700">
                      {hotel.partner_code}
                    </span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    {hotel.name}
                  </h3>
                  {hotel.address && (
                    <p className="mb-2 text-sm text-gray-500">{hotel.address}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {hotel.contact_name && (
                      <span>담당자: {hotel.contact_name}</span>
                    )}
                    {hotel.contact_phone && (
                      <span>연락처: {hotel.contact_phone}</span>
                    )}
                    {hotel.contact_email && (
                      <span>이메일: {hotel.contact_email}</span>
                    )}
                    <span className="font-medium text-gray-700">
                      인센티브:{" "}
                      {hotel.incentive_per_completion.toLocaleString()}원/건
                    </span>
                  </div>
                  {hotel.notes && (
                    <p className="mt-2 text-sm text-gray-400">
                      메모: {hotel.notes}
                    </p>
                  )}
                </div>
                <HotelActions
                  hotel={{
                    id: hotel.id,
                    name: hotel.name,
                    partner_code: hotel.partner_code,
                    status: hotel.status as "active" | "inactive",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <p className="mb-4 text-gray-500">등록된 호텔 파트너가 없습니다</p>
          <Link href="/admin/hotels/new">
            <Button className="rounded-lg bg-primary hover:bg-primary/90">
              첫 호텔 등록하기
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
