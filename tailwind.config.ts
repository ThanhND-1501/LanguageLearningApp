import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // Semantic, theme-aware tokens (see globals.css)
        bg: v("bg"),
        surface: v("surface"),
        subtle: v("subtle"),
        ink: v("ink"),
        "ink-2": v("ink-2"),
        mute: v("mute"),
        line: v("line"),
        "line-strong": v("line-strong"),
        primary: {
          DEFAULT: v("primary"),
          hover: v("primary-hover"),
          soft: v("primary-soft"),
          "soft-hover": v("primary-soft-hover"),
          ink: v("primary-ink"),
        },
        good: { DEFAULT: v("good"), soft: v("good-soft") },
        fair: { DEFAULT: v("fair"), soft: v("fair-soft") },
        poor: { DEFAULT: v("poor"), soft: v("poor-soft") },
        // Deck identity colors: dots, spines and tints only, never buttons
        deck: {
          blue: v("deck-blue"),
          teal: v("deck-teal"),
          amber: v("deck-amber"),
          rose: v("deck-rose"),
          violet: v("deck-violet"),
          green: v("deck-green"),
        },
        // Legacy scale kept for not-yet-migrated screens; now blue, not indigo
        brand: {
          50: "#edf2ff",
          100: "#dfe7ff",
          200: "#c3d2ff",
          300: "#9db4fb",
          400: "#6f90fa",
          500: "#2457f5",
          600: "#2457f5",
          700: "#1b46d6",
          800: "#1838a8",
          900: "#152f85",
          950: "#0f1d4f",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        raised: "0 1px 2px rgb(17 26 51 / 0.06), 0 6px 20px rgb(17 26 51 / 0.07)",
        lift: "0 1px 2px rgb(17 26 51 / 0.06), 0 14px 36px rgb(17 26 51 / 0.10)",
        button: "0 1px 2px rgb(36 87 245 / 0.30)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
