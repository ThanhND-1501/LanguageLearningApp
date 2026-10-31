"use client";

import { useState, useEffect } from "react";
import {
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOut,
  getSessionUser,
} from "@/lib/supabase";
import { syncAll, SyncResult } from "@/lib/sync";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Mail,
  Lock,
  LogOut,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Database,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

interface AuthModalProps {
  onClose: () => void;
  onSyncComplete?: () => void;
}

export function AuthModal({ onClose, onSyncComplete }: AuthModalProps) {
  const isConfigured = isSupabaseConfigured();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "sync">("sync");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncResult | null>(null);

  useEffect(() => {
    if (isConfigured) {
      getSessionUser().then((user) => {
        setCurrentUser(user);
        if (user) setActiveTab("sync");
        else setActiveTab("signin");
      });
    }
  }, [isConfigured]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (activeTab === "signin") {
        const { data, error } = await signInWithEmail(email, password);
        if (error) throw error;
        setCurrentUser(data.user);
        setSuccessMsg("Đăng nhập thành công!");
        setActiveTab("sync");
      } else {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setCurrentUser(data.user);
        setSuccessMsg("Tài khoản đã tạo thành công! Kiểm tra email để xác nhận.");
        setActiveTab("sync");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Xác thực thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await signInWithOAuth(provider);
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối với dịch vụ OAuth");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setCurrentUser(null);
      setSuccessMsg("Đã đăng xuất tài khoản.");
      setActiveTab("signin");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể đăng xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await syncAll();
    setSyncStats(result);

    if (result.success) {
      setSuccessMsg(result.message);
      if (onSyncComplete) onSyncComplete();
    } else {
      setErrorMsg(result.message || "Lỗi đồng bộ dữ liệu");
    }
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center dark:bg-brand-950/60 dark:text-brand-300">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Tài Khoản & Đồng Bộ Đám Mây
            </h3>
            <p className="text-xs text-slate-500">
              {isConfigured
                ? "Lưu trữ đa thiết bị qua Supabase PostgreSQL"
                : "Chế độ Local-First (Bộ nhớ trình duyệt)"}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Supabase unconfigured notification */}
        {!isConfigured && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 mb-6">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Database className="h-4 w-4 text-amber-600" />
              <span>Dự án đang chạy Local-First độc lập</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Mọi dữ liệu học tập và thẻ từ vựng vẫn được lưu an toàn 100% trên LocalStorage máy tính của bạn với tốc độ 0ms.
            </p>
            <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
              💡 Để đồng bộ đám mây: Thêm <code className="bg-white/80 px-1 py-0.5 rounded text-amber-800 dark:bg-slate-800 dark:text-amber-300">NEXT_PUBLIC_SUPABASE_URL</code> và <code className="bg-white/80 px-1 py-0.5 rounded text-amber-800 dark:bg-slate-800 dark:text-amber-300">ANON_KEY</code> vào file <code className="font-mono">.env.local</code>.
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 dark:text-slate-300">Kho từ vựng cá nhân:</span>
              <a
                href="/login"
                onClick={onClose}
                className="inline-flex items-center gap-1 font-bold text-xs text-brand-600 hover:text-brand-700 dark:text-brand-300 underline"
              >
                <span>Màn hình Đăng nhập & Tạo tài khoản &rarr;</span>
              </a>
            </div>
          </div>
        )}

        {/* Authenticated State */}
        {currentUser ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Đang đăng nhập:</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {currentUser.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>

            {/* Cloud Sync Action */}
            <div className="space-y-3">
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Đang đồng bộ hai chiều..." : "Đồng bộ hai chiều với Supabase Cloud"}</span>
              </button>

              {syncStats && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-white">Chi tiết đồng bộ:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside text-slate-500">
                    {syncStats.pulledDecks !== undefined && (
                      <li>Tải về: {syncStats.pulledDecks} bộ từ, {syncStats.pulledCards} thẻ</li>
                    )}
                    {syncStats.pushedDecks !== undefined && (
                      <li>Đẩy lên: {syncStats.pushedDecks} bộ từ, {syncStats.pushedCards} thẻ</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          isConfigured && (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "signin"
                      ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "signup"
                      ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Đăng ký tài khoản
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Email:
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Mật khẩu:
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading
                    ? "Đang xử lý..."
                    : activeTab === "signin"
                    ? "Đăng nhập"
                    : "Đăng ký tài khoản mới"}
                </button>
              </form>

              {/* OAuth Providers */}
              <div className="pt-2">
                <div className="relative flex items-center justify-center my-3">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="bg-white px-2 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900 absolute">
                    Hoặc đăng nhập với
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>GitHub</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
