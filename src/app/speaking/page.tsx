"use client";

import { useState, useEffect } from "react";
import { Card, PronScoreResult, GrammarEvaluationResult } from "@/types";
import { getLocalCards } from "@/lib/storage";
import { BrowserAudioRecorder, playNativePronunciation } from "@/lib/audio";
import { PronScoreDisplay } from "@/components/speaking/PronScoreDisplay";
import {
  Mic,
  Square,
  Sparkles,
  Loader2,
  Volume2,
  BookOpen,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";

export default function SpeakingStudioPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [recorder] = useState(() => new BrowserAudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [userSentence, setUserSentence] = useState("");
  const [scores, setScores] = useState<PronScoreResult | null>(null);
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarEvaluationResult | null>(null);

  useEffect(() => {
    const allCards = getLocalCards();
    setCards(allCards);
    if (allCards.length > 0) {
      setSelectedCard(allCards[0]);
    }
  }, []);

  const startRecording = async () => {
    try {
      setScores(null);
      setGrammarFeedback(null);
      await recorder.start();
      setIsRecording(true);
    } catch {
      alert("Vui lòng cấp quyền Microphone trên trình duyệt để ghi âm giọng nói.");
    }
  };

  const stopRecording = async () => {
    if (!selectedCard) return;
    try {
      setIsRecording(false);
      setIsEvaluating(true);
      const { audioBlob } = await recorder.stop();

      // 1. Chấm điểm phát âm PronScore (Azure Speech REST hoặc simulated heuristic)
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", selectedCard.exampleSentence || selectedCard.term);
      formData.append("userTranscript", userSentence || selectedCard.term);

      const assessRes = await fetch("/api/speech/assess", {
        method: "POST",
        body: formData,
      });

      if (assessRes.ok) {
        const assessData = await assessRes.json();
        if (assessData.success) {
          setScores(assessData.result);
        }
      }

      // 2. Chấm ngữ pháp câu với Gemini AI
      const grammarRes = await fetch("/api/ai/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetWords: [selectedCard.term],
          userSentence: userSentence || selectedCard.exampleSentence || selectedCard.term,
          promptQuestion: selectedCard.speakingPrompt || `Use '${selectedCard.term}' in a sentence.`,
        }),
      });

      if (grammarRes.ok) {
        const grammarData = await grammarRes.json();
        if (grammarData.success) {
          setGrammarFeedback(grammarData.evaluation);
        }
      }
    } catch (err) {
      console.error("Speech evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider mb-2 dark:bg-violet-950/60 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>PronScore™ Engine & Reflex Speaking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Studio Luyện Phản Xạ Nói & Chấm Phát Âm
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Buộc kích hoạt từ vựng vào câu nói hoàn chỉnh, loại bỏ tình trạng đơ khi giao tiếp thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Target Word Queue Selector */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chọn từ vựng mục tiêu:
            </span>
            <span className="text-xs text-brand-600 font-semibold">{cards.length} từ</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {cards.map((card) => {
              const isSelected = selectedCard?.id === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedCard(card);
                    setScores(null);
                    setGrammarFeedback(null);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/70 shadow-sm dark:bg-brand-950/50 dark:border-brand-700"
                      : "border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900 dark:text-white">
                      {card.term}
                    </strong>
                    <span className="text-xs font-mono text-brand-600 dark:text-brand-400">
                      {card.phonetic}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{card.definition}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Speaking Prompt & Recording Arena */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCard ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
              {/* Word Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span>{selectedCard.term}</span>
                    <button
                      onClick={() => playNativePronunciation(selectedCard.term)}
                      className="p-1.5 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 transition-colors"
                      title="Nghe mẫu bản xứ"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">
                    {selectedCard.phonetic} • ({selectedCard.partOfSpeech})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-slate-400">Nghĩa tiếng Việt</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedCard.definition}
                  </p>
                </div>
              </div>

              {/* Speaking Challenge Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-brand-50 border border-indigo-100 dark:from-slate-800 dark:to-indigo-950/40 dark:border-indigo-900">
                <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Đề bài luyện nói phản xạ (Speaking with words)</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  "{selectedCard.speakingPrompt || `Tell a short story where you had to be ${selectedCard.term}.`}"
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Quy tắc: Hãy nói to một câu trả lời hoàn chỉnh có chứa từ{" "}
                  <strong className="underline text-brand-700 dark:text-brand-400">
                    {selectedCard.term}
                  </strong>
                  .
                </p>
              </div>

              {/* Optional text input helper */}
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Câu bạn dự định nói (Tùy chọn - để đối sánh chính xác hơn):
                </label>
                <input
                  type="text"
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  placeholder={`VD: In tough situations, I always stay ${selectedCard.term} to achieve my dreams.`}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Big Record Button */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={isEvaluating}
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-brand-600 text-white font-bold text-base hover:bg-brand-700 shadow-xl shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="h-6 w-6" />
                    <span>Bấm vào đây để thu âm câu nói</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-rose-600 text-white font-bold text-base hover:bg-rose-700 shadow-xl shadow-rose-500/25 animate-pulse transition-all"
                  >
                    <Square className="h-5 w-5 fill-white" />
                    <span>Dừng ghi âm & Chấm PronScore</span>
                  </button>
                )}

                <p className="text-xs text-slate-400 mt-3">
                  {isRecording
                    ? "Đang thu âm... Hãy nói rõ ràng vào micro máy tính."
                    : "Hệ thống sẽ bóc tách âm vị, tính điểm trôi chảy, ngữ điệu và sửa ngữ pháp."}
                </p>
              </div>

              {isEvaluating && (
                <div className="flex items-center justify-center gap-3 p-6 text-brand-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-semibold text-sm">
                    Đang gửi âm thanh tới Azure Speech & Gemini AI...
                  </span>
                </div>
              )}

              {/* Assessment Breakdown */}
              {scores && (
                <div className="space-y-6 animate-in fade-in">
                  <PronScoreDisplay scores={scores} />

                  {grammarFeedback && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 dark:border-indigo-900 dark:bg-indigo-950/30">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm mb-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span>Phân tích Ngữ pháp & Diễn đạt từ AI</span>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {grammarFeedback.explanationVi}
                      </p>

                      {grammarFeedback.naturalRewrite && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-100 dark:bg-slate-900 dark:border-indigo-950">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                            Cách người bản xứ diễn đạt tự nhiên hơn:
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                            "{grammarFeedback.naturalRewrite}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 dark:bg-slate-900">
              <p className="text-slate-500">Hãy chọn một từ vựng bên trái để bắt đầu luyện nói.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
