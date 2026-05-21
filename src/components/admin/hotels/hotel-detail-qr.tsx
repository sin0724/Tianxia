"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";

interface HotelDetailQRProps {
  hotelName: string;
  partnerCode: string;
}

export function HotelDetailQR({ hotelName, partnerCode }: HotelDetailQRProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = `${window.location.origin}/h/${partnerCode}`;
    setQrUrl(url);

    let cancelled = false;

    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        // QR 생성 실패 시 무시
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [partnerCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `hotel-${partnerCode}-qr.png`;
    link.click();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">QR 코드 관리</h3>

      {/* QR 미리보기 */}
      <div className="mb-4 flex justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`${hotelName} QR`}
            className="h-48 w-48 rounded-lg border border-gray-100"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          </div>
        )}
      </div>

      {/* QR URL */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="mb-1 text-xs font-medium text-gray-400">QR 링크</p>
        <p className="break-all font-mono text-xs text-gray-700">{qrUrl}</p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              링크 복사
            </>
          )}
        </Button>
        <Button
          className="flex-1 gap-2 bg-primary hover:bg-primary/90"
          onClick={handleDownload}
          disabled={!qrDataUrl}
        >
          <Download className="h-4 w-4" />
          PNG 다운로드
        </Button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
