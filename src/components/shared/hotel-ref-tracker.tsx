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
        sessionStorage.setItem("_hc", ref);
        sessionStorage.setItem("_hid", rid);
      } catch {
        // sessionStorage unavailable (private browsing edge case)
      }
    }
  }, [searchParams]);

  return null;
}
