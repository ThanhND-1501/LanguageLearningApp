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
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Mic, PenLine, Plus, Search, Headphones, Volume2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { buttonClass } from "@/components/ui/button";
import { DeckSpine, MemoryRamp } from "@/components/deck/DeckCard";
import { EmptyCards } from "@/components/illustrations";
import { deckProgress, isDue, langPair, reviewMinutes } from "@/lib/deck-style";
import { cn } from "@/lib/utils";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "due" | "new" | "learning" | "mastered">("all");

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
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Đang tải">
        <Loader2 className="h-6 w-6 animate-spin text-mute" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGuard
        title="Đăng nhập để xem bộ từ này"
        description="Đăng nhập để xem toàn bộ thẻ, nghe phát âm và bắt đầu ôn tập."
        backHref="/decks"
        backLabel="Về thư viện"
      />
    );
  }

  if (!deck) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-mute" />
        <p className="text-ink-2">Đang tải bộ từ…</p>
        <Link href="/decks" className="text-sm font-semibold text-primary-ink hover:underline">Về thư viện</Link>
      </div>
    );
  }

  const now = Date.now();
  const p = deckProgress(cards, now);
  const q = query.toLowerCase().trim();
  const visible = cards.filter((c) => {
    if (statusFilter === "due" && !isDue(c, now)) return false;
    if (statusFilter !== "all" && statusFilter !== "due" && c.status !== statusFilter) return false;
    if (q && !c.term.toLowerCase().includes(q) && !c.definition.toLowerCase().includes(q)) return false;
    return true;
  });

  const STATUS_LABEL: Record<Card["status"], string> = { new: "Mới", learning: "Đang học", mastered: "Đã thuộc" };
  const FILTERS: [typeof statusFilter, string, number][] = [
    ["all", "Tất cả", p.total],
    ["due", "Cần ôn", p.due],
    ["new", "Mới", p.newCount],
    ["learning", "Đang học", p.learning],
    ["mastered", "Đã thuộc", p.mastered],
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
      <Link href="/decks" className="inline-flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Thư viện
      </Link>

      {/* Header */}
      <header className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex items-start gap-4">
          <DeckSpine deck={deck} className="h-14 w-11 text-sm" />
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]">{deck.title}</h1>
            <p className="mt-1 text-[15px] text-mute">
              {langPair(deck)} · {p.total} thẻ
            </p>
            {deck.description && <p className="mt-3 max-w-[60ch] text-ink-2">{deck.description}</p>}
            {deck.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {deck.tags.map((t) => (
                  <span key={t} className="rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink-2">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Study panel */}
        <section aria-label="Ôn tập" className="rounded-2xl border border-line bg-surface p-5 shadow-raised">
          {p.total === 0 ? (
            <>
              <p className="font-semibold">Bộ từ chưa có thẻ nào</p>
              <p className="mt-1 text-sm text-ink-2">Thêm thẻ để bắt đầu ôn tập.</p>
              <button type="button" onClick={handleOpenAddModal} className={buttonClass("primary", "md", "mt-4 w-full")}>
                <Plus className="h-4 w-4" /> Thêm thẻ đầu tiên
              </button>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span>
                  <span className="text-3xl font-bold tracking-tight">{p.due}</span>
                  <span className="ml-2 font-semibold">thẻ cần ôn</span>
                </span>
                <span className="text-sm text-mute">{p.masteredPct}% đã thuộc</span>
              </div>
              <MemoryRamp className="mt-3" newCount={p.newCount} learning={p.learning} mastered={p.mastered} />
              <div className="mt-2 flex gap-4 text-xs text-mute">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" />{p.mastered} đã thuộc</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary/45" />{p.learning} đang học</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-line-strong" />{p.newCount} mới</span>
              </div>
              <Link href={`/study/${deck.id}?mode=flashcard`} className={buttonClass("primary", "md", "mt-5 w-full")}>
                {p.due > 0 ? `Ôn ${p.due} thẻ · khoảng ${reviewMinutes(p.due)} phút` : "Ôn lại bằng thẻ lật"}
              </Link>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <Link href={`/study/${deck.id}?mode=write`} className={buttonClass("secondary", "sm")}>
                  <PenLine className="h-4 w-4" /> Gõ lại từ
                </Link>
                <Link href={`/study/${deck.id}?mode=dictation`} className={buttonClass("secondary", "sm")}>
                  <Headphones className="h-4 w-4" /> Nghe chép
                </Link>
              </div>
            </>
          )}
        </section>
      </header>

      {/* Cards */}
      <section aria-labelledby="cards-title" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="cards-title" className="text-lg font-bold tracking-tight">Thẻ trong bộ</h2>
          <div className="flex gap-2.5">
            <button type="button" onClick={handleOpenAiModal} className={buttonClass("secondary", "sm")}>
              <ImagePlus className="h-4 w-4" /> Tạo bằng AI
            </button>
            <button type="button" onClick={handleOpenAddModal} className={buttonClass("primary", "sm")}>
              <Plus className="h-4 w-4" /> Thêm thẻ
            </button>
          </div>
        </div>

        {p.total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Lọc theo trạng thái">
              {FILTERS.map(([id, label, n]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={statusFilter === id}
                  onClick={() => setStatusFilter(id)}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors",
                    statusFilter === id ? "border-primary bg-primary-soft text-primary-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                  )}
                >
                  {label} <span className="opacity-70">{n}</span>
                </button>
              ))}
            </div>
            <label className="relative ml-auto w-full sm:w-64">
              <span className="sr-only">Tìm thẻ</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm từ hoặc nghĩa…" className="field h-9 pl-9 text-sm" />
            </label>
          </div>
        )}

        {p.total === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
            <EmptyCards className="h-auto w-44" />
            <p className="mt-4 font-semibold">Chưa có thẻ nào</p>
            <p className="mt-1 max-w-sm text-sm text-ink-2">Gõ một từ và tra từ điển Cambridge để điền sẵn phiên âm, nghĩa và câu ví dụ, hoặc tạo hàng loạt bằng AI từ ảnh chụp.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-4 rounded-card border border-line bg-surface px-5 py-10 text-center text-ink-2">Không có thẻ nào khớp bộ lọc.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
            {visible.map((card) => (
              <li key={card.id} className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <button
                      type="button"
                      onClick={() => playNativePronunciation(card.term)}
                      aria-label={`Nghe phát âm “${card.term}”`}
                      className="-ml-1.5 grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-primary-soft hover:text-primary-ink"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <span className="text-[17px] font-semibold">{card.term}</span>
                    {card.phonetic && <span className="text-sm text-mute">{card.phonetic}</span>}
                    {card.partOfSpeech && <span className="text-sm italic text-mute">{card.partOfSpeech}</span>}
                  </div>
                  <p className="mt-1 text-ink-2">{card.definition}</p>
                  {card.exampleSentence && <p className="mt-1 text-sm italic text-mute">“{card.exampleSentence}”</p>}
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <div className="text-right text-xs leading-relaxed">
                    <div className={cn("font-semibold", card.status === "mastered" ? "text-primary-ink" : card.status === "learning" ? "text-ink-2" : "text-mute")}>
                      {STATUS_LABEL[card.status]}
                    </div>
                    <div className="text-mute">{card.status === "new" ? "Chưa học" : formatRelativeDate(card.nextReviewAt)}</div>
                  </div>
                  <button type="button" onClick={() => handleStartSpeechPractice(card)} className={buttonClass("soft", "sm")}>
                    <Mic className="h-4 w-4" /> Luyện nói
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAddModal && (
        <Modal
          title="Thêm thẻ"
          description="Gõ từ rồi bấm Tra từ điển để điền sẵn các trường còn lại."
          onClose={() => { setAvailableExamples([]); setShowAddModal(false); }}
          footer={
            <>
              <button type="button" onClick={() => { setAvailableExamples([]); setShowAddModal(false); }} className={buttonClass("ghost", "md")}>Hủy</button>
              <button type="submit" form="add-card" disabled={!newTerm.trim() || !newDef.trim()} className={buttonClass("primary", "md")}>Thêm thẻ</button>
            </>
          }
        >
          <form id="add-card" onSubmit={handleAddManualCard} className="space-y-4">
            <div>
              <label htmlFor="term" className="label">Từ vựng</label>
              <div className="flex gap-2">
                <input
                  id="term"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLookupCambridge(); } }}
                  placeholder="pragmatic"
                  className="field"
                />
                <button type="button" onClick={handleLookupCambridge} disabled={!newTerm.trim() || isLookingUp} className={buttonClass("soft", "md", "shrink-0")}>
                  {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Tra từ điển
                </button>
              </div>
              {lookupError && (
                <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-poor">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {lookupError} Bạn vẫn có thể tự điền.
                </p>
              )}
            </div>
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div>
                <label htmlFor="ipa" className="label">Phiên âm</label>
                <input id="ipa" value={newPhonetic} onChange={(e) => setNewPhonetic(e.target.value)} placeholder="/præɡˈmæt.ɪk/" className="field" />
              </div>
              <div>
                <label htmlFor="pos" className="label">Từ loại</label>
                <select id="pos" value={newPartOfSpeech} onChange={(e) => setNewPartOfSpeech(e.target.value)} className="field">
                  {Array.from(new Set([newPartOfSpeech, "noun", "verb", "adjective", "adverb", "phrase", "preposition"])).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {newAudioUrl && (
              <div className="flex items-center justify-between rounded-[10px] bg-good-soft px-3.5 py-2.5 text-sm text-good">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Đã có file phát âm từ Cambridge</span>
                <button type="button" onClick={() => new Audio(newAudioUrl).play()} className="flex items-center gap-1 font-semibold hover:underline">
                  <Volume2 className="h-4 w-4" /> Nghe thử
                </button>
              </div>
            )}
            <div>
              <label htmlFor="def" className="label">Nghĩa tiếng Việt</label>
              <input id="def" required value={newDef} onChange={(e) => setNewDef(e.target.value)} placeholder="thực tế, thực dụng" className="field" />
            </div>
            <div>
              <label htmlFor="ex" className="label">Câu ví dụ <span className="font-normal text-mute">(không bắt buộc)</span></label>
              <textarea id="ex" rows={2} value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="We need a pragmatic approach to meet the deadline." className="field h-auto py-2.5" />
              {availableExamples.length > 1 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-mute">Ví dụ khác, bấm để chọn:</p>
                  <div className="mt-1.5 flex max-h-32 flex-col gap-1.5 overflow-y-auto">
                    {availableExamples.slice(0, 4).map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewExample(ex)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          newExample === ex ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink-2 hover:border-line-strong"
                        )}
                      >
                        “{ex}”
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {activeSpeechCard && <SpeechPracticeModal card={activeSpeechCard} onClose={() => setActiveSpeechCard(null)} />}
      {showAiModal && <PhotoToCardModal deckId={deck.id} onAddCards={handleAddAiCards} onClose={() => setShowAiModal(false)} />}
    </div>
  );
}
