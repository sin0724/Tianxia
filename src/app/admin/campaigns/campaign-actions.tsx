"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, CalendarPlus, Pencil } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  title_ko: string;
  application_deadline: string;
}

interface CampaignActionsProps {
  campaign: Campaign;
}

export function CampaignActions({ campaign }: CampaignActionsProps) {
  const router = useRouter();
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState(campaign.application_deadline);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말 이 캠페인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaign.id);

    if (error) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setShowDeleteModal(false);
  };

  const handleExtend = async () => {
    if (!newDeadline) {
      alert("새로운 마감일을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const deadlineDate = new Date(newDeadline);
    const experienceDate = new Date(deadlineDate);
    experienceDate.setDate(experienceDate.getDate() + 1);

    const reviewDeadline = new Date(deadlineDate);
    reviewDeadline.setMonth(reviewDeadline.getMonth() + 1);

    const { error } = await supabase
      .from("campaigns")
      .update({
        application_deadline: newDeadline,
        experience_date: experienceDate.toISOString().split("T")[0],
        review_deadline: reviewDeadline.toISOString().split("T")[0],
        status: "active",
      })
      .eq("id", campaign.id);

    if (error) {
      alert("연장 중 오류가 발생했습니다: " + error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setShowExtendModal(false);
    setIsLoading(false);
    alert("모집 기간이 연장되었습니다.");
  };

  return (
    <>
      <div className="flex gap-2">
        <Link href={`/admin/campaigns/${campaign.id}`}>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
            <Pencil className="h-4 w-4" />
            수정
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-lg text-blue-600 hover:text-blue-700"
          onClick={() => setShowExtendModal(true)}
        >
          <CalendarPlus className="h-4 w-4" />
          연장
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

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">모집 기간 연장</h3>
            <p className="mb-4 text-sm text-gray-600">
              캠페인: <span className="font-medium">{campaign.title_ko}</span>
            </p>

            <div className="mb-4 space-y-2">
              <Label htmlFor="newDeadline">새 신청 마감일</Label>
              <Input
                id="newDeadline"
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {newDeadline && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm">
                <p className="mb-2 font-medium text-gray-700">자동 설정되는 날짜:</p>
                <div className="space-y-1 text-gray-600">
                  <p>
                    • 체험 날짜:{" "}
                    <span className="font-medium">
                      {new Date(new Date(newDeadline).setDate(new Date(newDeadline).getDate() + 1))
                        .toISOString()
                        .split("T")[0]}
                    </span>
                  </p>
                  <p>
                    • 후기 마감일:{" "}
                    <span className="font-medium">
                      {(() => {
                        const d = new Date(newDeadline);
                        d.setMonth(d.getMonth() + 1);
                        return d.toISOString().split("T")[0];
                      })()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExtendModal(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleExtend}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "처리 중..." : "연장하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
