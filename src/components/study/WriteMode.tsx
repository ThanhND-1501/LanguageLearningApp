"use client";

import { useState } from "react";
import { Card, SRSRating } from "@/types";
import { Check, X, ArrowRight, Volume2 } from "lucide-react";
import { playNativePronunciation } from "@/lib/audio";

interface WriteModeProps {
  cards: Card[];
  onRateCard: (cardId: string, rating: SRSRating) => void;
  onFinishSession?: () => void;
}

export function WriteMode({ cards, onRateCard, onFinishSession }: WriteModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentCard = cards[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || checked) return;

    const trimmedInput = inputVal.trim().toLowerCase();
    const correctTerm = currentCard.term.trim().toLowerCase();
    const correct = trimmedInput === correctTerm;

    setIsCorrect(correct);
    setChecked(true);

    if (correct) {
      playNativePronunciation(currentCard.term);
      onRateCard(currentCard.id, "good");
    } else {
      onRateCard(currentCard.id, "again");
    }
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

  if (!currentCard) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <Check className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold">Hoàn thành bài tập gõ từ!</h3>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl w-full">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
          Câu {currentIndex + 1} / {cards.length} • Chế độ Write
        </div>

        {/* Prompt: Vietnamese definition */}
        <div className="my-6">
          <p className="text-sm text-slate-500">Hãy gõ từ tiếng Anh tương ứng với nghĩa:</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 dark:text-white">
            {currentCard.definition}
          </h2>
          {currentCard.partOfSpeech && (
            <p className="text-xs italic text-slate-400 mt-1">({currentCard.partOfSpeech})</p>
          )}
        </div>

        {/* Typing Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            disabled={checked}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Gõ từ tiếng Anh tại đây..."
            className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          {!checked ? (
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Kiểm tra đáp án
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-4 rounded-2xl flex items-start gap-3 ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                }`}
              >
                {isCorrect ? (
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-rose-600 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {isCorrect ? "Chính xác tuyệt đối!" : "Chưa chính xác"}
                  </p>
                  <p className="text-sm mt-1">
                    Đáp án đúng: <strong className="font-mono">{currentCard.term}</strong>{" "}
                    {currentCard.phonetic && `(${currentCard.phonetic})`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
