"use client";

import { useState, useEffect } from "react";
import { Card, SRSRating } from "@/types";
import { Volume2, Check, ArrowRight, RotateCcw } from "lucide-react";
import { playNativePronunciation } from "@/lib/audio";

interface DictationModeProps {
  cards: Card[];
  onRateCard: (cardId: string, rating: SRSRating) => void;
  onFinishSession?: () => void;
}

export function DictationMode({ cards, onRateCard, onFinishSession }: DictationModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    if (currentCard && !checked) {
      playNativePronunciation(currentCard.exampleSentence || currentCard.term);
    }
  }, [currentIndex, currentCard, checked]);

  const handlePlayAudio = () => {
    if (currentCard) {
      playNativePronunciation(currentCard.exampleSentence || currentCard.term);
    }
  };

  const handlePlaySlow = () => {
    if (currentCard) {
      playNativePronunciation(currentCard.exampleSentence || currentCard.term, "en-US", 0.7);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || checked) return;

    const target = (currentCard.exampleSentence || currentCard.term).trim().toLowerCase();
    const cleanInput = inputVal.trim().toLowerCase();
    const correct = cleanInput === target;

    setIsCorrect(correct);
    setChecked(true);
    onRateCard(currentCard.id, correct ? "good" : "again");
  };

  const handleNext = () => {
    setChecked(false);
    setInputVal("");
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onFinishSession) onFinishSession();
    }
  };

  if (!currentCard) return null;

  return (
    <div className="mx-auto max-w-xl w-full">
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-lift">
        <div className="text-xs font-semibold text-mute mb-2">
          Câu {currentIndex + 1} / {cards.length} · Nghe chép
        </div>

        {/* Audio Listen Buttons */}
        <div className="my-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-subtle">
          <p className="text-xs font-semibold text-mute mb-4">Nhấn nút để nghe câu mẫu:</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlayAudio}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover shadow-raised transition-colors"
            >
              <Volume2 className="h-4 w-4" />
              <span>Tốc độ thường</span>
            </button>
            <button
              type="button"
              onClick={handlePlaySlow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface text-ink-2 font-medium hover:bg-subtle"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Chậm (0.7x)</span>
            </button>
          </div>
        </div>

        {/* Typing Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={3}
            autoFocus
            disabled={checked}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Gõ lại chính xác câu bạn nghe được..."
            className="w-full rounded-2xl border border-line p-4 text-base font-medium text-ink placeholder:text-mute focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary"
          />

          {!checked ? (
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              Kiểm tra
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-4 rounded-2xl ${
                  isCorrect
                    ? "bg-good-soft text-good border border-good/25"
                    : "bg-poor-soft text-poor border border-poor/25"
                }`}
              >
                <p className="font-bold text-sm">
                  {isCorrect ? "Xuất sắc! Bạn đã nghe đúng 100%." : "Câu gốc tham chiếu:"}
                </p>
                <p className="text-sm mt-1 font-medium">
                  &ldquo;{currentCard.exampleSentence || currentCard.term}&rdquo;
                </p>
                {currentCard.exampleTranslation && (
                  <p className="text-xs text-mute mt-1 italic">
                    {currentCard.exampleTranslation}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
