import { NextResponse } from "next/server";
import { checkOpenPronounceHealth } from "@/lib/azure-speech";

export async function GET() {
  const status = await checkOpenPronounceHealth();
  return NextResponse.json(status);
}

