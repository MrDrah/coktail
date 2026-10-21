# Agent Brief 03 — Developer & Solution Architect

Read first: [00-orchestration-plan.md](../00-orchestration-plan.md) (BR-01 to BR-11 and the §4 data contracts), the BA's schema and dictionary, and the UX specs.

## 1. Objectives & context

> You build the **logic**, not the content. The cocktail recipes, history and taste text are researched by the BA (BR-11). Don't generate or edit library content; report data problems to the BA.

**Mission:** build a zero-backend static web app. It loads a flat JSON library of 500 cocktails, normalizes free-text ingredient input to canonical IDs, runs an exact **subset match** plus an **N+1 near-match** fallback entirely in the browser, and renders the UX design.

You own:
- The architecture and tech stack.
- The JSON build pipeline and validation.
- The normalizer/synonym engine.
- The matching engine.
- The UI implementation.
- CI and deployment.

## 2. Input requirements

| Input | Source | Needed for |
|-------|--------|------------|
| Schema field table & validation rules | BA Step 2 | Data model, JSON Schema |
| `ingredients.json` (canonical + synonyms + ambiguity groups) | BA Step 3 | Normalizer |
| 500-recipe content | BA Step 4 | Library build |
| Tokens, component specs, copy | UX H2 | UI build |
| ACs & story IDs | BA H1 | Unit and integration tests |

You can start Steps 1–3 against the §4 draft schema and a 20-recipe seed before the BA's final version lands.

## 3. Step-by-step deliverables

### Step 1 — Architecture decision record → `docs/dev/architecture.md`
Recommended stack (deviations need justification in the ADR):
- **Vite + TypeScript + React** (or Preact for bundle size). Plain CSS modules driven by the UX token CSS variables.
- **Vitest** for unit tests and **Playwright** for end-to-end tests.
- Static hosting (GitHub Pages, Netlify or Vercel). No server and no runtime LLM.
- Folder layout: `src/domain` (pure logic, no DOM), `src/ui`, `data/`, `scripts/` (build and validate), `tests/`.

### Step 2 — Data pipeline → `data/schema/*.schema.json`, `scripts/validate-data.ts`
- Turn the BA schema into JSON Schema (draft 2020-12) for `cocktails.json` and `ingredients.json`.
- The validator runs in CI and fails the build on any of these:
  - a schema violation
  - an unknown ingredient ID
  - a duplicate ID
  - a synonym that maps to two IDs without being declared an ambiguity group
  - `history` + `tasteProfile` outside 1–3 paragraphs
  - a missing `sources`
- **Build-time precompute**, emitted as `cocktails.index.json` (or done at load):
  - per recipe, `req`: a sorted array of **counted, non-optional** canonical IDs, with ice and water removed (BR-02)
  - a bitset over the ingredient index, as a `Uint32Array` or `BigInt`, for O(1)-ish subset checks
  - an inverted index `ingredientId → recipeIds` to prune candidates for near matches
- Size budget: the library JSON should be at most 400 KB gzipped. Lazy-load the `history`/`tasteProfile` text if needed.

### Step 3 — Normalizer & synonym engine → `src/domain/normalize.ts`
```ts
type NormalizeResult =
  | { status: 'ok'; id: string; name: string }
  | { status: 'excluded'; raw: string; kind: 'water' | 'ice' }        // BR-02: silently dropped + info hint
  | { status: 'ambiguous'; raw: string; options: { id: string; name: string }[] }
  | { status: 'invalid'; raw: string; suggestions: { id: string; name: string }[] };
```
Pipeline:
1. Lowercase, trim, collapse whitespace, strip punctuation and diacritics.
2. Strip descriptor words from the BA list (`fresh`, `squeezed`, `chilled`, `wedge` …), but only when the stripped form doesn't change identity (BA Q3).
3. Look the term up in the exact synonym map, singularizing as needed.
4. Check the ambiguity groups, returning `ambiguous`.
5. Run a fuzzy match (Damerau-Levenshtein ≤ 2, or a trigram score above a threshold) and return `invalid` with up to 3 suggestions. **Never auto-accept a fuzzy match.**

`Soda Water` and its synonyms resolve to `ok` (BR-03). De-duplicate by canonical ID across chips.

### Step 4 — Matching engine → `src/domain/match.ts`
Let U be the set of user canonical IDs (counted only, |U| between 2 and 10), and R the `req` set of a recipe.

- **Primary (BR-05):** `R ⊆ U`. With bitsets this is `(R & ~U) === 0`.
- **Ranking:** sort by
  1. `|R|` descending, so the recipe that uses the most of the user's ingredients ranks first
  2. `popularity` descending
  3. name, as a tiebreaker

  Cap the results by input size (BR-06): `maxResults = |U| <= 4 ? 6 : 8`. Return everything that matches, from 1 up to the cap.
- **Near match (BR-07):** `|R \ U| = 1` and `|R ∩ U| ≥ 1`. Use the inverted index to scan only recipes that share at least one of the user's ingredients. Rank by:
  1. the missing ingredient's `pairingWeight` descending
  2. `|R ∩ U|` descending
  3. `popularity`

  Return the missing ingredient's ID with each result.
- When near matches run: only when there are zero primary matches.
- Pure functions only, with no DOM access. The target is under 5 ms for 500 recipes on a mid-tier phone. Include a micro-benchmark test.

### Step 5 — UI implementation → `src/ui/**`
- Implement the UX components exactly: the chip input (combobox ARIA pattern), CTA, card, detail dialog with the servings scaler (scale `ml` amounts linearly; `dash`/`piece` units round sensibly), results grid, and the fallback/near-match view with the "+ Add ingredient" action.
- Search is blocked while any chip is `ambiguous` or `invalid` (BR-08).
- Use UX microcopy verbatim, sourced from a single `copy.ts`.
- Keep state in the URL query (`?i=white-rum,lime-juice`) so results are shareable and the back button works.

### Step 6 — Quality & delivery
- Unit tests for the normalizer and matcher, mapped to BA story IDs, with **≥ 90% coverage on `src/domain`**.
- CI (GitHub Actions): lint, typecheck, data validation, unit tests, build, and Playwright smoke tests.
- A preview deploy per PR, and a `README` with setup and run instructions.

## 4. Handoff criteria & dependencies

**Depends on:** BA H1 (final schema, dictionary, library) and UX H2 (tokens, specs, copy).

**Handoff H3 is ready when:**
- [ ] `npm run validate:data` passes on all 500 recipes.
- [ ] Domain coverage is at least 90%, and every BA AC in E1–E3 and E6 has at least one unit test.
- [ ] The full journey works on the preview URL (desktop and mobile).
- [ ] The performance budget is met: matching takes under 5 ms, LCP is under 2.5 s, and the JSON is at most 400 KB gzipped.
- [ ] A known-issues list has been handed to QA.

**Consumers:** QA, for the build, preview URL, test hooks (`data-testid`s) and a debug panel showing normalized IDs (dev builds only).
