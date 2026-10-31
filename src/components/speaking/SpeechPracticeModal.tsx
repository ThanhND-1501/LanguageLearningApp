"use client";

import { useState } from "react";
import { Card, PronScoreResult, GrammarEvaluationResult } from "@/types";
import { Mic, Square, Sparkles, Loader2, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { BrowserAudioRecorder, playNativePronunciation } from "@/lib/audio";
import { PronScoreDisplay } from "./PronScoreDisplay";

interface SpeechPracticeModalProps {
  card: Card;
  onClose: () => void;
}

export function SpeechPracticeModal({ card, onClose }: SpeechPracticeModalProps) {
  const [recorder] = useState(() => new BrowserAudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState("");
  const [scores, setScores] = useState<PronScoreResult | null>(null);
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarEvaluationResult | null>(null);

  const startRecording = async () => {
    try {
      setScores(null);
      setGrammarFeedback(null);
      setUserTranscript("");
      await recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền Microphone trên trình duyệt.");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsEvaluating(true);
      const { audioBlob, audioUrl } = await recorder.stop();
      setAudioUrl(audioUrl);

      // 1. Chấm điểm phát âm PronScore (Azure Speech API or local assessment)
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", card.exampleSentence || card.term);
      formData.append("userTranscript", userTranscript || card.term);

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

      // 2. Kiểm tra ngữ pháp và từ vựng mục tiêu (Gemini API)
      const grammarRes = await fetch("/api/ai/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetWords: [card.term],
          userSentence: userTranscript || card.exampleSentence || card.term,
          promptQuestion: card.speakingPrompt || `Use the word '${card.term}' in a sentence.`,
        }),
      });

      if (grammarRes.ok) {
        const grammarData = await grammarRes.json();
        if (grammarData.success) {
          setGrammarFeedback(grammarData.evaluation);
        }
      }
    } catch (err) {
      console.error("Speech Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Luyện phản xạ nói & Chấm phát âm
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              Từ mục tiêu: <span className="text-brand-600">{card.term}</span>{" "}
              <span className="text-xs font-mono text-slate-400">({card.phonetic})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Prompt Section */}
        <div className="my-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Câu hỏi gợi ý nói:
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            &ldquo;{card.speakingPrompt || `How does the word '${card.term}' relate to your daily experience?`}&rdquo;
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
            <span>Bắt buộc sử dụng từ:</span>
            <span className="font-bold underline">{card.term}</span>
          </div>
        </div>

        {/* Microphone action area */}
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isEvaluating}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-brand-600 text-white font-bold text-base hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Mic className="h-6 w-6" />
              <span>Bấm vào đây để nói</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-rose-600 text-white font-bold text-base hover:bg-rose-700 shadow-lg shadow-rose-500/25 animate-pulse transition-all"
            >
              <Square className="h-5 w-5 fill-white" />
              <span>Dừng ghi âm & Chấm điểm</span>
            </button>
          )}

          <p className="text-xs text-slate-400 mt-3">
            {isRecording
              ? "Đang ghi âm giọng nói của bạn... Hãy nói to, rõ ràng!"
              : "Hỗ trợ chấm điểm phát âm ngữ điệu (Prosody) & sửa ngữ pháp tức thì."}
          </p>
        </div>

        {/* Loading Spinner */}
        {isEvaluating && (
          <div className="my-6 flex flex-col items-center justify-center p-6 text-brand-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-semibold mt-2">Đang phân tích âm vị và ngữ pháp với AI...</p>
          </div>
        )}

        {/* Results: PronScore & Grammar Feedback */}
        {scores && (
          <div className="mt-6 space-y-5 animate-in fade-in">
            <PronScoreDisplay scores={scores} />

            {grammarFeedback && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Đánh giá Ngữ pháp & Diễn đạt (AI Feedback)</span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {grammarFeedback.explanationVi}
                </p>

                {grammarFeedback.naturalRewrite && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 dark:bg-slate-900 dark:border-indigo-950">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Gợi ý diễn đạt tự nhiên hơn:
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                      &ldquo;{grammarFeedback.naturalRewrite}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
