"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface ApplicationActionsProps {
  applicationId: string;
  onStatusChange?: () => void;
}

export function ApplicationActions({ applicationId, onStatusChange }: ApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const updateStatus = async (status: "approved" | "rejected") => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("applications")
      .update({
        status,
        admin_note: adminNote || null,
      })
      .eq("id", applicationId);

    if (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: status === "approved" ? "승인 완료" : "반려 완료",
      description:
        status === "approved"
          ? "신청이 승인되었습니다"
          : "신청이 반려되었습니다",
    });

    setIsLoading(false);
    onStatusChange?.();
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="space-y-2">
        <Label htmlFor="admin_note">관리자 메모 (선택)</Label>
        <Input
          id="admin_note"
          placeholder="승인/반려 사유를 입력하세요"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => updateStatus("approved")}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
          승인
        </Button>
        <Button
          variant="destructive"
          onClick={() => updateStatus("rejected")}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <X className="h-4 w-4" />}
          반려
        </Button>
      </div>
    </div>
  );
}
