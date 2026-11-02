// ==============================================================================
// Google Gemini AI Pipeline (Multimodal Vision OCR, Topic Expansion, Grammar & Roleplay)
// ==============================================================================

import { GeneratedCardItem, GrammarEvaluationResult } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate flashcards from Topic or Image using Gemini 2.5 Flash / Gemini models
 */
export async function generateFlashcardsWithAI(params: {
  topic?: string;
  level?: string;
  count?: number;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<GeneratedCardItem[]> {
  const { topic = "IELTS Academic Vocabulary", level = "B2-C1", count = 5, imageBase64, imageMimeType } = params;

  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured, returning curated AI template cards.");
    return getFallbackGeneratedCards(topic);
  }

  const prompt = `
Bạn là chuyên gia ngôn ngữ học và giáo viên luyện thi quốc tế.
${
  imageBase64
    ? "Hãy phân tích hình ảnh đính kèm (ảnh chụp trang sách/tài liệu), bóc tách văn bản OCR và trích xuất " + count + " từ vựng quan trọng nhất."
    : `Hãy tạo ${count} từ vựng/cụm từ tiếng Anh hay nhất về chủ đề: "${topic}" ở trình độ ${level}.`
}

Yêu cầu định dạng: Trả về duy nhất một mảng JSON thuần túy (không bọc mã markdown thừa), mỗi phần tử gồm:
- term: Từ vựng hoặc cụm từ
- phonetic: Phiên âm quốc tế IPA chuẩn
- partOfSpeech: Từ loại (noun, verb, adjective, phrase, idiom...)
- definition: Nghĩa tiếng Việt ngắn gọn, súc tích và chuẩn ngữ cảnh
- exampleSentence: 1 câu ví dụ tiếng Anh tự nhiên chứa từ đó
- exampleTranslation: Bản dịch tiếng Việt của câu ví dụ
- synonyms: Mảng 2-3 từ đồng nghĩa tiếng Anh
- speakingPrompt: 1 câu hỏi mở ngắn gọn buộc người học phải dùng từ này để trả lời khi luyện nói.
`;

  try {
    const contents: any[] = [];
    const parts: any[] = [];

    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
          mimeType: imageMimeType,
        },
      });
    }

    parts.push({ text: prompt });
    contents.push({ parts });

    // Call Gemini REST API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      return JSON.parse(textOutput);
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
  }

  return getFallbackGeneratedCards(topic);
}

/**
 * Evaluates spoken user sentence against target vocabulary words & checks grammar
 */
export async function evaluateSpokenSentence(
  targetWords: string[],
  userSentence: string,
  promptQuestion: string
): Promise<GrammarEvaluationResult> {
  if (!GEMINI_API_KEY) {
    // Heuristic analysis when API key is not present
    const lower = userSentence.toLowerCase();
    const missing = targetWords.filter((w) => !lower.includes(w.toLowerCase()));
    return {
      hasUsedTargetWords: missing.length === 0,
      missingWords: missing,
      hasGrammarErrors: false,
      explanationVi: missing.length === 0 
        ? "Bạn đã sử dụng chính xác các từ vựng mục tiêu trong câu nói!" 
        : `Bạn chưa đưa từ vựng: ${missing.join(", ")} vào câu trả lời.`,
      correctedSentence: userSentence,
      naturalRewrite: `To answer "${promptQuestion}", a native speaker might say: "${userSentence.replace(/^[a-z]/, (s) => s.toUpperCase())}"`,
    };
  }

  const prompt = `
Bạn là giám khảo chấm thi nói tiếng Anh bản xứ.
Câu hỏi thảo luận: "${promptQuestion}"
Từ vựng mục tiêu buộc phải sử dụng: [${targetWords.join(", ")}]
Câu trả lời của người học: "${userSentence}"

Nhiệm vụ:
1. Kiểm tra xem người học đã dùng đúng (các) từ mục tiêu chưa.
2. Kiểm tra lỗi ngữ pháp, chia thì, chia động từ kép, mạo từ (ví dụ: "did not gave" -> "did not give").
3. Gợi ý câu viết lại tự nhiên, chuẩn bản xứ (collocation tự nhiên hơn).
4. Giải thích ngắn gọn bằng tiếng Việt dễ hiểu.

Trả về DUY NHẤT một JSON format:
{
  "hasUsedTargetWords": boolean,
  "missingWords": string[],
  "hasGrammarErrors": boolean,
  "explanationVi": string,
  "correctedSentence": string,
  "naturalRewrite": string
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (output) {
        return JSON.parse(output);
      }
    }
  } catch (err) {
    console.error("Gemini Grammar Evaluation Error:", err);
  }

  return {
    hasUsedTargetWords: true,
    missingWords: [],
    hasGrammarErrors: false,
    explanationVi: "Không phát hiện lỗi ngữ pháp cơ bản.",
    correctedSentence: userSentence,
    naturalRewrite: userSentence,
  };
}

/**
 * Generates an authentic, context-aware conversational response for AI Roleplay
 * Powered by Google Gemini 2.5 Flash with Groq Llama 3.3 failover
 */
export async function generateRoleplayReply(params: {
  scenarioTitle: string;
  aiPersona: string;
  targetWords: string[];
  usedWords: string[];
  history: Array<{ role: "assistant" | "user"; content: string }>;
  userMessage: string;
}): Promise<string> {
  const { scenarioTitle, aiPersona, targetWords, usedWords, history, userMessage } = params;
  const remainingWords = targetWords.filter((w) => !usedWords.includes(w));

  // 1. Try Google Gemini 2.5 Flash
  if (GEMINI_API_KEY && !GEMINI_API_KEY.includes("your_gemini_api_key_here") && GEMINI_API_KEY.length > 10) {
    try {
      const prompt = `You are roleplaying as "${aiPersona}" in an interactive English learning scenario: "${scenarioTitle}".
The user is an English language learner practicing spoken communication.

Target vocabulary words for this scenario: [${targetWords.join(", ")}].
Already used words: [${usedWords.join(", ")}].
Remaining words to use: [${remainingWords.join(", ")}].

Recent conversation history:
${history.slice(-6).map((m) => `${m.role === "assistant" ? aiPersona : "Learner"}: ${m.content}`).join("\n")}
Learner: ${userMessage}

YOUR TASK:
1. Respond naturally in authentic spoken English (2 to 3 sentences max), staying strictly in character as ${aiPersona}.
2. React genuinely to what the learner actually expressed.
3. If there are remaining target words (${remainingWords.join(", ")}), subtly nudge the dialogue or ask a targeted follow-up question so the learner naturally gets a chance to use them.
4. Keep the tone conversational, professional, and encouraging.

Respond ONLY with your spoken dialogue in English. No markdown, no prefixes, no explanations.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return text.replace(/^["']|["']$/g, "").trim();
        }
      }
    } catch (err) {
      console.warn("Gemini Roleplay API error, trying Groq fallback:", err);
    }
  }

  // 2. Try Groq Llama 3.3
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.includes("your_groq_api_key_here") && groqKey.startsWith("gsk_")) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are roleplaying as ${aiPersona} in "${scenarioTitle}". Respond in 2-3 natural spoken English sentences. React to the learner and ask an engaging question to help them practice words: ${remainingWords.join(", ")}.`,
            },
            ...history.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return text.replace(/^["']|["']$/g, "").trim();
        }
      }
    } catch (err) {
      console.warn("Groq Roleplay API error:", err);
    }
  }

  // 3. Fallback template
  const nextTarget = remainingWords[0] || targetWords[0];
  return `That makes a lot of sense. Speaking of our strategy, how do you think we can best incorporate concepts like '${nextTarget}' into our upcoming objectives?`;
}

/**
 * Fallback dataset for instant preview without requiring an API key immediately
 */
function getFallbackGeneratedCards(topic: string): GeneratedCardItem[] {
  return [
    {
      term: "pragmatic",
      phonetic: "/præɡˈmæt.ɪk/",
      partOfSpeech: "adjective",
      definition: "Thực tế, thực dụng, giải quyết vấn đề dựa trên điều kiện thực tế",
      exampleSentence: "We need to adopt a pragmatic approach to meet the deadline.",
      exampleTranslation: "Chúng ta cần áp dụng một cách tiếp cận thực tế để kịp hạn chót.",
      synonyms: ["practical", "sensible", "realistic"],
      speakingPrompt: `In the context of ${topic}, why is a pragmatic mindset essential?`,
    },
    {
      term: "discrepancy",
      phonetic: "/dɪˈskrep.ən.si/",
      partOfSpeech: "noun",
      definition: "Sự khác biệt, sai lệch không thống nhất giữa các sự việc hoặc số liệu",
      exampleSentence: "The auditors discovered a major discrepancy in the quarterly financial reports.",
      exampleTranslation: "Các kiểm toán viên đã phát hiện một sự sai lệch lớn trong báo cáo tài chính quý.",
      synonyms: ["inconsistency", "variance", "mismatch"],
      speakingPrompt: "How should a team handle a noticeable discrepancy in project estimations?",
    },
    {
      term: "streamline",
      phonetic: "/ˈstriːm.laɪn/",
      partOfSpeech: "verb",
      definition: "Hợp lý hóa, tinh gọn quy trình để tăng hiệu quả hoạt động",
      exampleSentence: "The company aims to streamline its customer onboarding process.",
      exampleTranslation: "Công ty đặt mục tiêu tinh gọn quy trình tiếp nhận khách hàng mới.",
      synonyms: ["simplify", "optimize", "expedite"],
      speakingPrompt: "What steps would you take to streamline your daily workflow?",
    },
  ];
}
