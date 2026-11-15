import { describe, it, assert } from "./test-helper";
import { generateCustomRoleplayScenario } from "../src/lib/gemini";
import { POST } from "../src/app/api/ai/scenario/route";

describe("Custom Roleplay Scenario Engine (AI Pipeline)", () => {
  const originalFetch = globalThis.fetch;

  it("should generate a valid custom scenario using AI API when available", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test_gemini_key_123456789";
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: "Phỏng vấn xin Visa du lịch Mỹ (US Tourist Visa Interview)",
                  description: "Bạn đang phỏng vấn với viên chức lãnh sự quán Hoa Kỳ. Hãy trả lời tự tin về mục đích, lịch trình và các mối ràng buộc tại quê nhà.",
                  aiPersona: "US Consular Visa Officer",
                  initialMessage: "Good morning. Please step forward and state the primary purpose of your trip to the United States.",
                  targetWords: ["itinerary", "strong ties", "sponsor", "duration"],
                }),
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("generativelanguage.googleapis.com")) {
        return new Response(JSON.stringify(mockGeminiResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not found", { status: 404 });
    }) as any;

    try {
      const scenario = await generateCustomRoleplayScenario({
        instruction: "Phỏng vấn visa du lịch Mỹ",
        level: "B1-B2",
        targetWords: ["itinerary", "strong ties"],
      });

      assert.ok(scenario.id.startsWith("custom-"));
      assert.strictEqual(scenario.title, "Phỏng vấn xin Visa du lịch Mỹ (US Tourist Visa Interview)");
      assert.strictEqual(scenario.aiPersona, "US Consular Visa Officer");
      assert.ok(scenario.initialMessage.includes("primary purpose"));
      assert.deepStrictEqual(scenario.targetWords, ["itinerary", "strong ties", "sponsor", "duration"]);
      assert.strictEqual(scenario.isCustom, true);
    } finally {
      process.env.GEMINI_API_KEY = prevKey;
      globalThis.fetch = originalFetch;
    }
  });

  it("should gracefully fallback to a formatted scenario when AI API is unavailable", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Network offline");
    }) as any;

    try {
      const scenario = await generateCustomRoleplayScenario({
        instruction: "Đàm phán hợp đồng cung ứng thiết bị",
        level: "B2-C1",
        targetWords: ["procurement", "lead time", "contingency"],
      });

      assert.ok(scenario.id.startsWith("custom-"));
      assert.strictEqual(scenario.title, "Đàm phán hợp đồng cung ứng thiết bị");
      assert.strictEqual(scenario.aiPersona, "Native Conversation Partner");
      assert.ok(scenario.initialMessage.length > 10);
      assert.deepStrictEqual(scenario.targetWords, ["procurement", "lead time", "contingency"]);
      assert.strictEqual(scenario.isCustom, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("Custom Scenario API Route Handler (/api/ai/scenario)", () => {
  it("should return 400 Bad Request when instruction is missing or empty", async () => {
    const request = new Request("http://localhost:3000/api/ai/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: "" }),
    });

    const response = await POST(request);
    assert.strictEqual(response.status, 400);

    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes("hướng dẫn"));
  });

  it("should return 200 OK with created scenario when instruction is provided", async () => {
    const request = new Request("http://localhost:3000/api/ai/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction: "Phàn nàn dịch vụ khách sạn 5 sao",
        level: "B1-B2",
        targetWords: ["inconvenience", "upgrade"],
      }),
    });

    const response = await POST(request);
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.scenario);
    assert.ok(body.scenario.id);
    assert.ok(body.scenario.initialMessage);
    assert.ok(Array.isArray(body.scenario.targetWords));
  });
});
