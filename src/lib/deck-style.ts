import { Card, Deck } from "@/types";

export const DECK_COLORS = ["blue", "teal", "amber", "rose", "violet", "green"] as const;
export type DeckColor = (typeof DECK_COLORS)[number];

/** Static class maps so Tailwind can see every class name. */
export const deckBg: Record<DeckColor, string> = {
  blue: "bg-deck-blue",
  teal: "bg-deck-teal",
  amber: "bg-deck-amber",
  rose: "bg-deck-rose",
  violet: "bg-deck-violet",
  green: "bg-deck-green",
};

export const deckText: Record<DeckColor, string> = {
  blue: "text-deck-blue",
  teal: "text-deck-teal",
  amber: "text-deck-amber",
  rose: "text-deck-rose",
  violet: "text-deck-violet",
  green: "text-deck-green",
};

/** A deck keeps the same identity color everywhere it appears. */
export function deckColor(deck: Pick<Deck, "id">): DeckColor {
  let h = 2166136261; // FNV-1a: spreads similar ids across colors
  for (let i = 0; i < deck.id.length; i++) {
    h ^= deck.id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return DECK_COLORS[h % DECK_COLORS.length];
}

const LANG_CODES: Record<string, string> = {
  english: "EN", "tiếng anh": "EN", en: "EN",
  french: "FR", "tiếng pháp": "FR", fr: "FR",
  japanese: "JA", "tiếng nhật": "JA", ja: "JA",
  korean: "KO", "tiếng hàn": "KO", ko: "KO",
  chinese: "ZH", "tiếng trung": "ZH", zh: "ZH",
  german: "DE", "tiếng đức": "DE", de: "DE",
  spanish: "ES", "tiếng tây ban nha": "ES", es: "ES",
  vietnamese: "VI", "tiếng việt": "VI", vi: "VI",
};

const LANG_NAMES: Record<string, string> = {
  EN: "Anh", FR: "Pháp", JA: "Nhật", KO: "Hàn", ZH: "Trung", DE: "Đức", ES: "Tây Ban Nha", VI: "Việt",
};

export function langCode(lang?: string): string {
  if (!lang) return "EN";
  const key = lang.trim().toLowerCase();
  return LANG_CODES[key] || lang.slice(0, 2).toUpperCase();
}

export function langPair(deck: Pick<Deck, "targetLang" | "nativeLang">): string {
  const t = langCode(deck.targetLang);
  const n = langCode(deck.nativeLang || "vi");
  return `${LANG_NAMES[t] || t} → ${LANG_NAMES[n] || n}`;
}

export function isDue(card: Card, now = Date.now()) {
  return card.status === "new" || new Date(card.nextReviewAt).getTime() <= now;
}

export interface DeckProgress {
  total: number;
  newCount: number;
  learning: number;
  mastered: number;
  due: number;
  masteredPct: number;
}

export function deckProgress(cards: Card[], now = Date.now()): DeckProgress {
  let newCount = 0, learning = 0, mastered = 0, due = 0;
  for (const c of cards) {
    if (c.status === "new") newCount++;
    else if (c.status === "mastered") mastered++;
    else learning++;
    if (isDue(c, now)) due++;
  }
  const total = cards.length;
  return { total, newCount, learning, mastered, due, masteredPct: total ? Math.round((mastered / total) * 100) : 0 };
}

/** Rough review time: about 20 seconds per card, at least 1 minute. */
export function reviewMinutes(cardCount: number) {
  return cardCount === 0 ? 0 : Math.max(1, Math.round((cardCount * 20) / 60));
}
