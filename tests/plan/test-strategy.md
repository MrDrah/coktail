# Test Strategy — Cocktail Discovery MVP

Owner: QA Agent · Version 1.0 · 2026-10-21 · Implements [04-qa-engineer.md](../../docs/agents/04-qa-engineer.md)

## 1. Levels

| Level | Tool | Location | What it covers |
|-------|------|----------|----------------|
| Data validation | Node script | `scripts/validate-data.mjs` | Schema and cross-file rules (BR-10, BR-11, 10 glasses, short descriptions) |
| Unit (engine) | Vitest | `tests/unit/{normalize,match,scale}.test.ts` | Normaliser, matcher, scaling, mapped to story IDs. Includes a naive-oracle property test (1,000 random inputs) and a 500-recipe benchmark |
| Library verification | Vitest | `tests/unit/library/verification.test.ts` | Checks C1, C3–C9 on **every** recipe (50 today). Writes `tests/library/verification-matrix.csv` with `WRITE_MATRIX=1` |
| UI integration | Vitest + Testing Library (jsdom) | `tests/unit/app.test.tsx` | App flows without a browser: chips, errors, search, dialog, fallback |
| End-to-end | Playwright (Chromium) | `tests/e2e/*.spec.ts` | Real production build (`vite preview`) on **desktop** (1280×720) and **mobile** (Pixel 5) |
| Accessibility | axe-core in Playwright | `tests/e2e/a11y.spec.ts` | WCAG 2.1 A/AA: zero serious or critical violations on 5 screens × 2 themes, plus a keyboard-only journey |
| Authenticity (C2) | Manual, agent-assisted | `tests/reports/mvp-test-report.md` | Recipe amounts compared against the cited source page |

## 2. Environments

- **CI:** GitHub Actions on ubuntu-latest with Node 22 ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)). Every push and PR runs data validation, typecheck, unit tests with coverage (≥ 90% gate on `src/domain`), build, and e2e.
- **Browsers:** automated tests run on Chromium (desktop and mobile emulation). Firefox, Safari, iOS Safari and Android Chrome are covered by manual smoke testing before release (§6).
- **Deploy:** GitHub Pages, only after CI passes on `main` ([deploy.yml](../../.github/workflows/deploy.yml)).

## 3. Entry and exit criteria

**Entry:** BA acceptance criteria are frozen (H1), the library passes validation, and the preview build runs.

**Exit (H4 release sign-off):**
- [ ] 100% of BA acceptance criteria have at least one passing test (traceability below)
- [ ] The library matrix is 100% PASS on C1–C9 (C2 manual)
- [ ] The oracle and the engine have 0 differences
- [ ] 0 open P1/P2 defects
- [ ] axe reports 0 serious or critical violations, and the keyboard journey passes
- [ ] CI is green on `main` and the Pages deploy succeeds

## 4. Defect severity

| Sev | Definition | Example |
|-----|------------|---------|
| P1 | Wrong result or blocked journey | A primary result needs an ingredient the user doesn't have |
| P2 | Major function or a11y failure | Dialog can't be closed by keyboard; serious axe violation |
| P3 | Minor function or visual issue | Focus lands in the wrong place after closing; layout glitch at one width |
| P4 | Cosmetic | Copy typo; spacing |

## 5. Traceability (story → tests)

| Story | Unit / UI | E2E |
|-------|-----------|-----|
| US-E1-01 add chip | app.test (comma split) | input.spec (autocomplete), journey.spec |
| US-E1-02 remove chip | — | input.spec (Backspace arm/remove), fallback.spec (× remove) |
| US-E1-03 min 2 | match.test, app.test | input.spec, journey.spec (landing) |
| US-E1-04 max 10 | match.test | input.spec (11th rejected, 10 + ice + water) |
| US-E1-05 ice/water | normalize.test, match.test, app.test | input.spec |
| US-E1-06 soda water | normalize.test, library C7 | input.spec (4 synonyms) |
| US-E1-07 duplicates | app.test | input.spec |
| US-E2-01 synonyms | normalize.test, library C8 | journey.spec ("lime" → Lime Juice) |
| US-E2-02 typos | normalize.test, app.test | input.spec |
| US-E2-03 ambiguity | normalize.test, app.test | input.spec, a11y.spec |
| US-E2-04 unparseable / inert markup | normalize.test, app.test | input.spec (XSS probe) |
| US-E2-05 blocked search | app.test | input.spec |
| US-E3-01…07 matching | match.test (fixtures + seed), oracle, library C3–C7 | journey.spec, fallback.spec |
| US-E4-01 caps | match.test | fallback.spec |
| US-E4-02 ranking | match.test | journey.spec (Mojito first) |
| US-E4-03 card | — | journey.spec |
| US-E4-04 no near when matched | match.test | fallback.spec |
| US-E4-05 announced | — | a11y.spec (live region) |
| US-E5-01…03 detail | scale.test, app.test (formatAmount) | journey.spec, a11y.spec (keyboard) |
| US-E6-01…06 fallback | match.test | fallback.spec |
| US-NF-02 keyboard | — | a11y.spec |
| US-NF-03 performance | match.test (benchmark) | — |
| US-NF-04 URL state | — | journey.spec (reload, back) |
| US-NF-05 sources | library C1 | journey.spec (source link) |

## 6. Manual checks per release

1. Smoke test on Safari (macOS and iOS), Firefox and Android Chrome: search, open a recipe, near-match add.
2. Screen reader pass (NVDA on Windows, VoiceOver on iOS): chip errors announced, result count announced, dialog title read first.
3. Lighthouse mobile on the Pages URL: performance and accessibility both ≥ 90.
4. Re-run the C2 authenticity check on any new or changed recipes.
