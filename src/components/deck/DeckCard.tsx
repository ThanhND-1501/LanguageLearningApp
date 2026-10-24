import Link from "next/link";
import { BookOpen, Clock, Play, Sparkles } from "lucide-react";
import { Deck, Card } from "@/types";

interface DeckCardProps {
  deck: Deck;
  cards: Card[];
}

export function DeckCard({ deck, cards }: DeckCardProps) {
  const newCards = cards.filter((c) => c.status === "new").length;
  const learningCards = cards.filter((c) => c.status === "learning").length;
  const masteredCards = cards.filter((c) => c.status === "mastered").length;

  const now = Date.now();
  const dueCards = cards.filter((c) => {
    if (c.status === "new") return true;
    return new Date(c.nextReviewAt).getTime() <= now;
  }).length;

  const masteryPercent = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900">
      <div>
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {deck.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
          {dueCards > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              <Clock className="h-3 w-3" />
              {dueCards} cần ôn
            </span>
          )}
        </div>

        {/* Title & Description */}
        <Link href={`/decks/${deck.id}`}>
          <h3 className="text-lg font-bold text-slate-900 hover:text-brand-600 transition-colors dark:text-white">
            {deck.title}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
          {deck.description}
        </p>

        {/* Learning progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Tiến độ ghi nhớ</span>
            <span>{masteryPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex dark:bg-slate-800">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(masteredCards / (cards.length || 1)) * 100}%` }}
              title={`Mastered: ${masteredCards}`}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${(learningCards / (cards.length || 1)) * 100}%` }}
              title={`Learning: ${learningCards}`}
            />
            <div
              className="bg-slate-300 dark:bg-slate-700 transition-all"
              style={{ width: `${(newCards / (cards.length || 1)) * 100}%` }}
              title={`New: ${newCards}`}
            />
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              {newCards} mới
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {learningCards} đang học
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {masteredCards} đã thuộc
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <Link
          href={`/decks/${deck.id}`}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Xem chi tiết ({cards.length} thẻ)
        </Link>

        <Link
          href={`/study/${deck.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          Học ngay
        </Link>
      </div>
    </div>
  );
}
