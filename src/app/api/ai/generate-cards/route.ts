import { NextResponse } from "next/server";
import { generateFlashcardsWithAI } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, level, count, imageBase64, imageMimeType } = body;

    const cards = await generateFlashcardsWithAI({
      topic,
      level,
      count: count || 5,
      imageBase64,
      imageMimeType,
    });

    return NextResponse.json({ success: true, cards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate cards" },
      { status: 500 }
    );
  }
}
