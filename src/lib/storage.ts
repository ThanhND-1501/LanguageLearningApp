// ==============================================================================
// Local-First Storage Adapter with Global Shared Catalog & Account Isolation
// Supports Personal Decks, Global Shared Library, and Spaced Repetition (SRS)
// ==============================================================================

import { Card, Deck, SRSRating, UserProfile } from "@/types";
import { calculateNextReview } from "./srs";

const DECKS_KEY = "lingopulse_decks_v1";
const CARDS_KEY = "lingopulse_cards_v1";
const ACTIVE_USER_KEY = "lingopulse_active_user_v1";
const ACCOUNTS_KEY = "lingopulse_accounts_v1";

/**
 * Standard / Global Shared Decks
 * Available for all users in the catalog; pre-enrolled for Demo/Evaluation account.
 */
export const GLOBAL_DECKS: Deck[] = [
  {
    id: "deck-ielts-mastery",
    title: "IELTS Academic Mastery (Band 7.0 - 8.5)",
    description: "Bộ từ vựng học thuật quan trọng nhất xuất hiện liên tục trong IELTS Writing & Speaking.",
    targetLang: "en-US",
    nativeLang: "vi-VN",
    tags: ["IELTS", "Academic", "Writing", "Speaking"],
    totalCards: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    isGlobal: true,
    ownerId: "system",
  },
  {
    id: "deck-silicon-valley",
    title: "Silicon Valley & Tech Communication",
    description: "Thuật ngữ và thành ngữ công nghệ dùng hàng ngày trong giao tiếp họp báo và standup.",
    targetLang: "en-US",
    nativeLang: "vi-VN",
    tags: ["Business", "Tech", "Workplace"],
    totalCards: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    isGlobal: true,
    ownerId: "system",
  },
];

// Alias for backwards compatibility
export const INITIAL_DECKS = GLOBAL_DECKS;

/**
 * Global Seed Cards for Standard Library
 */
export const GLOBAL_CARDS: Card[] = [
  {
    id: "card-resilient",
    deckId: "deck-ielts-mastery",
    term: "resilient",
    phonetic: "/rɪˈzɪl.jənt/",
    partOfSpeech: "adjective",
    definition: "Kiên cường, có khả năng phục hồi nhanh chóng sau nghịch cảnh",
    exampleSentence: "Children are often remarkably resilient to major changes in their environment.",
    exampleTranslation: "Trẻ em thường kiên cường một cách đáng chú ý trước những biến đổi lớn.",
    synonyms: ["tough", "tenacious", "adaptable"],
    speakingPrompt: "Describe a difficult situation you faced and explain how you stayed resilient.",
    status: "learning",
    repetition: 2,
    easinessFactor: 2.6,
    intervalDays: 3,
    nextReviewAt: new Date(Date.now() - 3600000).toISOString(), // due 1 hour ago
  },
  {
    id: "card-ubiquitous",
    deckId: "deck-ielts-mastery",
    term: "ubiquitous",
    phonetic: "/juːˈbɪk.wə.təs/",
    partOfSpeech: "adjective",
    definition: "Có mặt ở khắp mọi nơi, rất phổ biến",
    exampleSentence: "Smartphones have become ubiquitous across modern urban society.",
    exampleTranslation: "Điện thoại thông minh đã trở nên hiện diện ở khắp mọi nơi trong xã hội hiện đại.",
    synonyms: ["omnipresent", "pervasive", "everywhere"],
    speakingPrompt: "Do you believe AI tools will become ubiquitous in university education?",
    status: "learning",
    repetition: 1,
    easinessFactor: 2.5,
    intervalDays: 1,
    nextReviewAt: new Date(Date.now() - 7200000).toISOString(), // due 2 hours ago
  },
  {
    id: "card-corroborate",
    deckId: "deck-ielts-mastery",
    term: "corroborate",
    phonetic: "/kəˈrɒb.ə.reɪt/",
    partOfSpeech: "verb",
    definition: "Chứng thực, củng cố thêm bằng chứng cho một giả thuyết hoặc tuyên bố",
    exampleSentence: "Subsequent experiments corroborated the initial scientific hypothesis.",
    exampleTranslation: "Các thí nghiệm sau đó đã chứng thực giả thuyết khoa học ban đầu.",
    synonyms: ["substantiate", "validate", "confirm"],
    speakingPrompt: "Why is it essential to corroborate medical rumors before sharing them on social media?",
    status: "new",
    repetition: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
    nextReviewAt: new Date().toISOString(),
  },
  {
    id: "card-candid",
    deckId: "deck-ielts-mastery",
    term: "candid",
    phonetic: "/ˈkæn.dɪd/",
    partOfSpeech: "adjective",
    definition: "Thẳng thắn, bộc trực, không giấu giếm",
    exampleSentence: "The CEO gave a candid interview regarding the company's financial setbacks.",
    exampleTranslation: "Vị CEO đã đưa ra một cuộc phỏng vấn thẳng thắn về những khó khăn tài chính của công ty.",
    synonyms: ["frank", "honest", "outspoken"],
    speakingPrompt: "Should managers always provide candid feedback, or soften bad news?",
    status: "new",
    repetition: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
    nextReviewAt: new Date().toISOString(),
  },
  {
    id: "card-viable",
    deckId: "deck-ielts-mastery",
    term: "viable",
    phonetic: "/ˈvaɪ.ə.bəl/",
    partOfSpeech: "adjective",
    definition: "Khả thi, có thể thực hiện thành công được",
    exampleSentence: "Renewable energy has proven to be a viable alternative to coal power.",
    exampleTranslation: "Năng lượng tái tạo đã chứng minh là một giải pháp khả thi thay thế nhiệt điện than.",
    synonyms: ["feasible", "workable", "sustainable"],
    speakingPrompt: "What is the most viable strategy for reducing greenhouse gases in transportation?",
    status: "mastered",
    repetition: 4,
    easinessFactor: 2.8,
    intervalDays: 14,
    nextReviewAt: new Date(Date.now() + 864000000).toISOString(),
  },
  {
    id: "card-touch-base",
    deckId: "deck-silicon-valley",
    term: "touch base",
    phonetic: "/tʌtʃ beɪs/",
    partOfSpeech: "idiom",
    definition: "Liên hệ lại, trao đổi nhanh để cập nhật tiến độ công việc",
    exampleSentence: "Let's touch base right after lunch to review the wireframes.",
    exampleTranslation: "Hãy trao đổi nhanh ngay sau bữa trưa để xem lại bản vẽ thiết kế.",
    synonyms: ["check in", "reconnect", "sync up"],
    speakingPrompt: "How frequently do you touch base with your team during sprint planning?",
    status: "learning",
    repetition: 1,
    easinessFactor: 2.5,
    intervalDays: 1,
    nextReviewAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "card-bottleneck",
    deckId: "deck-silicon-valley",
    term: "bottleneck",
    phonetic: "/ˈbɒt.əl.nek/",
    partOfSpeech: "noun",
    definition: "Điểm nghẽn gây chậm trễ cho cả quy trình",
    exampleSentence: "Slow database indexing created an unexpected bottleneck in production.",
    exampleTranslation: "Việc đánh chỉ mục cơ sở dữ liệu chậm đã tạo ra điểm nghẽn bất ngờ trên môi trường thực tế.",
    synonyms: ["blocker", "obstacle", "impediment"],
    speakingPrompt: "How do you identify and eliminate bottlenecks in your study routine?",
    status: "new",
    repetition: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
    nextReviewAt: new Date().toISOString(),
  },
  {
    id: "card-leverage",
    deckId: "deck-silicon-valley",
    term: "leverage",
    phonetic: "/ˈlev.ər.ɪdʒ/",
    partOfSpeech: "verb",
    definition: "Tận dụng triệt để đòn bẩy hoặc nguồn lực để tối ưu hóa kết quả",
    exampleSentence: "Modern developers leverage AI coding assistants to accelerate development speed.",
    exampleTranslation: "Các lập trình viên hiện đại tận dụng trợ lý lập trình AI để tăng tốc độ phát triển.",
    synonyms: ["utilize", "exploit", "capitalize on"],
    speakingPrompt: "How will you leverage this language app to improve your speaking fluency?",
    status: "learning",
    repetition: 2,
    easinessFactor: 2.6,
    intervalDays: 4,
    nextReviewAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const INITIAL_CARDS = GLOBAL_CARDS;

// ------------------------------------------------------------------------------
// Internal Storage Helpers
// ------------------------------------------------------------------------------
function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export function getCurrentActiveUser(): UserProfile | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(ACTIVE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Returns all public/global shared decks available in the catalog
 */
export function getGlobalSharedDecks(): Deck[] {
  return GLOBAL_DECKS.map((d) => ({ ...d, isGlobal: true }));
}

/**
 * Check if the active user or given user has enrolled in a specific deck
 */
export function isDeckEnrolled(deckId: string, userId?: string): boolean {
  const active = getCurrentActiveUser();
  const currentUserId = userId || active?.id;

  // Demo user is pre-enrolled in both initial decks
  if (!currentUserId || currentUserId === "user-demo-linguist") {
    return GLOBAL_DECKS.some((d) => d.id === deckId);
  }

  // Check user profile enrolledDeckIds
  let enrolledIds = active?.id === currentUserId ? (active.enrolledDeckIds || []) : [];
  if (enrolledIds.length === 0) {
    const storage = getStorage();
    if (storage) {
      try {
        const rawAccounts = storage.getItem(ACCOUNTS_KEY);
        if (rawAccounts) {
          const accounts = JSON.parse(rawAccounts);
          const found = accounts.find((a: any) => a.id === currentUserId);
          if (found?.profile?.enrolledDeckIds) {
            enrolledIds = found.profile.enrolledDeckIds;
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  if (enrolledIds.includes(deckId)) return true;

  // Check if user is the direct owner of this deck
  const allStored = getRawStoredDecks();
  const owned = allStored.find((d) => d.id === deckId && d.ownerId === currentUserId);
  return !!owned;
}

/**
 * Raw read of all custom decks saved in localStorage
 */
function getRawStoredDecks(): Deck[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Enrolls active user in a global shared deck, copying cards into their personal study collection
 */
export function enrollInDeck(deckId: string, userId?: string): { success: boolean; deck?: Deck } {
  const storage = getStorage();
  const targetDeck = GLOBAL_DECKS.find((d) => d.id === deckId);
  if (!targetDeck) return { success: false };

  const active = getCurrentActiveUser();
  const currentUserId = userId || active?.id;

  if (storage && currentUserId) {
    if (active && active.id === currentUserId) {
      const enrolledIds = new Set(active.enrolledDeckIds || []);
      enrolledIds.add(deckId);
      active.enrolledDeckIds = Array.from(enrolledIds);
      storage.setItem(ACTIVE_USER_KEY, JSON.stringify(active));
    }

    // Also update in accounts list
    try {
      const rawAccounts = storage.getItem(ACCOUNTS_KEY);
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const idx = accounts.findIndex((a: any) => a.id === currentUserId);
        if (idx !== -1) {
          const enrolledIds = new Set(accounts[idx].profile.enrolledDeckIds || []);
          enrolledIds.add(deckId);
          accounts[idx].profile.enrolledDeckIds = Array.from(enrolledIds);
          storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
    } catch {
      // Ignore
    }
  }

  // Ensure cards for this deck exist in CARDS_KEY
  const currentCards = getRawStoredCards();
  const existingDeckCardIds = new Set(currentCards.map((c) => c.id));
  const cardsToAdd = GLOBAL_CARDS.filter((c) => c.deckId === deckId && !existingDeckCardIds.has(c.id));

  if (cardsToAdd.length > 0) {
    // For a newly enrolling user, reset repetition & status to 'new' for clean personal learning
    const personalCards: Card[] = cardsToAdd.map((c) => ({
      ...c,
      status: "new",
      repetition: 0,
      easinessFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: new Date().toISOString(),
    }));
    saveLocalCards([...currentCards, ...personalCards]);
  }

  return { success: true, deck: targetDeck };
}

/**
 * Unenrolls active user from a deck
 */
export function unenrollDeck(deckId: string, userId?: string): void {
  const active = getCurrentActiveUser();
  const currentUserId = userId || active?.id;
  const storage = getStorage();
  if (storage && currentUserId) {
    if (active && active.id === currentUserId) {
      active.enrolledDeckIds = (active.enrolledDeckIds || []).filter((id) => id !== deckId);
      storage.setItem(ACTIVE_USER_KEY, JSON.stringify(active));
    }

    try {
      const rawAccounts = storage.getItem(ACCOUNTS_KEY);
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const idx = accounts.findIndex((a: any) => a.id === currentUserId);
        if (idx !== -1) {
          accounts[idx].profile.enrolledDeckIds = (accounts[idx].profile.enrolledDeckIds || []).filter(
            (id: string) => id !== deckId
          );
          storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Retrieves the user's active/enrolled decks
 * - For demo user or guest: returns standard catalog + custom decks
 * - For a newly registered user: returns clean list (only enrolled or owned decks)
 */
export function getLocalDecks(userId?: string): Deck[] {
  const active = getCurrentActiveUser();
  const currentUserId = userId || active?.id;
  const storedDecks = getRawStoredDecks();
  const storage = getStorage();

  // 1. Guest / Demo User
  if (!currentUserId || currentUserId === "user-demo-linguist") {
    // If no custom decks stored, seed with GLOBAL_DECKS
    if (storedDecks.length === 0) {
      saveLocalDecks(GLOBAL_DECKS);
      return GLOBAL_DECKS;
    }
    // Return all stored decks + ensure global decks are included
    const all = [...storedDecks];
    for (const g of GLOBAL_DECKS) {
      if (!all.some((d) => d.id === g.id)) {
        all.push(g);
      }
    }
    return all;
  }

  // 2. Registered User (Clean slate isolation)
  let enrolledIds = active?.id === currentUserId ? (active.enrolledDeckIds || []) : [];
  if (enrolledIds.length === 0 && storage) {
    try {
      const rawAccounts = storage.getItem(ACCOUNTS_KEY);
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const found = accounts.find((a: any) => a.id === currentUserId);
        if (found?.profile?.enrolledDeckIds) {
          enrolledIds = found.profile.enrolledDeckIds;
        }
      }
    } catch {
      // Ignore
    }
  }

  const ownedDecks = storedDecks.filter((d) => d.ownerId === currentUserId);
  const enrolledGlobalDecks = GLOBAL_DECKS.filter((d) => enrolledIds.includes(d.id));

  // Combine owned + enrolled global decks (avoiding duplicates)
  const userDecks = [...ownedDecks];
  for (const ed of enrolledGlobalDecks) {
    if (!userDecks.some((d) => d.id === ed.id)) {
      userDecks.push(ed);
    }
  }

  return userDecks;
}

export function saveLocalDecks(decks: Deck[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch {
    // Ignore
  }
}

/**
 * Raw read of all cards from localStorage
 */
function getRawStoredCards(): Card[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves cards filtered by deckId and user context
 */
export function getLocalCards(userId?: string, deckId?: string): Card[] {
  const storage = getStorage();
  const active = getCurrentActiveUser();
  const currentUserId = userId || active?.id;
  let allCards = getRawStoredCards();

  // If storage is empty, initialize with GLOBAL_CARDS
  if (allCards.length === 0) {
    if (storage) {
      try {
        storage.setItem(CARDS_KEY, JSON.stringify(GLOBAL_CARDS));
      } catch {
        // Ignore
      }
    }
    allCards = GLOBAL_CARDS;
  }

  // If specific deck requested
  if (deckId) {
    const matching = allCards.filter((c) => c.deckId === deckId);
    if (matching.length > 0) return matching;

    // Fallback to global cards for previewing
    return GLOBAL_CARDS.filter((c) => c.deckId === deckId);
  }

  // If Demo / Guest user, return all cards
  if (!currentUserId || currentUserId === "user-demo-linguist") {
    return allCards;
  }

  // If Registered User, return cards only from user's enrolled and owned decks
  const userDecks = getLocalDecks(currentUserId);
  const userDeckIds = new Set(userDecks.map((d) => d.id));

  return allCards.filter((c) => userDeckIds.has(c.deckId));
}

export function saveLocalCards(cards: Card[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    // Ignore
  }
}

export function updateCardWithSRSRating(cardId: string, rating: SRSRating): Card | null {
  const cards = getRawStoredCards();
  const allCards = cards.length > 0 ? cards : [...GLOBAL_CARDS];
  const cardIndex = allCards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return null;

  const card = allCards[cardIndex];
  const srsUpdate = calculateNextReview(card, rating);
  const updatedCard: Card = {
    ...card,
    ...srsUpdate,
    lastReviewedAt: new Date().toISOString(),
  };

  allCards[cardIndex] = updatedCard;
  saveLocalCards(allCards);
  return updatedCard;
}
