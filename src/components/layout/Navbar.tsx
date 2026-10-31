"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  Mic,
  MessageSquare,
  Layers,
  Flame,
  Cloud,
  CheckCircle2,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { AuthModal } from "@/components/auth/AuthModal";
import { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isCloudConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (isCloudConfigured) {
      getSessionUser().then((user) => setCurrentUser(user));
    }
  }, [isCloudConfigured]);

  const navItems = [
    { href: "/", label: "Tổng quan", icon: Layers },
    { href: "/decks", label: "Bộ từ vựng", icon: BookOpen },
    { href: "/speaking", label: "Luyện phản xạ nói", icon: Mic },
    { href: "/conversation", label: "Hội thoại AI", icon: MessageSquare },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <span>
                LingoPulse{" "}
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  AI
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Cloud Sync & Auth Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                currentUser
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : isCloudConfigured
                  ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}
              title={
                currentUser
                  ? `Đã đồng bộ với tài khoản: ${currentUser.email}`
                  : isCloudConfigured
                  ? "Đăng nhập để đồng bộ Supabase Cloud"
                  : "Chế độ lưu cục bộ Local-First (Bấm để xem hướng dẫn Supabase)"
              }
            >
              {currentUser ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.email}</span>
                  <span className="sm:hidden">Đồng bộ</span>
                </>
              ) : isCloudConfigured ? (
                <>
                  <Cloud className="h-3.5 w-3.5 text-brand-600" />
                  <span>Đồng bộ Cloud</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3.5 w-3.5 text-slate-500" />
                  <span>Local-First</span>
                </>
              )}
            </button>

            {/* Study streak badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>7 ngày</span>
            </div>

            <Link
              href="/study/deck-ielts-mastery"
              className="hidden lg:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-sm transition-colors"
            >
              Ôn tập hôm nay
            </Link>
          </div>
        </div>
      </header>

      {/* Auth & Sync Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSyncComplete={() => {
            getSessionUser().then((user) => setCurrentUser(user));
          }}
        />
      )}
    </>
  );
}
