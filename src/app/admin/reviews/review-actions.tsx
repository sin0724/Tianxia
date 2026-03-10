"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface ReviewActionsProps {
  reviewId: string;
}

export function ReviewActions({ reviewId }: ReviewActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const approveReview = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("reviews")
      .update({ status: "approved" })
      .eq("id", reviewId);

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
      title: "승인 완료",
      description: "후기가 승인되었습니다",
    });

    router.refresh();
    setIsLoading(false);
  };

  return (
    <Button onClick={approveReview} disabled={isLoading} className="gap-2">
      {isLoading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
      후기 승인
    </Button>
  );
}
