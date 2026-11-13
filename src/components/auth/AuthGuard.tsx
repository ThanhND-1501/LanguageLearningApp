"use client";

import Link from "next/link";
import { ReadingLearner } from "@/components/illustrations";
import { buttonClass } from "@/components/ui/button";

interface AuthGuardProps {
  title?: string;
  description?: string;
  /** Kept for API compatibility; no longer rendered. */
  featureName?: string;
  backHref?: string;
  backLabel?: string;
}

export function AuthGuard({
  title = "Đăng nhập để tiếp tục",
  description = "Phần này cần tài khoản để lưu tiến độ học và dữ liệu cá nhân của bạn.",
  backHref = "/decks",
  backLabel = "Về thư viện bộ từ",
}: AuthGuardProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <ReadingLearner className="h-auto w-56" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{description}</p>
      <div className="mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Link href="/login" className={buttonClass("primary", "md")}>
          Đăng nhập
        </Link>
        <Link href={backHref} className={buttonClass("secondary", "md")}>
          {backLabel}
        </Link>
      </div>
      <p className="mt-5 text-sm text-mute">
        Chưa có tài khoản?{" "}
        <Link href="/login?mode=signup" className="font-semibold text-primary-ink hover:underline">
          Tạo tài khoản miễn phí
        </Link>
      </p>
    </div>
  );
}
