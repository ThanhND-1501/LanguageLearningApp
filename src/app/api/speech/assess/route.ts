import { NextResponse } from "next/server";
import { assessPronunciation } from "@/lib/azure-speech";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const referenceText = formData.get("referenceText") as string || "";
    const userTranscript = formData.get("userTranscript") as string || "";

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "Missing audio recording file" },
        { status: 400 }
      );
    }

    const pronResult = await assessPronunciation(audioFile, referenceText, userTranscript);

    return NextResponse.json({ success: true, result: pronResult });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Pronunciation assessment failed" },
      { status: 500 }
    );
  }
}
