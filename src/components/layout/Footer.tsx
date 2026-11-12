"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";

const HIDDEN_ON = ["/", "/login"];

export function Footer() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname) || pathname.startsWith("/study")) return null;

  return (
    <footer className="mt-16 hidden border-t border-line md:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-8 py-7 text-sm text-mute">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-6 w-6 rounded-md [&_svg]:h-3 [&_svg]:w-3" />
          <span>© {new Date().getFullYear()} LingoPulse AI</span>
        </div>
        <nav className="flex items-center gap-6" aria-label="Chân trang">
          <Link href="/decks" className="transition-colors hover:text-ink">Thư viện bộ từ</Link>
          <Link href="/speaking" className="transition-colors hover:text-ink">Luyện nói</Link>
          <Link href="/conversation" className="transition-colors hover:text-ink">Hội thoại</Link>
        </nav>
      </div>
    </footer>
  );
}
