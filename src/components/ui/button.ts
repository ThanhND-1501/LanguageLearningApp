import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-button hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-subtle",
  soft: "bg-primary-soft text-primary-ink hover:bg-primary-soft-hover",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
  danger: "border border-line bg-surface text-poor hover:border-poor/40 hover:bg-poor-soft",
  inverse: "bg-white text-primary-hover hover:bg-primary-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-lg px-3.5 text-sm",
  md: "h-11 rounded-[10px] px-5 text-[15px]",
  lg: "h-[52px] rounded-xl px-6 text-base",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(base, variants[variant], sizes[size], className);
}
