import { CampaignForm } from "../campaign-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">새 캠페인</h2>
        <p className="text-muted-foreground">
          한국어로 캠페인을 작성하면 자동으로 번체 중국어로 번역됩니다
        </p>
      </div>

      <CampaignForm />
    </div>
  );
}
