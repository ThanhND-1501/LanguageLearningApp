// ==============================================================================
// Hybrid Authentication & Personalized Account Management Engine
// Supports Local-First Accounts (zero-config, offline-ready) & Supabase Cloud Auth
// Handles user profiling, activity tracking, personalized statistics & streak tracking
// ==============================================================================

import {
  UserProfile,
  TargetProficiencyLevel,
  StudyActivity,
  UserPersonalStats,
  Card,
  Deck,
} from "@/types";
import { isSupabaseConfigured, getSupabase, signOut as supabaseSignOut } from "./supabase";
import { getLocalCards, getLocalDecks } from "./storage";

const ACCOUNTS_STORAGE_KEY = "lingopulse_accounts_v1";
const ACTIVE_USER_STORAGE_KEY = "lingopulse_active_user_v1";
const ACTIVITIES_STORAGE_KEY = "lingopulse_activities_v1";

interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

/**
 * SHA-256 Password Hashing via Web Crypto API (supported natively in browsers and Node.js)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const DEMO_USER: UserProfile = {
  id: "user-demo-linguist",
  email: "demo@lingopulse.ai",
  name: "Alex Nguyen (Demo)",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  targetLevel: "IELTS 7.5+",
  dailyGoalCards: 15,
  streakDays: 7,
  lastActiveDate: new Date().toISOString().split("T")[0],
  createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  isCloudSynced: false,
};

let memoryAccounts: StoredAccount[] = [];
let memoryActiveUser: UserProfile | null = null;
let memoryActivities: StudyActivity[] = [];

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

/**
 * Resets memory and storage states for clean unit testing
 */
export function clearAuthStorageForTesting(): void {
  memoryAccounts = [];
  memoryActiveUser = null;
  memoryActivities = [];
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(ACCOUNTS_STORAGE_KEY);
      storage.removeItem(ACTIVE_USER_STORAGE_KEY);
      storage.removeItem(ACTIVITIES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

function getStoredAccounts(): StoredAccount[] {
  const storage = getStorage();
  if (!storage) return memoryAccounts;
  try {
    const raw = storage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]): void {
  const storage = getStorage();
  if (!storage) {
    memoryAccounts = accounts;
    return;
  }
  try {
    storage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore
  }
}

/**
 * Retrieves the currently active user profile
 */
export function getActiveUser(): UserProfile | null {
  const storage = getStorage();
  if (!storage) return memoryActiveUser;
  try {
    const raw = storage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;
    const user: UserProfile = JSON.parse(raw);
    return user;
  } catch {
    return null;
  }
}

/**
 * Sets or clears the currently active user profile
 */
export function setActiveUser(user: UserProfile | null): void {
  if (user) {
    // Update streak if active on a new calendar day
    const today = new Date().toISOString().split("T")[0];
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (user.lastActiveDate === yesterday) {
        user.streakDays = (user.streakDays || 0) + 1;
      } else {
        user.streakDays = 1;
      }
      user.lastActiveDate = today;
    }
  }

  const storage = getStorage();
  if (!storage) {
    memoryActiveUser = user;
    return;
  }

  try {
    if (user) {
      storage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      storage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Registers a new local account
 */
export async function registerLocalUser(
  name: string,
  email: string,
  password: string,
  targetLevel: TargetProficiencyLevel = "IELTS 6.5"
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName) throw new Error("Vui lòng nhập tên hiển thị");
  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Địa chỉ email không hợp lệ");
  if (!password || password.length < 6) throw new Error("Mật khẩu phải chứa ít nhất 6 ký tự");

  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email === cleanEmail);
  if (existing) {
    throw new Error("Email này đã được đăng ký trên hệ thống.");
  }

  const passwordHash = await hashPassword(password);
  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: cleanName,
    targetLevel,
    dailyGoalCards: 10,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    isCloudSynced: false,
  };

  accounts.push({
    id: newUser.id,
    email: cleanEmail,
    passwordHash,
    profile: newUser,
  });

  saveStoredAccounts(accounts);
  setActiveUser(newUser);

  recordStudyActivity({
    type: "card_created",
    title: "Khởi tạo tài khoản",
    description: `Chào mừng ${cleanName} gia nhập LingoPulse AI!`,
  }, newUser.id);

  return newUser;
}

/**
 * Signs in with an existing local account
 */
export async function loginLocalUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const accounts = getStoredAccounts();
  const found = accounts.find((a) => a.email === cleanEmail);

  if (!found) {
    throw new Error("Không tìm thấy tài khoản với email này.");
  }

  if (found.passwordHash !== passwordHash) {
    throw new Error("Mật khẩu không chính xác.");
  }

  setActiveUser(found.profile);
  return found.profile;
}

/**
 * Instant 1-click Demo/Guest login for evaluation
 */
export function loginDemoUser(): UserProfile {
  setActiveUser(DEMO_USER);
  return DEMO_USER;
}

/**
 * Logs out the active user and clears active session
 */
export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseSignOut();
    } catch {
      // Ignore
    }
  }
  setActiveUser(null);
}

/**
 * Updates profile settings (name, avatar, target proficiency, daily goal)
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const current = getActiveUser();
  if (!current) throw new Error("Chưa có tài khoản đăng nhập");

  const updated: UserProfile = {
    ...current,
    ...updates,
  };

  setActiveUser(updated);

  // Sync update to stored accounts if local
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === current.id);
  if (index !== -1) {
    accounts[index].profile = updated;
    saveStoredAccounts(accounts);
  }

  return updated;
}

/**
 * Records a study activity event into the user's personal timeline
 */
export function recordStudyActivity(
  activity: Omit<StudyActivity, "id" | "timestamp" | "userId">,
  customUserId?: string
): StudyActivity {
  const activeUser = getActiveUser();
  const userId = customUserId || activeUser?.id || "anonymous-learner";

  const newActivity: StudyActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    metadata: activity.metadata,
    timestamp: new Date().toISOString(),
  };

  const storage = getStorage();
  if (!storage) {
    memoryActivities = [newActivity, ...memoryActivities].slice(0, 100);
    return newActivity;
  }

  try {
    const raw = storage.getItem(ACTIVITIES_STORAGE_KEY);
    const list: StudyActivity[] = raw ? JSON.parse(raw) : [];
    const updated = [newActivity, ...list].slice(0, 100); // Keep last 100 activities
    storage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }

  return newActivity;
}

/**
 * Fetches the recent study activities for a user
 */
export function getUserActivities(userId?: string): StudyActivity[] {
  const storage = getStorage();
  const activeUser = getActiveUser();
  const targetUserId = userId || activeUser?.id;

  if (!storage) {
    if (!targetUserId) return memoryActivities.slice(0, 20);
    return memoryActivities.filter((a) => a.userId === targetUserId).slice(0, 20);
  }

  try {
    const raw = storage.getItem(ACTIVITIES_STORAGE_KEY);
    if (!raw) return [];
    const allActivities: StudyActivity[] = JSON.parse(raw);
    if (!targetUserId) return allActivities.slice(0, 20);
    return allActivities.filter((a) => a.userId === targetUserId).slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Computes personalized learning metrics and vocabulary stats for the user
 */
export function getUserPersonalStats(userId?: string): UserPersonalStats {
  const cards: Card[] = getLocalCards();
  const activities = getUserActivities(userId);

  const totalWords = cards.length;
  const masteredWords = cards.filter((c) => c.status === "mastered").length;
  const learningWords = cards.filter((c) => c.status === "learning").length;
  const newWords = cards.filter((c) => c.status === "new").length;

  const speechActivities = activities.filter((a) => a.type === "speech_practice");
  const totalSpeakingAttempts = speechActivities.length;

  let totalScores = 0;
  let scoredCount = 0;
  for (const act of speechActivities) {
    if (act.metadata?.score && typeof act.metadata.score === "number") {
      totalScores += act.metadata.score;
      scoredCount++;
    }
  }

  const avgPronScore = scoredCount > 0 ? Math.round(totalScores / scoredCount) : 78; // baseline
  const retentionRate = totalWords > 0 ? Math.round(((masteredWords + learningWords * 0.5) / totalWords) * 100) : 0;

  return {
    totalWords,
    masteredWords,
    learningWords,
    newWords,
    totalSpeakingAttempts,
    avgPronScore,
    totalStudyDays: getActiveUser()?.streakDays || 1,
    retentionRate,
  };
}
