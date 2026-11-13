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
      bg: "bg-good-soft",
      text: "text-good",
      border: "border-good/25",
      label: "Xuất sắc (Native-like)",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-fair-soft",
      text: "text-fair",
      border: "border-fair/25",
      label: "Khá (Understandable)",
    };
  }
  return {
    bg: "bg-poor-soft",
    text: "text-poor",
    border: "border-poor/25",
    label: "Cần cải thiện",
  };
}
