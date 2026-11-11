/**
 * Placeholder line illustrations: original hand-drawn style, ink stroke plus
 * one primary-blue spot. Ink follows the text color so they work in dark mode.
 * Replace freely; every illustration is decorative (aria-hidden).
 */
import { cn } from "@/lib/utils";
import { LEARNING_LANGUAGES_SVG_INNER } from "./learning-languages-svg";

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

/** Animated "Learning Languages" illustration used on the home page. */
export function LearnerWithCards({ className }: P) {
  return (
    <svg
      id="freepik_stories-learning-languages"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 500 500"
      version="1.1"
      aria-hidden="true"
      className={cn("animated", className)}
      dangerouslySetInnerHTML={{ __html: LEARNING_LANGUAGES_SVG_INNER }}
    />
  );
}

/** Learner speaking, with sound lines (uses the animated learning-languages illustration). */
export function SpeakingLearner({ className }: P) {
  return <LearnerWithCards className={className} />;
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
