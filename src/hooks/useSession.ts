"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getActiveUser, syncSupabaseSessionToLocalUser } from "@/lib/auth";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { UserProfile } from "@/types";

/**
 * Resolves the active learner: Supabase session first when configured,
 * otherwise the local-first account. Re-checks on route change.
 */
export function useSession() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const done = (u: UserProfile | null) => {
      if (!alive) return;
      setUser(u);
      setLoading(false);
    };

    if (isSupabaseConfigured()) {
      getSessionUser()
        .then((sb) => done(sb && sb.email ? syncSupabaseSessionToLocalUser(sb) : getActiveUser()))
        .catch(() => done(getActiveUser()));
    } else {
      done(getActiveUser());
    }
    return () => {
      alive = false;
    };
  }, [pathname]);

  return { user, loading, setUser };
}
