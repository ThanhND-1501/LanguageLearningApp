"use client";

import React, { useState, useMemo } from "react";
import { Deck, Card, UserProfile } from "@/types";
import {
  EXAM_TYPES,
  TOPICS,
  CEFR_LEVELS,
  ExamType,
  TopicType,
  CefrLevel,
  filterDecksByTaxonomy,
  getCascadingTaxonomyCounts,
  classifyDeck,
} from "@/lib/taxonomy";
import { DeckCard } from "./DeckCard";
import {
  Globe,
  GraduationCap,
  Briefcase,
  Building2,
  Target,
  MessageCircle,
  LineChart,
  BookOpen,
  Sparkles,
  Leaf,
  Cpu,
  Users,
  Activity,
  Compass,
  MessagesSquare,
  Film,
  Layers,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Search,
  Check,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface TaxonomyExplorerProps {
  decks: Deck[];
  cards: Card[];
  currentUser: UserProfile | null;
  onEnroll: (deckId: string) => void;
  onRefresh: () => void;
}

export function TaxonomyExplorer({
  decks,
  cards,
  currentUser,
  onEnroll,
  onRefresh,
}: TaxonomyExplorerProps) {
  const [selectedExam, setSelectedExam] = useState<ExamType>("all");
  const [selectedTopic, setSelectedTopic] = useState<TopicType>("all");
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyEnrolled, setOnlyEnrolled] = useState(false);

  // Icon Resolver
  const renderIcon = (name: string, className = "h-4 w-4") => {
    switch (name) {
      case "Globe":
        return <Globe className={className} />;
      case "GraduationCap":
        return <GraduationCap className={className} />;
      case "Briefcase":
        return <Briefcase className={className} />;
      case "Building2":
        return <Building2 className={className} />;
      case "Target":
        return <Target className={className} />;
      case "MessageCircle":
        return <MessageCircle className={className} />;
      case "LineChart":
        return <LineChart className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Sparkles":
        return <Sparkles className={className} />;
      case "Leaf":
        return <Leaf className={className} />;
      case "Cpu":
        return <Cpu className={className} />;
      case "Users":
        return <Users className={className} />;
      case "Activity":
        return <Activity className={className} />;
      case "Compass":
        return <Compass className={className} />;
      case "MessagesSquare":
        return <MessagesSquare className={className} />;
      case "Film":
        return <Film className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Compute dynamic cascading counts:
  // - Exam counts: across all decks
  // - Topic counts: filtered by selectedExam
  // - Level counts: filtered by selectedExam AND selectedTopic
  const { examCounts, topicCounts, levelCounts } = useMemo(
    () => getCascadingTaxonomyCounts(decks, selectedExam, selectedTopic),
    [decks, selectedExam, selectedTopic]
  );

  const handleSelectExam = (exam: ExamType) => {
    setSelectedExam(exam);
    // If the currently selected topic has 0 cards in the newly selected exam, reset topic to "all"
    if (selectedTopic !== "all") {
      const countsInNewExam = getCascadingTaxonomyCounts(decks, exam, "all");
      if ((countsInNewExam.topicCounts[selectedTopic]?.cards || 0) === 0) {
        setSelectedTopic("all");
      }
    }
  };

  const handleSelectTopic = (topic: TopicType) => {
    setSelectedTopic(topic);
    // If the currently selected level has 0 cards in the newly selected (exam, topic), reset level to "all"
    if (selectedLevel !== "all") {
      const countsInNewTopic = getCascadingTaxonomyCounts(decks, selectedExam, topic);
      if ((countsInNewTopic.levelCounts[selectedLevel]?.cards || 0) === 0) {
        setSelectedLevel("all");
      }
    }
  };

  // Filtered decks
  const filteredDecks = useMemo(() => {
    const list = filterDecksByTaxonomy(decks, {
      examType: selectedExam,
      topic: selectedTopic,
      level: selectedLevel,
      searchQuery,
    });
    if (onlyEnrolled && currentUser) {
      return list.filter(
        (deck) =>
          currentUser.enrolledDeckIds?.includes(deck.id) ||
          deck.ownerId === currentUser.id ||
          (deck.enrolledUsers && deck.enrolledUsers.includes(currentUser.id))
      );
    }
    return list;
  }, [decks, selectedExam, selectedTopic, selectedLevel, searchQuery, onlyEnrolled, currentUser]);

  const totalFilteredCards = useMemo(() => {
    return filteredDecks.reduce((sum, d) => sum + (d.totalCards || 0), 0);
  }, [filteredDecks]);

  const resetFilters = () => {
    setSelectedExam("all");
    setSelectedTopic("all");
    setSelectedLevel("all");
    setSearchQuery("");
    setOnlyEnrolled(false);
  };

  const hasActiveFilters =
    selectedExam !== "all" ||
    selectedTopic !== "all" ||
    selectedLevel !== "all" ||
    searchQuery.trim().length > 0 ||
    onlyEnrolled;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. TẦNG 1: CHỌN CHỨNG CHỈ / MỤC TIÊU HỌC TẬP (EXAM TYPE)              */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-xs font-black">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chọn Chứng chỉ / Mục đích học
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {EXAM_TYPES.length - 1} chương trình
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {EXAM_TYPES.map((exam) => {
            const isSelected = selectedExam === exam.id;
            const stats = examCounts[exam.id] || { decks: 0, cards: 0 };

            return (
              <button
                key={exam.id}
                onClick={() => handleSelectExam(exam.id)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "border-brand-600 bg-brand-50/70 text-brand-900 dark:bg-brand-950/40 dark:border-brand-500 dark:text-brand-200 shadow-xs ring-1 ring-brand-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                )}
                <div
                  className={`p-2 rounded-lg mb-2 ${
                    isSelected
                      ? "bg-brand-600 text-white"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {renderIcon(exam.iconName, "h-5 w-5")}
                </div>
                <div className="text-xs font-bold leading-snug line-clamp-1">
                  {exam.shortLabel}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {stats.cards.toLocaleString()} từ
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. TẦNG 2: CHỌN CHỦ ĐỀ NỘI DUNG (TOPIC)                                */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-black">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chọn Chủ đề (Topic)
            </h3>
            {selectedExam !== "all" && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-md">
                trong {EXAM_TYPES.find((e) => e.id === selectedExam)?.shortLabel}
              </span>
            )}
          </div>
          {selectedTopic !== "all" && (
            <button
              onClick={() => setSelectedTopic("all")}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Xem tất cả chủ đề
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TOPICS.map((top) => {
            const isSelected = selectedTopic === top.id;
            const stats = topicCounts[top.id] || { decks: 0, cards: 0 };
            const isZero = stats.cards === 0 && top.id !== "all";

            return (
              <button
                key={top.id}
                onClick={() => handleSelectTopic(top.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
                    : isZero
                    ? "bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {renderIcon(top.iconName, "h-3.5 w-3.5")}
                <span>{top.shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : isZero
                      ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                      : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {stats.cards.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. TẦNG 3: CHỌN CẤP ĐỘ CEFR (LEVEL)                                    */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chọn Cấp độ Trình độ (CEFR Level)
            </h3>
            {(selectedExam !== "all" || selectedTopic !== "all") && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md">
                theo bộ lọc hiện tại
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">Khung chuẩn Châu Âu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CEFR_LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            const stats = levelCounts[lvl.id] || { decks: 0, cards: 0 };
            const isZero = stats.cards === 0 && lvl.id !== "all";

            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-500 ring-1 ring-emerald-500/30"
                    : isZero
                    ? "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 opacity-60 hover:opacity-100"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full mt-0.5 border text-xs font-bold shrink-0 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-transparent"
                  }`}
                >
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {lvl.label}
                    </span>
                    <span className={`text-[10px] font-bold ${isZero ? "text-slate-400" : "text-slate-500"}`}>
                      {stats.cards.toLocaleString()} từ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {lvl.subLabel}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {lvl.targetBands}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* BREADCRUMB & KẾT QUẢ TÌM KIẾM THEO PHÂN CẤP                             */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Active Criteria Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Lọc theo:
          </span>

          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
            {EXAM_TYPES.find((e) => e.id === selectedExam)?.label}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />

          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
            {TOPICS.find((t) => t.id === selectedTopic)?.label}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />

          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            {CEFR_LEVELS.find((l) => l.id === selectedLevel)?.label}
          </span>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-2 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* Quick Filter by Enrolled & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentUser && (
            <button
              type="button"
              onClick={() => setOnlyEnrolled(!onlyEnrolled)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                onlyEnrolled
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Đã đăng ký</span>
            </button>
          )}

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc từ khóa trong kết quả..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Tìm thấy{" "}
          <strong className="text-slate-900 dark:text-white font-bold">
            {filteredDecks.length}
          </strong>{" "}
          bộ từ vựng phù hợp (tổng cộng{" "}
          <strong className="text-brand-600 dark:text-brand-400 font-bold">
            {totalFilteredCards.toLocaleString()}
          </strong>{" "}
          từ vựng)
        </span>
      </div>

      {/* Grid Decks */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const isEnrolled = Boolean(
              currentUser &&
                (currentUser.enrolledDeckIds?.includes(deck.id) ||
                  deck.ownerId === currentUser.id ||
                  (deck.enrolledUsers && deck.enrolledUsers.includes(currentUser.id)))
            );

            const { examType, topic, level } = classifyDeck(deck);
            const levelInfo = CEFR_LEVELS.find((l) => l.id === level);

            return (
              <div key={deck.id} className="relative group">
                <DeckCard
                  deck={deck}
                  cards={cards.filter((c) => c.deckId === deck.id)}
                  isEnrolled={isEnrolled}
                  isLoggedIn={Boolean(currentUser)}
                  onEnroll={() => onEnroll(deck.id)}
                />
                {/* Level Badge Overlay on Top Right */}
                <div className="absolute top-4 right-4 z-10 pointer-events-none">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs ${
                      levelInfo?.badgeBg || "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {level.replace("_", "-")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-slate-400 mb-3">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Không tìm thấy bộ từ vựng nào khớp với bộ lọc
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Hãy thử nới lỏng bộ lọc Chứng chỉ, Chủ đề hoặc Trình độ để khám phá thêm nhiều từ vựng.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
          >
            Hiển thị tất cả từ vựng
          </button>
        </div>
      )}
    </div>
  );
}
