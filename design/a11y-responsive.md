# Responsive & Accessibility Spec — Cocktail Discovery MVP

Owner: UX/UI Designer · v1.0 · 2026-10-21 · Target: **WCAG 2.1 AA** (we also meet 2.2 target size 2.5.8 at 24px minimum)

## 1. Breakpoints & layout

Layout is mobile-first. Use `min-width` queries only.

| Token | Min width | Columns (results) | Gutter | Page padding | Input | CTA | Detail view |
|---|---|---|---|---|---|---|---|
| base | 0 (designed at **360**) | 1 | `--space-4` | `--space-4` | full width | full width. Sticky glass bottom bar once the field scrolls off | full-screen sheet |
| `md` | **768px** | 2 | `--space-5` | `--space-6` | max 720px, centred | inline, auto width | centred modal |
| `lg` | **1024px** | 3 | `--space-6` | `--space-8` | max 720px | inline, right of the helper row | modal 720px |
| `xl` | **1440px** | 3 (content capped at `--size-content-max` 1200px) | `--space-6` | auto (centred) | max 720px | inline | modal 720px |

- No horizontal scrolling at 320px CSS width (WCAG 1.4.10 reflow). The 360 design must also survive 320.
- Text resizes to 200% without loss. All sizes are in rem, and controls grow with text (`min-height`, never fixed `height`, for text containers).
- Touch targets are ≥ 44×44 on coarse pointers (`@media (pointer: coarse)`), using a `::before` hit-area expansion on chip × and stepper buttons. On fine pointers the minimum is 24×24.
- Landscape phones (height < 500px): the detail sheet header is not sticky, and the ambiguity sheet's max-height is 80dvh with scrolling.

## 2. Landmarks & structure

```
<a class="skip-link" href="#results-title">Skip to results</a>
<header role="banner">  wordmark · theme toggle
<main id="main">
  <h1>What’s in your cabinet?</h1>
  <form role="search" aria-label="Find cocktails by ingredient">  C1 + C2
  <div id="results-status" class="sr-only" aria-live="polite" aria-atomic="true"></div>
  <section aria-labelledby="results-title">  C5   |  <section aria-labelledby="fallback-title"> C6 …
</main>
<footer role="contentinfo">
<dialog aria-labelledby="detail-title">  C4 (portal, outside main)
```

Heading order: H1 page, then H2 for Results / Fallback / Near Matches, then H3 for card names. Inside the dialog, H2 is the name and H3 the sections.

## 3. ARIA patterns

| Component | Pattern | Key attributes |
|---|---|---|
| Ingredient input | **ARIA 1.2 Combobox with listbox popup** (editable, list autocomplete) | `input role="combobox" aria-expanded aria-controls="ingredient-listbox" aria-activedescendant aria-autocomplete="list" aria-describedby="ingredient-helper ingredient-counter ingredient-error"`; `ul role="listbox" id="ingredient-listbox" aria-label="Ingredient suggestions"`; `li role="option" id aria-selected aria-disabled` |
| Chip list | Plain list with buttons | `ul aria-label="Selected ingredients"`, `li` holds the text plus `<button aria-label="Remove Gin">`. Error chip text is `<button aria-label="Edit asdfgh">` and its accessible description is the error message. The ambiguous chip is `<button aria-haspopup="dialog" aria-expanded>` named "orange, needs a choice" |
| Ambiguity chooser | Non-modal **dialog** containing a **listbox** (desktop). Modal dialog (bottom sheet) on mobile | `role="dialog" aria-labelledby="ambiguity-prompt"`; `role="listbox"`; options `role="option"` |
| Did-you-mean | Group of buttons | `div role="group" aria-labelledby="ingredient-error"` |
| Primary CTA | Native button | `type="submit"`, `aria-disabled` + `aria-describedby="cta-helper"` when blocked, `aria-busy` when loading |
| Info hint (water/ice) | Status | `role="status"` (polite). It's always in the DOM and its text content is swapped |
| Limit error | Alert | Text injected into `#ingredient-limit` with `role="alert"` (assertive) |
| Results | Region + list | `section aria-labelledby`, `ul role="list"`, `aria-busy` while loading |
| Card | Article + overlay button | `article aria-labelledby="card-x-name"`; `button aria-haspopup="dialog" aria-describedby="card-x-desc"` (shortDescription). The clamped taste profile on the card is `aria-hidden` |
| Near-match "+ Add" | Button | `aria-label="Add Sugar to your ingredients and search again"`. At 10 ingredients the button is **removed from the DOM**, not disabled. On cards it is replaced by a static "missing" pill, and the best-addition callout is replaced by `fallback.tip` |
| Best-addition callout | Group + button | `div role="group" aria-labelledby="best-addition-label"`; the button `aria-label` = `bestAddition.buttonSr` |
| Detail | **Modal dialog** | native `<dialog>` + `showModal()`, `aria-labelledby="detail-title" aria-describedby="detail-desc"` (shortDescription under the H2). Assumed ice/water rows have the accessible name `detail.assumedSr` |
| Servings stepper | Group of 2 buttons + output | `role="group" aria-labelledby="servings-label"`; `<output id="servings-value" aria-live="polite">`. Buttons have `aria-label` "Fewer servings" / "More servings" and `aria-controls="detail-ingredients"` |
| Theme toggle | Toggle button | `aria-pressed` and a label from `app.themeToggle.*` |

## 4. Live regions

| Region | Politeness | Triggers (copy key) |
|---|---|---|
| `#ingredient-status` (sr-only) | polite | `chip.addedSr`, `chip.removedSr`, `chip.backspaceArmedSr`, `chip.duplicate`, `error.replacedSr`, `ambiguity.resolvedSr`, `input.counterSr`, `listbox.countSr_*` (debounced 500 ms) |
| `#hint-excluded` (visible) | polite (`role=status`) | `hint.excluded` |
| `#ingredient-error` (visible) | assertive, once per new error chip | `error.didYouMean` / `error.unrecognised` |
| `#ingredient-limit` (visible) | assertive (`role=alert`) | `error.tooMany` |
| `#results-status` (sr-only) | polite, atomic | `results.loadingSr`, then `results.countSr_*` / `fallback.liveSr` (+ `bestAddition.liveSr_*` when the callout shows) / `empty.liveSr` / `nearMatches.addedSr` |
| `#servings-value` | polite | value change (`detail.servingsSr`) |

Rules: one message per user action. Clear and re-set the text, waiting 50 ms, so repeated identical messages are re-announced. Never put `aria-live` on large containers.

## 5. Keyboard map

### Global

| Key | Action |
|---|---|
| Tab / Shift+Tab | Order: skip link → theme toggle → input → chips (each chip's buttons, left to right) → Clear all → suggestions/limit messages → CTA → results H2 (not a tab stop; programmatic focus only) → best-addition "+ Add" (zero-match only) → near-match cards (per card: "+ Add" first, then the card; at 10 ingredients the card is the only stop) |
| `/` | Focus the ingredient input (when focus isn't in a text field). Optional, Should |

### Ingredient combobox (focus in input)

| Key | Listbox closed | Listbox open |
|---|---|---|
| Typing | Opens the listbox when there are ≥ 1 characters and matches | Filters |
| ↓ / ↑ | Opens it and highlights the first / last option | Moves the active option (wraps) |
| Enter | Commits the typed text (normaliser). In an empty input with a valid list, **submits the search** | Commits the active option. With no active option, commits the typed text |
| `,` | Commits the typed text | Commits the typed text (not the highlighted option) |
| Tab | Normal tab. A non-empty input is **not** auto-committed | Closes the listbox without committing. Focus moves on |
| Esc | Clears the input text when not empty | Closes the listbox and keeps the text |
| Backspace (empty input) | 1st press arms the last chip, 2nd removes it (US-E1-02) | — |
| ← (caret at start, empty) | Moves focus to the last chip's remove button | — |
| Home / End | Caret | Caret (not options, to keep text editing) |

### Chips

| Key | Action |
|---|---|
| ← / → | Move between chip buttons (roving within the list). → past the last chip returns to the input |
| Enter / Space on × | Remove the chip and focus the next chip (or the input if none) |
| Delete / Backspace on a chip button | Remove it (same as ×) |
| Enter on an error chip text | Edit: text goes to the input, the chip is removed |
| Enter on an ambiguous chip | Open the chooser |

### Ambiguity chooser

| Key | Action |
|---|---|
| ↑ / ↓ | Move the option (focus starts on the first) |
| Enter / Space | Choose, close, focus the input |
| Esc | Close and focus the ambiguous chip (it stays unresolved) |
| Tab | Moves to "Remove “term”". On desktop, Tab past it closes the popover (non-modal). On mobile, focus is trapped |

### Results & cards

| Key | Action |
|---|---|
| Tab | Card to card (one stop per card, plus "+ Add" on near-match cards) |
| Enter / Space | Open the detail dialog |

### Detail dialog

| Key | Action |
|---|---|
| Tab / Shift+Tab | Cycle within the dialog: close → stepper − → stepper + → source links → close |
| Esc | Close and return focus to the opener |
| Enter/Space on stepper | ±1 serving (clamped 1–4) |
| ↑ / ↓ on a focused stepper button | Optional alias for +/− |

## 6. Focus management

| Event | Focus goes to |
|---|---|
| Page load | Not moved (desktop ≥ 1024: input autofocus) |
| Chip committed / suggestion picked / ambiguity resolved | Input |
| Chip removed via × | Next chip's ×, else the previous one, else the input |
| Disabled CTA activated | First error/ambiguous chip, else the input |
| Search completed (results) | `#results-title` H2 (tabindex=-1) |
| Search completed (zero) | `#fallback-title` / `#empty-title` H2 |
| "+ Add X" activated (near-match or best addition) | After re-search: `#results-title` (or the fallback title if still zero) |
| Chip removed while at 10 (back to 9) | "+ Add" buttons reappear. Focus follows the chip-removal rule and does not jump to them |
| "Start over" | Input |
| Card activated | Dialog H2 `#detail-title` (tabindex=-1) |
| Dialog closed | The card's open button that launched it (store a ref; if the card is gone, use the results H2) |
| Ambiguity chooser opens | First option |
| Ambiguity chooser closes (Esc) | Ambiguous chip |

Focus is always visible (`--focus-shadow`, ≥ 3:1). Sticky headers and the mobile CTA bar must never obscure the focused element: use `scroll-padding-top: 72px; scroll-padding-bottom: 88px` on `html`.

## 7. Motion & reduced motion

| Motion | Default | `prefers-reduced-motion: reduce` |
|---|---|---|
| Chip enter | scale .9→1 + fade, `--duration-fast` `--ease-spring` | appear instantly |
| Duplicate flash | 2 pulses of `--color-highlight` | static highlight for 1 s (state still conveyed by the SR message) |
| Listbox / popover | fade + 4px slide, `--duration-fast` | fade only, 1ms |
| Card hover lift | translateY(-2px), `--duration-fast` | shadow change only, no movement |
| Results stagger | 40ms per card | none |
| Skeleton shimmer | 1.2 s gradient sweep | static `--color-surface-sunken` blocks |
| Dialog open (mobile) | slide up, `--duration-slow` | fade, 1ms |
| Scroll to results | `behavior: smooth` | `behavior: auto` |
| CTA spinner | rotate | static "…" text |

All durations come from tokens, which collapse to 1ms under reduced motion in `tokens.css`. JS-driven motion must also check `matchMedia('(prefers-reduced-motion: reduce)')`. No content flashes more than 3 times per second. `prefers-reduced-transparency` swaps glass for a solid surface.

## 8. Other checks

- **Colour is never the only signal.** Error chips use ⚠ plus text, matched pills use ✓, missing pills use +, ambiguous chips use ? plus "Choose", and the active option has a left bar.
- **Language:** `<html lang="en">`. Cocktail and ingredient names with diacritics (Cachaça) are left as-is.
- **Forced colours (Windows High Contrast):** under `@media (forced-colors: active)`, chips get `border: 1px solid CanvasText`, the error chip uses `Mark`, and the focus shadow is replaced by `outline: 2px solid Highlight`.
- **Text spacing (1.4.12):** no fixed heights on text containers. Chips grow vertically.
- **Input purpose:** the ingredient input uses `autocomplete="off"`, `autocapitalize="none"`, `spellcheck="false"` and `enterkeyhint="done"`.
- **Zoom:** never set `maximum-scale` or `user-scalable=no`.
- **Links in prose (sources)** are underlined, not colour-only.

## 9. Contrast audit

All ratios below were **computed** with the WCAG 2.1 relative-luminance formula from the exact token values in `tokens.json`. Glass surfaces (`rgba`) are composited over `--color-bg`. Body text needs ≥ 4.5:1, and UI components and focus indicators need ≥ 3:1. The disabled CTA label is exempt (SC 1.4.3), but it's listed for transparency.

**Result:** every text pair passes, many at AAA. Three non-text pairs fall below 3:1 when measured naively. None of them is relied upon, and each has a mitigation that is part of the spec:

1. Light `accent` lime fill on `bg` is 1.13:1. The CTA always carries a 1px `--color-accent-edge` (#4D7C0F, 4.64:1) border, and its label is dark ink (14.75:1).
2. Light `secondary` orange fill on `surface` is 2.61:1. The "+ Add" badge carries a 1px `--color-secondary-strong` (#B93E0A, 5.59:1) border, and its label is ink (6.84:1).
3. Dark lime focus ring on the lime CTA is 1.00:1. `--focus-shadow` inserts a 2px `--color-surface` gap before the ring, so the ring sits on the gap (14.39:1).

Adjustments made during the audit:

- Placeholder `ink-subtle` moved from the brief's slate-500 to **#5B6B82** (5.43:1) so it clears 4.5 on glass.
- Error red was tuned to **#C8243F** (4.87:1 on its soft fill).
- Orange text uses **#B93E0A**, not the neon orange (neon #FF7A1A on white is only 2.61:1).
- Lime is never used as text or icon colour in the light theme. Use `--color-accent-strong` #3F6212 (7.08:1).

#### Light theme

| Foreground | Background | Use | Ratio | Needs | Result |
|---|---|---|---:|---:|---|
| `ink` #0F172A | `bg` #F4F7FA | Body text on page | 16.60:1 | 4.5:1 | PASS (AAA) |
| `ink` #0F172A | `surface` #FFFFFF | Body text on card | 17.85:1 | 4.5:1 | PASS (AAA) |
| `ink` #0F172A | `surface-sunken` #E6ECF2 | Text on sunken panel / chip | 15.00:1 | 4.5:1 | PASS (AAA) |
| `ink` #0F172A | `glass@bg` (glass over bg) | Text on frosted glass (over page) | 17.53:1 | 4.5:1 | PASS (AAA) |
| `ink-2` #334155 | `surface` #FFFFFF | Secondary text on card | 10.35:1 | 4.5:1 | PASS (AAA) |
| `ink-2` #334155 | `bg` #F4F7FA | Secondary text on page | 9.63:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #475569 | `surface` #FFFFFF | Meta text (era, glass, counter) | 7.58:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #475569 | `bg` #F4F7FA | Helper text on page | 7.05:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #475569 | `surface-sunken` #E6ECF2 | Helper text on sunken | 6.37:1 | 4.5:1 | PASS |
| `ink-subtle` #5B6B82 | `surface` #FFFFFF | Placeholder text in input | 5.43:1 | 4.5:1 | PASS |
| `ink-subtle` #5B6B82 | `glass@bg` (glass over bg) | Placeholder on glass input | 5.33:1 | 4.5:1 | PASS |
| `on-accent` #0F172A | `accent` #B6FF3B | CTA label on lime | 14.75:1 | 4.5:1 | PASS (AAA) |
| `on-accent` #0F172A | `accent-hover` #A6F02A | CTA label, hover | 12.85:1 | 4.5:1 | PASS (AAA) |
| `on-accent` #0F172A | `accent-active` #93DB18 | CTA label, active | 10.53:1 | 4.5:1 | PASS (AAA) |
| `ink` #0F172A | `accent-soft` #EEFCD3 | Active/selected chip & matched ingredient highlight | 16.58:1 | 4.5:1 | PASS (AAA) |
| `accent-strong` #3F6212 | `surface` #FFFFFF | Accent text / links on card | 7.08:1 | 4.5:1 | PASS (AAA) |
| `accent-strong` #3F6212 | `bg` #F4F7FA | Accent text / links on page | 6.58:1 | 4.5:1 | PASS |
| `on-secondary` #0F172A | `secondary` #FF7A1A | "+ Add" badge label on orange | 6.84:1 | 4.5:1 | PASS |
| `on-secondary` #0F172A | `secondary-hover` #F26B0A | "+ Add" badge hover | 5.85:1 | 4.5:1 | PASS |
| `secondary-strong` #B93E0A | `surface` #FFFFFF | "Missing" label text on card | 5.59:1 | 4.5:1 | PASS |
| `secondary-strong` #B93E0A | `secondary-soft` #FFEDDC | Missing ingredient row text | 4.90:1 | 4.5:1 | PASS |
| `error` #C8243F | `surface` #FFFFFF | Error message text | 5.56:1 | 4.5:1 | PASS |
| `error` #C8243F | `error-soft` #FDECEF | Error chip label | 4.87:1 | 4.5:1 | PASS |
| `error` #C8243F | `bg` #F4F7FA | Error helper on page | 5.17:1 | 4.5:1 | PASS |
| `info` #0B66A3 | `info-soft` #E3F1FB | Info hint (water/ice) | 5.30:1 | 4.5:1 | PASS |
| `info` #0B66A3 | `surface` #FFFFFF | Info text on card | 6.10:1 | 4.5:1 | PASS |
| `success` #0B7A55 | `success-soft` #DEF5EA | Success text | 4.67:1 | 4.5:1 | PASS |
| `ink` #0F172A | `highlight` #EEFCD3 | Duplicate-chip flash | 16.58:1 | 4.5:1 | PASS (AAA) |
| `ink-disabled` #94A3B8 | `fill-disabled` #E2E8F0 | Disabled CTA label (WCAG 1.4.3 exempt; shown for reference) | 2.08:1 | — | n/a |
| `border-strong` #64748B | `surface` #FFFFFF | Input / stepper boundary | 4.76:1 | 3:1 | PASS |
| `border-strong` #64748B | `bg` #F4F7FA | Input boundary on page | 4.43:1 | 3:1 | PASS |
| `border-strong` #64748B | `surface-sunken` #E6ECF2 | Chip outline on sunken | 4.00:1 | 3:1 | PASS |
| `focus-ring` #0F172A | `bg` #F4F7FA | Focus ring on page | 16.60:1 | 3:1 | PASS |
| `focus-ring` #0F172A | `surface` #FFFFFF | Focus ring on card | 17.85:1 | 3:1 | PASS |
| `focus-ring` #0F172A | `accent` #B6FF3B | Focus ring on CTA fill | 14.75:1 | 3:1 | PASS |
| `accent-edge` #4D7C0F | `bg` #F4F7FA | CTA edge vs page | 4.64:1 | 3:1 | PASS |
| `accent-edge` #4D7C0F | `surface` #FFFFFF | CTA edge / selected stepper vs card | 4.99:1 | 3:1 | PASS |
| `accent` #B6FF3B | `bg` #F4F7FA | Lime CTA fill vs page | 1.13:1 | 3:1 | FAIL → Mitigated: CTA always carries a 1px `accent-edge` border (4.64:1) + dark label; the fill is never the only boundary. |
| `secondary` #FF7A1A | `surface` #FFFFFF | Orange badge fill vs card | 2.61:1 | 3:1 | FAIL → Mitigated: "+ Add" badge carries a 1px `secondary-strong` border (5.59:1); label is ink (6.84:1). |
| `secondary-strong` #B93E0A | `surface` #FFFFFF | Orange badge edge vs card | 5.59:1 | 3:1 | PASS |
| `error-border` #D2344F | `surface` #FFFFFF | Error chip outline | 4.83:1 | 3:1 | PASS |
| `error-border` #D2344F | `error-soft` #FDECEF | Error chip outline vs own fill | 4.24:1 | 3:1 | PASS |
| `ink-muted` #475569 | `surface` #FFFFFF | Icons (glass, close ×) | 7.58:1 | 3:1 | PASS |

#### Dark theme

| Foreground | Background | Use | Ratio | Needs | Result |
|---|---|---|---:|---:|---|
| `ink` #E8EEF6 | `bg` #0B1220 | Body text on page | 16.04:1 | 4.5:1 | PASS (AAA) |
| `ink` #E8EEF6 | `surface` #111A2B | Body text on card | 14.91:1 | 4.5:1 | PASS (AAA) |
| `ink` #E8EEF6 | `surface-sunken` #0E1626 | Text on sunken panel / chip | 15.49:1 | 4.5:1 | PASS (AAA) |
| `ink` #E8EEF6 | `glass@bg` (glass over bg) | Text on frosted glass (over page) | 14.24:1 | 4.5:1 | PASS (AAA) |
| `ink-2` #CBD5E1 | `surface` #111A2B | Secondary text on card | 11.72:1 | 4.5:1 | PASS (AAA) |
| `ink-2` #CBD5E1 | `bg` #0B1220 | Secondary text on page | 12.61:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #A3B1C6 | `surface` #111A2B | Meta text (era, glass, counter) | 8.01:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #A3B1C6 | `bg` #0B1220 | Helper text on page | 8.61:1 | 4.5:1 | PASS (AAA) |
| `ink-muted` #A3B1C6 | `surface-sunken` #0E1626 | Helper text on sunken | 8.32:1 | 4.5:1 | PASS (AAA) |
| `ink-subtle` #8B9AB2 | `surface` #111A2B | Placeholder text in input | 6.10:1 | 4.5:1 | PASS |
| `ink-subtle` #8B9AB2 | `glass@bg` (glass over bg) | Placeholder on glass input | 5.83:1 | 4.5:1 | PASS |
| `on-accent` #0F172A | `accent` #B6FF3B | CTA label on lime | 14.75:1 | 4.5:1 | PASS (AAA) |
| `on-accent` #0F172A | `accent-hover` #C6FF66 | CTA label, hover | 15.21:1 | 4.5:1 | PASS (AAA) |
| `on-accent` #0F172A | `accent-active` #A6F02A | CTA label, active | 12.85:1 | 4.5:1 | PASS (AAA) |
| `ink` #E8EEF6 | `accent-soft` #22331A | Active/selected chip & matched ingredient highlight | 11.56:1 | 4.5:1 | PASS (AAA) |
| `accent-strong` #B6FF3B | `surface` #111A2B | Accent text / links on card | 14.39:1 | 4.5:1 | PASS (AAA) |
| `accent-strong` #B6FF3B | `bg` #0B1220 | Accent text / links on page | 15.47:1 | 4.5:1 | PASS (AAA) |
| `on-secondary` #0F172A | `secondary` #FF7A1A | "+ Add" badge label on orange | 6.84:1 | 4.5:1 | PASS |
| `on-secondary` #0F172A | `secondary-hover` #FF8F3D | "+ Add" badge hover | 7.86:1 | 4.5:1 | PASS (AAA) |
| `secondary-strong` #FF9A4D | `surface` #111A2B | "Missing" label text on card | 8.27:1 | 4.5:1 | PASS (AAA) |
| `secondary-strong` #FF9A4D | `secondary-soft` #33231A | Missing ingredient row text | 7.15:1 | 4.5:1 | PASS (AAA) |
| `error` #FF7A8F | `surface` #111A2B | Error message text | 6.99:1 | 4.5:1 | PASS |
| `error` #FF7A8F | `error-soft` #3A1A24 | Error chip label | 6.23:1 | 4.5:1 | PASS |
| `error` #FF7A8F | `bg` #0B1220 | Error helper on page | 7.52:1 | 4.5:1 | PASS (AAA) |
| `info` #6CC6FF | `info-soft` #132B40 | Info hint (water/ice) | 7.71:1 | 4.5:1 | PASS (AAA) |
| `info` #6CC6FF | `surface` #111A2B | Info text on card | 9.25:1 | 4.5:1 | PASS (AAA) |
| `success` #5EE0A0 | `success-soft` #12301F | Success text | 8.61:1 | 4.5:1 | PASS (AAA) |
| `ink` #E8EEF6 | `highlight` #22331A | Duplicate-chip flash | 11.56:1 | 4.5:1 | PASS (AAA) |
| `ink-disabled` #56657E | `fill-disabled` #1E2A40 | Disabled CTA label (WCAG 1.4.3 exempt; shown for reference) | 2.44:1 | — | n/a |
| `border-strong` #7B8BA6 | `surface` #111A2B | Input / stepper boundary | 5.04:1 | 3:1 | PASS |
| `border-strong` #7B8BA6 | `bg` #0B1220 | Input boundary on page | 5.43:1 | 3:1 | PASS |
| `border-strong` #7B8BA6 | `surface-sunken` #0E1626 | Chip outline on sunken | 5.24:1 | 3:1 | PASS |
| `focus-ring` #B6FF3B | `bg` #0B1220 | Focus ring on page | 15.47:1 | 3:1 | PASS |
| `focus-ring` #B6FF3B | `surface` #111A2B | Focus ring on card | 14.39:1 | 3:1 | PASS |
| `focus-ring` #B6FF3B | `accent` #B6FF3B | Focus ring on CTA fill | 1.00:1 | 3:1 | FAIL → Mitigated: focus shadow inserts a 2px `surface` gap before the lime ring, so the ring is measured against the gap (14.39:1), not the fill. |
| `accent-edge` #B6FF3B | `bg` #0B1220 | CTA edge vs page | 15.47:1 | 3:1 | PASS |
| `accent-edge` #B6FF3B | `surface` #111A2B | CTA edge / selected stepper vs card | 14.39:1 | 3:1 | PASS |
| `accent` #B6FF3B | `bg` #0B1220 | Lime CTA fill vs page | 15.47:1 | 3:1 | PASS |
| `secondary` #FF7A1A | `surface` #111A2B | Orange badge fill vs card | 6.67:1 | 3:1 | PASS |
| `secondary-strong` #FF9A4D | `surface` #111A2B | Orange badge edge vs card | 8.27:1 | 3:1 | PASS |
| `error-border` #FF7A8F | `surface` #111A2B | Error chip outline | 6.99:1 | 3:1 | PASS |
| `error-border` #FF7A8F | `error-soft` #3A1A24 | Error chip outline vs own fill | 6.23:1 | 3:1 | PASS |
| `ink-muted` #A3B1C6 | `surface` #111A2B | Icons (glass, close ×) | 8.01:1 | 3:1 | PASS |

Recompute: ratios were produced by a throwaway Node script (WCAG relative-luminance, alpha composited over `bg`). Dev should add an equivalent `scripts/contrast-audit` check that reads `design/tokens.json` so CI re-verifies these pairs whenever tokens change.
