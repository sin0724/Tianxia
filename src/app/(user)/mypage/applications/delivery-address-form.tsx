"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { PackageOpen } from "lucide-react";

const deliverySchema = z.object({
  recipient_name: z.string().min(1, "必填"),
  country: z.string().min(1, "必填"),
  city_state: z.string().min(1, "必填"),
  zipcode: z.string().min(1, "必填"),
  address: z.string().min(1, "必填"),
  mobile: z.string().min(1, "必填"),
  email: z.string().email("請輸入有效的電子郵件"),
});

type DeliveryInput = z.infer<typeof deliverySchema>;

interface DeliveryAddressFormProps {
  applicationId: string;
  onSuccess: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

export function DeliveryAddressForm({
  applicationId,
  onSuccess,
  defaultName,
  defaultEmail,
}: DeliveryAddressFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryInput>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      recipient_name: defaultName || "",
      email: defaultEmail || "",
      country: "台灣",
    },
  });

  const onSubmit = async (data: DeliveryInput) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("delivery_addresses")
      .upsert(
        { ...data, application_id: applicationId },
        { onConflict: "application_id" }
      );

    if (insertError) {
      toast({ title: "提交失敗", description: insertError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "reservation_submitted", updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (updateError) {
      toast({ title: "狀態更新失敗", description: updateError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "收件資訊已提交" });
    setIsLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
        <PackageOpen className="h-4 w-4" />
        填寫收件資訊
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">姓名 / Name *</Label>
          <Input {...register("recipient_name")} placeholder="王小明" className="bg-white" />
          {errors.recipient_name && <p className="text-xs text-destructive">{errors.recipient_name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">國家 / Country *</Label>
          <Input {...register("country")} placeholder="台灣" className="bg-white" />
          {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">城市、州 / City, State *</Label>
          <Input {...register("city_state")} placeholder="台北市大安區" className="bg-white" />
          {errors.city_state && <p className="text-xs text-destructive">{errors.city_state.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">郵遞區號 / Zipcode *</Label>
          <Input {...register("zipcode")} placeholder="106" className="bg-white" />
          {errors.zipcode && <p className="text-xs text-destructive">{errors.zipcode.message}</p>}
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">地址 / Address *</Label>
          <Input {...register("address")} placeholder="忠孝東路四段1號" className="bg-white" />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">手機號碼 / Mobile No. *</Label>
          <Input {...register("mobile")} placeholder="+886 912 345 678" className="bg-white" />
          {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">電子郵件 / E-mail *</Label>
          <Input {...register("email")} type="email" placeholder="example@email.com" className="bg-white" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="gap-2 w-full sm:w-auto">
        {isLoading ? <LoadingSpinner size="sm" /> : <PackageOpen className="h-4 w-4" />}
        提交收件資訊
      </Button>
    </form>
  );
}
