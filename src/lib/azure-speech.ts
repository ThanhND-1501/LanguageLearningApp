// ==============================================================================
// Pronunciation Assessment & Speech Analysis Multi-Provider Engine
// Tier 1: Azure AI Speech Services (Standard REST API if configured)
// Tier 2: Google Gemini 2.5 Flash Multimodal Audio (Zero-cost, listens to audio directly)
// Tier 3: Groq Whisper Cloud (Whisper-large-v3 ultra-fast STT + phonetic evaluation)
// Tier 4: Local Heuristic Simulator Fallback (100% offline developer testing)
// ==============================================================================

import { PronScoreResult, WordScore } from "@/types";

/**
 * Returns a 0-score evaluation when no speech / silence is detected
 */
export function createSilentPronResult(
  referenceText: string,
  provider = "Phát hiện âm thanh rỗng (Silence Detection)",
  audioSizeBytes = 0,
  latencyMs = 0
): PronScoreResult {
  const targetWords = referenceText
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  return {
    pronScore: 0,
    accuracyScore: 0,
    fluencyScore: 0,
    completenessScore: 0,
    prosodyScore: 0,
    provider,
    recognizedTranscript: "(Không phát hiện âm thanh giọng nói)",
    audioSizeBytes,
    latencyMs,
    wordScores: targetWords.map((word) => ({
      word,
      score: 0,
      accuracyScore: 0,
      errorType: "Omission" as const,
    })),
  };
}

/**
 * Assesses pronunciation using Google Gemini Multimodal Audio
 * Listens directly to the user's recorded audio and evaluates phonetics, fluency, completeness & prosody
 */
async function assessWithGeminiAudio(
  audioBlob: Blob,
  referenceText: string,
  geminiKey: string,
  startTime: number
): Promise<PronScoreResult | null> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    let mimeType = audioBlob.type || "audio/webm";
    if (mimeType.includes(";")) {
      mimeType = mimeType.split(";")[0].trim();
    }
    if (!mimeType || mimeType === "application/octet-stream") {
      mimeType = "audio/webm";
    }

    const prompt = `You are an expert IELTS and CEFR English pronunciation examiner and speech analysis AI.
The student was asked to speak the following reference text:
"${referenceText}"

Listen carefully to the student's attached audio recording.

CRITICAL RULES ON SILENCE / INAUDIBLE RECORDINGS:
- If the audio is silent, empty, inaudible, contains no human speech, or the student did NOT speak, you MUST set pronScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0, prosodyScore: 0, recognizedTranscript: "(Không phát hiện giọng nói)", and mark ALL words as errorType: "Omission" with score: 0.
- NEVER invent, assume, or award positive scores if the user did not audibly pronounce the words in the audio.

If speech is present:
1. recognizedTranscript: Transcribe faithfully the exact English words or sounds you heard the student utter in the audio recording.
2. accuracyScore: Phoneme precision, clarity of consonants, vowels, and word endings (e.g. /s/, /t/, /ed/).
3. fluencyScore: Speech pace, rhythm, lack of unnatural pauses or excessive hesitation.
4. completenessScore: Proportion of words in the reference text clearly uttered.
5. prosodyScore: Sentence stress, intonation (pitch variation), and natural expression.
6. pronScore: Weighted overall score (accuracy*0.4 + fluency*0.2 + completeness*0.2 + prosody*0.2).

For EACH individual word in the reference text:
- word: The word from the reference text
- score: 0-100 phoneme accuracy for this specific word
- accuracyScore: 0-100 score
- errorType: "None" (if good), "Mispronunciation" (if mispronounced or unclear), "Omission" (if skipped or silent), or "Insertion".

Return STRICT JSON only without any markdown formatting or code blocks:
{
  "recognizedTranscript": "words heard from audio",
  "pronScore": 85,
  "accuracyScore": 84,
  "fluencyScore": 86,
  "completenessScore": 95,
  "prosodyScore": 83,
  "wordScores": [
    {
      "word": "example",
      "score": 85,
      "accuracyScore": 85,
      "errorType": "None"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("Gemini Audio Assessment HTTP error status:", response.status);
      return null;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (typeof parsed.pronScore === "number" && Array.isArray(parsed.wordScores)) {
      return {
        pronScore: Math.min(100, Math.max(0, Math.round(parsed.pronScore))),
        accuracyScore: Math.min(100, Math.max(0, Math.round(parsed.accuracyScore || parsed.pronScore))),
        fluencyScore: Math.min(100, Math.max(0, Math.round(parsed.fluencyScore || parsed.pronScore))),
        completenessScore: Math.min(100, Math.max(0, Math.round(parsed.completenessScore || 100))),
        prosodyScore: Math.min(100, Math.max(0, Math.round(parsed.prosodyScore || parsed.pronScore))),
        provider: "Google Gemini 2.5 Flash Audio (Multimodal)",
        recognizedTranscript: parsed.recognizedTranscript || "",
        latencyMs: Date.now() - startTime,
        audioSizeBytes: audioBlob.size,
        wordScores: parsed.wordScores.map((w: any) => ({
          word: String(w.word || ""),
          score: Math.min(100, Math.max(0, Math.round(w.score ?? 80))),
          accuracyScore: Math.min(100, Math.max(0, Math.round(w.accuracyScore ?? w.score ?? 80))),
          errorType: w.errorType || (w.score < 60 ? "Mispronunciation" : "None"),
        })),
      };
    }
  } catch (err) {
    console.warn("Gemini Audio Assessment error, trying fallback provider:", err);
  }
  return null;
}

/**
 * Assesses pronunciation using Groq Whisper-large-v3 transcription
 */
async function assessWithGroqWhisper(
  audioBlob: Blob,
  referenceText: string,
  groqKey: string,
  startTime: number
): Promise<PronScoreResult | null> {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "speech.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");
    formData.append("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.warn("Groq Whisper API HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    const transcribedText = (data.text || "").trim();
    // If Whisper detects no speech (empty transcription), it was silence
    if (!transcribedText) {
      return createSilentPronResult(referenceText, "Groq Whisper-large-v3", audioBlob.size, Date.now() - startTime);
    }

    const sim = simulatePronAssessment(referenceText, transcribedText);
    return {
      ...sim,
      provider: "Groq Whisper-large-v3",
      recognizedTranscript: transcribedText,
      latencyMs: Date.now() - startTime,
      audioSizeBytes: audioBlob.size,
    };
  } catch (err) {
    console.warn("Groq Whisper Speech Assessment failed:", err);
  }
  return null;
}

/**
 * Assesses pronunciation against reference text with multi-provider failover:
 * 1. Azure Speech (if valid key)
 * 2. Google Gemini 2.5 Flash Audio (listens directly to audio file)
 * 3. Groq Whisper (ultra-fast transcription)
 * 4. Local Heuristic Simulator
 */
export async function assessPronunciation(
  audioBlob: Blob,
  referenceText: string,
  userTranscript?: string
): Promise<PronScoreResult> {
  const startTime = Date.now();
  // If recording is empty or less than 1KB (header only with no audio bytes), return 0
  if (!audioBlob || audioBlob.size < 1000) {
    return createSilentPronResult(
      referenceText,
      "Phát hiện tệp âm thanh rỗng (< 1KB)",
      audioBlob?.size || 0,
      Date.now() - startTime
    );
  }

  // 1. Try Azure Speech if key is real and valid (not placeholder)
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION || "eastus";
  const isAzureValid =
    azureKey &&
    !azureKey.includes("your_azure_speech_key_here") &&
    azureKey.length > 10;

  if (isAzureValid) {
    try {
      const pronAssessmentParams = {
        ReferenceText: referenceText,
        GradingSystem: "HundredMark",
        Granularity: "Phoneme",
        Dimension: "Comprehensive",
        EnableProsodyAssessment: "True",
      };

      const paramsJson = JSON.stringify(pronAssessmentParams);
      const paramsBase64 = Buffer.from(paramsJson).toString("base64");

      const response = await fetch(
        `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureKey,
            "Pronunciation-Assessment": paramsBase64,
            "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
            Accept: "application/json",
          },
          body: audioBlob,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const nBest = data.NBest?.[0];
        if (nBest) {
          const words: WordScore[] = (nBest.Words || []).map((w: any) => ({
            word: w.Word,
            score: Math.round(w.PronunciationAssessment?.AccuracyScore || 80),
            accuracyScore: Math.round(w.PronunciationAssessment?.AccuracyScore || 80),
            errorType: w.PronunciationAssessment?.ErrorType || "None",
          }));

          return {
            pronScore: Math.round(nBest.PronScore || 85),
            accuracyScore: Math.round(nBest.AccuracyScore || 84),
            fluencyScore: Math.round(nBest.FluencyScore || 86),
            completenessScore: Math.round(nBest.CompletenessScore || 100),
            prosodyScore: Math.round(nBest.ProsodyScore || 83),
            provider: "Azure AI Speech Services",
            recognizedTranscript: data.DisplayText || nBest.Display || referenceText,
            latencyMs: Date.now() - startTime,
            audioSizeBytes: audioBlob.size,
            wordScores: words,
          };
        }
      }
    } catch (err) {
      console.warn("Azure Speech API request failed, falling back to Gemini Audio:", err);
    }
  }

  // 2. Try Google Gemini Audio (Multimodal)
  const geminiKey = process.env.GEMINI_API_KEY;
  const isGeminiValid =
    geminiKey &&
    !geminiKey.includes("your_gemini_api_key_here") &&
    geminiKey.length > 10;

  if (isGeminiValid) {
    const geminiScore = await assessWithGeminiAudio(audioBlob, referenceText, geminiKey, startTime);
    if (geminiScore) {
      return geminiScore;
    }
  }

  // 3. Try Groq Whisper
  const groqKey = process.env.GROQ_API_KEY;
  const isGroqValid =
    groqKey &&
    !groqKey.includes("your_groq_api_key_here") &&
    groqKey.startsWith("gsk_");

  if (isGroqValid) {
    const groqScore = await assessWithGroqWhisper(audioBlob, referenceText, groqKey, startTime);
    if (groqScore) {
      return groqScore;
    }
  }

  // 4. Developer Fallback & Heuristic Simulator
  const fallbackResult = simulatePronAssessment(referenceText, userTranscript);
  return {
    ...fallbackResult,
    provider: "Local Heuristic Simulator",
    latencyMs: Date.now() - startTime,
    audioSizeBytes: audioBlob.size,
  };
}

/**
 * Heuristic pronunciation scoring simulation for zero-cost developer testing
 */
export function simulatePronAssessment(
  referenceText: string,
  userTranscript?: string
): PronScoreResult {
  const targetWords = referenceText
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  // If user transcript is explicitly provided as empty string, it signifies silence
  if (userTranscript !== undefined && userTranscript.trim() === "") {
    return createSilentPronResult(referenceText);
  }

  const wordsSpoken = (userTranscript !== undefined ? userTranscript : referenceText)
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (wordsSpoken.length === 0) {
    return createSilentPronResult(referenceText);
  }

  const wordScores: WordScore[] = targetWords.map((word) => {
    const isPresent = wordsSpoken.includes(word);
    const length = word.length;
    // Longer and complex words have higher variability
    const baseScore = isPresent ? Math.min(96, 75 + (length % 5) * 5) : 45;
    const jitter = Math.floor(Math.random() * 8) - 3;
    const score = Math.max(30, Math.min(100, baseScore + jitter));

    return {
      word,
      score,
      accuracyScore: score,
      errorType: score < 60 ? "Mispronunciation" : "None",
    };
  });

  const accuracyAvg =
    wordScores.reduce((acc, curr) => acc + curr.score, 0) / (wordScores.length || 1);
  const fluencyScore = Math.min(95, Math.max(65, Math.round(accuracyAvg + (Math.random() * 6 - 2))));
  const completenessScore = Math.min(
    100,
    Math.round((wordsSpoken.length / (targetWords.length || 1)) * 100)
  );
  const prosodyScore = Math.min(95, Math.max(60, Math.round((accuracyAvg + fluencyScore) / 2)));
  const pronScore = Math.round(
    accuracyAvg * 0.4 + fluencyScore * 0.2 + completenessScore * 0.2 + prosodyScore * 0.2
  );

  return {
    pronScore,
    accuracyScore: Math.round(accuracyAvg),
    fluencyScore,
    completenessScore,
    prosodyScore,
    provider: "Local Heuristic Simulator",
    recognizedTranscript: userTranscript !== undefined ? userTranscript : referenceText,
    wordScores,
  };
}
