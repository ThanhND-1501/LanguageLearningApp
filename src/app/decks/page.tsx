"use client";

import { useState, useEffect } from "react";
import { Deck, Card } from "@/types";
import { getLocalDecks, getLocalCards, saveLocalDecks } from "@/lib/storage";
import { DeckCard } from "@/components/deck/DeckCard";
import { PhotoToCardModal } from "@/components/ai/PhotoToCardModal";
import { Search, Plus, Sparkles, Filter } from "lucide-react";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    setDecks(getLocalDecks());
    setCards(getLocalCards());
  }, []);

  const allTags = Array.from(new Set(decks.flatMap((d) => d.tags)));

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? deck.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

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
    };

    const updated = [newDeck, ...decks];
    setDecks(updated);
    saveLocalDecks(updated);

    setNewTitle("");
    setNewDesc("");
    setNewTags("");
    setShowCreateModal(false);
  };

  const handleAddCards = (newCards: Card[]) => {
    const updated = [...cards, ...newCards];
    setCards(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("lingopulse_cards_v1", JSON.stringify(updated));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Kho Bộ Từ Vựng (Study Sets)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các bộ từ vựng IELTS, TOEIC, Giao tiếp và đồng bộ theo thuật toán SRS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tạo bằng AI</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bộ mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bộ từ vựng..."
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

      {/* Decks Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              cards={cards.filter((c) => c.deckId === deck.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <p className="text-slate-500 text-sm">Không tìm thấy bộ từ vựng phù hợp với tìm kiếm.</p>
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
          deckId={decks[0]?.id || "deck-ielts-mastery"}
          onAddCards={handleAddCards}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
