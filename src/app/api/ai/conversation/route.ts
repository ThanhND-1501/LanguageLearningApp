import { NextResponse } from "next/server";
import { generateRoleplayReply } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioTitle, aiPersona, targetWords, usedWords, messages, userMessage } = body;

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing userMessage" },
        { status: 400 }
      );
    }

    const reply = await generateRoleplayReply({
      scenarioTitle: scenarioTitle || "General English Conversation",
      aiPersona: aiPersona || "Native English Speaker",
      targetWords: targetWords || [],
      usedWords: usedWords || [],
      history: Array.isArray(messages) ? messages : [],
      userMessage,
    });

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error("API /api/ai/conversation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate roleplay response" },
      { status: 500 }
    );
  }
}

