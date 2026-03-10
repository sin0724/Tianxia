"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name_ko: string;
  icon: string | null;
}

interface CampaignSearchProps {
  categories: Category[];
}

export function CampaignSearch({ categories }: CampaignSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");

  const updateURL = (newSearch: string, newStatus: string, newCategory: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (newCategory && newCategory !== "all") params.set("category", newCategory);
    
    const queryString = params.toString();
    router.push(`/admin/campaigns${queryString ? `?${queryString}` : ""}`);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    updateURL(value, status, category);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateURL(search, value, category);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateURL(search, status, value);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    router.push("/admin/campaigns");
  };

  const hasFilters = search || status !== "all" || category !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="캠페인 제목, 브랜드명 검색..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="상태">
            {status === "all" ? "전체 상태" : 
             status === "active" ? "진행중" : 
             status === "closed" ? "마감" : "임시저장"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="active">진행중</SelectItem>
          <SelectItem value="closed">마감</SelectItem>
          <SelectItem value="draft">임시저장</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="카테고리">
            {category === "all" 
              ? "전체 카테고리" 
              : (() => {
                  const cat = categories.find((c) => c.id === category);
                  return cat ? `${cat.icon || ""} ${cat.name_ko}` : "전체 카테고리";
                })()
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.icon} {cat.name_ko}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1 text-gray-500"
        >
          <X className="h-4 w-4" />
          초기화
        </Button>
      )}
    </div>
  );
}
