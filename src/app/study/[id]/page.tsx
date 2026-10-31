"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Deck, SRSRating } from "@/types";
import { getLocalDecks, getLocalCards, updateCardWithSRSRating } from "@/lib/storage";
import { recordStudyActivity } from "@/lib/auth";
import { FlashcardViewer } from "@/components/study/FlashcardViewer";
import { WriteMode } from "@/components/study/WriteMode";
import { DictationMode } from "@/components/study/DictationMode";
import { ArrowLeft, BookOpen, Edit3, Volume2, RotateCcw } from "lucide-react";

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

  useEffect(() => {
    const allDecks = getLocalDecks();
    const currentDeck = allDecks.find((d) => d.id === deckId);
    if (currentDeck) setDeck(currentDeck);

    const allCards = getLocalCards();
    const deckCards = allCards.filter((c) => c.deckId === deckId);

    // Prioritize due cards first, then new cards
    const now = Date.now();
    const due = deckCards.filter((c) => c.status === "new" || new Date(c.nextReviewAt).getTime() <= now);
    setStudyCards(due.length > 0 ? due : deckCards);
  }, [deckId]);

  const handleRateCard = (cardId: string, rating: SRSRating) => {
    const updated = updateCardWithSRSRating(cardId, rating);
    if (updated) {
      recordStudyActivity({
        type: "srs_review",
        title: `Ôn tập SRS: ${updated.term}`,
        description: `Đánh giá '${rating}' — chu kỳ tiếp theo sau ${updated.intervalDays} ngày`,
        metadata: { term: updated.term, rating },
      });
    }
  };

  const handleRestart = () => {
    setIsFinished(false);
    const allCards = getLocalCards();
    setStudyCards(allCards.filter((c) => c.deckId === deckId));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Navigation & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại {deck ? deck.title : "Bộ từ"}</span>
        </Link>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setMode("flashcard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "flashcard"
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Flashcard</span>
          </button>

          <button
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "write"
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Write</span>
          </button>

          <button
            onClick={() => setMode("dictation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "dictation"
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Dictation</span>
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
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-lg max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-2xl">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Phiên học hoàn thành!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn đã ôn tập xong các thẻ trong phiên này. Thuật toán Spaced Repetition đã lên lịch ôn tiếp theo cho từng thẻ.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ôn tập lại từ đầu</span>
              </button>
              <Link
                href={`/decks/${deckId}`}
                className="py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-colors"
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
