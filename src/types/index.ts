// ==============================================================================
// Domain Type Definitions for LingoPulse AI
// ==============================================================================

export type CardStatus = 'new' | 'learning' | 'mastered';
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface Deck {
  id: string;
  title: string;
  description: string;
  targetLang: string;
  nativeLang: string;
  tags: string[];
  totalCards: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Card {
  id: string;
  deckId: string;
  term: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  synonyms?: string[];
  audioUrl?: string;
  imageUrl?: string;
  speakingPrompt?: string;

  // SRS Engine attributes
  status: CardStatus;
  repetition: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewAt: string; // ISO 8601 string
  lastReviewedAt?: string;
}

export interface DeckStats {
  total: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
  dueCount: number;
}

// ------------------------------------------------------------------------------
// PronScore Engine (Azure AI Speech Assessment Data Structures)
// ------------------------------------------------------------------------------
export interface WordScore {
  word: string;
  score: number;
  accuracyScore?: number;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
}

export interface PronScoreResult {
  pronScore: number;         // Overall weighted score (0 - 100)
  accuracyScore: number;     // Phoneme correctness (0 - 100)
  fluencyScore: number;      // Smoothness and pause rhythm (0 - 100)
  completenessScore: number; // Ratio of recognized words vs target text (0 - 100)
  prosodyScore: number;      // Stress, intonation, and rhythm naturalness (0 - 100)
  wordScores: WordScore[];
}

export interface SpeakingAttempt {
  id: string;
  cardId?: string;
  promptQuestion: string;
  userTranscript: string;
  targetWords: string[];
  grammarFeedback?: string;
  suggestedRewrite?: string;
  pronScores?: PronScoreResult;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// AI Roleplay Conversation Structures
// ------------------------------------------------------------------------------
export interface ConversationMessage {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
  pronScores?: PronScoreResult;
  grammarFeedback?: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  aiPersona: string;
  initialMessage: string;
  targetWords: string[];
}

export interface ConversationSession {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  targetWords: string[];
  usedWords: string[];
  messages: ConversationMessage[];
  status: 'in_progress' | 'completed';
  createdAt: string;
}

// ------------------------------------------------------------------------------
// AI Pipeline API Request & Response Types
// ------------------------------------------------------------------------------
export interface GeneratedCardItem {
  term: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  exampleTranslation: string;
  synonyms: string[];
  speakingPrompt: string;
}

export interface GenerateCardsRequest {
  topic?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  count?: number;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface GrammarEvaluationResult {
  hasUsedTargetWords: boolean;
  missingWords: string[];
  hasGrammarErrors: boolean;
  explanationVi: string;
  correctedSentence: string;
  naturalRewrite: string;
}
