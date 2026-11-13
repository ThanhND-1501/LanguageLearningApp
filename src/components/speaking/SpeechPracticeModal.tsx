"use client";

import { useState, useRef, useEffect } from "react";
import { Card, PronScoreResult } from "@/types";
import {
  Mic,
  Square,
  Sparkles,
  Loader2,
  Volume2,
  BookOpen,
  Settings2,
  AlertTriangle,
  VolumeX,
  CheckCircle2, X } from "lucide-react";
import {
  BrowserAudioRecorder,
  playNativePronunciation,
  createAudioVolumeMonitor,
} from "@/lib/audio";
import { PronScoreDisplay } from "./PronScoreDisplay";
import { MicTestModal } from "./MicTestModal";
import { recordStudyActivity } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SpeechPracticeModalProps {
  card: Card;
  onClose: () => void;
}

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

export function SpeechPracticeModal({ card, onClose }: SpeechPracticeModalProps) {
  const [mode, setMode] = useState<"read_sentence" | "free_speaking">("read_sentence");
  const [recorder] = useState(() => new BrowserAudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMicTestOpen, setIsMicTestOpen] = useState(false);

  // Live audio metering
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const volumeTeardownRef = useRef<(() => void) | null>(null);
  const [silenceWarning, setSilenceWarning] = useState<string | null>(null);

  const [userTranscript, setUserTranscript] = useState("");
  const [scores, setScores] = useState<PronScoreResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
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
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền Microphone trên trình duyệt.");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsEvaluating(true);

      if (volumeTeardownRef.current) {
        volumeTeardownRef.current();
        volumeTeardownRef.current = null;
      }
      setLiveVolume(0);

      const { audioBlob } = await recorder.stop();

      // Lưu URL để người dùng nghe lại bản ghi âm
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      }

      // Kiểm tra sơ bộ kích thước audio
      if (!audioBlob || audioBlob.size < 1000) {
        setSilenceWarning("Không thu được âm thanh giọng nói (bản ghi âm rỗng hoặc quá ngắn).");
      }

      // Xác định câu mẫu / câu mục tiêu chuẩn xác tương ứng với chế độ đang chọn
      const referenceToAssess =
        mode === "read_sentence"
          ? card.exampleSentence || card.term
          : userTranscript.trim() || card.exampleSentence || card.term;

      // Chấm điểm phát âm PronScore (Gemini Multimodal Audio / Groq Whisper / Azure)
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", referenceToAssess);
      formData.append("userTranscript", userTranscript || referenceToAssess);

      const assessRes = await fetch("/api/speech/assess", {
        method: "POST",
        body: formData,
      });

      if (assessRes.ok) {
        const assessData = await assessRes.json();
        if (assessData.success) {
          setScores(assessData.result);
          if (assessData.result.pronScore === 0 && assessData.result.completenessScore === 0) {
            setSilenceWarning("AI không phát hiện thấy âm thanh giọng nói tiếng Anh. Hãy nói to hơn và kiểm tra lại Micro.");
          } else {
            recordStudyActivity({
              type: "speech_practice",
              title: `Luyện phát âm: ${card.term}`,
              description: `Đạt ${assessData.result.pronScore}/100 điểm PronScore AI`,
              metadata: { term: card.term, score: assessData.result.pronScore },
            });
          }
        }
      }
    } catch (err) {
      console.error("Speech Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 sm:p-8 shadow-lift border border-line my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <span className="text-xs font-bold text-primary-ink">
              Luyện phát âm & Phản xạ nói
            </span>
            <h3 className="text-xl font-bold text-ink mt-0.5 flex items-center gap-2">
              <span>Từ mục tiêu:</span>
              <span className="text-primary-ink">{card.term}</span>
              <span className="text-xs text-mute">({card.phonetic})</span>
              <button
                type="button"
                onClick={() => playNativePronunciation(card.term)}
                className="p-1 rounded-lg text-primary-ink hover:bg-primary-soft-hover transition-colors"
                title="Nghe phát âm từ"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMicTestOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line hover:bg-subtle text-xs font-semibold text-ink-2 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5 text-primary-ink" />
              <span>Kiểm tra micro</span>
            </button>
            <button
              onClick={onClose}
              className="text-mute hover:text-ink-2 rounded-lg p-1.5"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex items-center gap-2 p-1.5 rounded-2xl bg-subtle border border-line">
          <button
            type="button"
            onClick={() => {
              setMode("read_sentence");
              setScores(null);
              setSilenceWarning(null);
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
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
              setSilenceWarning(null);
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mode === "free_speaking"
                ? "bg-surface text-primary-ink shadow-sm"
                : "text-ink-2 hover:text-ink"
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>Tự trả lời</span>
          </button>
        </div>

        {/* MODE 1: READ EXAMPLE SENTENCE */}
        {mode === "read_sentence" ? (
          <div className="my-5 p-5 rounded-2xl bg-primary-soft border border-primary/25 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-primary/25">
              <span className="text-xs font-bold text-primary-ink flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" />
                Câu mẫu — Đọc to câu này để được chấm điểm:
              </span>
              <button
                type="button"
                onClick={() =>
                  playNativePronunciation(card.exampleSentence || card.term)
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-primary-soft text-primary-ink text-xs font-bold shadow-sm transition-colors border border-primary/25"
                title="Nghe câu mẫu"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Nghe mẫu</span>
              </button>
            </div>

            <p className="text-lg sm:text-xl font-bold text-ink leading-relaxed">
              &ldquo;
              {highlightTerm(
                card.exampleSentence ||
                  `Understanding ${card.term} is vital for long-term mastery.`,
                card.term
              )}
              &rdquo;
            </p>

            {card.exampleTranslation && (
              <p className="text-xs text-ink-2 italic pt-1">
                <span className="not-italic font-bold text-mute mr-1.5">Dịch nghĩa:</span>
                {card.exampleTranslation}
              </p>
            )}
          </div>
        ) : (
          /* MODE 2: FREE SPEAKING CHALLENGE */
          <div className="my-5 p-4 rounded-2xl bg-primary-soft border border-primary/25 space-y-3">
            <div>
              <p className="text-xs font-bold text-primary-ink">
                Câu hỏi gợi ý nói:
              </p>
              <p className="mt-1 text-base font-semibold text-ink">
                &ldquo;{card.speakingPrompt || `How does the word '${card.term}' relate to your daily experience?`}&rdquo;
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-primary-ink">
                <span>Bắt buộc sử dụng từ:</span>
                <span className="font-bold underline">{card.term}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-2">
                Câu bạn dự định nói (nhập trước để AI đối sánh chuẩn hơn):
              </label>
              <input
                type="text"
                value={userTranscript}
                onChange={(e) => setUserTranscript(e.target.value)}
                placeholder={`VD: In my opinion, ${card.term} plays an important role...`}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Silence Warning */}
        {silenceWarning && (
          <div className="my-4 p-3.5 rounded-2xl bg-fair-soft border border-fair/25 text-fair flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-fair shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{silenceWarning}</p>
                <p className="mt-0.5 text-fair">
                  Hãy thử kiểm tra lại micro qua nút bên cạnh.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Microphone action area */}
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-subtle border border-line">
          {/* Live volume meter when recording */}
          {isRecording && (
            <div className="w-full max-w-sm mb-5 p-3 rounded-2xl bg-surface border border-line shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-poor animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-poor" />
                  Đang thu âm:
                </span>
                <span className="text-primary-ink">
                  {liveVolume}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-subtle overflow-hidden p-0.5 flex items-center">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-75",
                    liveVolume < 5 ? "bg-line w-1" : liveVolume < 75 ? "bg-good" : "bg-poor"
                  )}
                  style={{ width: `${Math.max(3, liveVolume)}%` }}
                />
              </div>
              <div className="text-[10px] text-center font-medium">
                {liveVolume < 5 ? (
                  <span className="text-fair flex items-center justify-center gap-1">
                    <VolumeX className="h-3 w-3" />
                    Chưa nhận thấy tiếng! Hãy nói to vào micro.
                  </span>
                ) : (
                  <span className="text-good flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Micro đang thu tốt!
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
              <span>Dừng ghi âm & Chấm điểm</span>
            </button>
          )}

          <p className="text-xs text-mute mt-3">
            {isRecording
              ? "Đang ghi âm giọng nói của bạn... Hãy nói to, rõ ràng!"
              : "AI sẽ phân tích âm vị từng từ, độ trôi chảy (Fluency) và ngữ điệu (Prosody)."}
          </p>
        </div>

        {/* Loading Spinner */}
        {isEvaluating && (
          <div className="my-6 flex flex-col items-center justify-center p-6 text-primary-ink">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-semibold mt-2">Đang phân tích âm vị và ngữ điệu với AI...</p>
          </div>
        )}

        {/* Results: PronScore */}
        {scores && (
          <div className="mt-6 space-y-5 animate-in fade-in">
            <PronScoreDisplay scores={scores} audioUrl={recordedAudioUrl} />
          </div>
        )}

        {/* Mic Test Modal Popup */}
        <MicTestModal isOpen={isMicTestOpen} onClose={() => setIsMicTestOpen(false)} />
      </div>
    </div>
  );
}
