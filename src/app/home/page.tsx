"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Mic,
  Brain,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Compass,
  Play,
  Flame,
  Clock,
  MessageSquare,
  Layers,
  GraduationCap,
  Target,
  User,
  Loader2,
  Calendar,
} from "lucide-react";
import { getActiveUser, getUserPersonalStats, getUserActivities, syncSupabaseSessionToLocalUser } from "@/lib/auth";
import { isSupabaseConfigured, getSessionUser } from "@/lib/supabase";
import { UserProfile, Deck, Card, UserPersonalStats, StudyActivity } from "@/types";
import { getLocalDecks, getLocalCards } from "@/lib/storage";
import { DeckCard } from "@/components/deck/DeckCard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { cn } from "@/lib/utils";

export default function HomeDashboardPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [enrolledDecks, setEnrolledDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<UserPersonalStats | null>(null);
  const [activities, setActivities] = useState<StudyActivity[]>([]);

  useEffect(() => {
    const loadUserData = (user: UserProfile | null) => {
      setCurrentUser(user);
      if (user) {
        const localDecks = getLocalDecks(user.id);
        const localCards = getLocalCards();
        setEnrolledDecks(localDecks);
        setCards(localCards);
        setStats(getUserPersonalStats(user.id));
        setActivities(getUserActivities(user.id));
      }
      setIsCheckingAuth(false);
    };

    if (isSupabaseConfigured()) {
      getSessionUser()
        .then((sbUser) => {
          if (sbUser && sbUser.email) {
            const synced = syncSupabaseSessionToLocalUser(sbUser);
            loadUserData(synced);
          } else {
            loadUserData(getActiveUser());
          }
        })
        .catch(() => {
          loadUserData(getActiveUser());
        });
    } else {
      loadUserData(getActiveUser());
    }
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGuard
        title="Đăng nhập để xem bảng tổng quan học tập"
        description="Bảng tổng quan cá nhân hóa giúp bạn theo dõi chuỗi ngày học, mục tiêu hàng ngày và các bộ từ vựng bạn đã đăng ký."
        featureName="Trang học tập cá nhân"
        backHref="/welcome"
        backLabel="Về trang giới thiệu"
      />
    );
  }

  // Calculate total due cards across all enrolled decks
  const now = Date.now();
  const enrolledDeckIds = new Set(enrolledDecks.map((d) => d.id));
  const enrolledCards = cards.filter((c) => enrolledDeckIds.has(c.deckId));
  const dueCardsCount = enrolledCards.filter((c) => {
    if (c.status === "new") return true;
    return new Date(c.nextReviewAt).getTime() <= now;
  }).length;

  const firstEnrolledDeckId = enrolledDecks[0]?.id || "deck-ielts-mastery";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 sm:space-y-12">
      {/* 1. User Welcome & Today's Goal Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 text-white flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Chào mừng trở lại, {currentUser.name}!
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {currentUser.streakDays || 1} ngày 🔥
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{currentUser.email}</span>
                <span>•</span>
                <span>Mục tiêu: <strong className="text-white font-semibold">{currentUser.targetLevel}</strong></span>
                <span>•</span>
                <span>Mục tiêu ngày: <strong className="text-white font-semibold">{currentUser.dailyGoalCards || 15} thẻ</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/study/${firstEnrolledDeckId}?mode=flashcard`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 font-extrabold text-xs sm:text-sm shadow-md hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-brand-700" />
              <span>Ôn tập hôm nay ({dueCardsCount})</span>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-900/80 text-white border border-indigo-400/30 text-xs sm:text-sm font-semibold transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Hồ sơ cá nhân</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Summary Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Retention Rate */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ lệ ghi nhớ</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.retentionRate || 0}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Dựa trên đường cong quên SM-2
            </p>
          </div>
        </div>

        {/* Metric 2: Average PronScore */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Điểm phát âm TB</span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 flex items-center justify-center">
              <Mic className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats && stats.avgPronScore > 0 ? stats.avgPronScore : "--"}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {stats?.totalSpeakingAttempts || 0} lượt phát âm đã đánh giá
            </p>
          </div>
        </div>

        {/* Metric 3: Mastered Vocabulary */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Từ vựng đã thuộc</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-brand-600 dark:bg-indigo-950/60 dark:text-brand-300 flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.masteredWords || 0}
              <span className="text-sm font-normal text-slate-400"> từ</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {stats?.learningWords || 0} đang học • {stats?.newWords || 0} từ mới
            </p>
          </div>
        </div>

        {/* Metric 4: Due for Review */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cần ôn tập</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {dueCardsCount}
              <span className="text-sm font-normal text-slate-400"> thẻ</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Từ các bộ từ bạn đã đăng ký
            </p>
          </div>
        </div>
      </section>

      {/* 3. Enrolled Decks Hub ("Bộ từ vựng bạn đang học") */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bộ từ vựng bạn đang học
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-brand-600 border border-indigo-100 dark:bg-indigo-950/60 dark:text-brand-300 dark:border-indigo-900">
                {enrolledDecks.length} bộ đã đăng ký
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tiến độ ghi nhớ Spaced Repetition (SRS) được lưu trữ và tối ưu hóa cá nhân hóa cho bạn
            </p>
          </div>

          <Link
            href="/decks"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <Compass className="h-4 w-4 text-brand-600" />
            <span>Khám phá thêm bộ từ mới</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {enrolledDecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                cards={cards.filter((c) => c.deckId === deck.id)}
                isEnrolled={true}
                isLoggedIn={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-brand-600 dark:text-brand-300 flex items-center justify-center">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Bạn chưa đăng ký bộ từ vựng nào
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Kho từ vựng của LingoPulse có hơn 88 bộ từ chuẩn quốc tế (IELTS, TOEIC, Giao tiếp, Công nghệ). Hãy vào kho từ vựng và chọn các bộ bạn muốn chinh phục!
              </p>
            </div>
            <Link
              href="/decks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Compass className="h-4 w-4" />
              <span>Đến Kho bộ từ vựng</span>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Quick Learning Modes Shortcuts */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Lối tắt rèn luyện phản xạ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Các chế độ rèn luyện thực chiến giúp kích hoạt từ vựng thụ động thành kỹ năng nói
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/speaking"
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mic className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                Luyện phản xạ nói
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chấm điểm phát âm 4 chiều PronScore™ (Accuracy, Fluency, Completeness, Prosody).
              </p>
            </div>
          </Link>

          <Link
            href="/conversation"
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                Hội thoại tình huống AI
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập vai giao tiếp theo ngữ cảnh thực tế với gia sư AI và sửa lỗi ngữ pháp tức thì.
              </p>
            </div>
          </Link>

          <Link
            href="/decks"
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-brand-600 dark:bg-indigo-950/60 dark:text-brand-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                Kho 88 bộ từ vựng
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đầy đủ lộ trình IELTS, TOEIC, Giao tiếp công nghệ, tự do đăng ký thêm bộ từ mới.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Recent Study Activity Timeline */}
      {activities.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Nhật ký hoạt động gần đây
            </h2>
            <Link
              href="/profile"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Xem toàn bộ trong hồ sơ &rarr;
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                      act.type === "speech_practice"
                        ? "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
                        : act.type === "srs_review"
                        ? "bg-indigo-50 text-brand-600 dark:bg-indigo-950 dark:text-brand-300"
                        : act.type === "cambridge_lookup"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300"
                    )}
                  >
                    {act.type === "speech_practice" ? (
                      <Mic className="h-4 w-4" />
                    ) : act.type === "srs_review" ? (
                      <Brain className="h-4 w-4" />
                    ) : act.type === "cambridge_lookup" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {act.description} •{" "}
                      {new Date(act.timestamp).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {act.metadata?.score !== undefined && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      act.metadata.score >= 80
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    )}
                  >
                    {act.metadata.score}/100
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
