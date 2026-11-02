"use client";

import { useState, useEffect, useRef } from "react";
import { Card, PronScoreResult } from "@/types";
import { getLocalCards } from "@/lib/storage";
import {
  BrowserAudioRecorder,
  playNativePronunciation,
  createAudioVolumeMonitor,
} from "@/lib/audio";
import { PronScoreDisplay } from "@/components/speaking/PronScoreDisplay";
import { MicTestModal } from "@/components/speaking/MicTestModal";
import { cn } from "@/lib/utils";
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
  CheckCircle2,
  Settings2,
  AlertTriangle,
  VolumeX,
} from "lucide-react";

function highlightTerm(sentence: string, term: string) {
  if (!sentence || !term) return sentence;
  const parts = sentence.split(new RegExp(`(${term})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <span
        key={i}
        className="text-brand-600 dark:text-brand-400 font-extrabold underline decoration-brand-400 underline-offset-4"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function SpeakingStudioPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [mode, setMode] = useState<"read_sentence" | "free_speaking">("read_sentence");
  const [recorder] = useState(() => new BrowserAudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMicTestOpen, setIsMicTestOpen] = useState(false);

  // Live audio metering
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const volumeTeardownRef = useRef<(() => void) | null>(null);
  const [silenceWarning, setSilenceWarning] = useState<string | null>(null);

  const [userSentence, setUserSentence] = useState("");
  const [scores, setScores] = useState<PronScoreResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const allCards = getLocalCards();
    setCards(allCards);
    if (allCards.length > 0) {
      setSelectedCard(allCards[0]);
    }

    return () => {
      if (volumeTeardownRef.current) {
        volumeTeardownRef.current();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
    setScores(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setUserSentence("");
    setSilenceWarning(null);
  };

  const startRecording = async () => {
    try {
      setScores(null);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(null);
      }
      setSilenceWarning(null);
      setLiveVolume(0);

      await recorder.start();
      setIsRecording(true);

      const stream = recorder.getStream();
      if (stream) {
        volumeTeardownRef.current = createAudioVolumeMonitor(stream, (vol) => {
          setLiveVolume(vol);
        });
      }
    } catch {
      alert("Vui lòng cấp quyền Microphone trên trình duyệt để ghi âm giọng nói.");
    }
  };

  const stopRecording = async () => {
    if (!selectedCard) return;
    try {
      setIsRecording(false);
      setIsEvaluating(true);

      if (volumeTeardownRef.current) {
        volumeTeardownRef.current();
        volumeTeardownRef.current = null;
      }
      setLiveVolume(0);

      const { audioBlob } = await recorder.stop();

      // Lưu URL để người dùng có thể nghe lại bản thu âm của chính mình
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      }

      // Kiểm tra sơ bộ kích thước tệp âm thanh
      if (!audioBlob || audioBlob.size < 1000) {
        setSilenceWarning(
          "Không thu được âm thanh (bản ghi âm rỗng hoặc quá ngắn). Hãy bấm 'Kiểm tra Micro' để xem micro có hoạt động không."
        );
      }

      // Xác định câu mẫu / câu mục tiêu chuẩn xác tương ứng với chế độ đang chọn
      const referenceToAssess =
        mode === "read_sentence"
          ? selectedCard.exampleSentence || selectedCard.term
          : userSentence.trim() || selectedCard.exampleSentence || selectedCard.term;

      // Chấm điểm phát âm PronScore (Gemini Multimodal Audio / Groq Whisper / Azure)
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", referenceToAssess);
      formData.append("userTranscript", userSentence || referenceToAssess);

      const assessRes = await fetch("/api/speech/assess", {
        method: "POST",
        body: formData,
      });

      if (assessRes.ok) {
        const assessData = await assessRes.json();
        if (assessData.success) {
          setScores(assessData.result);
          if (assessData.result.pronScore === 0 && assessData.result.completenessScore === 0) {
            setSilenceWarning(
              "AI không phát hiện thấy âm thanh giọng nói của bạn trong bản ghi âm. Vui lòng nói to hơn và kiểm tra lại Micro."
            );
          }
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
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider mb-2 dark:bg-violet-950/60 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>PronScore™ Engine & Reflex Speaking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Studio Luyện Phản Xạ Nói & Chấm Phát Âm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Luyện phát âm chuẩn xác từng câu ví dụ ngữ cảnh hoặc trả lời phản xạ với từ vựng mục tiêu.
          </p>
        </div>

        {/* Quick Test Mic Action */}
        <div>
          <button
            type="button"
            onClick={() => setIsMicTestOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
          >
            <Settings2 className="h-4 w-4 text-brand-600" />
            <span>Kiểm tra Micro</span>
          </button>
        </div>
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
                  onClick={() => handleSelectCard(card)}
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
                      title="Nghe mẫu phát âm từ"
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

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMode("read_sentence");
                    setScores(null);
                  }}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    mode === "read_sentence"
                      ? "bg-white text-brand-700 shadow-xs dark:bg-slate-900 dark:text-brand-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Chế độ 1: Đọc câu mẫu (Chuẩn phát âm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("free_speaking");
                    setScores(null);
                  }}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    mode === "free_speaking"
                      ? "bg-white text-brand-700 shadow-xs dark:bg-slate-900 dark:text-brand-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Chế độ 2: Tự trả lời phản xạ</span>
                </button>
              </div>

              {/* MODE 1: READ EXAMPLE SENTENCE (Prominently displayed) */}
              {mode === "read_sentence" ? (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50/90 via-indigo-50/70 to-purple-50/50 border-2 border-brand-200/90 dark:from-slate-800/90 dark:via-brand-950/40 dark:to-indigo-950/40 dark:border-brand-800/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-200/60 dark:border-brand-900/60">
                    <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
                      <Volume2 className="h-4 w-4 text-brand-600" />
                      <span>Câu mẫu chuẩn — Hãy đọc to câu này để được chấm điểm:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        playNativePronunciation(selectedCard.exampleSentence || selectedCard.term)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-100 text-brand-700 dark:bg-slate-900 dark:hover:bg-brand-950 dark:text-brand-300 text-xs font-bold shadow-xs transition-colors border border-brand-200 dark:border-brand-800"
                      title="Nghe giọng đọc bản xứ của toàn bộ câu"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Nghe mẫu</span>
                    </button>
                  </div>

                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed tracking-tight">
                    &ldquo;
                    {highlightTerm(
                      selectedCard.exampleSentence ||
                        `Understanding the concept of ${selectedCard.term} is vital for long-term mastery.`,
                      selectedCard.term
                    )}
                    &rdquo;
                  </p>

                  {selectedCard.exampleTranslation && (
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic pt-1">
                      <span className="not-italic text-xs font-bold uppercase text-slate-400 mr-2">
                        Dịch nghĩa:
                      </span>
                      {selectedCard.exampleTranslation}
                    </p>
                  )}
                </div>
              ) : (
                /* MODE 2: FREE SPEAKING CHALLENGE */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-brand-50 border border-indigo-100 dark:from-slate-800 dark:to-indigo-950/40 dark:border-indigo-900 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>Câu hỏi gợi ý phản xạ:</span>
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      &ldquo;
                      {selectedCard.speakingPrompt ||
                        `Tell a short story where you had to be ${selectedCard.term}.`}
                      &rdquo;
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Quy tắc: Hãy nói to một câu trả lời hoàn chỉnh có chứa từ{" "}
                      <strong className="underline text-brand-700 dark:text-brand-400">
                        {selectedCard.term}
                      </strong>
                      .
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Câu bạn dự định nói (nhập trước để AI đối sánh chính xác hơn):
                    </label>
                    <input
                      type="text"
                      value={userSentence}
                      onChange={(e) => setUserSentence(e.target.value)}
                      placeholder={`VD: In tough situations, I always stay ${selectedCard.term} to achieve my dreams.`}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Silence Warning Alert */}
              {silenceWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{silenceWarning}</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                        Hãy đảm bảo micro của bạn đang bật và nói to, rõ ràng hơn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMicTestOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors shadow-xs"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Test Micro</span>
                  </button>
                </div>
              )}

              {/* Big Record Button & Live Visualizer */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                {/* Live Volume Bar when recording */}
                {isRecording && (
                  <div className="w-full max-w-sm mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-rose-600 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        Đang thu âm giọng bạn:
                      </span>
                      <span className="font-mono text-brand-600 dark:text-brand-400">
                        {liveVolume}%
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 flex items-center">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-75",
                          liveVolume < 5
                            ? "bg-slate-300 w-1"
                            : liveVolume < 75
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${Math.max(3, liveVolume)}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-center font-medium">
                      {liveVolume < 5 ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                          <VolumeX className="h-3.5 w-3.5" />
                          Chưa nhận thấy tiếng! Hãy nói to vào micro.
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tín hiệu micro tốt!
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={isEvaluating}
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-brand-600 text-white font-bold text-base hover:bg-brand-700 shadow-xl shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="h-6 w-6" />
                    <span>
                      {mode === "read_sentence"
                        ? "Bấm vào đây & Đọc to câu mẫu"
                        : "Bấm vào đây để thu âm câu nói"}
                    </span>
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

                <div className="flex items-center gap-4 mt-3">
                  <p className="text-xs text-slate-400">
                    {isRecording
                      ? "Đang thu âm... Hãy nói to, rõ ràng từng âm tiết."
                      : "Hệ thống AI sẽ bóc tách âm vị, tính điểm trôi chảy, ngữ điệu và sửa lỗi phát âm."}
                  </p>
                  {!isRecording && (
                    <button
                      type="button"
                      onClick={() => setIsMicTestOpen(true)}
                      className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>Test Mic</span>
                    </button>
                  )}
                </div>
              </div>

              {isEvaluating && (
                <div className="flex items-center justify-center gap-3 p-6 text-brand-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-semibold text-sm">
                    Đang gửi âm thanh tới AI để phân tích âm vị & ngữ điệu...
                  </span>
                </div>
              )}

              {/* Assessment Breakdown */}
              {scores && (
                <div className="space-y-6 animate-in fade-in">
                  <PronScoreDisplay scores={scores} audioUrl={recordedAudioUrl} />
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

      {/* Mic Test Modal */}
      <MicTestModal isOpen={isMicTestOpen} onClose={() => setIsMicTestOpen(false)} />
    </div>
  );
}
