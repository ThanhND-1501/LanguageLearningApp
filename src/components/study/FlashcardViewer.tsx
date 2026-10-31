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
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tuyệt vời!</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md">
          Bạn đã hoàn thành phiên ôn tập toàn bộ các thẻ đến hạn hôm nay.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      {/* Progress & Shortcut Guide */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-2">
        <span>
          Thẻ {currentIndex + 1} / {cards.length}
        </span>
        <span className="hidden sm:inline text-slate-400">
          Phím tắt: [Space] Lật thẻ • [1-4] Đánh giá độ nhớ
        </span>
      </div>

      {/* 3D Flashcard container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative min-h-[380px] w-full cursor-pointer select-none rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
              currentCard.status === "mastered"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : currentCard.status === "learning"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {currentCard.status}
          </span>

          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 transition-colors"
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
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight dark:text-white">
                {currentCard.term}
              </h2>
              {currentCard.phonetic && (
                <p className="mt-3 text-lg font-mono text-brand-600 dark:text-brand-400">
                  {currentCard.phonetic}
                </p>
              )}
              {currentCard.partOfSpeech && (
                <p className="mt-1 text-sm italic text-slate-400">
                  ({currentCard.partOfSpeech})
                </p>
              )}
              <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nhấn thẻ hoặc bấm phím Space để xem nghĩa</span>
              </div>
            </div>
          ) : (
            // BACK: Definition, Examples, Synonyms, Speaking Prompt
            <div className="text-left space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Định nghĩa</p>
                <p className="text-xl font-bold text-slate-900 mt-1 dark:text-white">
                  {currentCard.definition}
                </p>
              </div>

              {currentCard.exampleSentence && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Ngữ cảnh thực tế
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                    &ldquo;{currentCard.exampleSentence}&rdquo;
                  </p>
                  {currentCard.exampleTranslation && (
                    <p className="mt-1 text-xs text-slate-500 italic">
                      {currentCard.exampleTranslation}
                    </p>
                  )}
                </div>
              )}

              {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Đồng nghĩa:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCard.synonyms.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentCard.speakingPrompt && (
                <div className="pt-2 text-xs text-indigo-600 font-medium flex items-center gap-1.5 dark:text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Gợi ý nói: {currentCard.speakingPrompt}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          EF: {currentCard.easinessFactor || 2.5} • Ôn lần thứ: {currentCard.repetition || 0}
        </div>
      </div>

      {/* SRS Rating Action Bar */}
      {isFlipped && (
        <div className="mt-6 grid grid-cols-4 gap-3 animate-in fade-in duration-200">
          <button
            onClick={() => handleRate("again")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition-all shadow-sm dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
          >
            <span className="text-xs uppercase tracking-wider text-rose-500 font-bold">[1] Quên</span>
            <span className="text-sm font-bold mt-0.5">Again</span>
            <span className="text-[10px] opacity-75 mt-0.5">1 ngày</span>
          </button>

          <button
            onClick={() => handleRate("hard")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition-all shadow-sm dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
          >
            <span className="text-xs uppercase tracking-wider text-amber-500 font-bold">[2] Khó</span>
            <span className="text-sm font-bold mt-0.5">Hard</span>
            <span className="text-[10px] opacity-75 mt-0.5">2 ngày</span>
          </button>

          <button
            onClick={() => handleRate("good")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-all shadow-sm dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300"
          >
            <span className="text-xs uppercase tracking-wider text-indigo-500 font-bold">[3] Tốt</span>
            <span className="text-sm font-bold mt-0.5">Good</span>
            <span className="text-[10px] opacity-75 mt-0.5">4 ngày</span>
          </button>

          <button
            onClick={() => handleRate("easy")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-all shadow-sm dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
          >
            <span className="text-xs uppercase tracking-wider text-emerald-500 font-bold">[4] Dễ</span>
            <span className="text-sm font-bold mt-0.5">Easy</span>
            <span className="text-[10px] opacity-75 mt-0.5">7 ngày</span>
          </button>
        </div>
      )}
    </div>
  );
}
