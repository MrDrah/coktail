# Agent Brief 02 — UX/UI Designer

Read first: [00-orchestration-plan.md](../00-orchestration-plan.md) (BR-01 to BR-11) and the BA's `docs/ba/user-stories.md`.

## 1. Objectives & context

**Mission:** design a minimalist, fresh, **"frosty"** experience that takes a user from "what's in my cabinet?" to a drink in under 30 seconds. Error and fallback states should feel helpful, not like failures.

You own:
- The design system: tokens, type, spacing, motion, iconography.
- Component specs, including every interaction state.
- Screen flows for the happy path, error paths and the zero-match path.
- Accessibility at WCAG 2.1 AA.

Out of scope: matching logic, data content.

## 2. Input requirements

| Input | Source | Status |
|-------|--------|--------|
| User stories & ACs (E1–E6) | BA, H1 | Needed before final specs. You can start the design system now. |
| Ingredient categories (for chip color coding or icons) | BA dictionary | Needed for the chip spec |
| Field list for card and detail views | BA schema | Needed for the card spec |
| Tech constraints (component library, CSS approach) | Dev architecture doc | Needed for token export format |

## 3. Step-by-step deliverables

### Step 1 — Design system & tokens → `design/tokens.json` + `design/tokens.css`
- **Palette:** cool neutral slate/ice base with small, highly saturated accent hits.
  - Surfaces: an ice-white to frost-slate ramp (e.g. `#F4F7FA`, `#E6ECF2`, `#CBD5E1`). Ink colors are deep slate (`#0F172A`, `#334155`).
  - Accent (primary CTA, focus, active chip): electric lime (around `#B6FF3B`) **or** neon citrus orange (around `#FF7A1A`). Pick one as primary and use the other for secondary highlights such as the near-match "missing" badge.
  - Semantic colors: error, info and success, all tuned to the cool palette.
  - Every text and background pair must reach a **4.5:1** contrast ratio. Neon accents on light surfaces usually fail, so specify dark ink on accent fills.
- Provide a dark-mode variant (deep slate surfaces with the same accents). This is nice-to-have for the MVP, but the tokens must support it.
- Typography scale, spacing scale (4px base), radii, elevation (frosted-glass blur plus a subtle shadow), and motion (durations, easing, and a reduced-motion fallback).

### Step 2 — Component specs → `design/components.md` (+ Figma or annotated mockups)
For each component, specify its anatomy, sizes, and the states default / hover / focus-visible / active / disabled / error / loading.

1. **Ingredient multi-select input**
   - Type-ahead autocomplete from the canonical dictionary, with synonyms shown as "Fresh lemon → Lemon Juice".
   - Enter or comma commits a **chip**. Chips are removable (× button, plus Backspace on an empty input).
   - A live counter shows "3 / 10 ingredients", and water/ice don't count. When water or ice is entered, show a transient info hint: "Ice & water are always assumed. No need to add them."
   - **Error chip** state for unparseable input: a red outline with an inline message and "Did you mean…" suggestion buttons.
   - **Ambiguity chooser:** a popover that lets the user pick one meaning, e.g. "Orange → Orange Juice / Orange Liqueur / Orange Bitters".
   - Limits: the CTA is disabled below 2 ingredients (with helper text), and input is blocked at 10 (with a message).
2. **Primary CTA** ("Find cocktails"): the accent fill, its disabled state, and a loading state.
3. **Cocktail card**: name, era badge (Vintage/Modern), glass icon, ingredient list with the user's matched ingredients highlighted, and a short taste tagline. The whole card is clickable and keyboard-operable.
4. **Detail view** (modal on desktop, full-screen sheet on mobile):
   - Header, ingredient list with quantities, and **dynamic proportion scaling** (a servings stepper 1–4 that rescales the amounts; ml/oz toggle optional).
   - Method steps, glass and garnish.
   - History and taste profile (1–3 paragraphs).
   - Focus trap, closes on Esc, and returns focus to the card that opened it.
5. **Results grid**: 1 to 6 cards (2–4 ingredients) or 1 to 8 cards (5–10 ingredients). The layout must also look intentional with a single card. 1 column on mobile, 2 on tablet, 3 on desktop. Skeleton loading state.
6. **Fallback view:**
   - A friendly "No direct matches found" notice with an illustration, plus a tip ("Try adding a citrus juice or a sweetener").
   - Below it, a distinct **"Near Matches — missing 1 ingredient"** section. Each card shows a prominent "+ Add *Lime Juice*" badge in the secondary accent, and tapping it adds the ingredient and re-runs the search.
   - An empty-of-everything state for when near matches are empty too.

### Step 3 — Screen flows → `design/flows.md`
- Happy path: land → add chips → search → results → open detail → close.
- Error paths: typo → suggestion. Ambiguous term → choose a meaning. Fewer than 2 ingredients. More than 10. Only water/ice entered.
- Zero match → near matches → "+ Add" → new results.
- Map each frame to the BA story IDs.

### Step 4 — Responsive & accessibility spec → `design/a11y-responsive.md`
- Breakpoints: 360, 768, 1024 and 1440.
- Keyboard map, ARIA patterns (combobox with listbox for the input, dialog for the detail view), `aria-live` regions for errors and the result count, and the `prefers-reduced-motion` fallback.

### Step 5 — Microcopy sheet → `design/copy.md`
All user-facing strings, including errors, hints, empty states and CTA labels, with a friendly, concise tone. Dev implements these verbatim.

## 4. Handoff criteria & dependencies

**Depends on:** BA H1 (stories, dictionary categories, schema fields) and the Dev token format decision.

**Handoff H2 is ready when:**
- [ ] Tokens are exported as both JSON and CSS custom properties.
- [ ] All six components are specified with every state, at mobile and desktop sizes.
- [ ] Flows cover every BA epic and every error and fallback path.
- [ ] The contrast audit is attached (all pairs reach 4.5:1 or better, and UI elements reach 3:1 or better).
- [ ] The microcopy sheet is complete.

**Consumers:** Dev builds from the specs, tokens and copy. QA uses the flows and copy for visual and UX checks.
