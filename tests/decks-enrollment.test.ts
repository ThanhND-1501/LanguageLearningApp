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
});

