"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BookOpen, Home, Mic, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonClass } from "@/components/ui/button";

const APP_NAV = [
  { href: "/home", label: "Hôm nay", icon: Home },
  { href: "/decks", label: "Thư viện", icon: BookOpen },
  { href: "/speaking", label: "Luyện nói", icon: Mic },
  { href: "/conversation", label: "Hội thoại", icon: MessageSquare },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavSearch() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      className="relative ml-auto hidden w-72 lg:block"
      onSubmit={(e) => {
        e.preventDefault();
        const q = ref.current?.value.trim() || "";
        router.push(q ? `/decks?q=${encodeURIComponent(q)}` : "/decks");
      }}
    >
      <label htmlFor="nav-search" className="sr-only">Tìm bộ từ</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
      <input ref={ref} id="nav-search" type="search" placeholder="Tìm bộ từ…" className="field h-10 bg-subtle pl-9 pr-9 text-sm" />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 font-sans text-xs text-mute">/</kbd>
    </form>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useSession();

  // The root route only redirects; keep the bar out of the way.
  if (pathname === "/") return null;

  if (!user) {
    return (
      <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-9 px-5 sm:px-8">
          <Logo href="/welcome" />
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-ink-2 md:flex" aria-label="Giới thiệu">
            <Link href="/welcome#cach-hoc" className="transition-colors hover:text-ink">Cách học</Link>
            <Link href="/decks" className="transition-colors hover:text-ink">Thư viện bộ từ</Link>
            <Link href="/welcome#luyen-noi" className="transition-colors hover:text-ink">Luyện nói</Link>
          </nav>
          <div className={cn("ml-auto flex items-center gap-1.5 transition-opacity sm:gap-2", loading && "opacity-0")}>
            <ThemeToggle />
            <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
              Đăng nhập
            </Link>
            <Link href="/login?mode=signup" className={buttonClass("primary", "sm")}>
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8">
          <Logo href="/home" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Chính">
            {APP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-primary-soft text-primary-ink"
                    : "text-ink-2 hover:bg-subtle hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <NavSearch />
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle />
            <Link
              href="/profile"
              title="Hồ sơ của bạn"
              aria-label={`Hồ sơ của ${user.name}`}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary-ink ring-offset-2 ring-offset-surface transition-shadow hover:ring-2 hover:ring-primary/40",
                isActive(pathname, "/profile") && "ring-2 ring-primary"
              )}
            >
              {initial}
            </Link>
          </div>
        </div>
      </header>

      {/* Phone: thumb-reachable tab bar */}
      <nav
        aria-label="Chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="grid grid-cols-4">
          {APP_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11.5px] font-medium",
                  active ? "text-primary-ink" : "text-mute"
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
