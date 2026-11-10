"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  getActiveUser,
  loginUser,
  registerUser,
  logoutUser,
  loginDemoUser,
  syncSupabaseSessionToLocalUser,
} from "@/lib/auth";
import { isSupabaseConfigured, signInWithOAuth, getSessionUser } from "@/lib/supabase";
import { TargetProficiencyLevel, UserProfile } from "@/types";
import { buttonClass } from "@/components/ui/button";
import { ReadingLearner } from "@/components/illustrations";
import { cn } from "@/lib/utils";

const LEVELS: { value: TargetProficiencyLevel; label: string }[] = [
  { value: "B1", label: "B1 · Giao tiếp hằng ngày" },
  { value: "IELTS 6.5", label: "IELTS 6.5 · Trung cấp trên (B2)" },
  { value: "IELTS 7.5+", label: "IELTS 7.5+ · Nâng cao (C1)" },
  { value: "TOEIC 800+", label: "TOEIC 800+ · Môi trường công sở" },
  { value: "C2", label: "C2 · Gần như bản xứ" },
];

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [targetLevel, setTargetLevel] = useState<TargetProficiencyLevel>("IELTS 7.5+");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCloudAvailable = isSupabaseConfigured();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");

    if (isSupabaseConfigured()) {
      getSessionUser()
        .then((sbUser) => setCurrentUser(sbUser ? syncSupabaseSessionToLocalUser(sbUser) : null))
        .finally(() => setChecking(false));
    } else {
      setCurrentUser(getActiveUser());
      setChecking(false);
    }
  }, []);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const user =
        mode === "signin"
          ? await loginUser(email, password)
          : await registerUser(name, email, password, targetLevel);
      setSuccessMessage(mode === "signin" ? `Chào mừng trở lại, ${user.name}.` : `Đã tạo tài khoản. Chào ${user.name}!`);
      setTimeout(() => router.push("/home"), 600);
    } catch (err: any) {
      setErrorMessage(err.message || "Không đăng nhập được. Kiểm tra lại email và mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      await signInWithOAuth(provider);
    } catch (err: any) {
      setErrorMessage(err.message || "Không kết nối được dịch vụ đăng nhập. Thử lại sau.");
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemoUser();
    router.push("/home");
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSuccessMessage("Bạn đã đăng xuất.");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1180px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
      <div className="mx-auto w-full max-w-[420px]">
        {checking ? (
          <div className="flex justify-center py-20" role="status" aria-label="Đang kiểm tra phiên đăng nhập">
            <Loader2 className="h-6 w-6 animate-spin text-mute" />
          </div>
        ) : currentUser ? (
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary-ink">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="mt-5 text-[28px] font-bold tracking-tight">Bạn đang đăng nhập</h1>
            <p className="mt-1.5 text-ink-2">
              {currentUser.name} · {currentUser.email}
            </p>
            <div className="mt-7 flex flex-col gap-2.5">
              <Link href="/home" className={buttonClass("primary", "md")}>Vào trang học</Link>
              <button type="button" onClick={handleLogout} className={buttonClass("secondary", "md")}>
                Đăng xuất để dùng tài khoản khác
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight">
              {mode === "signin" ? "Chào mừng trở lại" : "Tạo tài khoản LingoPulse"}
            </h1>
            <p className="mt-2 text-ink-2">
              {mode === "signin"
                ? "Đăng nhập để tiếp tục ôn những thẻ đến hạn hôm nay."
                : "Tài khoản mới bắt đầu trống. Bạn tự chọn bộ từ để học."}
            </p>

            <div role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký" className="mt-7 grid grid-cols-2 rounded-xl bg-subtle p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-semibold transition-colors",
                    mode === m ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink"
                  )}
                >
                  {m === "signin" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="label">Tên của bạn</label>
                  <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Nguyễn Minh Anh" />
                </div>
              )}
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="ban@email.com" />
              </div>
              <div>
                <label htmlFor="password" className="label">Mật khẩu</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="field pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-mute hover:bg-subtle hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && <p className="mt-1.5 text-[13px] text-mute">Ít nhất 6 ký tự.</p>}
              </div>
              {mode === "signup" && (
                <div>
                  <label htmlFor="level" className="label">Mục tiêu của bạn</label>
                  <select id="level" className="field appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d6684' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} value={targetLevel} onChange={(e) => setTargetLevel(e.target.value as TargetProficiencyLevel)}>
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {errorMessage && (
                <p role="alert" className="flex items-start gap-2 rounded-[10px] bg-poor-soft px-3.5 py-3 text-sm text-poor">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p role="status" className="flex items-start gap-2 rounded-[10px] bg-good-soft px-3.5 py-3 text-sm text-good">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {successMessage}
                </p>
              )}

              <button type="submit" disabled={isLoading} className={buttonClass("primary", "md", "w-full")}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            </form>

            {isCloudAvailable && (
              <>
                <div className="my-6 flex items-center gap-3 text-[13px] text-mute">
                  <span className="h-px flex-1 bg-line" />
                  hoặc tiếp tục với
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" disabled={isLoading} onClick={() => handleOAuthLogin("google")} className={buttonClass("secondary", "md")}>Google</button>
                  <button type="button" disabled={isLoading} onClick={() => handleOAuthLogin("github")} className={buttonClass("secondary", "md")}>GitHub</button>
                </div>
              </>
            )}

            <div className="mt-7 rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
              Chỉ muốn xem thử?{" "}
              <button type="button" onClick={handleDemo} className="font-semibold text-primary-ink hover:underline">
                Vào tài khoản demo
              </button>{" "}
              có sẵn bộ từ và tiến độ mẫu.
            </div>
          </div>
        )}
      </div>

      <div className="hidden h-[min(640px,80vh)] flex-col justify-between rounded-3xl bg-primary-soft p-12 lg:flex">
        <ReadingLearner className="mx-auto mt-6 h-auto w-[320px]" />
        <div>
          <p className="text-2xl font-bold leading-snug tracking-tight">
            Ôn vài phút mỗi ngày.
            <br />
            Nói được nhiều hơn mỗi tuần.
          </p>
          <p className="mt-2 text-ink-2">Dữ liệu học lưu ngay trên máy của bạn, học được cả khi không có mạng.</p>
        </div>
      </div>
    </div>
  );
}
