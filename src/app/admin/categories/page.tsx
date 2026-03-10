"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star, GripVertical, X, Check } from "lucide-react";
import type { Category } from "@/types/database";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name_ko: "",
    name_zh: "",
    icon: "",
    is_featured: false,
  });
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "오류",
        description: "카테고리를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!formData.name_ko || !formData.name_zh) {
      toast({
        title: "오류",
        description: "한국어 이름과 중국어 이름은 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    const maxOrder = Math.max(...categories.map((c) => c.display_order), 0);

    const { error } = await supabase.from("categories").insert({
      name_ko: formData.name_ko,
      name_zh: formData.name_zh,
      icon: formData.icon || null,
      is_featured: formData.is_featured,
      display_order: maxOrder + 1,
    });

    if (error) {
      toast({
        title: "오류",
        description: "카테고리 추가에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "카테고리가 추가되었습니다." });
      setFormData({ name_ko: "", name_zh: "", icon: "", is_featured: false });
      setShowAddForm(false);
      fetchCategories();
    }
  };

  const handleUpdate = async (category: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({
        name_ko: formData.name_ko,
        name_zh: formData.name_zh,
        icon: formData.icon || null,
        is_featured: formData.is_featured,
      })
      .eq("id", category.id);

    if (error) {
      toast({
        title: "오류",
        description: "카테고리 수정에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "카테고리가 수정되었습니다." });
      setEditingId(null);
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 카테고리를 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "오류",
        description: "카테고리 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "카테고리가 삭제되었습니다." });
      fetchCategories();
    }
  };

  const toggleFeatured = async (category: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_featured: !category.is_featured })
      .eq("id", category.id);

    if (error) {
      toast({
        title: "오류",
        description: "메인 표시 설정 변경에 실패했습니다.",
        variant: "destructive",
      });
    } else {
      fetchCategories();
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name_ko: category.name_ko,
      name_zh: category.name_zh,
      icon: category.icon || "",
      is_featured: category.is_featured,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name_ko: "", name_zh: "", icon: "", is_featured: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
      </div>
    );
  }

  const featuredCount = categories.filter((c) => c.is_featured).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-gray-500">
            총 {categories.length}개 · 메인 표시 {featuredCount}개
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          카테고리 추가
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 카테고리 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>아이콘 (이모지)</Label>
                <Input
                  placeholder="🍽️"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>
              <div>
                <Label>한국어 이름 *</Label>
                <Input
                  placeholder="레스토랑"
                  value={formData.name_ko}
                  onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                />
              </div>
              <div>
                <Label>중국어 이름 *</Label>
                <Input
                  placeholder="餐廳"
                  value={formData.name_zh}
                  onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">메인에 표시</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>추가</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name_ko: "", name_zh: "", icon: "", is_featured: false });
                }}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-4 p-4">
                <GripVertical className="h-5 w-5 cursor-grab text-gray-400" />
                
                {editingId === category.id ? (
                  <>
                    <Input
                      className="w-16"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="이모지"
                    />
                    <Input
                      className="w-32"
                      value={formData.name_ko}
                      onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                    />
                    <Input
                      className="w-32"
                      value={formData.name_zh}
                      onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                    />
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(category)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{category.icon || "📦"}</span>
                    <div className="flex-1">
                      <p className="font-medium">{category.name_ko}</p>
                      <p className="text-sm text-gray-500">{category.name_zh}</p>
                    </div>
                    <button
                      onClick={() => toggleFeatured(category)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                        category.is_featured
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${category.is_featured ? "fill-current" : ""}`} />
                      {category.is_featured ? "메인 표시" : "숨김"}
                    </button>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
