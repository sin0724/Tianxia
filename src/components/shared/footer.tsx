import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Tianxia"
              width={120}
              height={35}
              className="h-7 w-auto opacity-80"
            />
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-400">體驗型活動招募平台</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/campaigns" className="hover:text-primary transition-colors">
              體驗活動
            </Link>
            <Link href="/mypage" className="hover:text-primary transition-colors">
              我的帳戶
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-50 pt-5 text-center text-xs text-gray-300">
          © {new Date().getFullYear()} TIANXIA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
