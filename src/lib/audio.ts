// ==============================================================================
// Audio Synthesis (TTS) & MediaRecorder Audio Capture Utilities
// Zero external cost using standard Web APIs with high-fidelity fallbacks
// ==============================================================================

/**
 * Pronounces a given text using browser native SpeechSynthesis
 */
export function playNativePronunciation(text: string, lang = "en-US", rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // Slightly slower for clear language learning comprehension

    // Pick high quality native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Audio Recorder wrapper utilizing browser MediaRecorder API
 */
export class BrowserAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000, // Ideal for Azure Speech / Whisper STT
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // 100ms slice
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  stop(): Promise<{ audioBlob: Blob; audioUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("MediaRecorder not initialized"));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop all tracks to release microphone hardware indicator
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        resolve({ audioBlob, audioUrl });
      };

      this.mediaRecorder.stop();
    });
  }
}

/**
 * Monitors live microphone input volume using browser AudioContext and AnalyserNode
 * Returns a teardown function to clean up listeners and audio context
 */
export function createAudioVolumeMonitor(
  stream: MediaStream,
  onVolume: (volume: number) => void // 0 to 100
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId: number;
    let isActive = true;

    const tick = () => {
      if (!isActive) return;
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Convert to 0 - 100 percentage
      const volumePercent = Math.min(100, Math.round((avg / 64) * 100));
      onVolume(volumePercent);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      try {
        source.disconnect();
        analyser.disconnect();
        if (audioContext.state !== "closed") {
          audioContext.close();
        }
      } catch {
        // Ignore close errors
      }
    };
  } catch (err) {
    console.warn("Unable to initialize AudioContext volume monitor:", err);
    return () => {};
  }
}
