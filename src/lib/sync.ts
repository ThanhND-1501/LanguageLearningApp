// ==============================================================================
// Cloud & Local Synchronization Engine
// Bridges LocalStorage (0ms offline speed) and Supabase PostgreSQL Database
// ==============================================================================

import { Deck, Card, SpeakingAttempt } from "@/types";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getLocalDecks, saveLocalDecks, getLocalCards, saveLocalCards } from "./storage";

// ------------------------------------------------------------------------------
// Data Transformations: Domain (camelCase) <-> Database (snake_case)
// ------------------------------------------------------------------------------

export function mapDeckToDb(deck: Deck) {
  return {
    id: deck.id,
    title: deck.title,
    description: deck.description || null,
    target_lang: deck.targetLang || "en-US",
    native_lang: deck.nativeLang || "vi-VN",
    tags: deck.tags || [],
    total_cards: deck.totalCards || 0,
    created_at: deck.createdAt || new Date().toISOString(),
    updated_at: deck.updatedAt || new Date().toISOString(),
  };
}

export function mapDbToDeck(row: any): Deck {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    targetLang: row.target_lang || "en-US",
    nativeLang: row.native_lang || "vi-VN",
    tags: row.tags || [],
    totalCards: row.total_cards || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at,
  };
}

export function mapCardToDb(card: Card) {
  return {
    id: card.id,
    deck_id: card.deckId,
    term: card.term,
    phonetic: card.phonetic || null,
    part_of_speech: card.partOfSpeech || null,
    definition: card.definition,
    example_sentence: card.exampleSentence || null,
    example_translation: card.exampleTranslation || null,
    synonyms: card.synonyms || [],
    audio_url: card.audioUrl || null,
    image_url: card.imageUrl || null,
    speaking_prompt: card.speakingPrompt || null,
    status: card.status || "new",
    repetition: card.repetition || 0,
    easiness_factor: card.easinessFactor || 2.5,
    interval_days: card.intervalDays || 0,
    next_review_at: card.nextReviewAt || new Date().toISOString(),
    last_reviewed_at: card.lastReviewedAt || null,
  };
}

export function mapDbToCard(row: any): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    term: row.term,
    phonetic: row.phonetic || undefined,
    partOfSpeech: row.part_of_speech || undefined,
    definition: row.definition,
    exampleSentence: row.example_sentence || undefined,
    exampleTranslation: row.example_translation || undefined,
    synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
    audioUrl: row.audio_url || undefined,
    imageUrl: row.image_url || undefined,
    speakingPrompt: row.speaking_prompt || undefined,
    status: row.status || "new",
    repetition: row.repetition || 0,
    easinessFactor: row.easiness_factor || 2.5,
    intervalDays: row.interval_days || 0,
    nextReviewAt: row.next_review_at || new Date().toISOString(),
    lastReviewedAt: row.last_reviewed_at || undefined,
  };
}

export function mapSpeakingAttemptToDb(attempt: SpeakingAttempt) {
  return {
    id: attempt.id,
    card_id: attempt.cardId || null,
    prompt_question: attempt.promptQuestion,
    user_transcript: attempt.userTranscript,
    target_words: attempt.targetWords || [],
    ai_grammar_feedback: attempt.grammarFeedback || null,
    ai_suggested_rewrite: attempt.suggestedRewrite || null,
    pron_score: attempt.pronScores?.pronScore || null,
    accuracy_score: attempt.pronScores?.accuracyScore || null,
    fluency_score: attempt.pronScores?.fluencyScore || null,
    completeness_score: attempt.pronScores?.completenessScore || null,
    prosody_score: attempt.pronScores?.prosodyScore || null,
    word_level_scores: attempt.pronScores?.wordScores || [],
    created_at: attempt.createdAt || new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// Synchronization Operations
// ------------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  message: string;
  pushedDecks?: number;
  pushedCards?: number;
  pulledDecks?: number;
  pulledCards?: number;
  error?: string;
}

/**
 * Pushes local decks and cards up to Supabase Cloud
 */
export async function pushToCloud(): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: "Supabase chưa được cấu hình", error: "UNCONFIGURED" };
  }

  try {
    const localDecks = getLocalDecks();
    const localCards = getLocalCards();

    // 1. Upsert Decks
    if (localDecks.length > 0) {
      const dbDecks = localDecks.map(mapDeckToDb);
      const { error: deckErr } = await supabase.from("decks").upsert(dbDecks, { onConflict: "id" });
      if (deckErr) throw deckErr;
    }

    // 2. Upsert Cards
    if (localCards.length > 0) {
      const dbCards = localCards.map(mapCardToDb);
      const { error: cardErr } = await supabase.from("cards").upsert(dbCards, { onConflict: "id" });
      if (cardErr) throw cardErr;
    }

    return {
      success: true,
      message: `Đã đồng bộ lên đám mây: ${localDecks.length} bộ từ và ${localCards.length} thẻ.`,
      pushedDecks: localDecks.length,
      pushedCards: localCards.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Không thể đẩy dữ liệu lên đám mây",
      error: err.message || String(err),
    };
  }
}

/**
 * Pulls decks and cards from Supabase and merges with LocalStorage
 */
export async function pullFromCloud(): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: "Supabase chưa được cấu hình", error: "UNCONFIGURED" };
  }

  try {
    // 1. Fetch cloud decks
    const { data: cloudDecksRaw, error: deckErr } = await supabase.from("decks").select("*");
    if (deckErr) throw deckErr;

    // 2. Fetch cloud cards
    const { data: cloudCardsRaw, error: cardErr } = await supabase.from("cards").select("*");
    if (cardErr) throw cardErr;

    const cloudDecks: Deck[] = (cloudDecksRaw || []).map(mapDbToDeck);
    const cloudCards: Card[] = (cloudCardsRaw || []).map(mapDbToCard);

    // Merge with local decks: Cloud items take precedence or join
    const localDecks = getLocalDecks();
    const localCards = getLocalCards();

    const mergedDecksMap = new Map<string, Deck>();
    localDecks.forEach((d) => mergedDecksMap.set(d.id, d));
    cloudDecks.forEach((d) => mergedDecksMap.set(d.id, d)); // Cloud updates local
    const mergedDecks = Array.from(mergedDecksMap.values());
    saveLocalDecks(mergedDecks);

    const mergedCardsMap = new Map<string, Card>();
    localCards.forEach((c) => mergedCardsMap.set(c.id, c));
    cloudCards.forEach((c) => mergedCardsMap.set(c.id, c));
    const mergedCards = Array.from(mergedCardsMap.values());
    saveLocalCards(mergedCards);

    return {
      success: true,
      message: `Đã tải về và hợp nhất ${cloudDecks.length} bộ từ và ${cloudCards.length} thẻ từ đám mây.`,
      pulledDecks: cloudDecks.length,
      pulledCards: cloudCards.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Không thể tải dữ liệu từ đám mây",
      error: err.message || String(err),
    };
  }
}

/**
 * Two-way sync: Pulls latest data then pushes any unsynced local changes
 */
export async function syncAll(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Supabase chưa được cấu hình trong .env.local",
      error: "UNCONFIGURED",
    };
  }

  const pullResult = await pullFromCloud();
  if (!pullResult.success) {
    return pullResult;
  }

  const pushResult = await pushToCloud();
  return pushResult;
}

/**
 * Records a speaking attempt in Supabase if connected
 */
export async function saveSpeakingAttemptCloud(attempt: SpeakingAttempt): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const dbPayload = mapSpeakingAttemptToDb(attempt);
    const { error } = await supabase.from("speaking_attempts").insert(dbPayload);
    return !error;
  } catch {
    return false;
  }
}

