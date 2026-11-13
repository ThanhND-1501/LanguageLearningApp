import { describe, it, assert, beforeEach } from "./test-helper";
import {
  GLOBAL_DECKS,
  getGlobalSharedDecks,
  getLocalDecks,
  getLocalCards,
  isDeckEnrolled,
  enrollInDeck,
  unenrollDeck,
} from "../src/lib/storage";
import {
  registerLocalUser,
  loginDemoUser,
  logoutUser,
  clearAuthStorageForTesting,
  syncSupabaseSessionToLocalUser,
  DEMO_USER,
} from "../src/lib/auth";

describe("Global Decks & Account Isolation (storage.ts)", () => {
  beforeEach(() => {
    clearAuthStorageForTesting();
  });

  it("should have global standard decks defined with isGlobal: true and ownerId: 'system'", () => {
    const globalDecks = getGlobalSharedDecks();
    assert.ok(globalDecks.length >= 2);
    assert.ok(globalDecks.some((d) => d.id === "deck-ielts-mastery"));
    assert.ok(globalDecks.some((d) => d.id === "deck-silicon-valley"));

    for (const d of globalDecks) {
      assert.strictEqual(d.isGlobal, true);
      assert.strictEqual(d.ownerId, "system");
    }
  });

  it("should have Demo Account pre-enrolled in global decks with initial cards", () => {
    const demo = loginDemoUser();
    assert.strictEqual(demo.id, DEMO_USER.id);

    const enrolledIelts = isDeckEnrolled("deck-ielts-mastery", demo.id);
    const enrolledTech = isDeckEnrolled("deck-silicon-valley", demo.id);
    assert.strictEqual(enrolledIelts, true);
    assert.strictEqual(enrolledTech, true);

    const decks = getLocalDecks(demo.id);
    assert.ok(decks.length >= 2);

    const cards = getLocalCards(demo.id);
    assert.ok(cards.length >= 8);
  });

  it("should set new user to clean fresh slate on registration (0 personal decks)", async () => {
    const newUser = await registerLocalUser("Emily Watson", "emily@test.com", "secure123");

    // Emily has no enrolled decks initially
    const userDecks = getLocalDecks(newUser.id);
    assert.strictEqual(userDecks.length, 0);

    // Emily has 0 enrolled cards initially
    const userCards = getLocalCards(newUser.id);
    assert.strictEqual(userCards.length, 0);

    // Global decks are NOT enrolled for Emily yet
    assert.strictEqual(isDeckEnrolled("deck-ielts-mastery", newUser.id), false);
    assert.strictEqual(isDeckEnrolled("deck-silicon-valley", newUser.id), false);
  });

  it("should allow new user to enroll in a global shared deck", async () => {
    const newUser = await registerLocalUser("Frank Castle", "frank@test.com", "secure123");

    // Enroll in IELTS Academic Mastery
    const result = enrollInDeck("deck-ielts-mastery", newUser.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.deck?.id, "deck-ielts-mastery");

    // Frank now has 1 enrolled deck
    assert.strictEqual(isDeckEnrolled("deck-ielts-mastery", newUser.id), true);
    const userDecks = getLocalDecks(newUser.id);
    assert.strictEqual(userDecks.length, 1);
    assert.strictEqual(userDecks[0].id, "deck-ielts-mastery");

    // Frank now has cards for this deck
    const userCards = getLocalCards(newUser.id);
    assert.ok(userCards.length >= 5);

    // Unenroll
    unenrollDeck("deck-ielts-mastery", newUser.id);
    assert.strictEqual(isDeckEnrolled("deck-ielts-mastery", newUser.id), false);
    assert.strictEqual(getLocalDecks(newUser.id).length, 0);
  });

  it("should guard card addition by requiring deck enrollment in personal study collection", async () => {
    const user = await registerLocalUser("Grace Hopper", "grace@test.com", "secure123");
    const testDeckId = "deck-silicon-valley";

    // Grace hasn't enrolled yet
    assert.strictEqual(isDeckEnrolled(testDeckId, user.id), false);

    // After choosing to enroll/study the deck
    const enrollResult = enrollInDeck(testDeckId, user.id);
    assert.strictEqual(enrollResult.success, true);
    assert.strictEqual(isDeckEnrolled(testDeckId, user.id), true);

    // Cards are now present in Grace's personal study collection
    const personalCards = getLocalCards(user.id, testDeckId);
    assert.ok(personalCards.length > 0);
  });

  it("should sync cloud enrolled decks to a fresh browser session", () => {
    // Simulating a fresh browser logging in via Supabase Auth
    const freshSessionUser = syncSupabaseSessionToLocalUser({
      id: "supabase-user-cross-browser",
      email: "fresh@test.com",
      user_metadata: {
        full_name: "Fresh Device User",
        enrolled_deck_ids: ["deck-ielts-mastery", "deck-silicon-valley"],
      },
    });

    assert.strictEqual(freshSessionUser.enrolledDeckIds?.length, 2);
    assert.strictEqual(isDeckEnrolled("deck-ielts-mastery", freshSessionUser.id), true);
    assert.strictEqual(isDeckEnrolled("deck-silicon-valley", freshSessionUser.id), true);

    const decks = getLocalDecks(freshSessionUser.id);
    assert.strictEqual(decks.length, 2);
  });

  it("should recover enrolled decks from study activities if cloud metadata was missing them", () => {
    // Simulating legacy user whose metadata omitted enrolled_deck_ids but has activity history
    const userWithActivities = syncSupabaseSessionToLocalUser({
      id: "user-legacy-recovery",
      email: "legacy@test.com",
      user_metadata: {
        full_name: "Legacy User",
        study_activities: [
          {
            id: "act-1",
            type: "card_created",
            title: "Đăng ký học bộ từ vựng",
            metadata: { deckId: "deck-ielts-mastery" },
            timestamp: new Date().toISOString(),
          },
          {
            id: "act-2",
            type: "card_created",
            title: "Đăng ký học bộ từ vựng",
            metadata: { deckId: "deck-silicon-valley" },
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    assert.strictEqual(userWithActivities.enrolledDeckIds?.length, 2);
    assert.strictEqual(isDeckEnrolled("deck-ielts-mastery", userWithActivities.id), true);
    assert.strictEqual(isDeckEnrolled("deck-silicon-valley", userWithActivities.id), true);
  });
});

