import { NextResponse } from "next/server";
import { evaluateSpokenSentence } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetWords, userSentence, promptQuestion } = body;

    if (!userSentence) {
      return NextResponse.json(
        { success: false, error: "Missing userSentence" },
        { status: 400 }
      );
    }

    const evaluation = await evaluateSpokenSentence(
      targetWords || [],
      userSentence,
      promptQuestion || "Free speaking response"
    );

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate speech" },
      { status: 500 }
    );
  }
}
