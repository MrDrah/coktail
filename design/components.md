# Component Specs — Cocktail Discovery MVP ("Frost")

Owner: UX/UI Designer · v1.0 · 2026-10-21
Tokens: [tokens.css](tokens.css) / [tokens.json](tokens.json) · Copy keys: [copy.md](copy.md) · A11y: [a11y-responsive.md](a11y-responsive.md) · Visual reference: [preview.html](preview.html)

All values below are **token references**. Write them as `var(--…)` in CSS. Never hard-code hex values or pixel sizes that already have a token. Every interactive element uses the shared focus style:

```css
:focus-visible { outline: none; box-shadow: var(--focus-shadow); }
```

`--focus-shadow` draws a 2px `--color-surface` gap, a 2px `--color-focus-ring` ring and a 3px `--color-focus-halo` glow. In light mode the ring is ink and the halo is lime. In dark mode the ring is lime. The surface gap keeps the ring visible on lime fills (see the audit).

**Global state vocabulary**

| State | Rule |
|---|---|
| hover | Only under `@media (hover: hover)`. Never the only way to find a control. |
| focus-visible | `--focus-shadow`. Never removed. |
| active (pressed) | `transform: translateY(1px)` plus the darker fill step. No transform under reduced motion. |
| disabled | `aria-disabled="true"` (not the `disabled` attribute) on the CTA and "+ Add", so they stay focusable and announce *why* through `aria-describedby`. Use `--color-fill-disabled` and `--color-ink-disabled`, with `cursor: not-allowed`. |
| error | `--color-error-border` 1.5px outline, `--color-error-soft` fill, `--color-error` text, plus an icon. Never colour alone. |
| loading | Skeleton or spinner with `aria-busy="true"` on the region. Show it only if the work takes more than 150 ms, so it doesn't flash. |

**data-testid convention:** `kebab-case`, using `component-part`. Dynamic parts take the id: `chip-{ingredientId}`, `card-{cocktailId}`.

---

## C1. Ingredient multi-select combobox

Stories: US-E1-01 to 07 and US-E2-01 to 05.

### Anatomy

```
 Your ingredients                                       3 / 10 ingredients   Clear all
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [● Gin ×] [● Campari ×] [⚠ campary ×] [? orange · Choose ▾]  Add another…▌           │  ← field (glass)
└──────────────────────────────────────────────────────────────────────────────────────┘
  ┌───────────────────────────────┐
  │ ● Sweet Vermouth   vermouth   │  ← listbox (popover, glass)
  │ ● Dry Vermouth     vermouth   │
  │ ● Fresh lemon → Lemon Juice   │  ← synonym option
  └───────────────────────────────┘
  ⚠ We don’t know “campary”. Did you mean: [Campari]   ← error message under field
  ⓘ Ice & water are always assumed. No need to add them.                 ← transient info hint
  Press Enter or comma to add. Ice and water are always assumed.          ← static helper
```

| # | Part | Element | Tokens |
|---|---|---|---|
| 1 | Label | `<label for>` | `--text-sm-*`, `--font-weight-semibold`, `--color-ink-2` |
| 2 | Counter | `<span>` + SR live region | `--text-sm-*`, `--font-mono` for digits (tabular), `--color-ink-muted`. At 10/10: `--color-secondary-strong`, `--font-weight-semibold` |
| 3 | Clear all | text button | `--color-ink-muted`; hover `--color-ink`; hidden when there are 0 chips |
| 4 | Field (chip well) | `<div>` wrapping the chip list and input | bg `--color-glass` + `backdrop-filter: var(--glass-filter)`; border 1px `--color-border-strong`; radius `--radius-lg`; padding `--space-2` `--space-3`; min-height `--size-control`; gap `--space-2`; `--shadow-1` |
| 5 | Chip list | `<ul>` | flex-wrap, gap `--space-2` |
| 6 | Chip | `<li>` | see Chip below |
| 7 | Text input | `<input role="combobox">` | flex 1, min-width 8ch, `--text-md-*` (16px minimum stops iOS zoom), placeholder `--color-ink-subtle` |
| 8 | Listbox | `<ul role="listbox">` popover | `--color-glass`, `--glass-filter`, border 1px `--color-glass-border`, `--radius-md`, `--shadow-3`, `--z-popover`, max-height 320px (scroll), option height `--size-touch-min` |
| 9 | Error message | `<div id>` under the field | `--color-error`, `--text-sm-*`, warning icon `--size-icon-sm` |
| 10 | Info hint | `<div role="status">` | `--color-info-soft` bg, `--color-info` text + icon, `--radius-sm`, padding `--space-2` `--space-3` |
| 11 | Helper | `<p id>` | `--text-sm-*`, `--color-ink-muted` |
| 12 | Ambiguity chooser | popover anchored to its chip | see below |

### Sizes

| | Mobile (< 768) | Desktop (≥ 768) |
|---|---|---|
| Field width | 100% (16px gutters) | `min(100%, var(--size-input-max))`, centred |
| Field min-height | `--size-control` 48px | 48px. Grows with wrapped chips, max 3 rows, then scrolls internally |
| Chip height | `--size-chip` 32px. × hit area 44×44 via a `::before` overlay | 32px. × hit area 24×24 minimum |
| Listbox | Full field width, below. Flips above when there isn't room | Same width as the field, max 8 visible options |

### Chip

`[● Name ×]`: inline-flex, height `--size-chip`, padding-inline `--space-3` / `--space-1`, radius `--radius-pill`, `--text-sm-*`, `--font-weight-medium`.

- **Category dot:** 8px circle `--cat-{category}` (e.g. `--cat-citrus`). It's decorative (`aria-hidden`), because the label carries the meaning. The category name also appears as secondary text in listbox options.
- **Remove ×:** 24px circle button, icon `--size-icon-sm`, `--color-ink-muted`. Hover bg `--color-surface-sunken`, `aria-label` = `chip.remove`.

| State | Visual | Behaviour |
|---|---|---|
| default (valid) | bg `--color-surface`, border 1px `--color-border`, text `--color-ink` | — |
| hover | border `--color-border-strong` | — |
| focus-visible (× button) | `--focus-shadow` on the × | Enter/Space removes it |
| armed (Backspace once) | bg `--color-accent-soft`, border 1.5px `--color-accent-edge` | Announce `chip.backspaceArmedSr`. A second Backspace removes it. Any other key disarms it. |
| duplicate flash | bg pulses `--color-highlight` for `--duration-slow` × 2 | Announce `chip.duplicate`. Under reduced motion, a static highlight for 1 s. |
| entering | scale .9→1, opacity 0→1, `--duration-fast` `--ease-spring` | none under reduced motion |
| **error** (unrecognised) | bg `--color-error-soft`, border 1.5px `--color-error-border`, text `--color-error`, leading ⚠ icon instead of the dot. The text is the raw user text, rendered as text (never HTML) | `aria-invalid` semantics via accessible name `error.chipSr`. Its text is a button (`chip.edit`) that moves the text back into the input for editing and removes the chip. The message and suggestions render under the field (part 9), linked by `aria-describedby`. |
| **ambiguous** | bg `--color-surface`, border 1.5px dashed `--color-secondary-strong`, a `?` glyph, the term, and a "Choose ▾" badge (`--color-secondary-soft` bg, `--color-secondary-strong` text) | The whole chip is a button with `aria-haspopup="dialog"` and `aria-expanded`. It opens the Ambiguity chooser **automatically** on commit, with focus on the first option. |
| disabled | n/a (chips are never disabled) | — |
| loading | n/a (normalisation is synchronous) | — |

### Error suggestions ("Did you mean…")

A row of secondary buttons under the field: height `--size-control-sm`, radius `--radius-pill`, border 1px `--color-border-strong`, bg `--color-surface`, `--text-sm-*`, with a category dot. Hover sets bg `--color-accent-soft`. Activating one replaces the error chip with a valid chip (US-E2-02), announces `error.replacedSr` and returns focus to the input. Show at most 3 suggestions. With none, only show `error.unrecognised`.

If more than 1 chip is in error, each error chip's message is listed in its own block, in chip order, prefixed with the raw text.

### Ambiguity chooser (popover)

```
      [? orange · Choose ▾]
     ┌─────────────────────────────────┐
     │ Which “orange” do you mean?     │
     │ Pick one — they make very…      │
     │ ( ● Orange Juice        juice ) │  ← radio-like option buttons, 44px
     │ ( ● Orange Liqueur    liqueur ) │
     │ ( ● Orange Bitters    bitters ) │
     │                Remove “orange”  │
     └─────────────────────────────────┘
```

- Pattern: a non-modal `role="dialog"` popover with `aria-labelledby` set to the prompt. Options are a `role="listbox"` (`aria-label` = prompt) with `role="option"` items. Mobile (< 768) uses a bottom sheet with a scrim (`--color-scrim`).
- Visual: `--color-glass` + `--glass-filter`, `--radius-lg`, `--shadow-3`, padding `--space-4`, width 280–320px.
- Options come from `ambiguityGroups[term].options` **in data order**. Each option is 44px tall with a category dot, the name, and the category (`--color-ink-muted`). Hover/active-descendant: bg `--color-accent-soft`. Selected: check icon.
- Enter or click resolves the chip, announces `ambiguity.resolvedSr` and returns focus to the input. Esc closes the popover but leaves the chip ambiguous (search stays blocked) with focus on the chip. "Remove “orange”" removes it.
- If the chosen option is already a chip, treat it as a duplicate: flash that chip and remove the pending one.

### Counter, limits and hints

| Condition | Counter | Input | CTA (C2) | Messages |
|---|---|---|---|---|
| 0 counted | `0 / 10 ingredients` | placeholder `input.placeholder` | aria-disabled | `hint.min` (or `hint.onlyExcluded` if water or ice was entered) |
| 1 counted | `1 / 10` | `input.placeholderMore` | aria-disabled | `hint.minOne` |
| 2–9 counted, all valid | `n / 10` | — | enabled | — |
| any chip error/ambiguous | `n / 10` (error/ambiguous chips **don't count**) | — | aria-disabled | `hint.fixChips_*` |
| 10 counted | `10 / 10` in `--color-secondary-strong` | `input.placeholderFull`. Typing is still allowed, but committing a **counted** term is rejected: no chip is added, the text stays in the input, and `error.tooMany` shows (assertive) | enabled | — |
| user enters ice/water (any count, even at 10) | unchanged | input cleared | unchanged | `hint.excluded` info hint (polite), auto-hides after `--duration-hint-visible`. No limit error (US-E1-05). |

The info hint fades in and out with `--duration-base`. Under reduced motion it appears and disappears instantly. It doesn't hide while it has hover or focus.

### Listbox options

- Source: the dictionary (`name` and `synonyms`), excluding `classification: excluded`. Rank by prefix match on name, then prefix on synonym, then substring. Show at most 8.
- Option content: category dot, **name** with the matched substring in `--font-weight-bold`, and the category label on the right (`--color-ink-muted`, `--text-xs-*`).
- A synonym hit renders `listbox.synonym`: "Fresh lemon → Lemon Juice", with the typed part in `--color-ink-muted` and the arrow `aria-hidden`. The SR name is "Lemon Juice (from fresh lemon)".
- Already-added options: `aria-disabled="true"`, `--color-ink-disabled`, suffix `listbox.alreadyAdded`.
- Active descendant: bg `--color-accent-soft`, plus a 3px left bar `--color-accent-edge` (not colour-only).
- Ambiguity terms (e.g. typing "orange") show the group's options directly, so selecting one skips the chooser.

### Commit rules (mirrors the normaliser contract)

| Normaliser result | UI |
|---|---|
| `ok`, new | Add a valid chip and announce `chip.addedSr` |
| `ok`, duplicate | Flash the existing chip (US-E1-07) |
| `ambiguous` | Add the ambiguous chip and open the chooser |
| `invalid` | Add an error chip with suggestions (US-E2-02/04) |
| `excluded` | Clear the input and show the info hint (US-E1-05) |
| `ok` at 10 counted | Reject with `error.tooMany` (US-E1-04) |

Comma or paste with commas splits the text and commits each part in order (US-E1-01). Leading and trailing whitespace is trimmed. Empty segments are ignored.

### States (field level)

| State | Visual |
|---|---|
| default | as anatomy |
| hover | border `--color-ink-muted` |
| focus-within | `--focus-shadow` on the **field** (not the inner input), border `--color-ink` |
| error (≥ 1 error chip) | field border stays neutral. The error lives on the chip and in the message, to avoid double-signalling. |
| disabled | not used |
| loading | not used (dictionary is bundled). If the data is still loading, show a skeleton field 48px tall with `--color-surface-sunken` shimmer |

### ARIA & testids

ARIA 1.2 combobox: input `role="combobox"`, `aria-expanded`, `aria-controls="ingredient-listbox"`, `aria-activedescendant`, `aria-autocomplete="list"`, `aria-describedby="ingredient-helper ingredient-error ingredient-counter"`. Chips sit in a `<ul aria-label="Selected ingredients">`. See the a11y doc for the full keyboard map.

| testid | Element |
|---|---|
| `ingredient-input` | `<input>` |
| `ingredient-field` | wrapper |
| `ingredient-listbox` | listbox |
| `ingredient-option-{id}` | option |
| `chip-list` | `<ul>` |
| `chip-{id}` / `chip-error-{index}` / `chip-ambiguous-{term}` | chip `<li>` |
| `chip-remove-{id}` (error: `chip-remove-error-{index}`) | × button |
| `chip-edit-error-{index}` | error chip text button |
| `ingredient-counter` | counter |
| `ingredient-clear-all` | clear all |
| `ingredient-error` | error message block |
| `suggestion-{id}` | did-you-mean button |
| `hint-excluded` | info hint |
| `hint-limit` | too-many message |
| `ambiguity-chooser` | popover |
| `ambiguity-option-{id}` | option |
| `ambiguity-remove` | remove button |

---

## C2. Primary CTA — "Find cocktails"

Stories: US-E1-03 and US-E2-05.

**Anatomy:** `[ 🔍 Find cocktails ]`. A leading 20px search icon (`aria-hidden`), label `cta.search`. Below it sits a helper line (`id="cta-helper"`) for disabled reasons.

| Size | Mobile | Desktop |
|---|---|---|
| Height | `--size-control` 48px | 48px |
| Width | 100% (full-bleed inside gutter). Sticky to the bottom of the viewport (`--z-sticky`) on a glass bar once chips exist and the field has scrolled off | auto, min 200px, padding-inline `--space-6`, inline at the right of the counter row or centred under the field |
| Type | `--text-md-*`, `--font-weight-bold` | same |
| Radius | `--radius-pill` | same |

| State | Fill | Label | Edge / other |
|---|---|---|---|
| default | `--color-accent` | `--color-on-accent` | 1px `--color-accent-edge` border, `--shadow-accent-glow` |
| hover | `--color-accent-hover` | on-accent | glow intensifies (shadow-2 + accent-glow) |
| focus-visible | default fill | — | `--focus-shadow` |
| active | `--color-accent-active` | — | translateY(1px), no glow |
| disabled (`aria-disabled`) | `--color-fill-disabled` | `--color-ink-disabled` | no border or glow. `aria-describedby="cta-helper"`. Activating it moves focus to the first problem (the first error/ambiguous chip, or the input) and re-announces the helper |
| loading | `--color-accent` | `cta.searching` + 16px spinner (ink, 1px stroke, rotates `--duration-slow` linear; under reduced motion it's replaced by static "…") | `aria-busy="true"`, width locked so it doesn't jump |
| after results, chips changed | default | `cta.searchAgain` | — |
| error | n/a (errors are on chips) | — | — |

Search is near-instant (BR-10). Loading shows only when the work exceeds 150 ms, for a minimum of 300 ms once shown.

**ARIA:** a native `<button type="submit">` inside `<form role="search" aria-label="Find cocktails by ingredient">`. **testid:** `search-button`, `search-helper`.

---

## C3. Cocktail card

Story: US-E4-03.

### Anatomy

```
┌──────────────────────────────────────────┐
│ VINTAGE · 1898                  [glass]  │  ← era badge + glass icon + glass label
│ Daiquiri                                 │  ← H3 name
│ Crisp, clean and perfectly simple.       │  ← taste tagline (1 line, ellipsis)
│ ──────────────────────────────────────── │
│ [✓ White Rum] [✓ Lime Juice] [Sugar]     │  ← ingredient pills (matched highlighted)
│ Uses 2 of yours            View recipe → │  ← meta + affordance
└──────────────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Container | `<article>` with a full-card `<button>` overlay (see ARIA). bg `--color-surface`, border 1px `--color-border`, radius `--radius-lg`, padding `--space-5` (mobile `--space-4`), `--shadow-1`, min-height 200px, flex column, gap `--space-3` |
| Era badge | overline: `--text-overline-*`, uppercase, `--font-weight-bold`, `--color-ink-muted`, text `card.eraYear` (or just the era). Vintage gets a 6px dot in `--cat-syrup-sweetener` (amber) and Modern a 6px dot in `--cat-mixer` (cyan). Decorative only |
| Glass | 24px line icon (`--color-ink-muted`, 1.5px stroke) + `--text-xs-*` label. Icon family is mapped from the free-text `glass` (see table) |
| Name | H3 `--text-xl-*`, `--font-weight-bold`, `--color-ink`. Wraps to 2 lines max |
| Tagline | First sentence of `tasteProfile` (up to the first `.`), `--text-sm-*`, `--color-ink-2`, 1-line clamp on desktop, 2 on mobile. Full text lives in the detail |
| Ingredient pills | Counted, non-optional ingredients in recipe order (ice/water omitted, optional ones shown with "(opt.)"). Pill: height 24px, `--radius-pill`, `--text-xs-*`, padding-inline `--space-2`. **Matched:** bg `--color-accent-soft`, border 1px `--color-accent-edge`, ✓ icon, `--font-weight-semibold`, SR suffix `card.matchedSr`. **Not provided by user** (only near-match cards): bg `--color-secondary-soft`, border 1px dashed `--color-secondary-strong`, `+` icon. **Other** (e.g. extra optional): bg `--color-surface-sunken`, `--color-ink-2` |
| Meta | `card.uses_*` `--text-xs-*` `--color-ink-muted`, and on the right `card.openHint` + → in `--color-accent-strong`, `--font-weight-semibold` |

**Glass icon families** (case-insensitive keyword match on `glass`, first hit wins): `coupe|cocktail|martini` → *coupe*; `flute|champagne` → *flute*; `highball|collins|tall|fizz` → *highball*; `old fashioned|rocks|tumbler` → *rocks*; `mug|julep|cup` → *mug*; `wine|goblet` → *wine*; `irish coffee` → *mug*; otherwise *generic*. The label always shows the raw `glass` value.

### States

| State | Spec |
|---|---|
| default | as above |
| hover | translateY(-2px), `--shadow-2`, border `--color-border-strong`, "View recipe →" arrow shifts 2px. `--duration-fast` `--ease-standard` |
| focus-visible | `--focus-shadow` on the card (via `:has(:focus-visible)` or the overlay button's outline) |
| active | translateY(0), `--shadow-1` |
| disabled | n/a |
| loading (skeleton) | Same box. Lines are `--color-surface-sunken` rounded bars (overline 30%, name 60%, tagline 90%, 3 pills 20% each). A shimmer gradient sweeps every 1.2 s. Under reduced motion it's static. `aria-hidden="true"`, and the region carries `aria-busy` |
| error | n/a |
| near-match variant | See C6: adds the "Missing" strip and the "+ Add" button |

### ARIA

`<article aria-labelledby="card-{id}-name">` contains `<h3 id="card-{id}-name">`. The full-card hit target is a `<button>` positioned over the card (`::after inset 0`) with an accessible name equal to the cocktail name and `aria-describedby` pointing at the tagline and `card.open`. It opens C4 (`aria-haspopup="dialog"`). The near-match "+ Add" button is a separate, sibling button above the overlay (`position: relative; z-index: 1`), so it's never nested inside a button.

**testid:** `card-{cocktailId}`, `card-open-{cocktailId}`, `card-era-{cocktailId}`, `card-ingredient-{cocktailId}-{ingredientId}` (with `data-matched="true|false"`).

---

## C4. Detail view (dialog)

Stories: US-E5-01 to 03, US-E3-05 and US-NF-05.

### Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ VINTAGE · 1898 · Shaken                                 [×] │  ← sticky glass header
│ Daiquiri                                                    │
├──────────────────────────────────────────────────────────────┤
│ Ingredients                      Servings  [–]  2  [+]      │
│  ✓ 120 ml   White Rum            White Cuban rum            │
│  ✓  40 ml   Lime Juice                                      │
│     4 barspoons Sugar            Superfine sugar            │
│  (opt.) …                                                   │
│ Glass  Cocktail Glass     Garnish  No garnish               │
│ Method                                                       │
│  1. Add all ingredients to a cocktail shaker and stir…      │
│  2. Add ice and shake.                                      │
│  3. Strain into a chilled cocktail glass.                   │
│ How it tastes                                                │
│  Crisp, clean and perfectly simple…                         │
│ The story                                                    │
│  ¶1 … ¶2 …                                                  │
│ Sources                                                      │
│  IBA: Daiquiri ↗   Difford’s Guide: Daiquiri cocktail story ↗│
└──────────────────────────────────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Scrim | `--color-scrim`, plus `backdrop-filter: blur(4px)` on desktop. `--z-scrim` |
| Panel | `--color-surface` (solid for readability; only the header is glass), `--shadow-3`, `--z-dialog`. **Desktop (≥ 768):** centred modal, width `min(100% - 64px, var(--size-dialog-max))`, max-height `calc(100dvh - 64px)`, radius `--radius-xl`. **Mobile (< 768):** full-screen sheet, 100dvw × 100dvh, radius `--radius-xl` on the top corners only, slides up from the bottom |
| Header | sticky, `--color-glass` + `--glass-filter`, border-bottom 1px `--color-border`, padding `--space-4` `--space-6`. Overline (era · year · technique from `detail.technique.*`), H2 name `--text-2xl-*` `--font-weight-heavy`. Close button 44×44, radius `--radius-pill`, icon `--size-icon-lg` `--color-ink-muted`, hover bg `--color-surface-sunken` |
| Body | scrolls, padding `--space-6` (mobile `--space-4`), sections separated by `--space-8`. H3 `--text-lg-*` `--font-weight-bold`. Prose `--text-md-*` `--color-ink-2`, max 68ch |
| Ingredient rows | Grid columns: icon 20px · amount 11–12ch, right-aligned, `font-variant-numeric: tabular-nums` · name · note. Row height 40px, divider 1px `--color-border`. Matched rows show the ✓ icon in `--color-accent-strong` and an SR "You have this". Optional rows get an `chip.optional` tag (`--color-surface-sunken` pill). Notes are `--text-sm-*` `--color-ink-muted`; on mobile they wrap under the name. Ice and water rows are omitted from the list (they're covered by the method) |
| Servings stepper | label `detail.servings`. Group `[–] value [+]`: buttons 36×36 (`--size-control-sm`, 44 hit area on touch), border 1px `--color-border-strong`, radius `--radius-pill`. Value is `--font-mono` `--font-weight-bold`, min-width 3ch. Range 1–4, default 1. At 1, [–] is disabled; at 4, [+] is disabled. Hover bg `--color-accent-soft`. Active: fill `--color-accent`, edge `--color-accent-edge` |
| Glass / Garnish | 2-column definition list (`<dl>`), stacking on mobile |
| Method | `<ol>`. Numbers in 24px circles `--color-accent-soft` with `--color-ink` text |
| Sources | links `detail.sourceLink` in `--color-accent-strong`, underlined, ↗ icon, `target="_blank" rel="noopener noreferrer"`, SR suffix `detail.sourceNewTabSr` |

### Scaling rules (US-E5-02)

`ml`, `dash`, `drop`, `barspoon`, `piece`, `leaf`, `sprig` and `pinch` are multiplied by servings. ml rounds to the nearest 5 when ≥ 30, otherwise to 2.5. Count units round to the nearest 0.5 and display as an integer when whole (e.g. "1½" style is out of scope, so use "1.5"). `top`, `splash` and `null` never scale (`detail.unit.top` / `.splash`). `amount: null` with a countable unit shows `detail.unit.unknown` plus the note. Changing servings announces `detail.servingsSr` (polite) and doesn't move focus. Amounts animate with a number crossfade (`--duration-fast`), or swap instantly under reduced motion.

### States

| State | Spec |
|---|---|
| opening | Desktop: opacity 0→1 and scale .98→1, `--duration-base` `--ease-enter`. Mobile: translateY(100%)→0, `--duration-slow` `--ease-enter`. Reduced motion: opacity only, 1ms |
| closing | reverse, with `--ease-exit` and `--duration-fast` |
| focus-visible | close button, stepper buttons and links use `--focus-shadow` |
| hover | close button bg, stepper bg, link underline thickness 2px |
| disabled | stepper ends (`disabled` attribute plus `--color-ink-disabled`) |
| loading | n/a (the data is in memory). If an image is ever added, use a skeleton |
| error | If the record fails to render, the dialog shows `error.dataLoad` with a close button |
| near-match variant | The missing ingredient row shows a dashed `--color-secondary-strong` outline, the `+` icon and `detail.youNeed`. The footer holds a sticky "+ Add {name}" (C6 badge style, large) |

### ARIA & focus

`<dialog>` opened with `showModal()` (native focus trap and inert background) or `role="dialog" aria-modal="true"` with a JS trap. `aria-labelledby` points to the H2 name and `aria-describedby` to the tagline. On open, focus goes to the **H2 (tabindex=-1)**, so screen readers start at the title, not the close ×. Esc, the × and a backdrop click all close it (US-E5-03). Focus returns to the originating card's open button. Body scroll is locked while it's open. The stepper is `role="group" aria-labelledby="servings-label"`, and the value is `<output aria-live="polite">`.

**testid:** `detail-dialog`, `detail-title`, `detail-close`, `detail-ingredient-{id}`, `detail-amount-{id}`, `servings-decrease`, `servings-value`, `servings-increase`, `detail-method`, `detail-glass`, `detail-garnish`, `detail-history`, `detail-taste`, `detail-source-{index}`, `detail-add-missing` (near-match only).

---

## C5. Results grid

Stories: US-E4-01, 02, 04 and 05.

### Anatomy

```
Your cocktails                                   ← H2 (tabindex=-1, focus target after search)
3 cocktails you can make right now               ← count (also SR live region)
Showing the top 6 of 9 matches.                  ← only when capped
[card][card][card]
[card][card][card]
```

| Viewport | Columns | Gap | Notes |
|---|---|---|---|
| 360–767 | 1 | `--space-4` | Cards full width |
| 768–1023 | 2 | `--space-5` | |
| ≥ 1024 | 3 | `--space-6` | max width `--size-content-max` |

CSS: `grid-template-columns: repeat(var(--cols), minmax(0, 1fr))`. Results are **capped at 6 or 8** (BR-06), in the order the engine returns.

**Small counts must look intentional:**

| Count | Layout (≥ 1024) |
|---|---|
| 1 | Single "feature" card, centred, `max-width: 560px`. Horizontal layout: name and tagline on the left, ingredients on the right (≥ 768). Under the count: `results.single` |
| 2 | 2 columns, centred, grid max-width 2/3 of content |
| 3, 6 | 3 columns, full rows |
| 4 | 2 × 2 (switch `--cols` to 2, grid max-width 2/3) for a balanced block |
| 5, 7, 8 | 3 columns. The final partial row is centred (`justify-content: center` using a flex fallback, or grid with `grid-column` offsets) |

On tablet, odd counts leave the last card centred at half width.

### States

| State | Spec |
|---|---|
| idle (before first search) | Not rendered. The space below the input shows a frosted "how it works" strip: 3 steps, `--color-ink-muted` |
| loading | `aria-busy="true"`. Skeleton cards equal to `min(cap, 3)`. SR `results.loadingSr`. Shown only if > 150 ms |
| results | Cards stagger in (`--duration-base`, 40ms stagger, max 8). Reduced motion: no stagger |
| stale (chips changed after search) | Grid at 60% opacity with a "Results are for your previous list" note, and the CTA reads `cta.searchAgain`. Not shown on mobile, where the sticky CTA suffices |
| zero | Replaced by C6 |
| error | n/a (deterministic) |

### ARIA

`<section aria-labelledby="results-title">`. The cards are in a `<ul role="list">`. After search, focus moves to the H2 `results-title` (tabindex=-1), and a **separate** polite live region (`#results-status`, visually hidden) announces `results.countSr_*` (US-E4-05). Don't put `aria-live` on the grid itself.

**testid:** `results`, `results-title`, `results-count`, `results-capped`, `results-grid`, `results-skeleton`, `results-status`.

---

## C6. Fallback view, near matches, and empty-of-everything

Stories: US-E6-01 to 05.

### Anatomy (zero primary matches, ≥ 1 near match)

```
┌──────────────────────────────────────────────────────────────┐
│      (ice-cube-in-empty-coupe illustration, 96px)            │  ← frosted panel
│      No direct matches found                                 │
│      Nothing in our library uses only what you have — …      │
│      ⓘ Tip: adding Sugar unlocks the most drinks here.       │
└──────────────────────────────────────────────────────────────┘

Near Matches — missing 1 ingredient                    ← H2
Add the missing ingredient and we’ll search again.

┌───────────────────────────┐ ┌───────────────────────────┐
│ MISSING                   │ │ MISSING                   │
│ [ + Add Sugar ]  ← orange │ │ [ + Add Cola ]            │
│ VINTAGE · 1898   [glass]  │ │ VINTAGE          [glass]  │
│ Daiquiri                  │ │ Cuba Libre                │
│ Crisp, clean and …        │ │ …                         │
│ [✓White Rum][✓Lime][+Sugar]│ │ [✓White Rum][✓Lime][+Cola]│
│ Uses 2 of yours  View →   │ │ …                         │
└───────────────────────────┘ └───────────────────────────┘
```

| Part | Spec |
|---|---|
| Notice panel | `--color-glass` + `--glass-filter`, border 1px `--color-glass-border`, radius `--radius-xl`, padding `--space-8` (mobile `--space-6`), centred text, max-width 640px. Illustration: an inline SVG line drawing (ice cube + coupe) using `--color-ink-muted` strokes and a `--color-accent` ice highlight, `aria-hidden`. Title H2 `--text-2xl-*`. Body `--color-ink-2`. Tip row uses the info style (`--color-info-soft`, `--color-info`) |
| Section title | H2 `nearMatches.title` `--text-xl-*`, plus a 4px × 24px `--color-secondary` bar before it (decorative) |
| Near-match card | C3 card, plus a top strip: overline `nearMatches.missingLabel` (`--color-secondary-strong`) and the **+ Add badge-button**. Card border 1px `--color-border`, with the top border 3px `--color-secondary` |
| "+ Add" button | height 36px (`--size-control-sm`; hit area 44 on touch), radius `--radius-pill`, fill `--color-secondary`, border 1px `--color-secondary-strong`, label `--color-on-secondary` `--font-weight-bold` `--text-sm-*`, text `nearMatches.addButton`, with the category dot of the missing ingredient |
| Grid | Same as C5 (1/2/3 cols, cap 6/8, same small-count rules) |

**"+ Add" states**

| State | Spec |
|---|---|
| default | as above |
| hover | `--color-secondary-hover`, `--shadow-2` |
| focus-visible | `--focus-shadow` |
| active | translateY(1px) |
| loading | After activation: the label becomes a spinner plus "Adding…", the button gets `aria-busy`, and all other "+ Add" buttons get `aria-disabled` until the re-search completes |
| disabled | At 10 counted ingredients: `aria-disabled="true"`, `--color-fill-disabled`/`--color-ink-disabled`, `aria-describedby` → `nearMatches.addFullSr`. Activating it focuses the chip list |
| error | n/a |

**Behaviour (US-E6-04):** activating the button adds the chip (normal commit rules), announces `nearMatches.addedSr`, re-runs the search automatically, scrolls to the results top (smooth, or instant under reduced motion) and moves focus to `results-title`. The new chip gets the "entering" animation.

### Empty-of-everything (0 primary, 0 near) — US-E6-05

The notice panel uses the `empty.*` copy: an illustration (empty coupe, no ice), `empty.title`, `empty.body`, `empty.tip`, and a secondary button `empty.action` (outline: border 1px `--color-border-strong`, `--radius-pill`, 44px). The button clears the chips and focuses the input. **No Near Matches heading is rendered.**

### ARIA

The notice is a `<section aria-labelledby="fallback-title">` and the near matches are a `<section aria-labelledby="near-title">`. After search, focus moves to `fallback-title` (tabindex=-1), and the status region announces `fallback.liveSr` or `empty.liveSr`. Each "+ Add" button has `aria-label` = `nearMatches.addButtonSr`.

**testid:** `fallback`, `fallback-title`, `fallback-tip`, `near-matches`, `near-matches-title`, `near-card-{cocktailId}`, `near-add-{ingredientId}-{cocktailId}`, `empty-state`, `empty-reset`.

---

## Iconography

Line icons on a 24px grid with a 1.5px stroke, round caps, and `currentColor`. Set: search, x (close/remove), plus, check, info, alert-triangle, chevron-down, arrow-right, external-link, minus, and glasses (coupe, flute, highball, rocks, mug, wine, generic). Ship them as inline SVG React components (no icon font). Decorative icons are `aria-hidden="true" focusable="false"`.
