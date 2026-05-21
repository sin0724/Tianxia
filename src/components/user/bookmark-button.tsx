"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function bookmarkKey(userId: string) {
  return `bookmarks_${userId}`;
}

export function getBookmarks(userId: string | null): string[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    return JSON.parse(localStorage.getItem(bookmarkKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(userId: string, ids: string[]) {
  localStorage.setItem(bookmarkKey(userId), JSON.stringify(ids));
  window.dispatchEvent(new Event("bookmarks-changed"));
}

interface BookmarkButtonProps {
  campaignId: string;
  className?: string;
}

export function BookmarkButton({ campaignId, className = "" }: BookmarkButtonProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setIsBookmarked(getBookmarks(uid).includes(campaignId));
    });

    const handler = () => {
      supabase.auth.getUser().then(({ data }) => {
        const uid = data.user?.id ?? null;
        setIsBookmarked(getBookmarks(uid).includes(campaignId));
      });
    };
    window.addEventListener("bookmarks-changed", handler);
    return () => window.removeEventListener("bookmarks-changed", handler);
  }, [campaignId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push("/login");
      return;
    }

    const current = getBookmarks(userId);
    const next = current.includes(campaignId)
      ? current.filter((id) => id !== campaignId)
      : [...current, campaignId];
    saveBookmarks(userId, next);
    setIsBookmarked(next.includes(campaignId));
  };

  return (
    <button
      onClick={toggle}
      aria-label={isBookmarked ? "取消收藏" : "收藏活動"}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        isBookmarked
          ? "bg-red-500 text-white shadow-md"
          : "bg-white/80 text-gray-400 backdrop-blur-sm hover:bg-white hover:text-red-400"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
    </button>
  );
}
