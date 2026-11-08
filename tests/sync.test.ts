import { describe, it, assert } from "./test-helper";
import {
  mapDeckToDb,
  mapDbToDeck,
  mapCardToDb,
  mapDbToCard,
  mapSpeakingAttemptToDb,
} from "../src/lib/sync";
import { Deck, Card, SpeakingAttempt } from "../src/types";

describe("Cloud Sync & Mapping Engine (sync.ts)", () => {
  describe("Deck Mapping", () => {
    it("should correctly convert Domain Deck to Database Deck snake_case format", () => {
      const deck: Deck = {
        id: "deck-123",
        title: "IELTS Mastery",
        description: "Vocabulary set for IELTS",
        targetLang: "en-US",
        nativeLang: "vi-VN",
        tags: ["IELTS", "Academic"],
        totalCards: 10,
        createdAt: "2026-10-31T00:00:00.000Z",
      };

      const dbRecord = mapDeckToDb(deck);

      assert.strictEqual(dbRecord.id, "deck-123");
      assert.strictEqual(dbRecord.title, "IELTS Mastery");
      assert.strictEqual(dbRecord.target_lang, "en-US");
      assert.strictEqual(dbRecord.native_lang, "vi-VN");
      assert.deepStrictEqual(dbRecord.tags, ["IELTS", "Academic"]);
      assert.strictEqual(dbRecord.total_cards, 10);
    });

    it("should correctly convert Database Deck to Domain Deck camelCase format", () => {
      const dbRow = {
        id: "deck-456",
        title: "Tech Vocabulary",
        description: "Silicon Valley terms",
        target_lang: "en-US",
        native_lang: "vi-VN",
        tags: ["Tech"],
        total_cards: 5,
        created_at: "2026-10-31T01:00:00.000Z",
      };

      const deck = mapDbToDeck(dbRow);

      assert.strictEqual(deck.id, "deck-456");
      assert.strictEqual(deck.targetLang, "en-US");
      assert.strictEqual(deck.nativeLang, "vi-VN");
      assert.strictEqual(deck.totalCards, 5);
    });
  });

  describe("Card Mapping", () => {
    it("should correctly convert Domain Card to Database Card format", () => {
      const card: Card = {
        id: "card-789",
        deckId: "deck-123",
        term: "resilient",
        phonetic: "/rɪˈzɪl.jənt/",
        partOfSpeech: "adjective",
        definition: "kiên cường",
        exampleSentence: "She stayed resilient.",
        exampleTranslation: "Cô ấy vẫn kiên cường.",
        synonyms: ["tough", "adaptable"],
        status: "mastered",
        repetition: 4,
        easinessFactor: 2.8,
        intervalDays: 21,
        nextReviewAt: "2026-11-20T00:00:00.000Z",
      };

      const dbCard = mapCardToDb(card);

      assert.strictEqual(dbCard.id, "card-789");
      assert.strictEqual(dbCard.deck_id, "deck-123");
      assert.strictEqual(dbCard.part_of_speech, "adjective");
      assert.strictEqual(dbCard.easiness_factor, 2.8);
      assert.strictEqual(dbCard.interval_days, 21);
      assert.strictEqual(dbCard.next_review_at, "2026-11-20T00:00:00.000Z");
    });

    it("should correctly convert Database Card to Domain Card format", () => {
      const dbCardRow = {
        id: "card-101",
        deck_id: "deck-456",
        term: "bottleneck",
        phonetic: "/ˈbɒt.əl.nek/",
        part_of_speech: "noun",
        definition: "điểm nghẽn",
        example_sentence: "Slow database created a bottleneck.",
        example_translation: "Cơ sở dữ liệu chậm đã tạo ra điểm nghẽn.",
        synonyms: ["blocker"],
        status: "learning",
        repetition: 1,
        easiness_factor: 2.5,
        interval_days: 1,
        next_review_at: "2026-11-01T00:00:00.000Z",
      };

      const card = mapDbToCard(dbCardRow);

      assert.strictEqual(card.id, "card-101");
      assert.strictEqual(card.deckId, "deck-456");
      assert.strictEqual(card.partOfSpeech, "noun");
      assert.strictEqual(card.exampleSentence, "Slow database created a bottleneck.");
      assert.strictEqual(card.intervalDays, 1);
    });
  });

  describe("Speaking Attempt Mapping", () => {
    it("should correctly map speaking attempt with PronScore components", () => {
      const attempt: SpeakingAttempt = {
        id: "attempt-1",
        cardId: "card-789",
        promptQuestion: "Describe a challenge you overcame.",
        userTranscript: "I was resilient during the crisis.",
        targetWords: ["resilient"],
        grammarFeedback: "Good grammar.",
        suggestedRewrite: "I demonstrated great resilience during the crisis.",
        pronScores: {
          pronScore: 88,
          accuracyScore: 90,
          fluencyScore: 85,
          completenessScore: 100,
          prosodyScore: 82,
          wordScores: [{ word: "resilient", score: 92 }],
        },
        createdAt: "2026-10-31T02:00:00.000Z",
      };

      const dbAttempt = mapSpeakingAttemptToDb(attempt);

      assert.strictEqual(dbAttempt.id, "attempt-1");
      assert.strictEqual(dbAttempt.card_id, "card-789");
      assert.strictEqual(dbAttempt.pron_score, 88);
      assert.strictEqual(dbAttempt.accuracy_score, 90);
      assert.strictEqual(dbAttempt.fluency_score, 85);
      assert.strictEqual(dbAttempt.completeness_score, 100);
      assert.strictEqual(dbAttempt.prosody_score, 82);
      assert.strictEqual(dbAttempt.word_level_scores.length, 1);
    });
  });
});

