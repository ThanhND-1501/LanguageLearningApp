import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "LingoPulse AI — Nền Tảng Học Ngoại Ngữ Phản Xạ & Lặp Lại Ngắt Quãng",
  description:
    "Học từ vựng chủ động, Spaced Repetition (FSRS/SM-2), AI Chấm điểm phát âm PronScore và Luyện hội thoại phản xạ tự nhiên.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
