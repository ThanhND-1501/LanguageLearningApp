import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "LingoPulse AI — Nền Tảng Học Ngoại Ngữ Phản Xạ & Lặp Lại Ngắt Quãng",
  description:
    "Học từ vựng chủ động, Spaced Repetition (FSRS/SM-2), AI Chấm điểm phát âm PronScore và Luyện hội thoại phản xạ tương tự OpenQuiz.ai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
