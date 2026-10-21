# Architecture Decision Record — Cocktail Discovery MVP

Owner: Dev Agent · Version 0.1 (engine milestone) · 2026-10-21

## Decisions

| # | Decision | Why |
|---|----------|-----|
| ADR-1 | **Vite + TypeScript + React**, static build, no server | BR-10: zero-cost static hosting. React fits the chip/combobox/dialog components in the UX spec. |
| ADR-2 | **Pure domain layer** in `src/domain/` with no DOM and no React | Unit-testable in Node. The UI only calls `normalizer` and `matcher`. |
| ADR-3 | **Data passed in, not imported, by the factories** (`createNormalizer(dict)`, `createMatcher(library, dict)`). `src/domain/index.ts` binds the shipped JSON. | Tests use fixture libraries (FX-*) without touching real data. |
| ADR-4 | **Set-based matching, no bitsets** | 500 recipes × at most 10 IDs is trivial: the benchmark averages well under the 5 ms budget (US-NF-03). Bitsets can come later if the library grows 10×. |
| ADR-5 | **Vitest** for unit tests, with a 90% coverage threshold on `src/domain` enforced in config. Playwright comes with the UI. | Matches the QA brief. |
| ADR-6 | **Data validation** is `scripts/validate-data.mjs` (plain Node, no deps) and runs in CI. | It's the BA's rule set, so Dev doesn't duplicate it as JSON Schema yet. |

## Domain API

```ts
import { normalizer, matcher, scaleAmount } from './domain';

normalizer.normalize('Fresh Lemon');   // { status: 'ok', id: 'lemon-juice', name: 'Lemon Juice' }
normalizer.normalize('orange');        // { status: 'ambiguous', options: [...] }
normalizer.normalize('campary');       // { status: 'invalid', suggestions: [{ id: 'campari', ... }] }
normalizer.normalize('crushed ice');   // { status: 'excluded', kind: 'ice' }
normalizer.autocomplete('verm');       // [{ id: 'dry-vermouth', ... }, { id: 'sweet-vermouth', ... }]

matcher.search(['white-rum', 'lime-juice']);
// { status: 'ok', count: 2, cap: 6, matches: [], nearMatches: [{ cocktail, matchedIds, missingId: 'sugar' }, ...],
//   bestAddition: { id: 'sugar', unlocks: 2 } }   // the "+ Add X unlocks n cocktails" tip; null when there are matches
matcher.search(['gin']);               // { status: 'too-few', count: 1 }

scaleAmount({ id: 'gin', amount: 45, unit: 'ml', optional: false }, 2); // 90
```

### Matching rules as implemented (`src/domain/match.ts`)
- **User set U:** de-duplicated. Water and ice are dropped (BR-02). Unknown IDs throw, because the normaliser must run first. The count must be 2–10.
- **Available set:** U plus the `provides` of each ingredient (Whole Lime → Lime Juice).
- **req(recipe):** counted, non-optional ingredient IDs.
- **Primary match:** req ⊆ available. Ranked by number matched, then popularity, then name. Capped at 6 for 2–4 ingredients and 8 for 5–10.
- **Near matches:** only when there are 0 primary matches. Exactly 1 missing and at least 1 matched. Ranked by the missing ingredient's `pairingWeight`, then overlap, then popularity, then name. Same cap.

### Normaliser pipeline (`src/domain/normalize.ts`)
1. Clean the input: diacritics, case, punctuation, and hyphens become spaces.
2. Exact name/synonym match, or ambiguity term. Also tries simple singular forms.
3. Strip descriptor stop-words and retry.
4. Otherwise `invalid`, with up to 3 fuzzy suggestions. These use OSA edit distance: 1 for terms of 3–4 characters, 2 for 5 or more, and exact match only below 3. Fuzzy results are never auto-accepted.

## Commands

```bash
npm test               # unit tests
npm run coverage       # with v8 coverage, ≥ 90% enforced on src/domain
npm run typecheck
npm run validate:data
```

## UI (`src/ui/`)

| File | Spec |
|------|------|
| `App.tsx` | Shell, search flow, URL state `?i=` with back/forward, theme toggle, live regions |
| `IngredientInput.tsx` + `chips.ts` | C1 combobox: chips, autocomplete, error chips + suggestions, ambiguity chooser, limits |
| `CocktailCard.tsx` | C3 card and the near-match variant |
| `Results.tsx` | C5 grid (small-count layouts) and C6 fallback, best addition, empty state |
| `DetailDialog.tsx` + `format.ts` | C4 native `<dialog>`, servings stepper, assumed ice/water rows |
| `copy.ts` | Every string from `design/copy.md`, verbatim |
| `icons.tsx` | Line icons and the 10 glass icons |
| `app.css` | Styles using only `design/tokens.css` variables |

Known gaps vs the design spec (follow-ups):
- The ambiguity chooser is a popover at every width; the mobile bottom sheet isn't built.
- There's no sticky mobile CTA bar and no "how it works" idle strip.
- The card stagger and amount crossfade animations aren't built.
- Loading skeletons aren't needed yet, because search is synchronous.
- Playwright end-to-end tests and GitHub Actions CI are still to do. The UI flows are covered by Testing Library tests in `tests/unit/app.test.tsx`.
