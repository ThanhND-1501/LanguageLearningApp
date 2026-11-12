import Link from "next/link";
import { Plus } from "lucide-react";
import { Deck, Card } from "@/types";
import { cn } from "@/lib/utils";
import { deckBg, deckColor, deckProgress, langCode, langPair } from "@/lib/deck-style";
import { buttonClass } from "@/components/ui/button";

interface DeckCardProps {
  deck: Deck;
  cards: Card[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
  isLoggedIn?: boolean;
}

export function DeckSpine({ deck, className }: { deck: Deck; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-9 shrink-0 place-items-center rounded-md text-[12.5px] font-bold text-white dark:text-bg",
        deckBg[deckColor(deck)],
        className
      )}
      aria-hidden="true"
    >
      {langCode(deck.targetLang)}
    </span>
  );
}

/** New → learning → mastered, on one fixed blue ramp used everywhere. */
export function MemoryRamp({ newCount, learning, mastered, className }: { newCount: number; learning: number; mastered: number; className?: string }) {
  const total = newCount + learning + mastered;
  return (
    <div
      className={cn("flex h-1.5 overflow-hidden rounded-full bg-subtle", className)}
      role="img"
      aria-label={`${mastered} đã thuộc, ${learning} đang học, ${newCount} mới`}
    >
      {total > 0 && (
        <>
          <i className="block bg-primary" style={{ flex: mastered }} />
          <i className="block bg-primary/45" style={{ flex: learning }} />
          <i className="block bg-line-strong" style={{ flex: newCount }} />
        </>
      )}
    </div>
  );
}

export function DeckCard({ deck, cards, isEnrolled = true, onEnroll, isLoggedIn = false }: DeckCardProps) {
  const total = deck.totalCards && deck.totalCards > 0 ? deck.totalCards : cards.length;
  const p = deckProgress(cards);
  const href = isLoggedIn ? `/decks/${deck.id}` : "/login";
  const tracking = isLoggedIn && isEnrolled && cards.length > 0;

  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-surface p-5 transition-[box-shadow,border-color] duration-200 hover:border-line-strong hover:shadow-raised">
      <div className="flex items-start gap-3">
        <DeckSpine deck={deck} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none">
              {deck.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-[13px] text-mute">
            {langPair(deck)} · {total} thẻ
          </p>
        </div>
      </div>

      {deck.description && !tracking && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{deck.description}</p>
      )}

      <div className="mt-auto pt-4">
        {tracking ? (
          <>
            <MemoryRamp newCount={p.newCount} learning={p.learning} mastered={p.mastered} />
            <div className="mt-3 flex items-center justify-between text-[13px] text-ink-2">
              <span>{p.masteredPct}% đã thuộc</span>
              {p.due > 0 ? (
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-primary-ink">
                  {p.due} cần ôn
                </span>
              ) : (
                <span className="rounded-full bg-subtle px-2.5 py-0.5 text-[12.5px] font-medium text-mute">Đã ôn xong</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {deck.tags.slice(0, 2).map((t) => (
                <span key={t} className="truncate rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink-2">
                  {t}
                </span>
              ))}
            </div>
            {isLoggedIn && !isEnrolled && onEnroll && (
              <button
                type="button"
                onClick={onEnroll}
                className={buttonClass("soft", "sm", "relative z-10 shrink-0")}
              >
                <Plus className="h-4 w-4" />
                Thêm vào bộ của tôi
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
