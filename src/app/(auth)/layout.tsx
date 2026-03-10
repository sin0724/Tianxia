import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed left-0 right-0 top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
              天
            </div>
            <span className="text-lg font-bold text-gray-900">TIANXIA</span>
          </Link>
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
