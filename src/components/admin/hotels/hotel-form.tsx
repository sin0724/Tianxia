"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KOREA_REGIONS } from "@/constants/regions";

const hotelSchema = z.object({
  name: z.string().min(1, "호텔명을 입력해주세요"),
  name_en: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z
    .string()
    .email("올바른 이메일 형식을 입력해주세요")
    .optional()
    .or(z.literal("")),
  partner_code: z.string().min(1, "추천인 코드를 생성해주세요"),
  incentive_per_completion: z.coerce.number().min(0),
  status: z.enum(["active", "inactive", "pending"]),
  notes: z.string().optional(),
});

type HotelFormData = z.infer<typeof hotelSchema>;

export interface HotelData {
  id: string;
  name: string;
  name_en: string | null;
  address: string | null;
  region: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  partner_code: string;
  incentive_per_completion: number;
  status: "active" | "inactive" | "pending";
  notes: string | null;
}

interface HotelFormProps {
  hotel?: HotelData;
}

export function HotelForm({ hotel }: HotelFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!hotel;

  const form = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: hotel?.name ?? "",
      name_en: hotel?.name_en ?? "",
      address: hotel?.address ?? "",
      region: hotel?.region ?? "",
      contact_name: hotel?.contact_name ?? "",
      contact_phone: hotel?.contact_phone ?? "",
      contact_email: hotel?.contact_email ?? "",
      partner_code: hotel?.partner_code ?? "",
      incentive_per_completion: hotel?.incentive_per_completion ?? 20000,
      status: hotel?.status ?? "active",
      notes: hotel?.notes ?? "",
    },
  });

  const onSubmit = async (data: HotelFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    const payload = {
      name: data.name,
      name_en: data.name_en || null,
      address: data.address || null,
      region: data.region || null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      partner_code: data.partner_code,
      incentive_per_completion: data.incentive_per_completion,
      status: data.status,
      notes: data.notes || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("hotel_partners")
        .update(payload)
        .eq("id", hotel.id);

      if (error) {
        if (error.code === "23505") {
          alert("이미 사용 중인 추천인 코드입니다. 코드를 재생성해주세요.");
        } else {
          alert("수정 중 오류가 발생했습니다: " + error.message);
        }
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("hotel_partners").insert(payload);

      if (error) {
        if (error.code === "23505") {
          alert("이미 사용 중인 추천인 코드입니다. 코드를 재생성해주세요.");
        } else {
          alert("등록 중 오류가 발생했습니다: " + error.message);
        }
        setIsLoading(false);
        return;
      }
    }

    router.push("/admin/hotels");
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">기본 정보</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">호텔명 (한국어) *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="예: 롯데호텔 서울"
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="name_en">호텔명 (영문)</Label>
            <Input
              id="name_en"
              {...form.register("name_en")}
              placeholder="예: Lotte Hotel Seoul"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="region">지역</Label>
            <select
              id="region"
              {...form.register("region")}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">선택하세요</option>
              {KOREA_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label_ko}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="예: 서울특별시 중구 을지로 30"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* 담당자 정보 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">담당자 정보</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact_name">담당자명</Label>
            <Input
              id="contact_name"
              {...form.register("contact_name")}
              placeholder="홍길동"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contact_phone">연락처</Label>
            <Input
              id="contact_phone"
              {...form.register("contact_phone")}
              placeholder="010-0000-0000"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="contact_email">이메일</Label>
            <Input
              id="contact_email"
              type="email"
              {...form.register("contact_email")}
              placeholder="hotel@example.com"
              className="mt-1"
            />
            {form.formState.errors.contact_email && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.contact_email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 파트너 설정 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">파트너 설정</h3>
        <div className="space-y-4">
          {/* 추천인 코드 */}
          <div>
            <Label htmlFor="partner_code">추천인 코드</Label>
            <div className="mt-1">
              <Input
                id="partner_code"
                {...form.register("partner_code")}
                className="font-mono tracking-widest"
                placeholder="예: LOTTESEOUL"
                onChange={(e) =>
                  form.setValue("partner_code", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            {form.formState.errors.partner_code && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.partner_code.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              가입자가 회원가입 시 입력하는 코드입니다. 호텔에 알려주세요.
            </p>
          </div>

          {/* 인센티브 */}
          <div>
            <Label htmlFor="incentive_per_completion">체험 완료 인센티브 (원/건)</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="incentive_per_completion"
                type="number"
                min="0"
                step="1000"
                {...form.register("incentive_per_completion")}
                className="max-w-xs"
              />
              <span className="text-sm text-gray-500">원</span>
            </div>
          </div>

          {/* 상태 */}
          <div>
            <Label>상태</Label>
            <div className="mt-2 flex gap-4">
              {[
                { value: "active", label: "활성" },
                { value: "inactive", label: "비활성" },
                { value: "pending", label: "보류" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value={value}
                    {...form.register("status")}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label htmlFor="notes">메모</Label>
            <textarea
              id="notes"
              {...form.register("notes")}
              rows={3}
              placeholder="내부 메모를 입력하세요"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? "저장 중..." : isEdit ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
