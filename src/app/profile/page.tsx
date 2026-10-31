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
} from "lucide-react";
import {
  getActiveUser,
  getUserPersonalStats,
  getUserActivities,
  updateUserProfile,
  logoutUser,
  loginDemoUser,
} from "@/lib/auth";
import { getLocalCards, getLocalDecks } from "@/lib/storage";
import { UserProfile, UserPersonalStats, StudyActivity, TargetProficiencyLevel } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserPersonalStats | null>(null);
  const [activities, setActivities] = useState<StudyActivity[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState<TargetProficiencyLevel>("IELTS 7.5+");
  const [editGoal, setEditGoal] = useState(15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let currentUser = getActiveUser();
    if (!currentUser) {
      // Auto-assign guest/demo profile if not signed in yet
      currentUser = loginDemoUser();
    }
    setUser(currentUser);
    setEditName(currentUser.name);
    setEditLevel(currentUser.targetLevel);
    setEditGoal(currentUser.dailyGoalCards || 15);

    setStats(getUserPersonalStats(currentUser.id));
    setActivities(getUserActivities(currentUser.id));
  }, []);

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
    const cards = getLocalCards();
    const decks = getLocalDecks();
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

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
                  {user.targetLevel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100">{user.email}</p>
              <div className="flex items-center gap-3 pt-1 text-xs text-indigo-200">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Tham gia từ {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <Flame className="h-3.5 w-3.5 fill-amber-300" />
                  <span>Chuỗi {user.streakDays || 1} ngày học liên tục</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur transition-all"
            >
              <Settings className="h-4 w-4" />
              <span>{isEditing ? "Đóng cài đặt" : "Tùy chỉnh mục tiêu"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white text-xs font-semibold transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Cập nhật thông tin cá nhân và mục tiêu học tập thành công!</span>
        </div>
      )}

      {/* Edit Goal / Profile Inline Drawer */}
      {isEditing && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Cài đặt mục tiêu học tập cá nhân
          </h3>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Tên hiển thị:
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Mục tiêu trình độ:
              </label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as TargetProficiencyLevel)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="IELTS 6.5">IELTS 6.5 (B2 Upper-Intermediate)</option>
                <option value="IELTS 7.5+">IELTS 7.5+ (C1 Advanced Mastery)</option>
                <option value="TOEIC 800+">TOEIC 800+ (Business Workplace)</option>
                <option value="B1">B1 (Intermediate Everyday)</option>
                <option value="C2">C2 (Near-Native)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Số từ mục tiêu ôn mỗi ngày:
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={editGoal}
                onChange={(e) => setEditGoal(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Personalized Vocabulary Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Kho từ vựng cá nhân hóa (Personalized Vocabulary Insights)
            </h2>
            <p className="text-xs text-slate-500">
              Phân loại theo thuật toán lặp lại ngắt quãng Spaced Repetition SM-2
            </p>
          </div>
          <button
            onClick={handleExportVocabulary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất kho từ (.json)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng từ vựng</span>
              <BookOpen className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats?.totalWords || 0}
            </p>
            <span className="text-[11px] text-slate-400">Đã lưu trong kho cá nhân</span>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Thành thạo (Mastered)
              </span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-2">
              {stats?.masteredWords || 0}
            </p>
            <span className="text-[11px] text-emerald-600/80">Interval $\ge$ 21 ngày</span>
          </div>

          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Đang củng cố (Learning)
              </span>
              <Brain className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-300 mt-2">
              {stats?.learningWords || 0}
            </p>
            <span className="text-[11px] text-amber-600/80">Đang trong chu kỳ lặp lại</span>
          </div>

          <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                Từ mới (New)
              </span>
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-800 dark:text-indigo-300 mt-2">
              {stats?.newWords || 0}
            </p>
            <span className="text-[11px] text-indigo-600/80">Sẵn sàng học bài đầu tiên</span>
          </div>
        </div>
      </div>

      {/* Retention Rate & PronScore Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Tỷ lệ ghi nhớ dài hạn (Retention Index)
              </span>
            </div>
            <span className="text-sm font-extrabold text-brand-600">
              {stats?.retentionRate || 85}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.retentionRate || 85}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dựa trên tần suất ôn tập lặp lại ngắt quãng SM-2 và số lần bấm `Good` / `Easy` liên tiếp.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Điểm phát âm trung bình (PronScore)
              </span>
            </div>
            <span className="text-sm font-extrabold text-emerald-600">
              {stats?.avgPronScore || 82} / 100
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.avgPronScore || 82}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đánh giá trên 4 tiêu chí Azure AI: Độ chuẩn âm (Accuracy), Độ trôi chảy (Fluency), Độ hoàn thiện (Completeness) và Ngữ điệu (Prosody).
          </p>
        </div>
      </div>

      {/* Activity History Timeline */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Lịch sử hoạt động & tiến độ học tập gần đây
            </h3>
            <p className="text-xs text-slate-500">
              Nhật ký tra từ, luyện nói, lật thẻ flashcard và tương tác với AI
            </p>
          </div>
          <Link
            href="/decks"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Đến bộ từ vựng</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có hoạt động nào được ghi nhận. Hãy bắt đầu ôn tập hoặc tra từ mới!
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center shrink-0 mt-0.5">
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
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {act.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {act.description}
                  </p>
                  {act.metadata?.score && (
                    <span className="mt-1.5 inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
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

