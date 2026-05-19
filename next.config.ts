import type { NextConfig } from "next";

const securityHeaders = [
  // 클릭재킹 방지
  { key: "X-Frame-Options", value: "DENY" },
  // MIME 타입 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
  // XSS 필터 활성화
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // 리퍼러 정보 제한
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 카메라/마이크/위치 접근 차단
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS 강제 (프로덕션에서 유효)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
