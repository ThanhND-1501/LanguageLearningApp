import { NextResponse } from "next/server";
import { generateCustomRoleplayScenario } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instruction, level, targetWords } = body;

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập hướng dẫn hoặc tình huống hội thoại mong muốn." },
        { status: 400 }
      );
    }

    const scenario = await generateCustomRoleplayScenario({
      instruction: instruction.trim(),
      level: level || "Intermediate (B1-B2)",
      targetWords: Array.isArray(targetWords) ? targetWords : [],
    });

    return NextResponse.json({ success: true, scenario });
  } catch (error: any) {
    console.error("API /api/ai/scenario error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate custom roleplay scenario" },
      { status: 500 }
    );
  }
}
