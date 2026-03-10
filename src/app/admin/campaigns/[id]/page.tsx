import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignForm } from "../campaign-form";

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">캠페인 수정</h2>
        <p className="text-muted-foreground">
          수정 시 번체 중국어 번역이 다시 생성됩니다
        </p>
      </div>

      <CampaignForm campaign={campaign} />
    </div>
  );
}
