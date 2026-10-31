"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { DeckCard } from "@/components/deck/DeckCard";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";
import { DocumentUploadModal } from "@/components/deck/DocumentUploadModal";
import {
  Search,
  Plus,
  Sparkles,
  Upload,
  Globe,
  BookOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";

export default function DecksPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "global">("personal");
  const [personalDecks, setPersonalDecks] = useState<Deck[]>([]);
  const [globalDecks, setGlobalDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for manual deck creation
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");

  const refreshData = () => {
    const user = getActiveUser();
    setCurrentUser(user);
    setPersonalDecks(getLocalDecks(user?.id));
    setGlobalDecks(getGlobalSharedDecks());
    setCards(getLocalCards(user?.id));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleEnroll = (deckId: string) => {
    const res = enrollInDeck(deckId, currentUser?.id);
    if (res.success && res.deck) {
      recordStudyActivity(
        {
          type: "card_created",
          title: "Đăng ký học bộ từ vựng",
          description: `Đã thêm "${res.deck.title}" vào kho từ vựng cá nhân`,
          metadata: { deckId, cardsCount: res.deck.totalCards },
        },
        currentUser?.id
      );
      showToast(`Đã thêm thành công "${res.deck.title}" vào bộ từ cá nhân của bạn!`);
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
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      totalCards: 0,
      createdAt: new Date().toISOString(),
      ownerId: currentUser?.id || "user-local",
      isGlobal: false,
    };

    const updated = [newDeck, ...personalDecks];
    setPersonalDecks(updated);
    saveLocalDecks(updated);

    recordStudyActivity(
      {
        type: "deck_created",
        title: "Tạo bộ từ mới",
        description: `Đã tạo bộ từ "${newDeck.title}"`,
        metadata: { deckId: newDeck.id },
      },
      currentUser?.id
    );

    setNewTitle("");
    setNewDesc("");
    setNewTags("");
    setShowCreateModal(false);
    showToast(`Đã tạo bộ từ mới "${newDeck.title}"!`);
    refreshData();
  };

  const handleAddCards = (newCards: Card[]) => {
    const updated = [...cards, ...newCards];
    setCards(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("lingopulse_cards_v1", JSON.stringify(updated));
    }
    refreshData();
  };

  const currentDeckList = activeTab === "personal" ? personalDecks : globalDecks;
  const allTags = Array.from(new Set(currentDeckList.flatMap((d) => d.tags)));

  const filteredDecks = currentDeckList.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? deck.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-brand-600 shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-white" />
          <span>{notification}</span>
        </div>
      )}

      {/* Guest Banner if not logged in */}
      {!currentUser && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Bạn đang trải nghiệm ở chế độ Khách.{" "}
              <strong>Đăng ký hoặc Đăng nhập</strong> để lưu kho từ vựng cá nhân và đồng bộ chuỗi ngày học!
            </span>
          </div>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Kho Bộ Từ Vựng (Study Sets)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý kho từ vựng cá nhân, đăng ký bộ từ chuẩn quốc tế và đồng bộ theo thuật toán Spaced Repetition (SRS).
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            <span>Tải tài liệu lên</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tạo bằng AI</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bộ mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "personal"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Bộ từ của bạn ({personalDecks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "global"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Thư viện chung có sẵn ({globalDecks.length})</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            Mẫu chuẩn
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "personal"
                ? "Tìm trong bộ từ của bạn..."
                : "Tìm trong thư viện chung có sẵn..."
            }
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTag === null
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tất cả
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === tag
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab 1: Personal Decks View                                          */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "personal" && (
        <>
          {personalDecks.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400">
                <Layers className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Kho từ vựng cá nhân của bạn đang mới tinh!
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn chưa đăng ký hoặc tạo bộ từ vựng nào. Hãy chọn bộ từ vựng chuẩn quốc tế có sẵn trong Thư viện chung hoặc tải tài liệu của bạn lên để bắt đầu học.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("global")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <Globe className="h-4 w-4" />
                  <span>Khám phá bộ từ vựng chung có sẵn</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <Upload className="h-4 w-4 text-indigo-600" />
                  <span>Tải tài liệu lên (Ảnh, PDF, Word)</span>
                </button>
              </div>
            </div>
          ) : filteredDecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  cards={cards.filter((c) => c.deckId === deck.id)}
                  isEnrolled={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <p className="text-slate-500 text-sm">Không tìm thấy bộ từ vựng phù hợp với tìm kiếm.</p>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Tab 2: Global Shared Catalog View                                   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "global" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 flex items-center justify-between gap-4 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-indigo-600 shrink-0" />
              <span>
                Đây là các bộ từ vựng chuẩn quốc tế được biên soạn công phu. Bạn có thể bấm <strong>&ldquo;Đăng ký học bộ này&rdquo;</strong> để đưa vào kho từ cá nhân và học với thuật toán lặp lại ngắt quãng (SRS).
              </span>
            </div>
          </div>

          {filteredDecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecks.map((deck) => {
                const enrolled = isDeckEnrolled(deck.id, currentUser?.id);
                return (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    cards={cards.filter((c) => c.deckId === deck.id)}
                    isEnrolled={enrolled}
                    onEnroll={() => handleEnroll(deck.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <p className="text-slate-500 text-sm">Không tìm thấy bộ từ vựng chung nào phù hợp.</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Create Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tạo Bộ Từ Mới</h3>
            <form onSubmit={handleCreateDeck} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Tên bộ từ:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: 500 từ vựng TOEIC thường gặp"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Mô tả ngắn:</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu của bộ từ..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Tags (phân cách bằng dấu phẩy):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="TOEIC, Business, Giao tiếp"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
                >
                  Tạo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <PhotoToCardModal
          deckId={personalDecks[0]?.id || "deck-ielts-mastery"}
          onAddCards={handleAddCards}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newDeckId) => {
            showToast("Đã trích xuất và tạo bộ từ vựng cá nhân thành công!");
            setActiveTab("personal");
            refreshData();
          }}
        />
      )}
    </div>
  );
}
