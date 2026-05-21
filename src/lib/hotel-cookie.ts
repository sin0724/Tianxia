// 클라이언트 컴포넌트에서 호텔 유입 쿠키를 읽는 유틸리티

export interface HotelCookieData {
  hotelCode: string | null;
  hotelPartnerId: string | null;
}

export function getHotelCookie(): HotelCookieData {
  if (typeof document === "undefined") {
    return { hotelCode: null, hotelPartnerId: null };
  }

  const parse = (name: string): string | null => {
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  };

  return {
    hotelCode: parse("_hc"),
    hotelPartnerId: parse("_hid"),
  };
}

export function clearHotelCookie(): void {
  if (typeof document === "undefined") return;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `_hc=; ${expired}`;
  document.cookie = `_hid=; ${expired}`;
}
