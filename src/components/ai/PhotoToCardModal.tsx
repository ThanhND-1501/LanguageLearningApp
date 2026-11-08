"use client";

import { useState } from "react";
import { Sparkles, Camera, Upload, Loader2, Plus, Check } from "lucide-react";
import { GeneratedCardItem, Card } from "@/types";

interface PhotoToCardModalProps {
  deckId: string;
  onAddCards: (cards: Card[]) => void;
  onClose: () => void;
}

export function PhotoToCardModal({ deckId, onAddCards, onClose }: PhotoToCardModalProps) {
  const [activeTab, setActiveTab] = useState<"topic" | "photo">("topic");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("B2-C1");
  const [cardCount, setCardCount] = useState(5);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCardItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setGeneratedCards([]);

      const response = await fetch("/api/ai/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTab === "topic" ? topic : undefined,
          level,
          count: cardCount,
          imageBase64: activeTab === "photo" ? imagePreview : undefined,
          imageMimeType: activeTab === "photo" ? imageMime : undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.cards) {
        setGeneratedCards(data.cards);
        setSelectedIndices(data.cards.map((_: any, idx: number) => idx));
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectCard = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveSelectedCards = () => {
    const newCards: Card[] = selectedIndices.map((idx) => {
      const g = generatedCards[idx];
      return {
        id: `card-ai-${Date.now()}-${idx}`,
        deckId,
        term: g.term,
        phonetic: g.phonetic,
        partOfSpeech: g.partOfSpeech,
        definition: g.definition,
        exampleSentence: g.exampleSentence,
        exampleTranslation: g.exampleTranslation,
        synonyms: g.synonyms,
        speakingPrompt: g.speakingPrompt,
        status: "new",
        repetition: 0,
        easinessFactor: 2.5,
        intervalDays: 0,
        nextReviewAt: new Date().toISOString(),
      };
    });

    onAddCards(newCards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Tạo Flashcard thông minh bằng AI
              </h3>
              <p className="text-xs text-slate-500">
                Google Gemini Multimodal Vision & Language Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Tab selection */}
        <div className="my-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab("topic")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "topic"
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Nhập Chủ đề / Bài học
          </button>
          <button
            onClick={() => setActiveTab("photo")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "photo"
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Chụp ảnh sách / Tài liệu (Photo-to-Card)
          </button>
        </div>

        {/* Form Inputs */}
        {activeTab === "topic" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Chủ đề từ vựng:</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Phỏng vấn xin việc ngành IT, Du lịch sân bay, IELTS Reading..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Trình độ mục tiêu:</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="A2-B1">A2 - B1 (Cơ bản đến Trung cấp)</option>
                  <option value="B2-C1">B2 - C1 (Nâng cao & IELTS)</option>
                  <option value="C2">C2 (Thành thạo bản xứ)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Số lượng từ:</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-brand-400 transition-colors dark:border-slate-800">
              {imagePreview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg shadow-sm"
                  />
                  <label className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-200">
                    Đổi ảnh khác
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tải lên hoặc chụp ảnh tài liệu / trang sách
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Hỗ trợ PNG, JPG, WebP</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-5">
          <button
            onClick={handleGenerate}
            disabled={isLoading || (activeTab === "topic" && !topic.trim()) || (activeTab === "photo" && !imagePreview)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI đang phân tích và tạo flashcard...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Bắt đầu tạo bộ từ với AI</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Cards Preview */}
        {generatedCards.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kết quả: ({selectedIndices.length}/{generatedCards.length} được chọn)
              </span>
              <button
                onClick={() =>
                  setSelectedIndices(
                    selectedIndices.length === generatedCards.length
                      ? []
                      : generatedCards.map((_, i) => i)
                  )
                }
                className="text-xs font-semibold text-brand-600"
              >
                {selectedIndices.length === generatedCards.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {generatedCards.map((card, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectCard(idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-50/60 border-brand-300 dark:bg-brand-950/40 dark:border-brand-800"
                        : "bg-white border-slate-100 opacity-60 dark:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center text-xs mt-0.5 ${
                        isSelected ? "bg-brand-600 text-white" : "border border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">
                          {card.term}
                        </strong>
                        <span className="text-xs font-mono text-brand-600 dark:text-brand-400">
                          {card.phonetic}
                        </span>
                        <span className="text-xs text-slate-400">({card.partOfSpeech})</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {card.definition}
                      </p>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        &ldquo;{card.exampleSentence}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveSelectedCards}
              disabled={selectedIndices.length === 0}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Lưu {selectedIndices.length} thẻ vào bộ học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
