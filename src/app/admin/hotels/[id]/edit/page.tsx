import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HotelForm } from "@/components/admin/hotels/hotel-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHotelPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from("hotel_partners")
    .select("*")
    .eq("id", id)
    .single();

  if (!hotel) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">호텔 정보 수정</h2>
        <p className="text-muted-foreground">파트너 코드는 등록 후 변경할 수 없습니다.</p>
      </div>
      <HotelForm
        hotel={{
          id: hotel.id,
          name: hotel.name,
          name_en: (hotel as any).name_en ?? null,
          address: hotel.address,
          region: (hotel as any).region ?? null,
          contact_name: hotel.contact_name,
          contact_phone: hotel.contact_phone,
          contact_email: hotel.contact_email,
          partner_code: hotel.partner_code,
          incentive_per_completion: hotel.incentive_per_completion,
          status: hotel.status as "active" | "inactive" | "pending",
          notes: hotel.notes,
        }}
      />
    </div>
  );
}
