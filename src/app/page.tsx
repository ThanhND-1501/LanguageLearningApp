"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, Clock, Mic, CheckCircle2, Flame, Play, Plus, ArrowRight } from "lucide-react";
import { Deck, Card } from "@/types";
import { getLocalDecks, getLocalCards } from "@/lib/storage";
import { DeckCard } from "@/components/deck/DeckCard";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    setDecks(getLocalDecks());
    setCards(getLocalCards());
  }, []);

  const totalCards = cards.length;
  const masteredCount = cards.filter((c) => c.status === "mastered").length;
  const learningCount = cards.filter((c) => c.status === "learning").length;

  const now = Date.now();
  const dueCards = cards.filter((c) => {
    if (c.status === "new") return true;
    return new Date(c.nextReviewAt).getTime() <= now;
  });

  const handleAddCards = (newCards: Card[]) => {
    const updated = [...cards, ...newCards];
    setCards(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("lingopulse_cards_v1", JSON.stringify(updated));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Hero Welcome & Quick Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-600 to-violet-700 p-8 sm:p-10 text-white shadow-xl shadow-brand-500/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-indigo-100 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Spaced Repetition & AI Reflex Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Chuyển hóa từ vựng thụ động thành phản xạ nói tự nhiên.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-indigo-100 max-w-2xl leading-relaxed">
            Học ngắt quãng với thuật toán FSRS/SM-2, luyện phản xạ đặt câu theo ngữ cảnh và chấm điểm phát âm 4 chiều PronScore™ cùng AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {dueCards.length > 0 ? (
              <Link
                href={`/study/${decks[0]?.id || "deck-ielts-mastery"}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-brand-700 font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-brand-700" />
                <span>Ôn tập ngay ({dueCards.length} thẻ đến hạn)</span>
              </Link>
            ) : (
              <Link
                href="/decks"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-brand-700 font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all"
              >
                <span>Xem kho từ vựng</span>
              </Link>
            )}

            <button
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-semibold text-sm border border-indigo-400/30 backdrop-blur-sm transition-colors"
            >
              <Sparkles className="h-4 w-4 text-indigo-300" />
              <span>Tạo thẻ từ ảnh / AI</span>
            </button>
          </div>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-20 h-60 w-60 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <BookOpen className="h-4 w-4 text-brand-600" />
            <span>Tổng số thẻ</span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalCards}</p>
          <p className="text-xs text-slate-400 mt-1">Trong {decks.length} bộ học tập</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <Clock className="h-4 w-4 text-rose-500" />
            <span>Cần ôn hôm nay</span>
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-400">
            {dueCards.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Đến hạn ôn tập SRS</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Đã ghi nhớ lâu dài</span>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {masteredCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Trạng thái Mastered</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <Flame className="h-4 w-4 text-amber-500" />
            <span>Chuỗi ngày học</span>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-500">7 ngày</p>
          <p className="text-xs text-slate-400 mt-1">Duy trì streak đều đặn</p>
        </div>
      </div>

      {/* 4 Core Learning Modes Showcase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Vòng lặp học tập 4 giai đoạn
            </h2>
            <p className="text-xs text-slate-500">
              Từ nhận diện mặt chữ đến phản xạ giao tiếp chủ động theo blueprint kỹ thuật
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/study/${decks[0]?.id || "deck-ielts-mastery"}?mode=flashcard`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center font-bold mb-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Flashcard Lật Thẻ</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ghi nhớ định nghĩa, phiên âm IPA và câu ví dụ với phím tắt Space và số 1-4.
            </p>
          </Link>

          <Link
            href={`/study/${decks[0]?.id || "deck-ielts-mastery"}?mode=write`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Write (Tự luận gõ từ)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kiểm tra nhớ mặt chữ chủ động bằng cách gõ chính xác từ vựng theo nghĩa tiếng Việt.
            </p>
          </Link>

          <Link
            href={`/study/${decks[0]?.id || "deck-ielts-mastery"}?mode=dictation`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Dictation (Nghe chép)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Luyện thính giác ngữ điệu bản xứ và chép lại toàn bộ câu ngữ cảnh.
            </p>
          </Link>

          <Link
            href="/speaking"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold mb-3 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              4
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">PronScore™ & Phản xạ nói</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bắt buộc đặt câu bằng giọng nói và chấm điểm 4 chỉ số âm vị, trôi chảy, ngữ điệu.
            </p>
          </Link>
        </div>
      </div>

      {/* Decks Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Bộ từ vựng của bạn
            </h2>
            <p className="text-xs text-slate-500">
              Theo dõi tiến độ Spaced Repetition cho từng bộ thẻ
            </p>
          </div>

          <Link
            href="/decks"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              cards={cards.filter((c) => c.deckId === deck.id)}
            />
          ))}
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <PhotoToCardModal
          deckId={decks[0]?.id || "deck-ielts-mastery"}
          onAddCards={handleAddCards}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
