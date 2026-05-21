"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const BOOKMARK_KEY = "bookmarked_campaigns";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
  } catch {
    return [];
  }
}

function setBookmarks(ids: string[]) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("bookmarks-changed"));
}

interface BookmarkButtonProps {
  campaignId: string;
  className?: string;
}

export function BookmarkButton({ campaignId, className = "" }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setIsBookmarked(getBookmarks().includes(campaignId));

    const handler = () => setIsBookmarked(getBookmarks().includes(campaignId));
    window.addEventListener("bookmarks-changed", handler);
    return () => window.removeEventListener("bookmarks-changed", handler);
  }, [campaignId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = getBookmarks();
    const next = current.includes(campaignId)
      ? current.filter((id) => id !== campaignId)
      : [...current, campaignId];
    setBookmarks(next);
    setIsBookmarked(!current.includes(campaignId));
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
