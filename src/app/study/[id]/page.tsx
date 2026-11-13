"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Deck, SRSRating, UserProfile } from "@/types";
import { getLocalDecks, getLocalCards, updateCardWithSRSRating, saveLocalCards } from "@/lib/storage";
import { getActiveUser } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { mapDbToDeck, mapDbToCard } from "@/lib/sync";
import { recordStudyActivity } from "@/lib/auth";
import { FlashcardViewer } from "@/components/study/FlashcardViewer";
import { WriteMode } from "@/components/study/WriteMode";
import { DictationMode } from "@/components/study/DictationMode";
import { ArrowLeft, BookOpen, Edit3, Volume2, RotateCcw, Check } from "lucide-react";

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const deckId = params.id as string;
  const initialMode = (searchParams.get("mode") as "flashcard" | "write" | "dictation") || "flashcard";

  const [mode, setMode] = useState<"flashcard" | "write" | "dictation">(initialMode);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    const allDecks = getLocalDecks();
    const currentDeck = allDecks.find((d) => d.id === deckId);
    if (currentDeck) setDeck(currentDeck);

    const allCards = getLocalCards();
    const deckCards = allCards.filter(
      (c) => c.deckId === deckId || (Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
    );

    const setupCards = (cardList: Card[]) => {
      const now = Date.now();
      const due = cardList.filter((c) => c.status === "new" || new Date(c.nextReviewAt).getTime() <= now);
      setStudyCards(due.length > 0 ? due : cardList);
    };

    if (deckCards.length > 0) {
      setupCards(deckCards);
    }

    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        if (!currentDeck) {
          sb.from("decks")
            .select("*")
            .eq("id", deckId)
            .single()
            .then(({ data, error }) => {
              if (!error && data) setDeck(mapDbToDeck(data));
            });
        }

        sb.from("cards")
          .select("*")
          .or(`deck_id.eq.${deckId},deck_ids.cs.{${deckId}}`)
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const cloudDeckCards = data.map(mapDbToCard);
              // Smart merge: preserve more recent local reviews
              const allStoredCards = getLocalCards();
              const merged = cloudDeckCards.map((cloudCard) => {
                const localCard = allStoredCards.find((c) => c.id === cloudCard.id);
                if (localCard && localCard.lastReviewedAt) {
                  const localTime = new Date(localCard.lastReviewedAt).getTime();
                  const cloudTime = cloudCard.lastReviewedAt ? new Date(cloudCard.lastReviewedAt).getTime() : 0;
                  if (localTime >= cloudTime) {
                    return {
                      ...cloudCard,
                      status: localCard.status,
                      repetition: localCard.repetition,
                      easinessFactor: localCard.easinessFactor,
                      intervalDays: localCard.intervalDays,
                      nextReviewAt: localCard.nextReviewAt,
                      lastReviewedAt: localCard.lastReviewedAt,
                    };
                  }
                }
                return cloudCard;
              });

              setupCards(merged);
              const remaining = allStoredCards.filter(
                (c) => c.deckId !== deckId && !(Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
              );
              saveLocalCards([...remaining, ...merged]);
            }
          });
      }
    }
  }, [deckId]);

  const handleRateCard = (cardId: string, rating: SRSRating) => {
    const updated = updateCardWithSRSRating(cardId, rating);
    if (updated) {
      recordStudyActivity({
        type: "srs_review",
        title: `Ôn tập SRS: ${updated.term}`,
        description: `Đánh giá '${rating}' — chu kỳ tiếp theo sau ${updated.intervalDays} ngày`,
        metadata: { term: updated.term, rating, mode },
      });
    }
  };

  const handleRestart = () => {
    setIsFinished(false);
    const allCards = getLocalCards();
    setStudyCards(
      allCards.filter(
        (c) => c.deckId === deckId || (Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
      )
    );
  };

  if (!isAuthChecking && !currentUser) {
    return (
      <AuthGuard
        featureName="Ôn Tập Thuật Toán SM-2"
        title="Đăng nhập để bắt đầu phiên học"
        description="Thuật toán lặp lại ngắt quãng (SRS) cần lưu lại chỉ số Ease Factor, số lần lặp và chu kỳ ôn tập vào tài khoản cá nhân của bạn."
        backHref={`/decks/${deckId}`}
        backLabel="Xem danh sách từ trong bộ"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Navigation & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại {deck ? deck.title : "Bộ từ"}</span>
        </Link>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-subtle p-1">
          <button
            onClick={() => setMode("flashcard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "flashcard"
                ? "bg-surface text-primary-ink shadow-sm"
                : "text-ink-2"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Thẻ lật</span>
          </button>

          <button
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "write"
                ? "bg-surface text-primary-ink shadow-sm"
                : "text-ink-2"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Gõ lại từ</span>
          </button>

          <button
            onClick={() => setMode("dictation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "dictation"
                ? "bg-surface text-primary-ink shadow-sm"
                : "text-ink-2"
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Nghe chép</span>
          </button>
        </div>
      </div>

      {/* Main Study Arena */}
      <div className="py-6">
        {!isFinished ? (
          <>
            {mode === "flashcard" && (
              <FlashcardViewer
                cards={studyCards}
                onRateCard={handleRateCard}
                onFinishSession={() => setIsFinished(true)}
              />
            )}
            {mode === "write" && (
              <WriteMode
                cards={studyCards}
                onRateCard={handleRateCard}
                onFinishSession={() => setIsFinished(true)}
              />
            )}
            {mode === "dictation" && (
              <DictationMode
                cards={studyCards}
                onRateCard={handleRateCard}
                onFinishSession={() => setIsFinished(true)}
              />
            )}
          </>
        ) : (
          <div className="text-center p-12 bg-surface rounded-2xl border border-line shadow-lift max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-good-soft text-good flex items-center justify-center font-bold text-2xl">
              <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-ink">
              Phiên học hoàn thành!
            </h2>
            <p className="text-sm text-ink-2">
              Bạn đã ôn tập xong các thẻ trong phiên này. Thuật toán Spaced Repetition đã lên lịch ôn tiếp theo cho từng thẻ.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ôn tập lại từ đầu</span>
              </button>
              <Link
                href={`/decks/${deckId}`}
                className="py-2.5 rounded-xl border border-line bg-surface text-ink-2 font-semibold hover:bg-subtle transition-colors"
              >
                Về trang chi tiết bộ từ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
