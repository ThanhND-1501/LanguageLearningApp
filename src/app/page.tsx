"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveUser, syncSupabaseSessionToLocalUser } from "@/lib/auth";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { LogoMark } from "@/components/ui/Logo";

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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4" role="status">
      <LogoMark className="h-11 w-11 rounded-xl animate-pulse [&_svg]:h-5 [&_svg]:w-5" />
      <span className="text-sm text-mute">Đang mở LingoPulse…</span>
    </div>
  );
}
