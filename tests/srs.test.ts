import { describe, it, assert } from "./test-helper";
import { calculateNextReview, filterDueCards } from "../src/lib/srs";
import { Card } from "../src/types";

function createMockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "test-card-1",
    deckId: "deck-1",
    term: "resilient",
    definition: "kiên cường",
    status: "new",
    repetition: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
    nextReviewAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Spaced Repetition Engine (srs.ts)", () => {
  describe("calculateNextReview - Rating: again", () => {
    it("should reset repetition and set interval to 1 day on forget", () => {
      const card = createMockCard({
        repetition: 3,
        easinessFactor: 2.5,
        intervalDays: 14,
        status: "mastered",
      });

      const result = calculateNextReview(card, "again");

      assert.strictEqual(result.repetition, 0);
      assert.strictEqual(result.intervalDays, 1);
      assert.strictEqual(result.status, "learning");
      // EF decreases by 0.54: 2.5 - 0.54 = 1.96
      assert.strictEqual(result.easinessFactor, 1.96);
    });

    it("should respect EF lower bound of 1.3", () => {
      const card = createMockCard({
        repetition: 1,
        easinessFactor: 1.4,
        intervalDays: 2,
        status: "learning",
      });

      const result = calculateNextReview(card, "again");

      // 1.4 - 0.54 = 0.86, but bound is 1.3
      assert.strictEqual(result.easinessFactor, 1.3);
      assert.strictEqual(result.intervalDays, 1);
    });
  });

  describe("calculateNextReview - Rating: hard", () => {
    it("should decrease EF by 0.14 and progress interval correctly", () => {
      const card = createMockCard({
        repetition: 0,
        easinessFactor: 2.5,
        intervalDays: 0,
        status: "new",
      });

      const result = calculateNextReview(card, "hard");

      // 2.5 - 0.14 = 2.36
      assert.strictEqual(result.easinessFactor, 2.36);
      assert.strictEqual(result.repetition, 1);
      assert.strictEqual(result.intervalDays, 1);
      assert.strictEqual(result.status, "learning");
    });
  });

  describe("calculateNextReview - Rating: good", () => {
    it("should keep EF unchanged and advance interval to 1 on first repetition", () => {
      const card = createMockCard({
        repetition: 0,
        easinessFactor: 2.5,
        intervalDays: 0,
        status: "new",
      });

      const result = calculateNextReview(card, "good");

      assert.strictEqual(result.easinessFactor, 2.5);
      assert.strictEqual(result.repetition, 1);
      assert.strictEqual(result.intervalDays, 1);
      assert.strictEqual(result.status, "learning");
    });

    it("should advance interval to 6 on second repetition", () => {
      const card = createMockCard({
        repetition: 1,
        easinessFactor: 2.5,
        intervalDays: 1,
        status: "learning",
      });

      const result = calculateNextReview(card, "good");

      assert.strictEqual(result.repetition, 2);
      assert.strictEqual(result.intervalDays, 6);
      assert.strictEqual(result.status, "learning");
    });

    it("should multiply interval by EF on third and subsequent repetitions", () => {
      const card = createMockCard({
        repetition: 2,
        easinessFactor: 2.5,
        intervalDays: 6,
        status: "learning",
      });

      const result = calculateNextReview(card, "good");

      assert.strictEqual(result.repetition, 3);
      // Math.round(6 * 2.5) = 15
      assert.strictEqual(result.intervalDays, 15);
      assert.strictEqual(result.status, "learning");
    });

    it("should transition status to mastered when repetition >= 4", () => {
      const card = createMockCard({
        repetition: 3,
        easinessFactor: 2.5,
        intervalDays: 6,
        status: "learning",
      });

      const result = calculateNextReview(card, "good");

      assert.strictEqual(result.repetition, 4);
      assert.strictEqual(result.status, "mastered");
    });

    it("should transition status to mastered when interval >= 21 even if repetition < 4", () => {
      const card = createMockCard({
        repetition: 2,
        easinessFactor: 3.0,
        intervalDays: 8,
        status: "learning",
      });

      const result = calculateNextReview(card, "good");

      // Math.round(8 * 3.0) = 24 >= 21
      assert.strictEqual(result.intervalDays, 24);
      assert.strictEqual(result.status, "mastered");
    });
  });

  describe("calculateNextReview - Rating: easy", () => {
    it("should increase EF by 0.10 up to maximum bound of 3.0", () => {
      const card = createMockCard({
        repetition: 1,
        easinessFactor: 2.95,
        intervalDays: 1,
        status: "learning",
      });

      const result = calculateNextReview(card, "easy");

      // 2.95 + 0.10 = 3.05, ceiling 3.0
      assert.strictEqual(result.easinessFactor, 3.0);
    });

    it("should calculate valid ISO nextReviewAt timestamp in the future", () => {
      const card = createMockCard();
      const beforeTime = Date.now();
      const result = calculateNextReview(card, "good");
      const nextTime = new Date(result.nextReviewAt).getTime();

      assert.ok(!isNaN(nextTime));
      // Should be roughly 24 hours later
      const diffHours = (nextTime - beforeTime) / (1000 * 60 * 60);
      assert.ok(diffHours >= 23.9 && diffHours <= 24.1);
    });
  });

  describe("filterDueCards", () => {
    it("should always include cards with status 'new'", () => {
      const cards: Card[] = [
        createMockCard({ id: "c1", status: "new" }),
        createMockCard({ id: "c2", status: "learning", nextReviewAt: new Date(Date.now() + 86400000).toISOString() }),
      ];

      const due = filterDueCards(cards);
      assert.strictEqual(due.length, 1);
      assert.strictEqual(due[0].id, "c1");
    });

    it("should include cards that are past their nextReviewAt timestamp", () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour later

      const cards: Card[] = [
        createMockCard({ id: "due-card", status: "learning", nextReviewAt: pastTime }),
        createMockCard({ id: "future-card", status: "learning", nextReviewAt: futureTime }),
      ];

      const due = filterDueCards(cards);
      assert.strictEqual(due.length, 1);
      assert.strictEqual(due[0].id, "due-card");
    });
  });
});
