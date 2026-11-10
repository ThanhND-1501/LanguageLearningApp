"use client";

import Link from "next/link";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, Shield } from "lucide-react";

interface AuthGuardProps {
  title?: string;
  description?: string;
  featureName?: string;
  backHref?: string;
  backLabel?: string;
}

export function AuthGuard({
  title = "Yêu cầu đăng nhập tài khoản",
  description = "Tính năng này yêu cầu bạn đăng nhập để ghi nhận tiến độ, lưu trữ dữ liệu cá nhân và đồng bộ đám mây.",
  featureName = "Tính năng cần tài khoản",
  backHref = "/decks",
  backLabel = "Quay về Thư viện bộ từ",
}: AuthGuardProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-6 border border-brand-100 dark:border-brand-900 shadow-sm">
          <Lock className="h-8 w-8" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 mb-3">
          <Shield className="h-3.5 w-3.5" />
          <span>{featureName}</span>
        </div>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {/* Feature Highlights */}
        <div className="my-8 text-left bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Lưu trữ tiến độ cá nhân & thuật toán lặp lại ngắt quãng (SM-2)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Chấm điểm phát âm PronScore™ 4 chiều & phân tích ngữ điệu</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Hội thoại nhập vai AI không giới hạn & trích xuất tài liệu thông minh</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={backHref}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
