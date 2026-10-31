// ==============================================================================
// Supabase Client & Authentication Adapter
// Supports Cloud Synchronization, Auth (Email & OAuth), and graceful Local-First fallback
// ==============================================================================

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Checks if Supabase credentials are valid and configured (not placeholder / empty)
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes("your-project.supabase.co")) return false;
  if (supabaseAnonKey.includes("your_supabase_anon_key_here")) return false;
  return true;
}

// Lazy/Conditional client initialization to prevent runtime crash when keys are unset
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Helper to fetch current logged-in user (or null)
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Signs in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình trong .env.local");
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Signs up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình trong .env.local");
  return await supabase.auth.signUp({ email, password });
}

/**
 * Signs in with third-party OAuth provider (Google, GitHub)
 */
export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình trong .env.local");
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

/**
 * Signs out current user
 */
export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  return await supabase.auth.signOut();
}

