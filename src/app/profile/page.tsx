"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Flame,
  Award,
  BookOpen,
  Brain,
  Mic,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Download,
  Settings,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  RefreshCw,
  Cloud,
  AlertCircle,
} from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { DeckCard } from "@/components/deck/DeckCard";
import { getLocalCards as loadCards } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { syncAll } from "@/lib/sync";
import {
  getActiveUser,
  getUserPersonalStats,
  getUserActivities,
  updateUserProfile,
  logoutUser,
  syncSupabaseSessionToLocalUser,
} from "@/lib/auth";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { getLocalCards, getLocalDecks } from "@/lib/storage";
import { UserProfile, UserPersonalStats, StudyActivity, TargetProficiencyLevel, Deck } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserPersonalStats | null>(null);
  const [activities, setActivities] = useState<StudyActivity[]>([]);
  const [enrolledDecks, setEnrolledDecks] = useState<Deck[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState<TargetProficiencyLevel>("IELTS 7.5+");
  const [editGoal, setEditGoal] = useState(15);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const allCards = typeof window !== "undefined" && user ? loadCards() : [];

  useEffect(() => {
    const applyUser = (u: UserProfile) => {
      setUser(u);
      setEditName(u.name);
      setEditLevel(u.targetLevel);
      setEditGoal(u.dailyGoalCards || 15);
      setStats(getUserPersonalStats(u.id));
      setActivities(getUserActivities(u.id));
      setEnrolledDecks(getLocalDecks(u.id));
    };

    if (isSupabaseConfigured()) {
      getSessionUser().then((sbUser) => {
        if (sbUser && sbUser.email) {
          const synced = syncSupabaseSessionToLocalUser(sbUser);
          applyUser(synced);
        } else {
          // No active Supabase session -> redirect to unified login page
          router.push("/login");
        }
      });
    } else {
      const currentUser = getActiveUser();
      if (currentUser) {
        applyUser(currentUser);
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updated = await updateUserProfile({
        name: editName.trim(),
        targetLevel: editLevel,
        dailyGoalCards: Number(editGoal),
      });
      setUser(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const handleExportVocabulary = () => {
    const cards = getLocalCards(user?.id);
    const decks = getLocalDecks(user?.id);
    const exportData = {
      user: user?.name,
      email: user?.email,
      exportedAt: new Date().toISOString(),
      decks,
      cards,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lingopulse-vocabulary-${user?.name?.toLowerCase().replace(/\s+/g, "-") || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAll();
      setSyncResult({
        success: res.success,
        message: res.message || (res.success ? "Đồng bộ đám mây thành công!" : "Không thể đồng bộ"),
      });
      if (user) {
        setStats(getUserPersonalStats(user.id));
        setActivities(getUserActivities(user.id));
        setEnrolledDecks(getLocalDecks(user.id));
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || "Lỗi khi kết nối đám mây",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary-ink" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary-ink">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">{user.name}</h1>
            <p className="mt-0.5 text-ink-2">{user.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-mute">
              <span>Mục tiêu {user.targetLevel}</span>
              <span>Tham gia {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
              <span>Chuỗi {user.streakDays || 1} ngày</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button type="button" onClick={() => setIsEditing(!isEditing)} className={buttonClass("secondary", "md")}>
            <Settings className="h-4 w-4" />
            {isEditing ? "Đóng cài đặt" : "Đổi mục tiêu"}
          </button>
          <button type="button" onClick={handleLogout} className={buttonClass("danger", "md")}>
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-good-soft border border-good/25 text-good text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Cập nhật thông tin cá nhân và mục tiêu học tập thành công!</span>
        </div>
      )}

      {/* Edit Goal / Profile Inline Drawer */}
      {isEditing && (
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-sm animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-ink mb-4">
            Cài đặt mục tiêu học tập cá nhân
          </h3>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-2">
                Tên hiển thị:
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-2">
                Mục tiêu trình độ:
              </label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as TargetProficiencyLevel)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="IELTS 6.5">IELTS 6.5 (B2 Upper-Intermediate)</option>
                <option value="IELTS 7.5+">IELTS 7.5+ (C1 Advanced Mastery)</option>
                <option value="TOEIC 800+">TOEIC 800+ (Business Workplace)</option>
                <option value="B1">B1 (Intermediate Everyday)</option>
                <option value="C2">C2 (Near-Native)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-2">
                Số từ mục tiêu ôn mỗi ngày:
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={editGoal}
                onChange={(e) => setEditGoal(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:bg-subtle"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vocabulary figures */}
      <section aria-labelledby="vocab-title">
        <div className="mb-3.5 flex items-end justify-between gap-4">
          <div>
            <h2 id="vocab-title" className="text-lg font-bold tracking-tight">Từ vựng của bạn</h2>
            <p className="text-sm text-mute">Theo trạng thái ghi nhớ của từng thẻ.</p>
          </div>
          <button type="button" onClick={handleExportVocabulary} className={buttonClass("secondary", "sm")}>
            <Download className="h-4 w-4" />
            Xuất từ vựng (JSON)
          </button>
        </div>
        <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-3 lg:grid-cols-6 [&>div]:border-line [&>div]:px-5 [&>div]:py-4 max-lg:[&>div]:border-b lg:divide-x">
          {([
            ["Tổng số từ", stats?.totalWords ?? 0, null],
            ["Đã thuộc", stats?.masteredWords ?? 0, "bg-primary"],
            ["Đang học", stats?.learningWords ?? 0, "bg-primary/45"],
            ["Mới", stats?.newWords ?? 0, "bg-line-strong"],
            ["Tỷ lệ ghi nhớ", `${stats?.retentionRate ?? 0}%`, null],
            ["Phát âm trung bình", stats && stats.avgPronScore > 0 ? `${stats.avgPronScore}/100` : "Chưa có", null],
          ] as const).map(([label, value, dot]) => (
            <div key={label}>
              <dt className="flex items-center gap-1.5 text-[13px] text-mute">
                {dot && <i className={cn("h-2 w-2 rounded-full", dot)} aria-hidden="true" />}
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2.5 text-[13px] text-mute">
          Tỷ lệ ghi nhớ tính từ số thẻ đã thuộc và đang học. Điểm phát âm là trung bình
          {stats?.totalSpeakingAttempts ? ` của ${stats.totalSpeakingAttempts} lần luyện nói` : " các lần luyện nói"}.
        </p>
      </section>

      {/* Decks */}
      <section aria-labelledby="decks-title">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 id="decks-title" className="text-lg font-bold tracking-tight">Bộ từ đang học</h2>
          <Link href="/decks" className="text-sm font-semibold text-primary-ink hover:underline">Xem thư viện</Link>
        </div>
        {enrolledDecks.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong px-5 py-8 text-center text-ink-2">
            Bạn chưa có bộ từ nào.{" "}
            <Link href="/decks" className="font-semibold text-primary-ink hover:underline">Chọn bộ từ trong thư viện</Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} cards={allCards.filter((c) => c.deckId === deck.id)} isEnrolled isLoggedIn />
            ))}
          </div>
        )}
      </section>

      {/* Cloud Sync & Backup Section */}
      <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0 mt-0.5">
              <Cloud className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-ink">
                  Lưu trữ và đồng bộ
                </h3>
                {isSupabaseConfigured() ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-good-soft text-good border border-good/25">
                    <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
                    Đã kết nối đám mây
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-subtle text-ink-2 border border-line">
                    Chỉ lưu trên máy này
                  </span>
                )}
              </div>
              <p className="text-xs text-mute max-w-2xl leading-relaxed">
                Tiến độ ôn, bài luyện nói và bộ từ của bạn luôn được lưu trên máy này. Khi đã kết nối đám mây, bạn có thể đồng bộ để dùng trên thiết bị khác, hoặc xuất bản sao lưu dạng JSON bất cứ lúc nào.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-subtle hover:bg-line text-ink-2 text-xs font-semibold transition-all disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin text-primary-ink")} />
              <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ thủ công"}</span>
            </button>
            <button
              onClick={handleExportVocabulary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line hover:bg-subtle text-xs font-semibold text-ink-2 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất sao lưu (.json)</span>
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl text-xs font-medium border animate-in fade-in duration-200",
              syncResult.success
                ? "bg-good-soft text-good border-good/25"
                : "bg-fair-soft text-fair border-fair/25"
            )}
          >
            {syncResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-good" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-fair" />
            )}
            <span>{syncResult.message}</span>
          </div>
        )}
      </div>

      {/* Activity History Timeline */}
      <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">
              Hoạt động gần đây
            </h3>
            <p className="text-xs text-mute">
              Ôn thẻ, tra từ, luyện nói và hội thoại
            </p>
          </div>
          <Link
            href="/decks"
            className="text-xs font-semibold text-primary-ink hover:text-primary-ink flex items-center gap-1"
          >
            <span>Đến bộ từ vựng</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-mute text-xs">
            Chưa có hoạt động nào được ghi nhận. Hãy bắt đầu ôn tập hoặc tra từ mới!
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-subtle border border-line transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0 mt-0.5">
                  {act.type === "speech_practice" ? (
                    <Mic className="h-4 w-4" />
                  ) : act.type === "cambridge_lookup" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : act.type === "srs_review" ? (
                    <Brain className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink truncate">
                      {act.title}
                    </p>
                    <span className="text-[11px] text-mute shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 mt-0.5">
                    {act.description}
                  </p>
                  {act.metadata?.score && (
                    <span className="mt-1.5 inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-good-soft text-good">
                      PronScore: {act.metadata.score}/100
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

