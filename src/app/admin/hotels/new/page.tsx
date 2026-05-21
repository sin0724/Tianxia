import { HotelForm } from "@/components/admin/hotels/hotel-form";

export default function NewHotelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">호텔 등록</h2>
        <p className="text-muted-foreground">
          새 제휴 호텔을 등록합니다. 파트너 코드는 자동 생성됩니다.
        </p>
      </div>
      <HotelForm />
    </div>
  );
}
