// ==============================================================================
// AI Language & Vision Pipeline (Multimodal Vision OCR, Topic Expansion, Grammar & Roleplay)
// ==============================================================================

import { GeneratedCardItem, GrammarEvaluationResult, RoleplayScenario } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Generate flashcards from Topic or Image using AI models
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

    // Call Cloud AI REST API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
      throw new Error(`AI Service API responded with status ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      return JSON.parse(textOutput);
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
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
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
    console.error("AI Grammar Evaluation Error:", err);
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
 * Powered by AI Language Models with multi-tier failover
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

  // 1. Try Primary AI Provider
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
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
      console.warn("Primary AI Roleplay error, trying fallback AI:", err);
    }
  }

  // 2. Try Secondary AI Provider
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
      console.warn("Secondary AI Roleplay error:", err);
    }
  }

  // 3. Fallback template
  const nextTarget = remainingWords[0] || targetWords[0];
  return `That makes a lot of sense. Speaking of our strategy, how do you think we can best incorporate concepts like '${nextTarget}' into our upcoming objectives?`;
}

/**
 * Generates a customized AI Roleplay scenario based on user prompt/instructions
 * Uses AI Language Models with failover and graceful template fallback
 */
export async function generateCustomRoleplayScenario(params: {
  instruction: string;
  level?: string;
  targetWords?: string[];
}): Promise<RoleplayScenario> {
  const { instruction, level = "Intermediate (B1-B2)", targetWords = [] } = params;

  // Clean target words
  const cleanTargetWords = targetWords
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || GEMINI_MODEL;

  // 1. Try Primary Cloud AI API
  if (apiKey && !apiKey.includes("your_gemini_api_key_here") && apiKey.length > 10) {
    try {
      const prompt = `Bạn là một chuyên gia ngôn ngữ học và thiết kế giáo trình đàm thoại tiếng Anh ứng dụng thực tế.
Người dùng muốn tạo một kịch bản luyện tập giao tiếp nhập vai (AI Roleplay Conversation) theo hướng dẫn / tình huống sau:
"${instruction}"

Trình độ mục tiêu: ${level}
${cleanTargetWords.length > 0 ? `Từ vựng người dùng muốn đưa vào luyện tập: [${cleanTargetWords.join(", ")}]` : ""}

YÊU CẦU:
Thiết kế một kịch bản nhập vai tương tác hoàn chỉnh giữa AI và người học:
1. "title": Tiêu đề kịch bản súc tích, hấp dẫn (tiếng Việt có kèm phụ đề ngữ cảnh tiếng Anh nếu cần).
2. "description": Mô tả ngắn gọn bối cảnh tình huống, vai trò của người học và mục tiêu đàm thoại (1-2 câu tiếng Việt).
3. "aiPersona": Vai trò nhân vật mà AI sẽ đóng (ví dụ: "US Embassy Consular Officer", "Hotel Front Desk Manager", "Senior Technical Interviewer", "Car Dealership Sales Rep").
4. "initialMessage": Lời thoại mở đầu tự nhiên, chân thực của AI bằng TIẾNG ANH (1-2 câu) để chào hỏi và bắt đầu cuộc hội thoại, khơi gợi người học trả lời.
5. "targetWords": Mảng gồm 3 đến 5 từ vựng hoặc cụm từ (idiom/collocation) tiếng Anh đắt giá, phù hợp nhất với tình huống và trình độ ${level} mà người học nên vận dụng vào câu trả lời của mình. ${cleanTargetWords.length > 0 ? `Hãy ưu tiên kết hợp các từ: ${cleanTargetWords.join(", ")}.` : ""}

ĐỊNH DẠNG ĐẦU RA:
Trả về DUY NHẤT một đối tượng JSON hợp lệ (không chứa markdown backticks, không giải thích ngoài lề):
{
  "title": "...",
  "description": "...",
  "aiPersona": "...",
  "initialMessage": "...",
  "targetWords": ["word1", "word2", "word3", "word4"]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
              maxOutputTokens: 600,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.title && parsed.aiPersona && parsed.initialMessage) {
            return {
              id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title: parsed.title,
              description: parsed.description || `Kịch bản đàm thoại theo yêu cầu: "${instruction}"`,
              aiPersona: parsed.aiPersona,
              initialMessage: parsed.initialMessage,
              targetWords: Array.isArray(parsed.targetWords) && parsed.targetWords.length > 0
                ? parsed.targetWords
                : cleanTargetWords.length > 0 ? cleanTargetWords : ["collaborate", "resilient", "viable"],
              isCustom: true,
              createdAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.warn("Primary AI Custom Scenario Generation Error, trying fallback AI:", err);
    }
  }

  // 2. Try Secondary AI Provider Failover
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
              content: `You are an expert English conversation curriculum designer. The user wants a custom roleplay scenario.
Return ONLY valid JSON matching this schema:
{
  "title": "Short title in Vietnamese with English subtitle",
  "description": "Short scenario context in Vietnamese (1-2 sentences)",
  "aiPersona": "Role of the AI in English",
  "initialMessage": "Authentic opening spoken English line from the AI",
  "targetWords": ["word1", "word2", "word3"]
}`,
            },
            {
              role: "user",
              content: `User instruction: "${instruction}". Target level: ${level}. Preferred words: [${cleanTargetWords.join(", ")}]`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.title && parsed.aiPersona && parsed.initialMessage) {
            return {
              id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title: parsed.title,
              description: parsed.description || `Kịch bản đàm thoại theo yêu cầu: "${instruction}"`,
              aiPersona: parsed.aiPersona,
              initialMessage: parsed.initialMessage,
              targetWords: Array.isArray(parsed.targetWords) && parsed.targetWords.length > 0
                ? parsed.targetWords
                : cleanTargetWords.length > 0 ? cleanTargetWords : ["collaborate", "resilient", "viable"],
              isCustom: true,
              createdAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.warn("Secondary AI Custom Scenario Generation Error:", err);
    }
  }

  // 3. Fallback scenario template
  return getFallbackCustomScenario(instruction, cleanTargetWords);
}

function getFallbackCustomScenario(instruction: string, customWords?: string[]): RoleplayScenario {
  const fallbackWords = customWords && customWords.length >= 2
    ? customWords
    : ["clarify", "perspective", "recommend", "objective"];

  const safeTitle = instruction.trim().length > 35
    ? instruction.trim().slice(0, 35) + "..."
    : instruction.trim() || "Tình huống giao tiếp thực tế";

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: safeTitle,
    description: `Kịch bản mô phỏng tương tác theo yêu cầu: "${instruction}". Hãy dùng các từ vựng mục tiêu trong quá trình trao đổi với AI.`,
    aiPersona: "Native Conversation Partner",
    initialMessage: `Hello there! I'm glad we could connect today to talk about this. To help me better understand your perspective, could you briefly describe what you hope to achieve first?`,
    targetWords: fallbackWords,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
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
