// ==============================================================================
// Spaced Repetition Algorithm Engine (Modified SuperMemo SM-2 & FSRS logic)
// Referenced from Section 3.4 of openquiz_ai_technical_analysis_and_blueprint.md
// ==============================================================================

import { Card, CardStatus, SRSRating } from "@/types";

export interface SRSCalculationResult {
  repetition: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewAt: string; // ISO string
  status: CardStatus;
}

/**
 * Calculates updated spaced repetition parameters for a card based on user recall rating:
 * - 'again' (Q=1): Forgotten completely -> Reset interval to 0 / 1 day, decrease EF.
 * - 'hard'  (Q=3): Recalled with heavy effort -> Small interval increment, decrease EF.
 * - 'good'  (Q=4): Recalled correctly with slight hesitation -> Standard interval * EF.
 * - 'easy'  (Q=5): Recalled instantly without hesitation -> Large interval, increase EF.
 */
export function calculateNextReview(
  card: Card,
  rating: SRSRating
): SRSCalculationResult {
  const currentRep = card.repetition || 0;
  let ef = card.easinessFactor || 2.5;
  let interval = card.intervalDays || 0;
  let rep = currentRep;
  let status: CardStatus = card.status;

  // Rating grade mapped to 0-5 SuperMemo scale
  let grade = 4;
  switch (rating) {
    case "again":
      grade = 1;
      break;
    case "hard":
      grade = 3;
      break;
    case "good":
      grade = 4;
      break;
    case "easy":
      grade = 5;
      break;
  }

  // Update Easiness Factor (EF)
  // Formula: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ef < 1.3) ef = 1.3; // SM-2 standard lower bound
  if (ef > 3.0) ef = 3.0; // Realistic ceiling

  if (grade < 3) {
    // Forgotten: reset repetition count and review soon
    rep = 0;
    interval = 1; // 1 day or immediate queue
    status = "learning";
  } else {
    // Correct recall
    if (rep === 0) {
      interval = 1;
    } else if (rep === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }

    rep += 1;

    // Transition card status
    if (rep >= 4 || interval >= 21) {
      status = "mastered";
    } else {
      status = "learning";
    }
  }

  // Calculate next review timestamp
  const now = new Date();
  const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    repetition: rep,
    easinessFactor: Number(ef.toFixed(2)),
    intervalDays: interval,
    nextReviewAt: nextDate.toISOString(),
    status,
  };
}

/**
 * Filter cards that are due for review (nextReviewAt <= now) or new cards
 */
export function filterDueCards(cards: Card[]): Card[] {
  const now = new Date().getTime();
  return cards.filter((card) => {
    if (card.status === "new") return true;
    const reviewTime = new Date(card.nextReviewAt).getTime();
    return reviewTime <= now;
  });
}
