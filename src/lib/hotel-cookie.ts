// 클라이언트 컴포넌트에서 호텔 유입 쿠키를 읽는 유틸리티

export interface HotelCookieData {
  hotelCode: string | null;
  hotelPartnerId: string | null;
}

export function getHotelCookie(): HotelCookieData {
  if (typeof window === "undefined") {
    return { hotelCode: null, hotelPartnerId: null };
  }

  // sessionStorage is the primary source (set from URL params by HotelRefTracker)
  // cookies are the fallback
  const fromStorage = (key: string): string | null => {
    try {
      return sessionStorage.getItem(key) || null;
    } catch {
      return null;
    }
  };

  const fromCookie = (name: string): string | null => {
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  };

  return {
    hotelCode: fromStorage("_hc") ?? fromCookie("_hc"),
    hotelPartnerId: fromStorage("_hid") ?? fromCookie("_hid"),
  };
}

export function clearHotelCookie(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("_hc");
    sessionStorage.removeItem("_hid");
  } catch { /* ignore */ }
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `_hc=; ${expired}`;
  document.cookie = `_hid=; ${expired}`;
}
