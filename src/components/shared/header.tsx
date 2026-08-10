"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
  } | null;
  actionCount?: number;
}

export function Header({ user, actionCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/campaigns", label: "體驗活動" },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/티엔샤로고.png"
            alt="Tianxia"
            width={152}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              pathname === "/"
                ? "bg-primary/10 text-primary"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            <Home className="h-3.5 w-3.5" />
            首頁
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative gap-2 rounded-full px-4">
                  <User className="h-4 w-4" />
                  我的帳戶
                  {actionCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {actionCount > 9 ? "9+" : actionCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    個人資料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mypage/applications" className="cursor-pointer justify-between">
                    我的申請
                    {actionCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                        {actionCount > 9 ? "9+" : actionCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  登入
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
                  註冊
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: show login button only for unauthenticated users (bottom tab bar handles authenticated nav) */}
        {!user && (
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-sm font-medium text-gray-600">
                登入
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full px-4 bg-primary text-xs">
                註冊
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
