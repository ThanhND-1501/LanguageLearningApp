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
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center font-bold">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Kiểm Tra Microphone Của Bạn
              </h3>
              <p className="text-xs text-slate-500">
                Đảm bảo micro thu âm rõ ràng trước khi vào phòng chấm điểm phát âm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Device & Permission Status */}
        <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Thiết bị thu âm:</span>
            {permissionStatus === "granted" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã kết nối
              </span>
            ) : permissionStatus === "denied" ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                <AlertCircle className="h-3.5 w-3.5" />
                Bị từ chối quyền
              </span>
            ) : (
              <span className="text-amber-600 font-bold">Đang yêu cầu quyền...</span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
            {deviceLabel}
          </p>

          {permissionStatus === "denied" && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              Trình duyệt chưa được cấp quyền dùng Micro. Hãy bấm vào biểu tượng chiếc ổ khóa (hoặc biểu tượng Micro gạch chéo) ở thanh địa chỉ trang web trên trình duyệt và chọn <strong>&ldquo;Cho phép&rdquo; (Allow)</strong>, sau đó tải lại trang.
            </div>
          )}
        </div>

        {/* 2. Live Audio Volume Visualizer */}
        {permissionStatus === "granted" && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200/80 dark:from-slate-800/50 dark:to-indigo-950/20 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-brand-600" />
                Cường độ âm thanh thu trực tiếp:
              </span>
              <span className="font-mono text-sm text-brand-600 dark:text-brand-400">
                {volume}%
              </span>
            </div>

            {/* Volume Multi-Bar Equalizer */}
            <div className="h-5 w-full rounded-xl bg-slate-200 dark:bg-slate-700/80 p-1 flex items-center gap-1 overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => {
                const threshold = (i / 24) * 100;
                const isLit = volume >= threshold;
                const colorCls =
                  i > 20
                    ? "bg-rose-500"
                    : i > 15
                    ? "bg-amber-400"
                    : "bg-emerald-500";
                return (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                      isLit ? colorCls : "bg-slate-300/40 dark:bg-slate-600/40"
                    }`}
                  />
                );
              })}
            </div>

            {/* Visual Guidance on Volume */}
            <div className="text-xs font-medium">
              {volume < 5 ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <VolumeX className="h-3.5 w-3.5" />
                  Chưa nhận thấy tiếng. Hãy thử nói <em>&ldquo;Hello, one two three&rdquo;</em> vào micro...
                </span>
              ) : volume <= 75 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tín hiệu âm thanh rất tốt! Micro đang nhận giọng bạn rõ ràng.
                </span>
              ) : (
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Âm lượng quá lớn (có thể bị vỡ tiếng, hãy đưa micro xa một chút).
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3. Record Test & Playback */}
        {permissionStatus === "granted" && (
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ghi âm thử 3 giây và nghe lại giọng của bạn
            </span>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {!isTestRecording ? (
                <button
                  type="button"
                  onClick={startTestRecord}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Mic className="h-4 w-4" />
                  <span>{testAudioUrl ? "Ghi âm thử lại (3s)" : "Bắt đầu thu âm thử (3s)"}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md animate-pulse">
                  <Square className="h-4 w-4 fill-white" />
                  <span>Đang thu âm thử... Hãy nói điều gì đó ({countdown}s)</span>
                </div>
              )}

              {testAudioUrl && !isTestRecording && (
                <button
                  type="button"
                  onClick={playTestAudio}
                  disabled={isPlayingBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{isPlayingBack ? "Đang phát lại..." : "▶ Nghe lại giọng của tôi"}</span>
                </button>
              )}
            </div>

            {testAudioUrl && (
              <p className="text-xs text-slate-500 pt-1">
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
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Sẵn sàng luyện nói
          </button>
        </div>
      </div>
    </div>
  );
}

