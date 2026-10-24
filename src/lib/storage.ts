// ==============================================================================
// Local-First Storage Adapter with Initial Seed Data
// Enables instant zero-config experience, offline persistence, and export/import
// ==============================================================================

import { Card, Deck, SRSRating } from "@/types";
import { calculateNextReview } from "./srs";

const DECKS_KEY = "lingopulse_decks_v1";
const CARDS_KEY = "lingopulse_cards_v1";

export const INITIAL_DECKS: Deck[] = [
  {
    id: "deck-ielts-mastery",
    title: "IELTS Academic Mastery (Band 7.0 - 8.5)",
    description: "Bộ từ vựng học thuật quan trọng nhất xuất hiện liên tục trong IELTS Writing & Speaking.",
    targetLang: "en-US",
    nativeLang: "vi-VN",
    tags: ["IELTS", "Academic", "Writing", "Speaking"],
    totalCards: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "deck-silicon-valley",
    title: "Silicon Valley & Tech Communication",
    description: "Thuật ngữ và thành ngữ công nghệ dùng hàng ngày trong giao tiếp họp báo và standup.",
    targetLang: "en-US",
    nativeLang: "vi-VN",
    tags: ["Business", "Tech", "Workplace"],
    totalCards: 3,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CARDS: Card[] = [
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

export function getLocalDecks(): Deck[] {
  if (typeof window === "undefined") return INITIAL_DECKS;
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) {
      localStorage.setItem(DECKS_KEY, JSON.stringify(INITIAL_DECKS));
      return INITIAL_DECKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DECKS;
  }
}

export function saveLocalDecks(decks: Deck[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getLocalCards(): Card[] {
  if (typeof window === "undefined") return INITIAL_CARDS;
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) {
      localStorage.setItem(CARDS_KEY, JSON.stringify(INITIAL_CARDS));
      return INITIAL_CARDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CARDS;
  }
}

export function saveLocalCards(cards: Card[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function updateCardWithSRSRating(cardId: string, rating: SRSRating): Card | null {
  const cards = getLocalCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return null;

  const card = cards[cardIndex];
  const srsUpdate = calculateNextReview(card, rating);
  const updatedCard: Card = {
    ...card,
    ...srsUpdate,
    lastReviewedAt: new Date().toISOString(),
  };

  cards[cardIndex] = updatedCard;
  saveLocalCards(cards);
  return updatedCard;
}
