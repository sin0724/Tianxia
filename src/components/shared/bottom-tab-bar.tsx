"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  user: { id: string; email: string } | null;
  actionCount?: number;
}

export function BottomTabBar({ user, actionCount = 0 }: BottomTabBarProps) {
  const pathname = usePathname();

  const tabs = user
    ? [
        {
          href: "/",
          label: "首頁",
          icon: Home,
          isActive: (p: string) => p === "/",
          badge: false,
        },
        {
          href: "/campaigns",
          label: "體驗活動",
          icon: Compass,
          isActive: (p: string) => p.startsWith("/campaigns"),
          badge: false,
        },
        {
          href: "/mypage/applications",
          label: "我的申請",
          icon: ClipboardList,
          isActive: (p: string) => p.startsWith("/mypage/applications"),
          badge: true,
        },
        {
          href: "/mypage",
          label: "我的",
          icon: User,
          isActive: (p: string) =>
            p === "/mypage" ||
            (p.startsWith("/mypage") && !p.startsWith("/mypage/applications")),
          badge: false,
        },
      ]
    : [
        {
          href: "/",
          label: "首頁",
          icon: Home,
          isActive: (p: string) => p === "/",
          badge: false,
        },
        {
          href: "/campaigns",
          label: "體驗活動",
          icon: Compass,
          isActive: (p: string) => p.startsWith("/campaigns"),
          badge: false,
        },
        {
          href: "/login",
          label: "登入",
          icon: User,
          isActive: (p: string) =>
            p.startsWith("/login") || p.startsWith("/signup"),
          badge: false,
        },
      ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive(pathname);
          const showBadge = tab.badge && actionCount > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white">
                    {actionCount > 9 ? "9+" : actionCount}
                  </span>
                )}
              </div>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
