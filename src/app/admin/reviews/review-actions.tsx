"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface ReviewActionsProps {
  reviewId: string;
  applicationId: string | null;
}

export function ReviewActions({ reviewId, applicationId }: ReviewActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  const approveReview = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("reviews")
      .update({ status: "approved", admin_feedback: null })
      .eq("id", reviewId);

    if (error) {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // 후기 승인 = 협업 완료 → 신청 상태도 completed로 동기화
    if (applicationId) {
      const { error: appError } = await supabase
        .from("applications")
        .update({
          status: "completed",
          visit_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (appError) {
        toast({
          title: "후기는 승인됐으나 신청 완료처리 실패",
          description: appError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        router.refresh();
        return;
      }
    }

    toast({ title: "승인 완료", description: "후기 승인 및 신청 완료처리 되었습니다" });
    router.refresh();
    setIsLoading(false);
  };

  const rejectReview = async () => {
    const reason = feedback.trim();
    if (!reason) {
      toast({ title: "반려 사유를 입력해주세요", description: "유저에게 그대로 표시됩니다", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("reviews")
      .update({ status: "rejected", admin_feedback: reason })
      .eq("id", reviewId);

    if (error) {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({
      title: "반려 완료",
      description: "유저가 사유를 확인하고 수정 후 재제출할 수 있습니다",
    });
    router.refresh();
    setIsLoading(false);
  };

  if (showRejectForm) {
    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-700">후기 반려 — 수정 요청 사항</p>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="예: 매장 외관 사진이 누락되었습니다. 외관 사진을 추가해서 다시 올려주세요. (유저에게 그대로 표시됩니다)"
          rows={3}
          className="bg-white text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={rejectReview}
            disabled={isLoading || !feedback.trim()}
            className="gap-1.5"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <X className="h-3.5 w-3.5" />}
            반려 및 수정 요청
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRejectForm(false)}
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={approveReview} disabled={isLoading} className="gap-2">
        {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
        후기 승인 & 완료처리
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowRejectForm(true)}
        disabled={isLoading}
        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <X className="h-4 w-4" />
        반려 (수정 요청)
      </Button>
    </div>
  );
}
