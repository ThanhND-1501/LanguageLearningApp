/**
 * Placeholder line illustrations: original hand-drawn style, ink stroke plus
 * one primary-blue spot. Ink follows the text color so they work in dark mode.
 * Replace freely; every illustration is decorative (aria-hidden).
 */
import { cn } from "@/lib/utils";

type P = { className?: string };

const FILL = "rgb(var(--illus-fill))";
const SPOT = "rgb(var(--primary))";

function Svg({ className, w, h, children }: P & { w: number; h: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("text-ink", className)}
    >
      {children}
    </svg>
  );
}

/** Learner holding a small stack of flashcards. */
export function LearnerWithCards({ className }: P) {
  return (
    <Svg className={className} w={260} h={230}>
      <path d="M60 222c18-58 50-78 74-78s58 22 70 78" fill={FILL} />
      <ellipse cx="190" cy="74" rx="34" ry="30" fill={SPOT} stroke="none" opacity=".9" />
      <path d="M134 124c-20 0-34-16-33-37 1-20 15-34 34-33 19 1 31 17 30 36-1 20-13 34-31 34z" fill={FILL} />
      <path d="M103 82c6-22 28-34 50-24 10 5 16 14 15 26-8-8-20-12-30-9-12 4-22 6-35 7z" fill="currentColor" />
      <path d="M122 92v.5M146 92v.5" strokeWidth="3.4" />
      <path d="M127 105c4 4 11 4 15 0" />
      <g transform="rotate(-10 120 168)">
        <rect x="96" y="148" width="68" height="46" rx="5" fill={FILL} />
        <path d="M108 164h30M108 176h44" />
      </g>
      <g transform="rotate(8 150 158)">
        <rect x="132" y="140" width="68" height="46" rx="5" fill={FILL} />
        <path d="M146 158c4-6 10-6 14 0s10 6 14 0" stroke={SPOT} />
        <path d="M146 172h36" />
      </g>
      <path d="M206 36l4-10M222 46l9-6M226 64h10" strokeWidth="2" />
    </Svg>
  );
}

/** Learner speaking, with sound lines. */
export function SpeakingLearner({ className }: P) {
  return (
    <Svg className={className} w={190} h={200}>
      <path d="M40 196c10-44 34-62 58-62s48 18 58 62" fill={FILL} />
      <path d="M98 128c-19 0-32-15-31-35 1-19 14-32 32-31 18 1 30 16 29 34-1 19-12 32-30 32z" fill={FILL} />
      <path d="M68 86c2-24 26-38 50-28 9 4 14 12 12 22-10-6-18-6-28-2-10 5-20 7-34 8z" fill="currentColor" />
      <path d="M88 94v.5M110 94v.5" strokeWidth="3.4" />
      <ellipse cx="100" cy="110" rx="6" ry="5" />
      <path d="M136 66c10-6 16-16 16-26M146 80c14-4 24-12 28-24M146 98c12 0 22-4 30-10" stroke={SPOT} strokeWidth="2.6" />
    </Svg>
  );
}

/** Learner reading at a desk, waving: used on sign-in. */
export function ReadingLearner({ className }: P) {
  return (
    <Svg className={className} w={280} h={240}>
      <circle cx="206" cy="62" r="30" fill={SPOT} stroke="none" opacity=".9" />
      <path d="M70 186c8-44 34-64 62-64s52 18 60 64" fill={FILL} />
      <path d="M132 112c-19 0-32-15-31-34 1-19 14-32 32-31 18 1 30 16 29 34-1 19-12 31-30 31z" fill={FILL} />
      <path d="M102 72c4-22 30-32 50-20 8 5 12 13 10 22-9-6-18-7-28-4-11 3-20 3-32 2z" fill="currentColor" />
      <path d="M121 82v.5M143 82v.5" strokeWidth="3.4" />
      <path d="M125 96c4 3 10 3 14 0" />
      <path d="M192 150c10-14 18-28 20-44M208 104l-6-10M214 104l2-12M220 108l8-8" />
      <path d="M40 188h200" />
      <path d="M96 188l40-26 40 26" fill={FILL} />
      <path d="M136 162v26" />
      <path d="M108 176l20-8M146 168l20 8" stroke={SPOT} />
      <path d="M58 188v34M222 188v34" />
    </Svg>
  );
}

/** An open box of blank cards: empty states. */
export function EmptyCards({ className }: P) {
  return (
    <Svg className={className} w={220} h={170}>
      <ellipse cx="148" cy="44" rx="26" ry="22" fill={SPOT} stroke="none" opacity=".85" />
      <g transform="rotate(-12 86 58)">
        <rect x="60" y="30" width="56" height="40" rx="5" fill={FILL} />
      </g>
      <g transform="rotate(10 128 62)">
        <rect x="102" y="40" width="56" height="40" rx="5" fill={FILL} />
        <path d="M114 56h24M114 66h32" />
      </g>
      <path d="M40 86h140l-12 66H52z" fill={FILL} />
      <path d="M40 86l18-14h104l18 14" />
      <path d="M92 114h36" />
      <path d="M30 156h160" strokeWidth="2" />
    </Svg>
  );
}

/** A camera over a document: create from photo. */
export function CameraDoc({ className }: P) {
  return (
    <Svg className={className} w={64} h={56}>
      <path d="M8 14h12l4-6h16l4 6h12v34H8z" fill={FILL} strokeWidth="2.2" />
      <circle cx="32" cy="30" r="10" fill="rgb(var(--primary-soft))" strokeWidth="2.2" />
      <circle cx="32" cy="30" r="5" strokeWidth="2.2" />
    </Svg>
  );
}
