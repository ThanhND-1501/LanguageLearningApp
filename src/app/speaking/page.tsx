"use client";

import { useState, useEffect, useRef } from "react";
import { Card, PronScoreResult, UserProfile } from "@/types";
import { getLocalCards } from "@/lib/storage";
import { getActiveUser } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
        className="text-primary-ink font-bold underline decoration-primary-ink underline-offset-4"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function SpeakingStudioPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
  const [engineStatus, setEngineStatus] = useState<{ online: boolean; message: string } | null>(null);

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    fetch("/api/speech/health")
      .then((res) => res.json())
      .then((data) => setEngineStatus(data))
      .catch(() => setEngineStatus({ online: false, message: "Không thể kết nối API" }));
  }, []);

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
          "Không thu được âm thanh (bản ghi âm rỗng hoặc quá ngắn). Hãy bấm 'Kiểm tra micro' để xem micro có hoạt động không."
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

  if (!isAuthChecking && !currentUser) {
    return (
      <AuthGuard
        featureName="Phòng Luyện Phản Xạ Nói"
        title="Đăng nhập để luyện phản xạ nói"
        description="Tính năng ghi âm và chấm điểm phát âm 4 chiều PronScore™ yêu cầu tài khoản để lưu lại lịch sử phát âm và phân tích tiến độ học tập."
        backHref="/decks"
        backLabel="Khám phá bộ từ vựng"
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Luyện nói</h1>
          <p className="mt-1 text-ink-2">
            Đọc to câu ví dụ để chấm phát âm từng từ, hoặc tự trả lời câu hỏi bằng từ vừa học.
          </p>
        </div>

        {/* Actions: Engine Status & Mic Test */}
        <div className="flex flex-wrap items-center gap-3">
          {engineStatus && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all",
                engineStatus.online
                  ? "bg-good-soft text-good border-good/25"
                  : "bg-fair-soft text-fair border-fair/25"
              )}
              title={engineStatus.message}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  engineStatus.online ? "bg-good animate-pulse" : "bg-fair"
                )}
              />
              <span>
                {engineStatus.online
                  ? "OpenPronounce: Sẵn sàng (Local AI)"
                  : "OpenPronounce: Offline"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMicTestOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-subtle hover:bg-line text-ink text-xs font-bold transition-all shadow-sm"
          >
            <Settings2 className="h-4 w-4 text-primary-ink" />
            <span>Kiểm tra micro</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Target Word Queue Selector */}
        <div className="lg:col-span-4 self-start overflow-hidden rounded-2xl border border-line bg-surface px-5 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mute">
              Chọn từ để luyện
            </span>
            <span className="text-xs text-primary-ink font-semibold">{cards.length} từ</span>
          </div>

          <ul className="-mx-5 max-h-[500px] divide-y divide-line overflow-y-auto border-t border-line">
            {cards.map((card) => {
              const isSelected = selectedCard?.id === card.id;
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectCard(card)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`block w-full px-5 py-3 text-left transition-colors ${
                      isSelected ? "bg-primary-soft" : "hover:bg-subtle"
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <strong className={`text-sm font-semibold ${isSelected ? "text-primary-ink" : "text-ink"}`}>{card.term}</strong>
                      <span className="text-xs text-mute">{card.phonetic}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-mute">{card.definition}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column: Speaking Prompt & Recording Arena */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCard ? (
            <div className="space-y-6">
              {/* Word Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-ink flex items-center gap-3">
                    <span>{selectedCard.term}</span>
                    <button
                      onClick={() => playNativePronunciation(selectedCard.term)}
                      className="p-1.5 rounded-xl bg-primary-soft text-primary-ink hover:bg-primary-soft-hover transition-colors"
                      title="Nghe mẫu phát âm từ"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </h2>
                  <p className="text-sm text-mute mt-0.5">
                    {selectedCard.phonetic} • ({selectedCard.partOfSpeech})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-mute">Nghĩa tiếng Việt</span>
                  <p className="text-sm font-bold text-ink">
                    {selectedCard.definition}
                  </p>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-subtle border border-line">
                <button
                  type="button"
                  onClick={() => {
                    setMode("read_sentence");
                    setScores(null);
                  }}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    mode === "read_sentence"
                      ? "bg-surface text-primary-ink shadow-sm"
                      : "text-ink-2 hover:text-ink"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Đọc câu mẫu</span>
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
                      ? "bg-surface text-primary-ink shadow-sm"
                      : "text-ink-2 hover:text-ink"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Tự trả lời</span>
                </button>
              </div>

              {/* MODE 1: READ EXAMPLE SENTENCE (Prominently displayed) */}
              {mode === "read_sentence" ? (
                <div className="p-6 rounded-2xl bg-primary-soft border border-primary/25 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-primary/25">
                    <div className="flex items-center gap-2 text-primary-ink text-xs font-bold">
                      <Volume2 className="h-4 w-4 text-primary-ink" />
                      <span>Đọc to câu này để được chấm điểm</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        playNativePronunciation(selectedCard.exampleSentence || selectedCard.term)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-primary-soft text-primary-ink text-xs font-bold shadow-sm transition-colors border border-primary/25"
                      title="Nghe giọng đọc bản xứ của toàn bộ câu"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Nghe mẫu</span>
                    </button>
                  </div>

                  <p className="text-xl sm:text-2xl font-bold text-ink leading-relaxed tracking-tight">
                    &ldquo;
                    {highlightTerm(
                      selectedCard.exampleSentence ||
                        `Understanding the concept of ${selectedCard.term} is vital for long-term mastery.`,
                      selectedCard.term
                    )}
                    &rdquo;
                  </p>

                  {selectedCard.exampleTranslation && (
                    <p className="text-sm font-medium text-ink-2 italic pt-1">
                      <span className="not-italic text-xs font-bold text-mute mr-2">
                        Nghĩa:
                      </span>
                      {selectedCard.exampleTranslation}
                    </p>
                  )}
                </div>
              ) : (
                /* MODE 2: FREE SPEAKING CHALLENGE */
                <div className="p-6 rounded-2xl bg-primary-soft border border-primary/25 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-primary-ink text-xs font-bold mb-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>Câu hỏi gợi ý phản xạ:</span>
                    </div>
                    <p className="text-base font-bold text-ink">
                      &ldquo;
                      {selectedCard.speakingPrompt ||
                        `Tell a short story where you had to be ${selectedCard.term}.`}
                      &rdquo;
                    </p>
                    <p className="text-xs text-mute mt-1.5">
                      Quy tắc: Hãy nói to một câu trả lời hoàn chỉnh có chứa từ{" "}
                      <strong className="underline text-primary-ink">
                        {selectedCard.term}
                      </strong>
                      .
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink-2">
                      Câu bạn dự định nói (nhập trước để AI đối sánh chính xác hơn):
                    </label>
                    <input
                      type="text"
                      value={userSentence}
                      onChange={(e) => setUserSentence(e.target.value)}
                      placeholder={`VD: In tough situations, I always stay ${selectedCard.term} to achieve my dreams.`}
                      className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Silence Warning Alert */}
              {silenceWarning && (
                <div className="p-4 rounded-2xl bg-fair-soft border border-fair/25 text-fair flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-fair shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{silenceWarning}</p>
                      <p className="mt-0.5 text-fair">
                        Hãy đảm bảo micro của bạn đang bật và nói to, rõ ràng hơn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMicTestOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fair hover:bg-fair text-white font-bold shrink-0 transition-colors shadow-sm"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Kiểm tra micro</span>
                  </button>
                </div>
              )}

              {/* Big Record Button & Live Visualizer */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-subtle border border-line">
                {/* Live Volume Bar when recording */}
                {isRecording && (
                  <div className="w-full max-w-sm mb-6 p-4 rounded-2xl bg-surface border border-line shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-poor animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-poor" />
                        Đang thu âm giọng bạn:
                      </span>
                      <span className="text-primary-ink">
                        {liveVolume}%
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-subtle overflow-hidden p-0.5 flex items-center">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-75",
                          liveVolume < 5
                            ? "bg-line w-1"
                            : liveVolume < 75
                            ? "bg-good"
                            : "bg-poor"
                        )}
                        style={{ width: `${Math.max(3, liveVolume)}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-center font-medium">
                      {liveVolume < 5 ? (
                        <span className="text-fair flex items-center justify-center gap-1">
                          <VolumeX className="h-3.5 w-3.5" />
                          Chưa nhận thấy tiếng! Hãy nói to vào micro.
                        </span>
                      ) : (
                        <span className="text-good flex items-center justify-center gap-1">
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
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-white font-bold text-base hover:bg-primary-hover shadow-lift transition-all disabled:opacity-50"
                  >
                    <Mic className="h-6 w-6" />
                    <span>
                      {mode === "read_sentence"
                        ? "Bắt đầu ghi âm"
                        : "Ghi âm câu trả lời"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-poor text-white font-bold text-base hover:bg-poor shadow-lift animate-pulse transition-all"
                  >
                    <Square className="h-5 w-5 fill-white" />
                    <span>Dừng ghi âm & Chấm PronScore</span>
                  </button>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <p className="text-xs text-mute">
                    {isRecording
                      ? "Đang thu âm... Hãy nói to, rõ ràng từng âm tiết."
                      : "Bạn sẽ thấy điểm từng từ, độ trôi chảy và ngữ điệu ngay sau khi nói."}
                  </p>
                </div>
              </div>

              {isEvaluating && (
                <div className="flex items-center justify-center gap-3 p-6 text-primary-ink">
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
            <div className="p-12 text-center bg-surface rounded-2xl border border-line">
              <p className="text-mute">Hãy chọn một từ vựng bên trái để bắt đầu luyện nói.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mic Test Modal */}
      <MicTestModal isOpen={isMicTestOpen} onClose={() => setIsMicTestOpen(false)} />
    </div>
  );
}
