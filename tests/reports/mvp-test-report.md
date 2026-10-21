# MVP Test Report — Cocktail Discovery

QA Agent · 2026-10-21 · Build `9eede8b` · Strategy: [test-strategy.md](../plan/test-strategy.md)

## Summary

| Suite | Result |
|-------|--------|
| Data validation (`validate:data`) | ✅ PASS: 50 cocktails, 94 ingredients |
| Engine unit tests (normaliser, matcher, scaling, oracle, benchmark) | ✅ 111 / 111 |
| UI integration tests (Testing Library) | ✅ 20 / 20 |
| Library verification C1, C3–C9 (50 recipes × 8 checks) | ✅ 400 / 400 (51 N/A where a check doesn't apply) |
| Library authenticity C2 (manual, against sources) | ✅ 50 PASS · 0 FAIL · 0 BLOCKED |
| E2E Playwright: desktop + mobile | ✅ 83 passed · 1 skipped (keyboard journey is desktop-only) |
| Accessibility: axe WCAG 2.1 AA, 5 screens × 2 themes × 2 viewports | ✅ 0 serious or critical violations |
| Coverage `src/domain` | 100% lines · 98.7% branches (gate is 90%) |
| CI on GitHub (`main`) | ✅ [run 39589443207](https://github.com/quentinmilavec-sutrix/coktail/actions/runs/39589443207) |

**Recommendation: GO for MVP preview**, with the open items below. They aren't release blockers.

## Library verification

- Automated matrix: [tests/library/verification-matrix.csv](../library/verification-matrix.csv). Regenerate it with `WRITE_MATRIX=1 npm run test:library`.
- Authenticity (C2): [tests/library/c2-authenticity.csv](../library/c2-authenticity.csv).
  - All 51 recipe source URLs load and show the correct cocktail (47 IBA, 4 Difford's).
  - Every ingredient and amount is within ±10% of its source.
  - No record has an extra ingredient.
- The oracle and the engine have 0 differences across 1,000 seeded random inputs.

## Defects found and fixed during QA

| # | Sev | Defect | Fix |
|---|-----|--------|-----|
| D1 | P2 | The ambiguity chip's accessible name didn't include its visible "Choose" text (axe `label-content-name-mismatch`) | Name is now built from the visible text plus SR-only text |
| D2 | P2 | The ambiguity chooser nested buttons inside `role="option"` (axe `nested-interactive`) | Changed to a labelled group of buttons |
| D3 | P3 | Focus didn't return to the card after closing the recipe dialog | Focus is restored after the dialog unmounts (found in the UI build, covered by e2e) |
| D4 | P3 | The page didn't scroll to the results after a search | Scroll is deferred one frame (covered by e2e focus assertions) |

There are no open P1 or P2 defects.

## Observations for the BA (data, not defects)

1. **Kir:** the record follows IBA (90 ml wine, 10 ml cassis). Its second cited source, Difford's "Kir Apéritif", uses a different ratio. Keep only IBA as the `recipe` source, or re-tag the Difford's link as `history`.
2. **Mai Tai:** IBA's two rums (30 ml amber Jamaican + 30 ml Martinique molasses) are merged into one `aged-rum` 60 ml line with a note. The total is correct, but the detail view loses the split. Consider allowing the same ID twice, or adding a `rhum-agricole` line.
3. **Teaspoons stored as `barspoon`:** this affects Bee's Knees, Caipirinha and Mint Julep. They're close enough for home use. A `teaspoon` unit is an option.
4. **Glass mappings where the source is vague:** Mojito → Highball (IBA names no glass), Piña Colada → Hurricane ("large glass"), Whiskey Sour → Rocks, Pisco Sour → Wine Glass.

## Not covered yet

- Manual smoke tests on Firefox, Safari, iOS Safari and Android Chrome (strategy §6). Automated runs use Chromium only.
- Screen-reader passes with NVDA and VoiceOver.
- Lighthouse on the deployed Pages URL (waiting for the first deploy).
- UI parts the design specifies but that aren't built yet: the mobile bottom-sheet chooser, the sticky mobile CTA and the card stagger animation. See [architecture.md](../../docs/dev/architecture.md).
