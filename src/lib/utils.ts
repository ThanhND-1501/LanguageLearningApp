import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(isoString: string): string {
  const targetDate = new Date(isoString);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    if (Math.abs(diffHours) < 1) return "Đến hạn ngay bây giờ";
    if (Math.abs(diffDays) < 1) return `Quá hạn ${Math.abs(diffHours)} giờ`;
    return `Quá hạn ${Math.abs(diffDays)} ngày`;
  }

  if (diffMins < 60) return `Sau ${diffMins} phút`;
  if (diffHours < 24) return `Sau ${diffHours} giờ`;
  if (diffDays === 1) return "Ngày mai";
  return `Sau ${diffDays} ngày`;
}

export function getScoreBadgeColor(score: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-300 dark:border-emerald-800",
      label: "Xuất sắc (Native-like)",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-300 dark:border-amber-800",
      label: "Khá (Understandable)",
    };
  }
  return {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-800",
    label: "Cần cải thiện",
  };
}
