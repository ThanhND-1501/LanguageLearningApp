"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Settings2,
  X,
  VolumeX,
} from "lucide-react";
import { createAudioVolumeMonitor } from "@/lib/audio";

interface MicTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MicTestModal({ isOpen, onClose }: MicTestModalProps) {
  const [permissionStatus, setPermissionStatus] = useState<"checking" | "granted" | "denied">("checking");
  const [deviceLabel, setDeviceLabel] = useState<string>("Đang tìm kiếm Microphone...");
  const [volume, setVolume] = useState<number>(0);
  const [peakVolume, setPeakVolume] = useState<number>(0);

  // Test recording states
  const [isTestRecording, setIsTestRecording] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const volumeTeardownRef = useRef<(() => void) | null>(null);
  const testRecorderRef = useRef<MediaRecorder | null>(null);
  const testChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startMicStream();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (volumeTeardownRef.current) {
      volumeTeardownRef.current();
      volumeTeardownRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setVolume(0);
    setIsTestRecording(false);
    setIsPlayingBack(false);
  };

  const startMicStream = async () => {
    try {
      setPermissionStatus("checking");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setPermissionStatus("granted");

      // Extract device label
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0 && tracks[0].label) {
        setDeviceLabel(tracks[0].label);
      } else {
        setDeviceLabel("Microphone mặc định của hệ thống");
      }

      // Initialize live volume monitor
      const teardown = createAudioVolumeMonitor(stream, (vol) => {
        setVolume(vol);
        setPeakVolume((prev) => Math.max(prev, vol));
      });
      volumeTeardownRef.current = teardown;
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      setPermissionStatus("denied");
      setDeviceLabel("Không thể truy cập Microphone");
    }
  };

  const startTestRecord = () => {
    if (!streamRef.current) return;

    setTestAudioUrl(null);
    testChunksRef.current = [];
    setCountdown(3);
    setIsTestRecording(true);

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      testRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          testChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(testChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(recordedBlob);
        setTestAudioUrl(url);
        setIsTestRecording(false);
      };

      recorder.start(100);

      // 3-second countdown
      let count = 3;
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Test record failed:", err);
      setIsTestRecording(false);
    }
  };

  const playTestAudio = () => {
    if (!testAudioUrl) return;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(testAudioUrl);
    audioElementRef.current = audio;
    setIsPlayingBack(true);

    audio.onended = () => {
      setIsPlayingBack(false);
    };
    audio.onerror = () => {
      setIsPlayingBack(false);
    };

    audio.play();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface p-6 sm:p-8 shadow-lift border border-line space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center font-bold">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                Kiểm Tra Microphone Của Bạn
              </h3>
              <p className="text-xs text-mute">
                Đảm bảo micro thu âm rõ ràng trước khi vào phòng chấm điểm phát âm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-mute hover:text-ink-2 rounded-xl p-2 hover:bg-subtle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Device & Permission Status */}
        <div className="p-4 rounded-2xl border bg-subtle border-line space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-mute">Thiết bị thu âm:</span>
            {permissionStatus === "granted" ? (
              <span className="inline-flex items-center gap-1 text-good font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã kết nối
              </span>
            ) : permissionStatus === "denied" ? (
              <span className="inline-flex items-center gap-1 text-poor font-bold">
                <AlertCircle className="h-3.5 w-3.5" />
                Bị từ chối quyền
              </span>
            ) : (
              <span className="text-fair font-bold">Đang yêu cầu quyền...</span>
            )}
          </div>
          <p className="text-sm font-bold text-ink truncate">
            {deviceLabel}
          </p>

          {permissionStatus === "denied" && (
            <div className="mt-3 p-3 rounded-xl bg-poor-soft border border-poor/25 text-xs text-poor">
              Trình duyệt chưa được cấp quyền dùng Micro. Hãy bấm vào biểu tượng chiếc ổ khóa (hoặc biểu tượng Micro gạch chéo) ở thanh địa chỉ trang web trên trình duyệt và chọn <strong>&ldquo;Cho phép&rdquo; (Allow)</strong>, sau đó tải lại trang.
            </div>
          )}
        </div>

        {/* 2. Live Audio Volume Visualizer */}
        {permissionStatus === "granted" && (
          <div className="p-5 rounded-2xl bg-primary-soft border border-line space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-ink-2">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-primary-ink" />
                Cường độ âm thanh thu trực tiếp:
              </span>
              <span className="text-sm text-primary-ink">
                {volume}%
              </span>
            </div>

            {/* Volume Multi-Bar Equalizer */}
            <div className="h-5 w-full rounded-xl bg-line p-1 flex items-center gap-1 overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => {
                const threshold = (i / 24) * 100;
                const isLit = volume >= threshold;
                const colorCls =
                  i > 20
                    ? "bg-poor"
                    : i > 15
                    ? "bg-fair"
                    : "bg-good";
                return (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                      isLit ? colorCls : "bg-line"
                    }`}
                  />
                );
              })}
            </div>

            {/* Visual Guidance on Volume */}
            <div className="text-xs font-medium">
              {volume < 5 ? (
                <span className="text-mute flex items-center gap-1">
                  <VolumeX className="h-3.5 w-3.5" />
                  Chưa nhận thấy tiếng. Hãy thử nói <em>&ldquo;Hello, one two three&rdquo;</em> vào micro...
                </span>
              ) : volume <= 75 ? (
                <span className="text-good font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tín hiệu âm thanh rất tốt! Micro đang nhận giọng bạn rõ ràng.
                </span>
              ) : (
                <span className="text-poor font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Âm lượng quá lớn (có thể bị vỡ tiếng, hãy đưa micro xa một chút).
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3. Record Test & Playback */}
        {permissionStatus === "granted" && (
          <div className="p-4 rounded-2xl border border-dashed border-line-strong text-center space-y-3">
            <span className="text-xs font-bold text-mute">
              Ghi âm thử 3 giây và nghe lại giọng của bạn
            </span>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {!isTestRecording ? (
                <button
                  type="button"
                  onClick={startTestRecord}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink hover:bg-ink text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Mic className="h-4 w-4" />
                  <span>{testAudioUrl ? "Ghi âm thử lại (3s)" : "Bắt đầu thu âm thử (3s)"}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-poor text-white text-xs font-bold shadow-raised animate-pulse">
                  <Square className="h-4 w-4 fill-white" />
                  <span>Đang thu âm thử... Hãy nói điều gì đó ({countdown}s)</span>
                </div>
              )}

              {testAudioUrl && !isTestRecording && (
                <button
                  type="button"
                  onClick={playTestAudio}
                  disabled={isPlayingBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-good hover:bg-good text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{isPlayingBack ? "Đang phát lại..." : "▶ Nghe lại giọng của tôi"}</span>
                </button>
              )}
            </div>

            {testAudioUrl && (
              <p className="text-xs text-mute pt-1">
                Nếu bạn nghe thấy giọng của mình phát ra từ loa/tai nghe thì Micro đã sẵn sàng 100%!
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-raised"
          >
            Sẵn sàng luyện nói
          </button>
        </div>
      </div>
    </div>
  );
}

