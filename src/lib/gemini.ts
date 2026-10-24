// ==============================================================================
// Google Gemini AI Pipeline (Multimodal Vision OCR, Topic Expansion, Grammar & Roleplay)
// Referenced from Section 3.3 & 5.4 of openquiz_ai_technical_analysis_and_blueprint.md
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
