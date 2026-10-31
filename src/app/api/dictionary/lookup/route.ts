import { NextResponse } from "next/server";
import { fetchCambridgeWord } from "@/lib/cambridge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get("word");

    if (!word || !word.trim()) {
      return NextResponse.json(
        { success: false, error: "Tham số 'word' không được để trống" },
        { status: 400 }
      );
    }

    const data = await fetchCambridgeWord(word);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: `Không tìm thấy từ '${word}' trên từ điển Cambridge.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi tra cứu từ điển Cambridge" },
      { status: 500 }
    );
  }
}
