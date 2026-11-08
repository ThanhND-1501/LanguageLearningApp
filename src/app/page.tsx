"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveUser, syncSupabaseSessionToLocalUser } from "@/lib/auth";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { Sparkles, Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRoute = async () => {
      try {
        if (isSupabaseConfigured()) {
          const sbUser = await getSessionUser();
          if (sbUser && sbUser.email) {
            syncSupabaseSessionToLocalUser(sbUser);
            if (isMounted) router.replace("/home");
            return;
          }
        }

        const localUser = getActiveUser();
        if (localUser) {
          if (isMounted) router.replace("/home");
        } else {
          if (isMounted) router.replace("/welcome");
        }
      } catch (err) {
        if (isMounted) router.replace("/welcome");
      }
    };

    checkAuthAndRoute();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25 animate-pulse">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        <span>Đang khởi động LingoPulse AI...</span>
      </div>
    </div>
  );
}
