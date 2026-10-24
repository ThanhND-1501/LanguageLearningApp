import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              LingoPulse AI — Personal Language Platform
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Nền tảng học ngoại ngữ cá nhân • Spaced Repetition (FSRS/SM-2) • Gemini 2.5 • Azure Speech PronScore
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/decks" className="hover:text-brand-600 transition-colors">Bộ từ</Link>
            <Link href="/speaking" className="hover:text-brand-600 transition-colors">Luyện nói</Link>
            <Link href="/conversation" className="hover:text-brand-600 transition-colors">Hội thoại</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
