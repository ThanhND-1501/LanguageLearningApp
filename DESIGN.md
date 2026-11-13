---
name: LingoPulse
description: A Vietnamese vocabulary app, from flashcards to speaking, at category-standard polish.
colors:
  primary: "#2457f5"
  primary-hover: "#1b46d6"
  primary-soft: "#edf2ff"
  primary-soft-hover: "#dfe7ff"
  primary-ink: "#1b46d6"
  bg: "#f6f7fb"
  surface: "#ffffff"
  subtle: "#f1f3f8"
  ink: "#111a33"
  ink-2: "#424b66"
  mute: "#5d6684"
  line: "#e4e7f0"
  line-strong: "#cdd3e3"
  good: "#17794a"
  good-soft: "#e8f6ee"
  fair: "#955c00"
  fair-soft: "#fdf4e1"
  poor: "#c42c3c"
  poor-soft: "#fdecee"
  deck-blue: "#2457f5"
  deck-teal: "#0b766c"
  deck-amber: "#9e5f04"
  deck-rose: "#c4325a"
  deck-violet: "#6f4ff0"
  deck-green: "#2b8a3e"
  dark-bg: "#0b0e16"
  dark-surface: "#141823"
  dark-subtle: "#1b202e"
  dark-ink: "#e9ecf5"
  dark-ink-2: "#bec5d8"
  dark-mute: "#929bb5"
  dark-line: "#272d3e"
  dark-line-strong: "#3a4259"
  dark-primary: "#2e60f5"
  dark-primary-hover: "#4a76fa"
  dark-primary-soft: "#1c2648"
  dark-primary-soft-hover: "#24325f"
  dark-primary-ink: "#8faaff"
  dark-good: "#5cc98a"
  dark-good-soft: "#122e21"
  dark-fair: "#ebb552"
  dark-fair-soft: "#34270e"
  dark-poor: "#ff808c"
  dark-poor-soft: "#3c161c"
  dark-deck-blue: "#5c84ff"
  dark-deck-teal: "#2db4a5"
  dark-deck-amber: "#dea034"
  dark-deck-rose: "#f0648c"
  dark-deck-violet: "#967cff"
  dark-deck-green: "#58be6a"
typography:
  display:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "58px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  stat:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  page-title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  body-ui:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  meta:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  micro:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "8px"
  field: "10px"
  lg: "12px"
  card: "14px"
  panel: "16px"
  full: "9999px"
spacing:
  page-x-mobile: "20px"
  page-x: "32px"
  page-y: "40px"
  section-gap: "40px"
  grid-gap: "16px"
  card-pad: "20px"
  panel-pad: "36px"
  row-pad: "16px 20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.body-ui}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.subtle}"
  button-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-soft-hover:
    backgroundColor: "{colors.primary-soft-hover}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.poor}"
    rounded: "{rounded.field}"
  button-danger-hover:
    backgroundColor: "{colors.poor-soft}"
  button-lg:
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "52px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-ui}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
  deck-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  deck-spine:
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    width: "36px"
    height: "44px"
  count-pill:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: LingoPulse

## Overview

**Creative North Star: "The Well-Kept Notebook"**

LingoPulse is a category-standard flashcard app done with more care than the category leader: a top nav, a Today queue, deck tiles, hairline-divided lists. Nothing is reinvented for its own sake. The polish lives in restraint: a cool near-white ground, white surfaces drawn with one-pixel hairlines, one blue that means "act here", and small marks of deck color that let a learner recognize a deck at a glance. Every screen is Vietnamese-first, set in Be Vietnam Pro with tabular figures so counts and scores line up.

Density is calm and operational. The dashboard leads with one raised Today panel (a large due count, a minutes estimate, a deck split bar, one primary button), then drops to flat tiles and rows. Progress is shown as it is, never celebrated: there are no streak flames, confetti, badges or mascots. The only imagery is a set of original hand-drawn line illustrations (ink stroke, one blue spot) that are explicitly placeholders.

The world is drawn twice, light and dark, from one set of semantic tokens. Dark mode is a cool navy-black with the same hierarchy, not an inversion.

**Key Characteristics:**
- Cool near-white ground, white surfaces, 1px hairlines; shadow only on the few raised elements.
- One primary blue for actions, selection and the memory ramp; nothing else is blue by decoration.
- Six muted deck identity colors, used only as dots, spines and split-bar segments.
- Be Vietnam Pro everywhere, 400 to 800, tabular figures on by default.
- Lists are hairline-divided rows inside one bordered container, not stacks of nested cards.
- Light and dark from the same semantic tokens.

## Colors

A cool, low-chroma neutral system carrying one saturated blue, a small semantic trio for scores, and six muted identity hues for decks.

All color tokens live in `src/app/globals.css` as RGB channel triplets (`--primary: 36 87 245`) so Tailwind opacity modifiers work; the `dark-*` keys in the frontmatter are the `.dark` overrides of the same variables. Code always uses the semantic name (`primary`, `ink`, `line`), never the hex.

### Primary
- **Action Blue** (`primary`): the fill of every primary button, the logo mark, the active tab underline, the selected-chip border, the focus ring (2px outline, 2px offset), text caret, and the mastered segment of the memory ramp. Hover deepens to **Pressed Blue** (`primary-hover`).
- **Blue Wash** (`primary-soft`, hover `primary-soft-hover`): the background of selected chips, the active nav item, the "N cần ôn" due pill, soft buttons, the avatar disc, and the illustration well beside the Today panel.
- **Blue Ink** (`primary-ink`): text on Blue Wash and inline text links ("Xem thư viện"). In dark mode it lifts to a pale periwinkle so it stays legible on the dark wash.

### Secondary
- **Deck identity hues** (`deck-blue`, `deck-teal`, `deck-amber`, `deck-rose`, `deck-violet`, `deck-green`): muted, darkened hues assigned to a deck by an FNV-1a hash of its id (`src/lib/deck-style.ts`), so a deck keeps the same color on every screen. They appear as the DeckSpine block behind the language code, 8px dots beside deck names and words, and segments of the Today split bar. `deck-blue` intentionally equals the primary blue; it is still identity, not action, because it only ever appears in those three shapes.

### Tertiary
- **Good / Fair / Poor** (`good`, `fair`, `poor`, each with a `-soft` background): score semantics for PronScore and per-word pronunciation (thresholds 80 and 60). `poor` also colors destructive buttons. Always paired with a non-color cue: the number itself, a legend with thresholds, or a text label.

### Neutral
- **Cool Paper** (`bg`): the page ground behind everything.
- **Surface White** (`surface`): cards, panels, nav bar, modal bodies, inputs.
- **Subtle Tint** (`subtle`): hover fills, the empty track of bars, tag and count backgrounds, nav search field, modal footers.
- **Ink Navy** (`ink`): headings and primary text; also the toast and modal-scrim base.
- **Slate Ink** (`ink-2`): body copy, nav links at rest, secondary button text.
- **Mute** (`mute`): metadata, placeholders, inactive tab-bar items, counts. Kept at a value that holds contrast on both `bg` and `surface`.
- **Hairline** (`line`): every 1px border and list divider.
- **Firm Hairline** (`line-strong`): hover borders, the dashed "create deck" outline, the "new" segment of the memory ramp, scrollbars.

### Named Rules
**The One Blue Rule.** Blue means action or selection. Primary buttons, links, the active nav item, the focused field, the selected chip, and mastery progress are blue; headings, icons at rest, decorative fills and section backgrounds are not.

**The Identity-Not-Action Rule.** Deck colors appear only as spines, dots and split-bar segments. Never a button, never a heading, never a panel background, never text color for body copy.

**The One Ramp Rule.** Memory state is drawn on one fixed ramp everywhere: mastered `primary`, learning `primary` at 45% opacity, new `line-strong`, on a `subtle` track. Do not recolor learning or mastered per screen.

**The Score-Has-A-Word Rule.** `good` / `fair` / `poor` are reserved for scores and outcomes, and every use carries a number, legend or label so the meaning survives without color.

## Typography

**Display Font:** Be Vietnam Pro (via `next/font`, latin + vietnamese subsets, weights 400/500/600/700/800), falling back to system-ui, sans-serif
**Body Font:** Be Vietnam Pro
**Label/Mono Font:** none distinct; keyboard hints (`/`) use the same family

**Character:** One humanist sans that handles Vietnamese diacritics cleanly, used at different weights rather than paired. Headlines get tight negative tracking; body stays at default spacing. `font-variant-numeric: tabular-nums` is set on `body`, so every count, score and date aligns.

### Hierarchy
- **Display** (800, 40px mobile to 58px desktop, line-height 1.08, -0.035em): the landing hero headline only.
- **Headline** (800, 30px to 40px, line-height 1.25, -0.03em, max 18em wide): landing section headings.
- **Stat** (700, 56px to 64px, line-height 1, -0.03em): the due count in the Today panel; one per screen at most.
- **Page Title** (700, 26px to 28px, tight tracking): the h1 of every app screen ("Chào buổi tối, Alex").
- **Title** (700, 24px, tight tracking): headings inside a panel ("Bạn đã ôn xong hôm nay"); modal titles use 18px bold.
- **Section Title** (700, 18px, tight tracking): section headers above tile grids and lists, paired on the right with a 14px semibold `primary-ink` link.
- **Body** (400, 16px, 1.5; long copy capped near 34em): explanatory paragraphs in `ink-2`.
- **Body UI** (500 to 600, 15px): nav links, tabs, button text, field text.
- **Meta** (400, 13px): language pairs, card counts, phonetics, deck legends, in `mute`.
- **Label** (500, 14px): form labels in `ink-2`, chip text.
- **Micro** (500, 11.5px): mobile tab-bar labels and word-road stage names. Never uppercase.

### Named Rules
**The Sentence-Case Rule.** All labels, headings, tabs and buttons are sentence-case Vietnamese. No uppercase tracked kickers or eyebrows above headings; a section opens with its heading.

**The Tabular Rule.** Numbers are tabular everywhere. Do not switch to proportional figures for a "nicer" stat.

## Layout

A centered single column with a 1200px max width on app screens (1180px on public screens), side padding 20px on phones and 32px from `sm`, vertical padding 32px to 40px. Sections are separated by 40px; section headers sit 14px above their content.

App screens follow a fixed order: page title row (title left, date or meta right on the same baseline), one lead panel, then tile grids and lists. Tile grids are 1, 2, then 3 columns (`sm`, `lg`) with 16px gaps. The Today panel splits into content plus a 320px illustration well from `md`; the well hides on phones.

Navigation changes by breakpoint: from `md` the app nav is a 64px sticky top bar (logo, four text nav items, deck search from `lg`, theme toggle, avatar); below `md` a fixed 64px bottom tab bar with icon plus micro label takes over, and the page gets 80px bottom padding to clear it. The public nav is a 72px sticky bar with text links and "Bắt đầu miễn phí".

Lists are rows inside one bordered container (`divide-y` hairlines, 16px by 20px row padding) laid on a column grid so columns align across rows; on phones secondary columns drop and the control moves to the first row.

## Elevation & Depth

Mostly flat, separated by hairlines and the step from `bg` to `surface`. Shadows are soft, navy-tinted and offset downward, and they belong to a short list of elements: the lead Today panel, the study card, modals and toasts, and deck tiles on hover. The sticky nav uses translucency and a backdrop blur instead of a shadow.

### Shadow Vocabulary
- **Raised** (`box-shadow: 0 1px 2px rgb(17 26 51 / 0.06), 0 6px 20px rgb(17 26 51 / 0.07)`): the Today panel at rest; deck tiles on hover.
- **Lift** (`box-shadow: 0 1px 2px rgb(17 26 51 / 0.06), 0 14px 36px rgb(17 26 51 / 0.10)`): modals, toasts, the active flashcard.
- **Button** (`box-shadow: 0 1px 2px rgb(36 87 245 / 0.30)`): primary buttons only, a one-pixel blue contact shadow.

### Named Rules
**The One Raised Panel Rule.** A screen has at most one element raised at rest (its lead panel or the card being studied). Everything else is flat with a hairline and may rise to Raised on hover.

## Shapes

Gently rounded, never pill-heavy except for small counts and chips. The radius steps with size: 6px for deck spines and tags, 8px for small buttons and nav items, 10px for fields and medium buttons, 12px for large buttons and toasts, 14px for cards and list containers, 16px for the lead panel and modals (top corners only when the modal docks as a bottom sheet on phones). Fully round is reserved for chips, due/count pills, dots, bar segments and the avatar. Borders are always 1px hairlines; the one dashed outline (1.5px, `line-strong`) marks the "create" tile.

Illustrations are open line drawings: 2.4px round-capped ink strokes, white (or `subtle` in dark) fills, one primary-blue spot shape.

## Components

### Buttons
Plain, confident and quick; one primary per group.
- **Shape:** 8px (small, 36px tall), 10px (medium, 44px tall), 12px (large, 52px tall); semibold text, 8px icon gap.
- **Primary:** Action Blue fill, white text, Button shadow. The one main action on a panel ("Bắt đầu ôn").
- **Secondary:** white surface, hairline border, ink text; hover fills `subtle` and firms the border. Sits beside a primary.
- **Soft:** Blue Wash with Blue Ink text; per-row or per-tile actions ("Luyện nói", "Thêm vào bộ của tôi").
- **Ghost:** no fill, `ink-2` text, `subtle` on hover; nav-level actions like "Đăng nhập".
- **Danger:** surface with hairline and `poor` text; hover fills `poor-soft`.
- **Inverse:** white with Pressed Blue text, for use on a blue field.
- **Hover / Focus / Press:** 150ms color transitions on the out-expo curve, a 1px downward nudge on press, global 2px blue focus outline; disabled is 50% opacity.

### Chips
- **Style:** fully round, 36px tall, 14px medium text, hairline border on surface, `ink-2` text.
- **State:** selected is Blue Wash fill, Action Blue border and Blue Ink text, with `aria-pressed`. Used for deck filters, card status filters and example choices.

### Tabs
- Text tabs with a 2px bottom border: active is Action Blue border with ink text, inactive transparent with `mute`. A count pill rides beside the label (Blue Wash when active, `subtle` otherwise).

### Cards / Containers
- **Corner Style:** 14px for tiles and list containers, 16px for the lead panel.
- **Background:** Surface White on Cool Paper.
- **Shadow Strategy:** flat at rest; see Elevation.
- **Border:** 1px Hairline, firming to `line-strong` on hover.
- **Internal Padding:** 20px for tiles, 24px to 36px for the lead panel, 24px by 20px for modal sections.

### Inputs / Fields
- **Style:** 44px tall, 10px radius, 1px hairline on surface, 15px text, `mute` placeholder, blue caret; hover firms the border.
- **Focus:** border turns Action Blue with a 4px Action Blue halo at 15%.
- **Search:** the nav search is a field on `subtle` with a leading search icon and a `/` key hint; `/` focuses it from anywhere.

### Navigation
- **App top bar:** 64px, sticky, surface at 90% with backdrop blur, bottom hairline. Items are 15px medium `ink-2` with 8px radius; hover fills `subtle`; active is Blue Wash with Blue Ink and `aria-current`.
- **Mobile tab bar:** fixed bottom, four equal cells, 22px stroke icons over 11.5px labels; active is Blue Ink with a heavier icon stroke, inactive `mute`. Respects the safe-area inset.
- **Avatar:** 36px Blue Wash disc with the initial; ring on hover and on the profile route.

### Deck Card (signature)
A white tile led by the **DeckSpine**: a 36px by 44px block in the deck's identity color carrying the two-letter target-language code in bold (white text; `bg` text in dark). Title 16px semibold, meta line "Anh → Việt · 5 thẻ" in `mute`. When the learner is tracking the deck, the foot shows the Memory Ramp, "% đã thuộc", and a due pill (Blue Wash "N cần ôn", or `subtle` "Đã ôn xong"). Otherwise it shows up to two tags and, for unenrolled catalog decks, a soft "Thêm vào bộ của tôi" button. The whole tile is the link.

### Memory Ramp and Word Road (signature)
- **Memory Ramp:** a 6px fully round bar, segments in mastered / learning / new order per The One Ramp Rule, with an `aria-label` spelling out the counts.
- **Word Road:** four 6px segments for Nhớ, Viết, Nghe, Nói, filled Action Blue only when the learner actually practiced that mode; unfilled segments are `subtle` with an inset hairline. Stage names sit beneath in Micro, `ink-2` when reached.

### Today Panel (signature)
The single raised element on the dashboard: Stat-size due count with "thẻ cần ôn hôm nay", a minutes line, an 8px split bar of deck-colored segments with a dot legend, then primary "Bắt đầu ôn" plus a secondary. The right well is Blue Wash holding a line illustration. Empty and all-done states swap the stat for a Title and their own pair of actions.

### Modal and Toast
- **Modal:** surface, 16px radius, Lift shadow, ink scrim at 40% with a slight blur; header with an 18px bold title and close button, hairline-separated body, and a `subtle` footer with right-aligned actions. Docks as a bottom sheet on phones; enters with fade-up.
- **Toast:** an Ink Navy capsule (12px radius) with surface text, bottom center, above the tab bar on phones.

### Motion
One curve, out-expo (`cubic-bezier(0.16, 1, 0.3, 1)`), for button state changes (150ms) and the fade-up entrance (450ms, 6px rise) on modals and toasts. Tiles transition shadow and border over 200ms. `prefers-reduced-motion` collapses all durations.

## Do's and Don'ts

### Do:
- **Do** reserve Action Blue for actions, selection, focus and mastery (The One Blue Rule).
- **Do** show a deck's identity color only as its spine, a dot, or a split-bar segment, and get it from `deckColor()` so it matches everywhere.
- **Do** draw memory progress with the Memory Ramp: mastered `primary`, learning `primary` at 45%, new `line-strong`.
- **Do** mark selected chips with Blue Wash fill, Action Blue border and Blue Ink text, plus `aria-pressed`.
- **Do** put repeated items in one hairline-divided container (`divide-y divide-line`, 14px radius) on a shared column grid.
- **Do** pair every `good` / `fair` / `poor` color with a number, legend or word.
- **Do** write sentence-case Vietnamese for every label, heading and button, and keep numbers tabular.
- **Do** ship every screen in light and dark using semantic tokens only.
- **Do** keep illustrations as ink line drawings with one blue spot, decorative and `aria-hidden`.

### Don't:
- **Don't** put a deck color on a button, heading, link or panel background.
- **Don't** add uppercase tracked kickers or eyebrow labels above headings.
- **Don't** nest cards inside cards; use hairline rows inside one container.
- **Don't** raise more than one element per screen at rest, or use shadows other than Raised, Lift and Button.
- **Don't** use gradients, indigo or purple, or the legacy `brand-*` scale on new work; it exists only for unmigrated files.
- **Don't** gamify: no confetti, mascots, badges, XP or celebratory color for progress.
- **Don't** use raw Tailwind palette colors (`slate-*`, `indigo-*`, `white` text on a theme surface) where a semantic token exists; they break dark mode.
