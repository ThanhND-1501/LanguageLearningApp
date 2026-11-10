"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, SRSRating } from "@/types";
import { Volume2, RotateCcw, Check, Sparkles, HelpCircle } from "lucide-react";
import { playNativePronunciation } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface FlashcardViewerProps {
  cards: Card[];
  onRateCard: (cardId: string, rating: SRSRating) => void;
  onFinishSession?: () => void;
}

export function FlashcardViewer({ cards, onRateCard, onFinishSession }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!currentCard) return;
      onRateCard(currentCard.id, rating);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        if (onFinishSession) onFinishSession();
      }
    },
    [currentCard, onRateCard, currentIndex, cards.length, onFinishSession]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleRate("again");
        if (e.key === "2") handleRate("hard");
        if (e.key === "3") handleRate("good");
        if (e.key === "4") handleRate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleRate]);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCard) {
      playNativePronunciation(currentCard.term);
    }
  };

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface border border-line">
        <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-good-soft text-good mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-ink">Tuyệt vời!</h3>
        <p className="mt-2 text-ink-2 max-w-md">
          Bạn đã hoàn thành phiên ôn tập toàn bộ các thẻ đến hạn hôm nay.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      {/* Progress & Shortcut Guide */}
      <div
        className="mb-3 h-1.5 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-label="Tiến độ phiên ôn"
        aria-valuemin={0}
        aria-valuemax={cards.length}
        aria-valuenow={currentIndex}
      >
        <i className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out-expo" style={{ width: `${(currentIndex / Math.max(cards.length, 1)) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-mute mb-4 px-0.5">
        <span>
          Thẻ {currentIndex + 1} / {cards.length}
        </span>
        <span className="hidden sm:inline text-mute">
          Phím tắt: Space để lật · 1–4 để đánh giá
        </span>
      </div>

      {/* 3D Flashcard container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative min-h-[380px] w-full cursor-pointer select-none rounded-2xl border border-line bg-surface p-8 shadow-lift transition-all hover:border-primary/25 flex flex-col justify-between"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold",
              currentCard.status === "mastered"
                ? "bg-good-soft text-good"
                : currentCard.status === "learning"
                ? "bg-fair-soft text-fair"
                : "bg-subtle text-ink"
            )}
          >
            {currentCard.status === "mastered" ? "Đã thuộc" : currentCard.status === "learning" ? "Đang học" : "Từ mới"}
          </span>

          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-soft text-primary-ink hover:bg-primary-soft-hover transition-colors"
            title="Nghe phát âm chuẩn"
          >
            <Volume2 className="h-4 w-4" />
            <span className="text-xs font-medium">Nghe</span>
          </button>
        </div>

        {/* Card Body: Front vs Back */}
        <div className="my-auto text-center py-6">
          {!isFlipped ? (
            // FRONT: Word, IPA, Part of speech
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
                {currentCard.term}
              </h2>
              {currentCard.phonetic && (
                <p className="mt-3 text-lg text-mute">
                  {currentCard.phonetic}
                </p>
              )}
              {currentCard.partOfSpeech && (
                <p className="mt-1 text-sm italic text-mute">
                  ({currentCard.partOfSpeech})
                </p>
              )}
              <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-mute">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nhấn thẻ hoặc bấm phím Space để xem nghĩa</span>
              </div>
            </div>
          ) : (
            // BACK: Definition, Examples, Synonyms, Speaking Prompt
            <div className="text-left space-y-4">
              <div>
                <p className="text-xs font-semibold text-mute">Định nghĩa</p>
                <p className="text-xl font-bold text-ink mt-1">
                  {currentCard.definition}
                </p>
              </div>

              {currentCard.exampleSentence && (
                <div className="rounded-xl bg-subtle p-4 border border-line">
                  <p className="text-xs font-semibold text-primary-ink">
                    Ngữ cảnh thực tế
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    &ldquo;{currentCard.exampleSentence}&rdquo;
                  </p>
                  {currentCard.exampleTranslation && (
                    <p className="mt-1 text-xs text-mute italic">
                      {currentCard.exampleTranslation}
                    </p>
                  )}
                </div>
              )}

              {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-mute">Đồng nghĩa:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCard.synonyms.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-xs bg-subtle text-ink-2">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentCard.speakingPrompt && (
                <div className="pt-2 text-xs text-primary-ink font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Gợi ý nói: {currentCard.speakingPrompt}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="text-center text-xs text-mute pt-2 border-t border-line">
          {currentCard.repetition ? `Đã ôn ${currentCard.repetition} lần` : "Lần đầu gặp từ này"}
        </div>
      </div>

      {/* SRS rating */}
      {isFlipped && (
        <div className="mt-6 grid animate-fade-up grid-cols-4 gap-2.5" role="group" aria-label="Bạn nhớ từ này thế nào?">
          {([
            ["again", "1", "Lại", "Quên rồi", "hover:border-poor/50 hover:bg-poor-soft"],
            ["hard", "2", "Khó", "Nhớ chật vật", "hover:border-fair/50 hover:bg-fair-soft"],
            ["good", "3", "Được", "Nhớ ra", "border-primary/40 bg-primary-soft hover:bg-primary-soft-hover"],
            ["easy", "4", "Dễ", "Nhớ ngay", "hover:border-good/50 hover:bg-good-soft"],
          ] as const).map(([rating, key, label, hint, tone]) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRate(rating)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border border-line bg-surface px-2 py-3 transition-colors",
                tone
              )}
            >
              <span className="text-[15px] font-semibold">{label}</span>
              <span className="text-xs text-mute">{hint}</span>
              <kbd className="mt-1 hidden rounded border border-line px-1.5 font-sans text-[11px] text-mute sm:inline">{key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
