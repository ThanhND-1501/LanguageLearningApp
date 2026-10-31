import { NextResponse } from "next/server";
import { extractVocabularyFromDocument } from "@/lib/document-extractor";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const level = (formData.get("level") as string) || "B2-C1";
      const count = parseInt((formData.get("count") as string) || "8", 10);
      const deckTitle = (formData.get("deckTitle") as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn tệp tin tài liệu cần tải lên." },
          { status: 400 }
        );
      }

      // Convert Web API File to Node.js Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await extractVocabularyFromDocument({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
        level,
        count: isNaN(count) ? 8 : count,
        deckTitle,
      });

      return NextResponse.json(result);
    }

    // JSON fallback (base64)
    const body = await request.json();
    const { fileBase64, fileName, mimeType, level, count, deckTitle } = body;

    if (!fileBase64 || !fileName) {
      return NextResponse.json(
        { success: false, error: "Thiếu dữ liệu tệp tin hoặc tên file." },
        { status: 400 }
      );
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    const result = await extractVocabularyFromDocument({
      fileName,
      mimeType: mimeType || "application/octet-stream",
      buffer,
      level: level || "B2-C1",
      count: count || 8,
      deckTitle,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/ai/extract-document error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Xảy ra lỗi trong quá trình xử lý tài liệu.",
      },
      { status: 500 }
    );
  }
}

