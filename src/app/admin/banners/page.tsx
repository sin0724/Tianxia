"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Plus, Trash2, Eye, EyeOff, Upload, GripVertical, ExternalLink } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: "",
    link_url: "",
    image_url: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "오류",
        description: "배너를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "오류",
        description: "파일 크기는 5MB 이하여야 합니다",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드 가능합니다",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(filePath);

      setNewBanner((prev) => ({ ...prev, image_url: urlData.publicUrl }));

      toast({
        title: "업로드 완료",
        description: "이미지가 업로드되었습니다",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다",
        variant: "destructive",
      });
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!newBanner.image_url) {
      toast({
        title: "오류",
        description: "배너 이미지를 업로드해주세요",
        variant: "destructive",
      });
      return;
    }

    const maxOrder = Math.max(...banners.map((b) => b.display_order), 0);

    const { error } = await supabase.from("banners").insert({
      image_url: newBanner.image_url,
      link_url: newBanner.link_url || null,
      title: newBanner.title || null,
      is_active: true,
      display_order: maxOrder + 1,
    });

    if (error) {
      toast({
        title: "오류",
        description: "배너 추가에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "배너가 추가되었습니다." });
      setNewBanner({ title: "", link_url: "", image_url: "" });
      setPreviewUrl("");
      setShowAddForm(false);
      fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 배너를 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      toast({
        title: "오류",
        description: "배너 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "배너가 삭제되었습니다." });
      fetchBanners();
    }
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) {
      toast({
        title: "오류",
        description: "상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      fetchBanners();
    }
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === banners.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

    for (let i = 0; i < newBanners.length; i++) {
      await supabase
        .from("banners")
        .update({ display_order: i })
        .eq("id", newBanners[i].id);
    }

    fetchBanners();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">배너 관리</h1>
          <p className="text-gray-500">
            총 {banners.length}개 · 활성 {activeCount}개
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          배너 추가
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 배너 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <Label>배너 이미지 *</Label>
                <div className="relative h-40 w-72 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="배너 미리보기"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-400">
                      <Upload className="mb-2 h-8 w-8" />
                      <span className="text-sm">이미지 업로드</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  파일 선택
                </Button>
              </div>

              {/* 기타 정보 */}
              <div className="flex-1 space-y-4">
                <div>
                  <Label>배너 제목 (선택)</Label>
                  <Input
                    placeholder="배너 설명 (관리용)"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>링크 URL (선택)</Label>
                  <Input
                    placeholder="https://..."
                    value={newBanner.link_url}
                    onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    클릭 시 이동할 URL (비워두면 클릭 불가)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={uploading || !newBanner.image_url}>
                추가
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewBanner({ title: "", link_url: "", image_url: "" });
                  setPreviewUrl("");
                }}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner List */}
      {banners.length > 0 ? (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id} className={!banner.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveOrder(index, "up")}
                    disabled={index === 0}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <button
                    onClick={() => moveOrder(index, "down")}
                    disabled={index === banners.length - 1}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div className="relative h-24 w-48 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={banner.image_url}
                    alt={banner.title || "배너"}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <p className="font-medium">{banner.title || "(제목 없음)"}</p>
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {banner.link_url.substring(0, 50)}...
                    </a>
                  )}
                  <p className="text-xs text-gray-400">
                    순서: {index + 1}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                      banner.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {banner.is_active ? (
                      <>
                        <Eye className="h-4 w-4" /> 표시중
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" /> 숨김
                      </>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">등록된 배너가 없습니다</p>
            <Button onClick={() => setShowAddForm(true)} className="mt-4">
              첫 배너 추가하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
