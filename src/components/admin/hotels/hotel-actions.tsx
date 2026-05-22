"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Power, Copy, Check } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  partner_code: string;
  status: "active" | "inactive";
}

interface HotelActionsProps {
  hotel: Hotel;
}

export function HotelActions({ hotel }: HotelActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `"${hotel.name}"을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("hotel_partners")
      .delete()
      .eq("id", hotel.id);

    if (error) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
  };

  const handleToggleStatus = async () => {
    const newStatus = hotel.status === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "비활성화" : "활성화";

    if (!confirm(`"${hotel.name}"을 ${action}하시겠습니까?`)) return;

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("hotel_partners")
      .update({ status: newStatus })
      .eq("id", hotel.id);

    if (error) {
      alert("상태 변경 중 오류가 발생했습니다: " + error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setIsLoading(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(hotel.partner_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/hotels/${hotel.id}`}>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg">
          상세
        </Button>
      </Link>
      <Link href={`/admin/hotels/${hotel.id}/edit`}>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg">
          <Pencil className="h-4 w-4" />
          수정
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg text-blue-600 hover:text-blue-700"
        onClick={handleCopyCode}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "복사됨" : "코드 복사"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 rounded-lg ${
          hotel.status === "active"
            ? "text-orange-600 hover:text-orange-700"
            : "text-green-600 hover:text-green-700"
        }`}
        onClick={handleToggleStatus}
        disabled={isLoading}
      >
        <Power className="h-4 w-4" />
        {hotel.status === "active" ? "비활성화" : "활성화"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg text-red-600 hover:text-red-700"
        onClick={handleDelete}
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4" />
        삭제
      </Button>
    </div>
  );
}
