"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
  Plus,
} from "lucide-react";
import { Card, Deck, GeneratedCardItem, UserProfile } from "@/types";
import { getLocalDecks, saveLocalDecks, saveLocalCards, getLocalCards, enrollInDeck } from "@/lib/storage";
import { getActiveUser, recordStudyActivity } from "@/lib/auth";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: (deckId: string) => void;
}

export function DocumentUploadModal({ onClose, onSuccess }: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser] = useState<UserProfile | null>(() => getActiveUser());
  const [existingDecks] = useState<Deck[]>(() => getLocalDecks());

  // Step state: 'upload' -> 'extracting' -> 'review'
  const [step, setStep] = useState<"upload" | "extracting" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Configuration options
  const [mode, setMode] = useState<"new_deck" | "existing_deck">("new_deck");
  const [targetDeckId, setTargetDeckId] = useState<string>(existingDecks[0]?.id || "");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [targetLevel, setLevel] = useState("B2-C1");
  const [targetCount, setCount] = useState(8);

  // Extracted Cards
  const [extractedCards, setExtractedCards] = useState<GeneratedCardItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [extractedPreview, setExtractedPreview] = useState<string>("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (f: File) => {
    setErrorMsg("");
    const validExtensions = [
      ".png", ".jpg", ".jpeg", ".webp",
      ".pdf", ".docx", ".txt", ".md", ".csv"
    ];
    const nameLower = f.name.toLowerCase();
    const isValid = validExtensions.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      setErrorMsg("Định dạng file không hỗ trợ. Vui lòng tải file Ảnh, PDF, DOCX, TXT hoặc MD.");
      return;
    }

    if (f.size > 25 * 1024 * 1024) {
      setErrorMsg("Kích thước file vượt quá 25MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }

    setFile(f);
    // Suggest a deck title based on file name
    const cleanName = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    setDeckTitle(`Từ vựng: ${formatted}`);
    setDeckDesc(`Trích xuất tự động bằng AI từ tài liệu "${f.name}"`);
  };

  const handleStartExtraction = async () => {
    if (!file) return;

    try {
      setStep("extracting");
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("level", targetLevel);
      formData.append("count", targetCount.toString());
      if (deckTitle.trim()) {
        formData.append("deckTitle", deckTitle.trim());
      }

      const res = await fetch("/api/ai/extract-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể bóc tách từ vựng từ tài liệu này.");
      }

      setExtractedCards(data.cards || []);
      setSelectedIndices((data.cards || []).map((_: any, idx: number) => idx));
      if (data.suggestedDeckTitle && !deckTitle) {
        setDeckTitle(data.suggestedDeckTitle);
      }
      if (data.extractedTextPreview) {
        setExtractedPreview(data.extractedTextPreview);
      }

      setStep("review");
    } catch (err: any) {
      setErrorMsg(err.message || "Xảy ra lỗi trong quá trình bóc tách.");
      setStep("upload");
    }
  };

  const toggleSelectCard = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === extractedCards.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(extractedCards.map((_, i) => i));
    }
  };

  const handleUpdateCardField = (index: number, field: keyof GeneratedCardItem, value: any) => {
    setExtractedCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveToDeck = () => {
    if (selectedIndices.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 thẻ từ vựng để lưu.");
      return;
    }

    let finalDeckId = targetDeckId;
    const allStoredDecks = getLocalDecks(currentUser?.id);

    // If creating a brand new deck
    if (mode === "new_deck" || !finalDeckId) {
      finalDeckId = `deck-doc-${Date.now()}`;
      const newDeck: Deck = {
        id: finalDeckId,
        title: deckTitle.trim() || `Bộ từ vựng ${file?.name || "Tài liệu"}`,
        description: deckDesc.trim() || "Bộ từ vựng cá nhân trích xuất từ tài liệu",
        targetLang: "en-US",
        nativeLang: "vi-VN",
        tags: ["Tài liệu", "AI-Extract", targetLevel],
        totalCards: selectedIndices.length,
        createdAt: new Date().toISOString(),
        ownerId: currentUser?.id || "user-local",
        isGlobal: false,
      };

      const updatedDecks = [newDeck, ...allStoredDecks];
      saveLocalDecks(updatedDecks);

      // Auto-enroll user in their newly created deck
      enrollInDeck(finalDeckId, currentUser?.id);
    }

    // Prepare card objects
    const newCards: Card[] = selectedIndices.map((idx, offset) => {
      const g = extractedCards[idx];
      return {
        id: `card-doc-${Date.now()}-${offset}`,
        deckId: finalDeckId,
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

    // Save to storage
    const existingCards = getLocalCards();
    saveLocalCards([...existingCards, ...newCards]);

    // Record activity
    recordStudyActivity(
      {
        type: "deck_created",
        title: "Tạo bộ từ từ tài liệu",
        description: `Trích xuất thành công ${newCards.length} từ vựng từ "${file?.name || "tài liệu"}"`,
        metadata: {
          deckId: finalDeckId,
          cardsCount: newCards.length,
        },
      },
      currentUser?.id
    );

    onSuccess(finalDeckId);
    onClose();
  };

  const getFileIcon = (fileName: string) => {
    const l = fileName.toLowerCase();
    if (/\.(png|jpe?g|webp)$/.test(l)) return <ImageIcon className="h-6 w-6 text-primary-ink" />;
    return <FileText className="h-6 w-6 text-primary-ink" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface p-6 sm:p-8 shadow-lift border border-line my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-soft text-primary-ink">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">
                Tải Tài Liệu Tạo Bộ Từ Vựng Cá Nhân
              </h2>
              <p className="text-xs text-mute mt-0.5">
                Bóc tách tự động từ Ảnh chụp, file PDF, Word (.docx) hoặc ghi chú văn bản
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-subtle text-mute hover:text-ink-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-3.5 rounded-xl bg-poor-soft text-poor text-xs font-medium border border-poor/25">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Step 1: Upload & Configuration                                      */}
        {/* ------------------------------------------------------------------ */}
        {step === "upload" && (
          <div className="mt-6 space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary-soft scale-[1.01]"
                  : "border-line hover:border-primary bg-subtle/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,.md,.csv"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-surface rounded-xl shadow-sm border border-line">
                    {getFileIcon(file.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">
                      {file.name}
                    </p>
                    <p className="text-xs text-mute mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Bấm để chọn file khác
                    </p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-good bg-good-soft px-2.5 py-1 rounded-full border border-good/25">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sẵn sàng
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-2 text-sm">
                      Kéo thả tệp tin vào đây, hoặc{" "}
                      <span className="text-primary-ink underline">chọn từ thiết bị</span>
                    </p>
                    <p className="text-xs text-mute mt-1">
                      Hỗ trợ Ảnh giáo trình (.png, .jpg), Sách (.pdf), Word (.docx), Ghi chú (.txt, .md) • Tối đa 25MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Options Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-2 mb-1.5">
                  Mục tiêu lưu trữ
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-subtle rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMode("new_deck")}
                    className={`py-2 px-3 rounded-lg transition-all ${
                      mode === "new_deck"
                        ? "bg-surface text-primary-ink shadow-sm"
                        : "text-mute hover:text-ink"
                    }`}
                  >
                    Tạo bộ từ mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("existing_deck")}
                    disabled={existingDecks.length === 0}
                    className={`py-2 px-3 rounded-lg transition-all ${
                      mode === "existing_deck"
                        ? "bg-surface text-primary-ink shadow-sm"
                        : "text-mute hover:text-ink disabled:opacity-40"
                    }`}
                  >
                    Thêm vào bộ sẵn có
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-2 mb-1.5">
                  Trình độ từ vựng mục tiêu
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="B1">B1 — Trung cấp (Giao tiếp thường nhật)</option>
                  <option value="B2-C1">B2-C1 — Trung cao cấp (IELTS 6.5 - 7.5)</option>
                  <option value="C1-C2">C1-C2 — Nâng cao / Học thuật (IELTS 8.0+)</option>
                  <option value="Business-Tech">Chuyên ngành Công nghệ & Business</option>
                </select>
              </div>
            </div>

            {mode === "new_deck" ? (
              <div className="space-y-3 p-4 rounded-2xl bg-subtle border border-line">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Tên bộ từ vựng mới
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder="VD: Từ vựng Chương 3 Sinh học"
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                    placeholder="VD: Thuật ngữ cốt lõi phục vụ bài thi tuần tới"
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-xs text-ink-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">
                  Chọn bộ từ vựng đích
                </label>
                <select
                  value={targetDeckId}
                  onChange={(e) => setTargetDeckId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {existingDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.totalCards} thẻ)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <div className="flex items-center gap-2">
                <span className="text-xs text-mute">Số từ cần trích xuất:</span>
                <div className="flex gap-1.5">
                  {[5, 8, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCount(cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        targetCount === cnt
                          ? "bg-primary text-white"
                          : "bg-subtle text-ink-2 hover:bg-line"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!file}
                onClick={handleStartExtraction}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                <span>Trích xuất bằng AI</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Step 2: Extracting Progress                                        */}
        {/* ------------------------------------------------------------------ */}
        {step === "extracting" && (
          <div className="py-16 text-center space-y-4">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-14 w-14 animate-spin text-primary-ink" />
              <Sparkles className="h-6 w-6 text-primary-ink absolute" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                AI Đang Phân Tích & Bóc Tách Tài Liệu
              </h3>
              <p className="text-xs text-mute mt-1 max-w-md mx-auto">
                Đang đọc hiểu ngữ cảnh tài liệu &ldquo;{file?.name}&rdquo;, nhận diện thuật ngữ học thuật và xây dựng định nghĩa, phiên âm IPA cùng câu ví dụ...
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Step 3: Review & Select Cards                                      */}
        {/* ------------------------------------------------------------------ */}
        {step === "review" && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-primary-soft rounded-2xl border border-primary/25">
              <div className="flex items-center gap-2 text-xs text-primary-ink">
                <CheckCircle2 className="h-4 w-4 text-primary-ink shrink-0" />
                <span>
                  Đã bóc tách <strong>{extractedCards.length}</strong> từ vựng trọng tâm. Bạn có thể chỉnh sửa trước khi lưu.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-primary-ink hover:underline"
              >
                {selectedIndices.length === extractedCards.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            {extractedPreview && (
              <p className="text-xs text-mute italic line-clamp-2 px-1">
                Trích dẫn từ tài liệu: &ldquo;{extractedPreview}&rdquo;
              </p>
            )}

            {/* Cards Scrollable List */}
            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
              {extractedCards.map((c, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "border-primary/25 bg-primary-soft"
                        : "border-line bg-subtle/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectCard(idx)}
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-line-strong bg-surface"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={c.term}
                            onChange={(e) => handleUpdateCardField(idx, "term", e.target.value)}
                            className="font-bold text-ink bg-transparent text-base border-b border-transparent hover:border-line-strong focus:border-primary focus:outline-none"
                          />
                          <span className="text-xs text-mute">
                            {c.phonetic}
                          </span>
                          <span className="text-[10px] font-semibold text-primary-ink bg-primary-soft px-2 py-0.5 rounded-full">
                            {c.partOfSpeech}
                          </span>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={c.definition}
                            onChange={(e) => handleUpdateCardField(idx, "definition", e.target.value)}
                            className="w-full text-xs font-medium text-ink-2 bg-transparent border-b border-transparent hover:border-line-strong focus:border-primary focus:outline-none"
                          />
                        </div>

                        {c.exampleSentence && (
                          <div className="text-xs text-mute bg-white/70 p-2.5 rounded-xl border border-line">
                            <p className="font-medium text-ink-2">
                              {c.exampleSentence}
                            </p>
                            {c.exampleTranslation && (
                              <p className="text-[11px] text-mute mt-0.5 italic">
                                {c.exampleTranslation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:bg-subtle"
              >
                Quay lại tải file khác
              </button>

              <button
                type="button"
                onClick={handleSaveToDeck}
                disabled={selectedIndices.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Lưu {selectedIndices.length} thẻ vào{" "}
                  {mode === "new_deck" ? "bộ từ mới" : "bộ từ vựng"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

