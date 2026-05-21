"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function HotelRefTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    const rid = searchParams.get("rid");
    if (ref && rid) {
      try {
        localStorage.setItem("_hc", ref);
        localStorage.setItem("_hid", rid);
      } catch {
        // storage unavailable (private browsing edge case)
      }
    }
  }, [searchParams]);

  return null;
}
