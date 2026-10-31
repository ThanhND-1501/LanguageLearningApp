"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Brain,
  Mic,
  BookOpen,
  Cloud,
  Compass,
} from "lucide-react";
import {
  getActiveUser,
  loginLocalUser,
  registerLocalUser,
  loginDemoUser,
  logoutUser,
} from "@/lib/auth";
import { isSupabaseConfigured, signInWithOAuth } from "@/lib/supabase";
import { TargetProficiencyLevel, UserProfile } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetLevel, setTargetLevel] = useState<TargetProficiencyLevel>("IELTS 7.5+");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCloudAvailable = isSupabaseConfigured();

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === "signin") {
        const user = await loginLocalUser(email, password);
        setCurrentUser(user);
        setSuccessMessage(`Chào mừng bạn trở lại, ${user.name}!`);
        setTimeout(() => router.push("/profile"), 700);
      } else {
        const user = await registerLocalUser(name, email, password, targetLevel);
        setCurrentUser(user);
        setSuccessMessage(`Đăng ký tài khoản thành công! Chào mừng ${user.name}.`);
        setTimeout(() => router.push("/profile"), 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Xác thực không thành công.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    const demo = loginDemoUser();
    setCurrentUser(demo);
    setSuccessMessage(`Đã đăng nhập tài khoản Demo: ${demo.name}!`);
    setTimeout(() => router.push("/profile"), 600);
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      await signInWithOAuth(provider);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối dịch vụ đăng nhập");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSuccessMessage("Đã đăng xuất tài khoản.");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        {/* Left Visual Hero / Highlights */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-800 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">LingoPulse AI</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                Nâng Tầm Vốn Từ & Phản Xạ Nói Bản Xứ
              </h1>
              <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
                Hệ thống học tập cá nhân hóa với thuật toán Spaced Repetition (SM-2) và công nghệ chấm điểm phát âm PronScore.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-indigo-50">
                <Brain className="h-5 w-5 text-indigo-200 shrink-0 mt-0.5" />
                <span>Kho từ vựng cá nhân hóa tự động ghi nhớ tiến độ theo đường cong quên.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-indigo-50">
                <Mic className="h-5 w-5 text-indigo-200 shrink-0 mt-0.5" />
                <span>Chấm điểm phát âm PronScore chuẩn ngữ điệu & trọng âm từng từ.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-indigo-50">
                <BookOpen className="h-5 w-5 text-indigo-200 shrink-0 mt-0.5" />
                <span>Tra từ điển Cambridge tự động hóa kèm audio bản xứ và câu ví dụ.</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/15 flex items-center justify-between text-xs text-indigo-200">
            <span>Local-First & Cloud Ready</span>
            <span className="flex items-center gap-1">
              <Cloud className="h-3.5 w-3.5" />
              <span>Đồng bộ đa thiết bị</span>
            </span>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          {currentUser ? (
            <div className="space-y-6 text-center py-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold text-2xl border border-brand-200 dark:border-brand-800 shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Đang đăng nhập
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {currentUser.name}
                </h2>
                <p className="text-sm text-slate-500">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Mục tiêu: {currentUser.targetLevel}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-sm mx-auto">
                <Link
                  href="/profile"
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all"
                >
                  <Compass className="h-4 w-4" />
                  <span>Vào Trang Hồ Sơ</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header & Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mode === "signin" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}
                  </h2>
                  <span className="text-xs font-medium text-slate-400">Bước 1 / 1</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Lưu trữ từ vựng cá nhân, chuỗi học tập (streak) và lịch sử phát âm.
                </p>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === "signin"
                        ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === "signup"
                        ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Đăng ký tài khoản
                  </button>
                </div>
              </div>

              {/* Feedback Notifications */}
              {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tên của bạn:
                    </label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Địa chỉ Email:
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu:
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mục tiêu trình độ hướng tới:
                    </label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value as TargetProficiencyLevel)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="IELTS 6.5">IELTS 6.5 (B2 Upper-Intermediate)</option>
                      <option value="IELTS 7.5+">IELTS 7.5+ (C1 Advanced Mastery)</option>
                      <option value="TOEIC 800+">TOEIC 800+ (Professional Workplace)</option>
                      <option value="B1">B1 (Intermediate Everyday)</option>
                      <option value="C2">C2 (Proficient / Near-Native)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{isLoading ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Đăng ký ngay"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick 1-Click Demo Account */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 transition-colors shadow-xs"
                >
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Dùng thử 1-Click với Tài khoản Demo (Không cần tạo form)</span>
                </button>

                {isCloudAvailable && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("google")}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center transition-colors"
                    >
                      Google Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("github")}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center transition-colors"
                    >
                      GitHub Cloud
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
