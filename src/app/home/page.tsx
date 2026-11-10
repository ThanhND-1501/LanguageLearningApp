"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Mic, Plus } from "lucide-react";
import { getUserActivities } from "@/lib/auth";
import { getLocalDecks, getLocalCards } from "@/lib/storage";
import { Card, Deck, StudyActivity } from "@/types";
import { useSession } from "@/hooks/useSession";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DeckCard } from "@/components/deck/DeckCard";
import { buttonClass } from "@/components/ui/button";
import { EmptyCards, LearnerWithCards } from "@/components/illustrations";
import { deckBg, deckColor, isDue, reviewMinutes } from "@/lib/deck-style";
import { cn } from "@/lib/utils";

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function firstName(name: string) {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(/\s+/);
  return parts[0] || clean;
}

const STAGES = ["Nhớ", "Viết", "Nghe", "Nói"];

/** Remember → write → listen → speak, from what the learner has actually done. */
function WordRoad({ stages }: { stages: [boolean, boolean, boolean, boolean] }) {
  const label = STAGES.map((s, i) => `${s}: ${stages[i] ? "đã luyện" : "chưa"}`).join(", ");
  return (
    <div role="img" aria-label={label}>
      <div className="flex gap-1.5">
        {stages.map((done, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", done ? "bg-primary" : "bg-subtle ring-1 ring-inset ring-line")} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] text-mute">
        {STAGES.map((s, i) => (
          <span key={s} className={cn(stages[i] && "font-medium text-ink-2")}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default function HomeDashboardPage() {
  const { user, loading } = useSession();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activities, setActivities] = useState<StudyActivity[]>([]);

  useEffect(() => {
    if (!user) return;
    setDecks(getLocalDecks(user.id));
    setCards(getLocalCards());
    setActivities(getUserActivities(user.id));
  }, [user]);

  const today = useMemo(() => {
    const now = Date.now();
    const deckIds = new Set(decks.map((d) => d.id));
    const mine = cards.filter((c) => deckIds.has(c.deckId));
    const perDeck = decks
      .map((d) => ({ deck: d, due: mine.filter((c) => c.deckId === d.id && isDue(c, now)).length }))
      .filter((x) => x.due > 0)
      .sort((a, b) => b.due - a.due);
    const due = perDeck.reduce((s, x) => s + x.due, 0);
    const practiced = (term: string, test: (a: StudyActivity) => boolean) =>
      activities.some((a) => a.metadata?.term?.toLowerCase() === term.toLowerCase() && test(a));
    const ready = mine
      .filter((c) => c.status !== "new")
      .map((card) => ({
        card,
        stages: [
          true,
          practiced(card.term, (a) => a.type === "srs_review" && a.metadata?.mode === "write" && a.metadata?.rating !== "again"),
          practiced(card.term, (a) => a.type === "srs_review" && a.metadata?.mode === "dictation" && a.metadata?.rating !== "again"),
          practiced(card.term, (a) => a.type === "speech_practice"),
        ] as [boolean, boolean, boolean, boolean],
      }))
      .filter((x) => !x.stages[3])
      .sort((a, b) => b.stages.filter(Boolean).length - a.stages.filter(Boolean).length || (b.card.lastReviewedAt || "").localeCompare(a.card.lastReviewedAt || ""))
      .slice(0, 5);
    return { perDeck, due, ready };
  }, [decks, cards, activities]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Đang tải">
        <Loader2 className="h-6 w-6 animate-spin text-mute" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGuard
        title="Đăng nhập để xem trang học của bạn"
        description="Trang Hôm nay cho biết thẻ nào cần ôn, bộ từ bạn đang học và những từ sẵn sàng để luyện nói."
        backHref="/welcome"
        backLabel="Về trang giới thiệu"
      />
    );
  }

  const deckById = new Map(decks.map((d) => [d.id, d]));
  const startDeck = today.perDeck[0]?.deck;
  const dateLabel = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" });

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-[26px] font-bold tracking-tight sm:text-[28px]">
          {greeting()}, {firstName(user.name)}
        </h1>
        <p className="text-[15px] text-mute">
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
          {user.streakDays > 0 && <> · chuỗi {user.streakDays} ngày</>}
        </p>
      </div>

      {/* Today */}
      <section aria-labelledby="today-title" className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-raised md:grid-cols-[1fr_320px]">
        <div className="p-6 sm:p-9">
          {decks.length === 0 ? (
            <>
              <h2 id="today-title" className="text-2xl font-bold tracking-tight">Bắt đầu với bộ từ đầu tiên</h2>
              <p className="mt-2 max-w-[34em] text-ink-2">
                Tài khoản của bạn đang trống. Chọn một bộ có sẵn trong thư viện, hoặc tự tạo bộ từ từ danh sách từ, ảnh
                chụp hay tài liệu của bạn.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/decks" className={buttonClass("primary", "md")}>Chọn trong thư viện</Link>
                <Link href="/decks?create=1" className={buttonClass("secondary", "md")}>
                  <Plus className="h-4 w-4" />
                  Tạo bộ từ mới
                </Link>
              </div>
            </>
          ) : today.due === 0 ? (
            <>
              <h2 id="today-title" className="text-2xl font-bold tracking-tight">Bạn đã ôn xong hôm nay</h2>
              <p className="mt-2 max-w-[34em] text-ink-2">
                Không còn thẻ nào đến hạn. Đây là lúc tốt để luyện nói những từ đã nhớ, hoặc thêm từ mới.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/speaking" className={buttonClass("primary", "md")}>
                  <Mic className="h-4 w-4" />
                  Luyện nói
                </Link>
                <Link href="/decks" className={buttonClass("secondary", "md")}>Thêm bộ từ</Link>
              </div>
            </>
          ) : (
            <>
              <h2 id="today-title" className="sr-only">Cần ôn hôm nay</h2>
              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                <span className="text-[56px] font-bold leading-none tracking-[-0.03em] sm:text-[64px]">{today.due}</span>
                <span className="text-lg font-semibold">thẻ cần ôn hôm nay</span>
              </div>
              <p className="mt-1.5 text-mute">
                Khoảng {reviewMinutes(today.due)} phút, từ {today.perDeck.length} bộ từ
              </p>
              <div className="mb-2.5 mt-6 flex h-2 max-w-[520px] gap-1" aria-hidden="true">
                {today.perDeck.map(({ deck, due }) => (
                  <i key={deck.id} className={cn("block rounded-full", deckBg[deckColor(deck)])} style={{ flex: due }} />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-ink-2">
                {today.perDeck.map(({ deck, due }) => (
                  <li key={deck.id} className="flex items-center gap-1.5">
                    <i className={cn("h-2 w-2 rounded-full", deckBg[deckColor(deck)])} aria-hidden="true" />
                    <Link href={`/study/${deck.id}?mode=flashcard`} className="hover:text-ink hover:underline">
                      {deck.title}
                    </Link>
                    <span className="font-semibold text-ink">{due}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/study/${startDeck!.id}?mode=flashcard`} className={buttonClass("primary", "md")}>
                  Bắt đầu ôn
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/decks/${startDeck!.id}`} className={buttonClass("secondary", "md")}>Thêm thẻ mới</Link>
              </div>
              {today.perDeck.length > 1 && (
                <p className="mt-3 text-[13px] text-mute">Bắt đầu với “{startDeck!.title}”, bộ có nhiều thẻ đến hạn nhất.</p>
              )}
            </>
          )}
        </div>
        <div className="hidden place-items-center border-l border-line bg-primary-soft md:grid" aria-hidden="true">
          {decks.length === 0 ? <EmptyCards className="h-auto w-[220px]" /> : <LearnerWithCards className="h-auto w-[250px]" />}
        </div>
      </section>

      {/* Decks */}
      {decks.length > 0 && (
        <section className="mt-10" aria-labelledby="decks-title">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 id="decks-title" className="text-lg font-bold tracking-tight">Bộ từ của bạn</h2>
            <Link href="/decks" className="text-sm font-semibold text-primary-ink hover:underline">Xem thư viện</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} cards={cards.filter((c) => c.deckId === deck.id)} isEnrolled isLoggedIn />
            ))}
            <Link
              href="/decks?create=1"
              className="flex min-h-[148px] flex-col items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-strong p-5 text-center text-ink-2 transition-colors hover:border-primary hover:text-primary-ink"
            >
              <Plus className="h-6 w-6" />
              <span className="font-semibold">Tạo bộ từ mới</span>
              <span className="text-[13px] text-mute">Gõ tay, tra từ điển, hoặc tải ảnh và tài liệu</span>
            </Link>
          </div>
        </section>
      )}

      {/* Ready to speak: each word's road from remembering to speaking */}
      {today.ready.length > 0 && (
        <section className="mt-10" aria-labelledby="speak-title">
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <h2 id="speak-title" className="text-lg font-bold tracking-tight">Sẵn sàng để nói</h2>
            <Link href="/speaking" className="shrink-0 text-sm font-semibold text-primary-ink hover:underline">Mở phòng luyện nói</Link>
          </div>
          <p className="mb-3.5 text-sm text-mute">Những từ bạn đã nhớ nhưng chưa luyện nói. Nói thành tiếng để biến chúng thành vốn từ chủ động.</p>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {today.ready.map(({ card: c, stages }) => {
              const d = deckById.get(c.deckId);
              return (
                <li key={c.id} className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 md:grid-cols-[8px_minmax(0,1.1fr)_minmax(0,1fr)_240px_auto]">
                  <i className={cn("col-start-1 row-start-1 block h-2 w-2 rounded-full", d ? deckBg[deckColor(d)] : "bg-line-strong")} aria-hidden="true" />
                  <div className="col-start-2 row-start-1 min-w-0">
                    <div className="font-semibold">{c.term}</div>
                    {c.phonetic && <div className="text-[13px] text-mute">{c.phonetic}</div>}
                  </div>
                  <div className="hidden min-w-0 truncate text-ink-2 md:col-start-3 md:row-start-1 md:block">{c.definition}</div>
                  <div className="col-span-2 col-start-2 row-start-2 md:col-span-1 md:col-start-4 md:row-start-1">
                    <WordRoad stages={stages} />
                  </div>
                  <Link href="/speaking" className={buttonClass("soft", "sm", "col-start-3 row-start-1 md:col-start-5 md:row-start-1")}>Luyện nói</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
