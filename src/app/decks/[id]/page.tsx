"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Deck, Card, UserProfile } from "@/types";
import { getLocalDecks, getLocalCards, saveLocalCards } from "@/lib/storage";
import { getActiveUser, recordStudyActivity } from "@/lib/auth";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { mapDbToDeck, mapDbToCard } from "@/lib/sync";
import { playNativePronunciation } from "@/lib/audio";
import { SpeechPracticeModal } from "@/components/speaking/SpeechPracticeModal";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";
import { AuthGuard } from "@/components/auth/AuthGuard";
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

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeSpeechCard, setActiveSpeechCard] = useState<Card | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setCurrentUser(getActiveUser());
    setIsAuthChecking(false);
  }, []);

  const handleOpenAiModal = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setShowAiModal(true);
  };

  const handleOpenAddModal = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setShowAddModal(true);
  };

  const handleStartSpeechPractice = (card: Card) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setActiveSpeechCard(card);
  };

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

      recordStudyActivity({
        type: "cambridge_lookup",
        title: `Tra từ điển Cambridge: ${wordEntry.term}`,
        description: `Tra cứu phát âm và câu ví dụ cho '${wordEntry.term}'`,
        metadata: { term: wordEntry.term },
      });
    } catch {
      setLookupError("Lỗi kết nối tới dịch vụ tra từ điển Cambridge.");
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    if (!getActiveUser()) return;

    const allDecks = getLocalDecks();
    const foundDeck = allDecks.find((d) => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
    }

    const allCards = getLocalCards();
    const localDeckCards = allCards.filter(
      (c) => c.deckId === deckId || (Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
    );
    setCards(localDeckCards);

    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        if (!foundDeck) {
          sb.from("decks")
            .select("*")
            .eq("id", deckId)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setDeck(mapDbToDeck(data));
              }
            });
        }

        sb.from("cards")
          .select("*")
          .or(`deck_id.eq.${deckId},deck_ids.cs.{${deckId}}`)
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const cloudDeckCards = data.map(mapDbToCard);
              // Smart merge: preserve more recent local reviews
              const allStoredCards = getLocalCards();
              const merged = cloudDeckCards.map((cloudCard) => {
                const localCard = allStoredCards.find((c) => c.id === cloudCard.id);
                if (localCard && localCard.lastReviewedAt) {
                  const localTime = new Date(localCard.lastReviewedAt).getTime();
                  const cloudTime = cloudCard.lastReviewedAt ? new Date(cloudCard.lastReviewedAt).getTime() : 0;
                  if (localTime >= cloudTime) {
                    return {
                      ...cloudCard,
                      status: localCard.status,
                      repetition: localCard.repetition,
                      easinessFactor: localCard.easinessFactor,
                      intervalDays: localCard.intervalDays,
                      nextReviewAt: localCard.nextReviewAt,
                      lastReviewedAt: localCard.lastReviewedAt,
                    };
                  }
                }
                return cloudCard;
              });

              setCards(merged);
              // Cache in localStorage alongside other cards
              const remaining = allStoredCards.filter(
                (c) => c.deckId !== deckId && !(Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
              );
              saveLocalCards([...remaining, ...merged]);
            }
          });
      }
    }
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
    setCards(
      updated.filter(
        (c) => c.deckId === deckId || (Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
      )
    );

    recordStudyActivity({
      type: "card_created",
      title: `Thêm từ mới: ${newCard.term}`,
      description: `Đã lưu từ '${newCard.term}' (${newCard.partOfSpeech}) vào kho từ vựng cá nhân`,
      metadata: { term: newCard.term, deckId },
    });

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
    setCards(
      updated.filter(
        (c) => c.deckId === deckId || (Array.isArray(c.deckIds) && c.deckIds.includes(deckId))
      )
    );
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGuard
        featureName="Chi tiết bộ từ vựng"
        title="Đăng nhập để xem chi tiết bộ từ vựng"
        description="Vui lòng đăng nhập để xem danh sách toàn bộ từ vựng, câu ví dụ ngữ cảnh, phát âm bản xứ và bắt đầu ôn tập."
        backHref="/decks"
        backLabel="Xem danh mục bộ từ"
      />
    );
  }

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

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAiModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300 transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tạo thêm thẻ bằng AI</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm thẻ thủ công</span>
            </button>
          </div>
        </div>

        {/* Study Mode Selector tabs */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Chọn chế độ học & ôn tập</span>
            <span>3 chế độ luyện tập phản xạ</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Mode 1: Flashcard (Primary / Default) */}
            <Link
              href={currentUser ? `/study/${deck.id}?mode=flashcard` : "/login"}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-brand-500 bg-gradient-to-r from-brand-50/80 to-indigo-50/60 hover:from-brand-100 hover:to-indigo-100 dark:from-brand-950/40 dark:to-indigo-950/40 dark:border-brand-500 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">Flashcard</p>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black uppercase bg-brand-600 text-white">
                      Ôn tập chính
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lật thẻ phản xạ Spaced Repetition (SRS)</p>
                </div>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                dueCards.length > 0
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {dueCards.length > 0 ? `${dueCards.length} cần ôn` : "0 cần ôn"}
              </span>
            </Link>

            {/* Mode 2: Write */}
            <Link
              href={currentUser ? `/study/${deck.id}?mode=write` : "/login"}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700 transition-all shadow-xs group"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Write (Chính tả)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gõ từ chủ động theo định nghĩa</p>
              </div>
            </Link>

            {/* Mode 3: Dictation */}
            <Link
              href={currentUser ? `/study/${deck.id}?mode=dictation` : "/login"}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 transition-all shadow-xs group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dictation (Nghe chép)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nghe audio và chép lại từ vựng</p>
              </div>
            </Link>
          </div>
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
                  {card.status === "new" ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      Từ mới
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeDate(card.nextReviewAt)}
                    </span>
                  )}

                  <button
                    onClick={() => handleStartSpeechPractice(card)}
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
