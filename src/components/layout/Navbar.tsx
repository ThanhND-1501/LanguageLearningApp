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
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { getActiveUser, syncSupabaseSessionToLocalUser } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const isCloudConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (isCloudConfigured) {
      getSessionUser().then((user) => {
        setCurrentUser(user);
        if (user && user.email) {
          const synced = syncSupabaseSessionToLocalUser(user);
          setActiveProfile(synced);
        } else {
          setActiveProfile(null);
        }
      });
    } else {
      const localUser = getActiveUser();
      setActiveProfile(localUser);
    }
  }, [isCloudConfigured, pathname]);

  const navItems = activeProfile
    ? [
        { href: "/home", label: "Tổng quan", icon: Layers },
        { href: "/decks", label: "Kho từ vựng", icon: BookOpen },
        { href: "/speaking", label: "Luyện phản xạ nói", icon: Mic },
        { href: "/conversation", label: "Hội thoại AI", icon: MessageSquare },
        { href: "/welcome", label: "Giới thiệu", icon: Sparkles },
      ]
    : [
        { href: "/welcome", label: "Giới thiệu", icon: Sparkles },
        { href: "/decks", label: "Kho từ vựng", icon: BookOpen },
        { href: "/speaking", label: "Luyện phản xạ nói", icon: Mic },
        { href: "/conversation", label: "Hội thoại AI", icon: MessageSquare },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href={activeProfile ? "/home" : "/welcome"}
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white"
            >
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
            {/* Unified User Account / Login */}
            {activeProfile || currentUser ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/60 dark:hover:text-brand-300 transition-colors border border-slate-200 dark:border-slate-700"
                title="Hồ sơ cá nhân & Thống kê"
              >
                <div className="h-6 w-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(activeProfile?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate text-slate-800 dark:text-slate-200">
                  {activeProfile?.name || currentUser?.email}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Study streak badge */}
            {activeProfile && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{activeProfile?.streakDays || 1} ngày</span>
              </div>
            )}

            <Link
              href={activeProfile ? "/home" : "/login"}
              className="hidden lg:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-sm transition-colors"
            >
              {activeProfile ? "Ôn tập hôm nay" : "Bắt đầu học"}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
