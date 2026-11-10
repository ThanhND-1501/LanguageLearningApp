"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, ImagePlus, Plus, Search, X } from "lucide-react";
import { Deck, Card, UserProfile } from "@/types";
import {
  getLocalDecks,
  getLocalCards,
  saveLocalDecks,
  getGlobalSharedDecks,
  isDeckEnrolled,
  enrollInDeck,
} from "@/lib/storage";
import { getActiveUser, recordStudyActivity } from "@/lib/auth";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { mapDbToDeck } from "@/lib/sync";
import {
  CEFR_LEVELS,
  EXAM_TYPES,
  TOPICS,
  CefrLevel,
  ExamType,
  TopicType,
  filterDecksByTaxonomy,
  getCascadingTaxonomyCounts,
} from "@/lib/taxonomy";
import { DeckCard } from "@/components/deck/DeckCard";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";
import { DocumentUploadModal } from "@/components/deck/DocumentUploadModal";
import { Modal, Toast } from "@/components/ui/Modal";
import { buttonClass } from "@/components/ui/button";
import { EmptyCards } from "@/components/illustrations";
import { cn } from "@/lib/utils";

const PAGE = 24;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary-soft text-primary-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

export default function DecksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<"mine" | "catalog">("catalog");
  const [personalDecks, setPersonalDecks] = useState<Deck[]>([]);
  const [globalDecks, setGlobalDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [query, setQuery] = useState("");
  const [exam, setExam] = useState<ExamType>("all");
  const [topic, setTopic] = useState<TopicType>("all");
  const [level, setLevel] = useState<CefrLevel>("all");
  const [limit, setLimit] = useState(PAGE);

  const [showCreate, setShowCreate] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");

  const refreshData = () => {
    const user = getActiveUser();
    setCurrentUser(user);
    setPersonalDecks(getLocalDecks(user?.id));
    setGlobalDecks(getGlobalSharedDecks());
    setCards(getLocalCards());
    return user;
  };

  useEffect(() => {
    const user = refreshData();
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
    else if (user && getLocalDecks(user.id).length > 0) setTab("mine");
    if (user && params.get("create") === "1") setShowCreate(true);

    if (isSupabaseConfigured()) {
      getSupabase()
        ?.from("decks")
        .select("*")
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped = data.map(mapDbToDeck);
            setGlobalDecks(mapped);
            saveLocalDecks(mapped);
          }
        });
    }
  }, []);

  useEffect(() => setLimit(PAGE), [query, exam, topic, level]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const requireLogin = (msg: string) => {
    if (currentUser) return true;
    showToast(msg);
    setTimeout(() => router.push("/login"), 900);
    return false;
  };

  const handleEnroll = (deckId: string) => {
    if (!requireLogin("Đăng nhập để thêm bộ từ này vào bộ của bạn.")) return;
    const res = enrollInDeck(deckId, currentUser!.id);
    if (res.success && res.deck) {
      recordStudyActivity(
        {
          type: "card_created",
          title: "Thêm bộ từ để học",
          description: `Đã thêm "${res.deck.title}" vào bộ từ của bạn`,
          metadata: { deckId, cardsCount: res.deck.totalCards },
        },
        currentUser!.id
      );
      showToast(`Đã thêm “${res.deck.title}” vào bộ từ của bạn.`);
      refreshData();
    }
  };

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "Bộ từ vựng cá nhân",
      targetLang: "en-US",
      nativeLang: "vi-VN",
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      totalCards: 0,
      createdAt: new Date().toISOString(),
      ownerId: currentUser?.id || "user-local",
      isGlobal: false,
    };
    saveLocalDecks([newDeck, ...personalDecks]);
    recordStudyActivity(
      { type: "deck_created", title: "Tạo bộ từ mới", description: `Đã tạo bộ từ "${newDeck.title}"`, metadata: { deckId: newDeck.id } },
      currentUser?.id
    );
    setNewTitle("");
    setNewDesc("");
    setNewTags("");
    setShowCreate(false);
    router.push(`/decks/${newDeck.id}`);
  };

  const handleAddCards = (newCards: Card[]) => {
    const updated = [...cards, ...newCards];
    setCards(updated);
    localStorage.setItem("lingopulse_cards_v1", JSON.stringify(updated));
    refreshData();
  };

  const counts = useMemo(() => getCascadingTaxonomyCounts(globalDecks, exam, topic), [globalDecks, exam, topic]);
  const catalog = useMemo(
    () => filterDecksByTaxonomy(globalDecks, { examType: exam, topic, level, searchQuery: query }),
    [globalDecks, exam, topic, level, query]
  );
  const mine = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return personalDecks;
    return personalDecks.filter(
      (d) => d.title.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [personalDecks, query]);

  const filtersActive = exam !== "all" || topic !== "all" || level !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setExam("all");
    setTopic("all");
    setLevel("all");
    setQuery("");
  };

  const selectStyle =
    "field h-10 w-auto min-w-[180px] appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 text-sm";
  const chevron = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d6684' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Thư viện</h1>
          <p className="mt-1 text-ink-2">Bộ từ bạn đang học và các bộ có sẵn để thêm vào.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => requireLogin("Đăng nhập để tải tài liệu lên.") && setShowUpload(true)} className={buttonClass("secondary", "md")}>
            <FileUp className="h-4 w-4" />
            Tạo từ tài liệu
          </button>
          <button type="button" onClick={() => requireLogin("Đăng nhập để tạo thẻ bằng AI.") && setShowAi(true)} className={buttonClass("secondary", "md", "hidden sm:inline-flex")}>
            <ImagePlus className="h-4 w-4" />
            Tạo từ ảnh hoặc chủ đề
          </button>
          <button type="button" onClick={() => requireLogin("Đăng nhập để tạo bộ từ mới.") && setShowCreate(true)} className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" />
            Tạo bộ từ
          </button>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-line">
        <div role="tablist" className="-mb-px flex gap-6">
          {([
            ["mine", "Bộ từ của tôi", personalDecks.length],
            ["catalog", "Thư viện chung", globalDecks.length],
          ] as const).map(([id, label, n]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 border-b-2 pb-3 text-[15px] font-semibold transition-colors",
                tab === id ? "border-primary text-ink" : "border-transparent text-mute hover:text-ink"
              )}
            >
              {label}
              <span className={cn("rounded-full px-2 py-px text-xs", tab === id ? "bg-primary-soft text-primary-ink" : "bg-subtle text-mute")}>{n}</span>
            </button>
          ))}
        </div>
        <label className="relative mb-3 w-full sm:w-72">
          <span className="sr-only">Tìm bộ từ</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc thẻ…" className="field h-10 pl-9 text-sm" />
        </label>
      </div>

      {tab === "mine" ? (
        <section className="mt-6">
          {!currentUser ? (
            <div className="flex flex-col items-center py-16 text-center">
              <EmptyCards className="h-auto w-48" />
              <h2 className="mt-5 text-xl font-bold">Đăng nhập để xem bộ từ của bạn</h2>
              <p className="mt-1.5 max-w-sm text-ink-2">Bộ từ bạn tạo hoặc thêm từ thư viện chung sẽ nằm ở đây.</p>
              <button type="button" onClick={() => router.push("/login")} className={buttonClass("primary", "md", "mt-6")}>Đăng nhập</button>
            </div>
          ) : personalDecks.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <EmptyCards className="h-auto w-48" />
              <h2 className="mt-5 text-xl font-bold">Bạn chưa có bộ từ nào</h2>
              <p className="mt-1.5 max-w-md text-ink-2">Thêm một bộ có sẵn từ thư viện chung, hoặc tự tạo từ danh sách từ, ảnh chụp hay tài liệu.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <button type="button" onClick={() => setTab("catalog")} className={buttonClass("primary", "md")}>Xem thư viện chung</button>
                <button type="button" onClick={() => setShowCreate(true)} className={buttonClass("secondary", "md")}>Tạo bộ từ</button>
              </div>
            </div>
          ) : mine.length === 0 ? (
            <p className="py-16 text-center text-ink-2">Không có bộ từ nào khớp “{query}”.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((deck) => (
                <DeckCard key={deck.id} deck={deck} cards={cards.filter((c) => c.deckId === deck.id)} isEnrolled isLoggedIn />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Lọc theo chương trình">
            {EXAM_TYPES.filter((e) => e.id === "all" || (counts.examCounts[e.id]?.decks || 0) > 0).map((e) => (
              <Chip key={e.id} active={exam === e.id} onClick={() => { setExam(e.id); setTopic("all"); setLevel("all"); }}>
                {e.shortLabel}
                <span className="ml-1.5 text-mute">{counts.examCounts[e.id]?.decks || 0}</span>
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <label className="sr-only" htmlFor="topic">Chủ đề</label>
            <select id="topic" value={topic} onChange={(e) => { setTopic(e.target.value as TopicType); setLevel("all"); }} className={selectStyle} style={chevron}>
              {TOPICS.filter((t) => t.id === "all" || (counts.topicCounts[t.id]?.decks || 0) > 0).map((t) => (
                <option key={t.id} value={t.id}>{t.id === "all" ? "Mọi chủ đề" : `${t.label} (${counts.topicCounts[t.id]?.decks || 0})`}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="level">Trình độ</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value as CefrLevel)} className={selectStyle} style={chevron}>
              {CEFR_LEVELS.filter((l) => l.id === "all" || (counts.levelCounts[l.id]?.decks || 0) > 0).map((l) => (
                <option key={l.id} value={l.id}>{l.id === "all" ? "Mọi trình độ" : `${l.label} (${counts.levelCounts[l.id]?.decks || 0})`}</option>
              ))}
            </select>
            <span className="ml-auto text-sm text-mute">
              {catalog.length} bộ từ
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="ml-3 inline-flex items-center gap-1 font-semibold text-primary-ink hover:underline">
                  <X className="h-3.5 w-3.5" /> Xóa bộ lọc
                </button>
              )}
            </span>
          </div>

          {catalog.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-ink-2">Không có bộ từ nào khớp bộ lọc này.</p>
              <button type="button" onClick={clearFilters} className={buttonClass("secondary", "sm", "mt-4")}>Xóa bộ lọc</button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.slice(0, limit).map((deck) => {
                  const enrolled = Boolean(currentUser && isDeckEnrolled(deck.id, currentUser.id));
                  return (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      cards={cards.filter((c) => c.deckId === deck.id)}
                      isEnrolled={enrolled}
                      isLoggedIn={!!currentUser}
                      onEnroll={() => handleEnroll(deck.id)}
                    />
                  );
                })}
              </div>
              {catalog.length > limit && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setLimit((l) => l + PAGE)} className={buttonClass("secondary", "md")}>
                    Xem thêm {Math.min(PAGE, catalog.length - limit)} bộ từ
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showCreate && (
        <Modal
          title="Tạo bộ từ mới"
          description="Đặt tên cho bộ từ. Bạn sẽ thêm thẻ ở bước tiếp theo."
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowCreate(false)} className={buttonClass("ghost", "md")}>Hủy</button>
              <button type="submit" form="create-deck" disabled={!newTitle.trim()} className={buttonClass("primary", "md")}>Tạo bộ từ</button>
            </>
          }
        >
          <form id="create-deck" onSubmit={handleCreateDeck} className="space-y-4">
            <div>
              <label htmlFor="deck-title" className="label">Tên bộ từ</label>
              <input id="deck-title" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ví dụ: Tiếng Anh chuyên ngành Marketing" className="field" />
            </div>
            <div>
              <label htmlFor="deck-desc" className="label">Mô tả <span className="font-normal text-mute">(không bắt buộc)</span></label>
              <textarea id="deck-desc" rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Bộ từ này để làm gì?" className="field h-auto py-2.5" />
            </div>
            <div>
              <label htmlFor="deck-tags" className="label">Thẻ phân loại <span className="font-normal text-mute">(cách nhau bằng dấu phẩy)</span></label>
              <input id="deck-tags" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="TOEIC, Công sở" className="field" />
            </div>
          </form>
        </Modal>
      )}

      {showAi && (
        <PhotoToCardModal deckId={personalDecks[0]?.id || "deck-ielts-mastery"} onAddCards={handleAddCards} onClose={() => setShowAi(false)} />
      )}

      {showUpload && (
        <DocumentUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            showToast("Đã tạo bộ từ từ tài liệu của bạn.");
            setTab("mine");
            refreshData();
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
