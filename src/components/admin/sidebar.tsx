"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  Star,
  Tag,
  Image as ImageIcon,
} from "lucide-react";

const menuItems = [
  {
    href: "/admin",
    label: "대시보드",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/banners",
    label: "배너 관리",
    icon: ImageIcon,
  },
  {
    href: "/admin/campaigns",
    label: "캠페인 관리",
    icon: Megaphone,
  },
  {
    href: "/admin/categories",
    label: "카테고리 관리",
    icon: Tag,
  },
  {
    href: "/admin/applications",
    label: "신청 관리",
    icon: FileText,
  },
  {
    href: "/admin/users",
    label: "회원 관리",
    icon: Users,
  },
  {
    href: "/admin/reviews",
    label: "후기 관리",
    icon: Star,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-60 border-r bg-white">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <NextImage
            src="/logo.png"
            alt="Tianxia"
            width={100}
            height={30}
            className="h-6 w-auto"
          />
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            관리자
          </span>
        </Link>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
