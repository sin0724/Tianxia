"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, QrCode, Power } from "lucide-react";

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
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const qrUrl = `${appUrl}/h/${hotel.partner_code}`;

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

  const handleShowQR = async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch {
      alert("QR 코드 생성 중 오류가 발생했습니다.");
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR_${hotel.name}_${hotel.partner_code}.png`;
    link.click();
  };

  return (
    <>
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
          onClick={handleShowQR}
        >
          <QrCode className="h-4 w-4" />
          QR
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

      {/* QR 코드 모달 */}
      {showQR && qrDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-center text-lg font-semibold">
              {hotel.name}
            </h3>
            <p className="mb-4 text-center font-mono text-sm text-gray-500">
              {hotel.partner_code}
            </p>
            <div className="flex justify-center">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-60 w-60 rounded-lg border"
              />
            </div>
            <p className="mt-3 break-all text-center text-xs text-gray-400">
              {qrUrl}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowQR(false)}>
                닫기
              </Button>
              <Button
                onClick={handleDownloadQR}
                className="bg-primary hover:bg-primary/90"
              >
                PNG 다운로드
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
