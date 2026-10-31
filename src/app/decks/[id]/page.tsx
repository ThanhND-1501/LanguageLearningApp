"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Deck, Card } from "@/types";
import { getLocalDecks, getLocalCards, saveLocalCards } from "@/lib/storage";
import { playNativePronunciation } from "@/lib/audio";
import { SpeechPracticeModal } from "@/components/speaking/SpeechPracticeModal";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";
import {
  Volume2,
  Play,
  Plus,
  Sparkles,
  ArrowLeft,
  Clock,
  Mic,
  BookOpen,
  Edit3,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeSpeechCard, setActiveSpeechCard] = useState<Card | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New card form state
  const [newTerm, setNewTerm] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newPartOfSpeech, setNewPartOfSpeech] = useState("noun");
  const [newDef, setNewDef] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");
  const [availableExamples, setAvailableExamples] = useState<string[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookupCambridge = async () => {
    if (!newTerm.trim()) return;
    try {
      setIsLookingUp(true);
      setLookupError(null);
      setAvailableExamples([]);
      const res = await fetch(`/api/dictionary/lookup?word=${encodeURIComponent(newTerm.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.data) {
        setLookupError(data.message || "Không tìm thấy từ trên từ điển Cambridge.");
        return;
      }

      const wordEntry = data.data;
      if (wordEntry.phoneticUk || wordEntry.phoneticUs) {
        setNewPhonetic(wordEntry.phoneticUk || wordEntry.phoneticUs);
      }
      if (wordEntry.partOfSpeech) {
        setNewPartOfSpeech(wordEntry.partOfSpeech);
      }
      if (wordEntry.audioUsUrl || wordEntry.audioUkUrl) {
        setNewAudioUrl(wordEntry.audioUsUrl || wordEntry.audioUkUrl);
      }

      const firstDef = wordEntry.definitions?.[0];
      if (firstDef) {
        setNewDef(firstDef.vietnameseTranslation || firstDef.englishDef);
      }

      // Automatically populate example sentence from definition or multi-tier providers
      const allEx: string[] =
        wordEntry.examples && wordEntry.examples.length > 0
          ? wordEntry.examples
          : (wordEntry.definitions?.flatMap((d: any) => d.examples || []) || []);

      const primaryEx = wordEntry.example || firstDef?.examples?.[0] || allEx[0];
      if (primaryEx) {
        setNewExample(primaryEx);
      }
      if (allEx.length > 0) {
        setAvailableExamples(allEx);
      }
    } catch {
      setLookupError("Lỗi kết nối tới dịch vụ tra từ điển Cambridge.");
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    const allDecks = getLocalDecks();
    const foundDeck = allDecks.find((d) => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
    }

    const allCards = getLocalCards();
    setCards(allCards.filter((c) => c.deckId === deckId));
  }, [deckId]);

  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDef.trim()) return;

    const newCard: Card = {
      id: `card-${Date.now()}`,
      deckId,
      term: newTerm.trim(),
      phonetic: newPhonetic.trim(),
      partOfSpeech: newPartOfSpeech,
      definition: newDef.trim(),
      exampleSentence: newExample.trim(),
      audioUrl: newAudioUrl.trim() || undefined,
      status: "new",
      repetition: 0,
      easinessFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: new Date().toISOString(),
    };

    const allCards = getLocalCards();
    const updated = [newCard, ...allCards];
    saveLocalCards(updated);
    setCards(updated.filter((c) => c.deckId === deckId));

    setNewTerm("");
    setNewPhonetic("");
    setNewDef("");
    setNewExample("");
    setNewAudioUrl("");
    setAvailableExamples([]);
    setLookupError(null);
    setShowAddModal(false);
  };

  const handleAddAiCards = (newAiCards: Card[]) => {
    const allCards = getLocalCards();
    const updated = [...newAiCards, ...allCards];
    saveLocalCards(updated);
    setCards(updated.filter((c) => c.deckId === deckId));
  };

  if (!deck) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-500">Đang tải dữ liệu bộ từ...</p>
      </div>
    );
  }

  const now = Date.now();
  const dueCards = cards.filter((c) => {
    if (c.status === "new") return true;
    return new Date(c.nextReviewAt).getTime() <= now;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/decks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách bộ từ</span>
        </Link>
      </div>

      {/* Deck Header & Study Launcher */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {deck.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {deck.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {deck.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tạo thêm thẻ bằng AI</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm thẻ thủ công</span>
            </button>

            <Link
              href={`/study/${deck.id}?mode=flashcard`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Bắt đầu ôn tập ({dueCards.length})</span>
            </Link>
          </div>
        </div>

        {/* Study Mode Selector tabs */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/study/${deck.id}?mode=flashcard`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-brand-50 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-800/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-indigo-100 text-brand-600 dark:bg-indigo-950 dark:text-brand-300">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Flashcard</p>
              <p className="text-xs text-slate-500">Lật thẻ ghi nhớ SRS</p>
            </div>
          </Link>

          <Link
            href={`/study/${deck.id}?mode=write`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-200 dark:border-slate-800 dark:bg-slate-800/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Write</p>
              <p className="text-xs text-slate-500">Gõ từ chủ động</p>
            </div>
          </Link>

          <Link
            href={`/study/${deck.id}?mode=dictation`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-800/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Dictation</p>
              <p className="text-xs text-slate-500">Nghe chép chính tả</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Cards Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Danh sách từ vựng ({cards.length} thẻ)
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playNativePronunciation(card.term)}
                      className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {card.term}
                    </span>
                    {card.phonetic && (
                      <span className="text-xs font-mono text-brand-600 dark:text-brand-400">
                        {card.phonetic}
                      </span>
                    )}
                    {card.partOfSpeech && (
                      <span className="text-xs text-slate-400 italic">
                        ({card.partOfSpeech})
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        card.status === "mastered"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : card.status === "learning"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 pl-8">
                    {card.definition}
                  </p>

                  {card.exampleSentence && (
                    <p className="text-xs text-slate-500 italic pl-8">
                      &ldquo;{card.exampleSentence}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRelativeDate(card.nextReviewAt)}
                  </span>

                  <button
                    onClick={() => setActiveSpeechCard(card)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Luyện nói</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Thêm thẻ từ vựng mới</h3>
            <form onSubmit={handleAddManualCard} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-500">Từ vựng (Term):</label>
                    <button
                      type="button"
                      onClick={handleLookupCambridge}
                      disabled={!newTerm.trim() || isLookingUp}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-lg dark:bg-brand-950 dark:text-brand-300 disabled:opacity-50 transition-colors"
                      title="Tự động tra phiên âm, từ loại, nghĩa tiếng Việt, câu ví dụ và audio phát âm chuẩn Cambridge"
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang tra...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>⚡ Tra Cambridge</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="VD: pragmatic"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Phiên âm IPA:</label>
                  <input
                    type="text"
                    value={newPhonetic}
                    onChange={(e) => setNewPhonetic(e.target.value)}
                    placeholder="/præɡˈmæt.ɪk/"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {newAudioUrl && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Đã lấy phát âm Cambridge MP3</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(newAudioUrl);
                      audio.play();
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold underline"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Nghe thử</span>
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Nghĩa tiếng Việt:</label>
                <input
                  type="text"
                  required
                  value={newDef}
                  onChange={(e) => setNewDef(e.target.value)}
                  placeholder="Thực tế, thực dụng"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Câu ví dụ ngữ cảnh:</label>
                <textarea
                  rows={2}
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="We need to adopt a pragmatic approach to meet the deadline."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
                {availableExamples.length > 1 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">Gợi ý ví dụ khác (bấm để chọn):</p>
                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                      {availableExamples.slice(0, 4).map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewExample(ex)}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                            newExample === ex
                              ? "bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300 font-medium"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          &ldquo;{ex}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAvailableExamples([]);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
                >
                  Thêm thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Speech Practice Modal */}
      {activeSpeechCard && (
        <SpeechPracticeModal
          card={activeSpeechCard}
          onClose={() => setActiveSpeechCard(null)}
        />
      )}

      {/* AI Generator Modal */}
      {showAiModal && (
        <PhotoToCardModal
          deckId={deck.id}
          onAddCards={handleAddAiCards}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
