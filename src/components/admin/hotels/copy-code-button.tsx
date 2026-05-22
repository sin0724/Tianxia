"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 shrink-0"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">복사됨</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          복사
        </>
      )}
    </Button>
  );
}
