# Library Content Plan — 500 Authentic Cocktails

Owner: BA Agent · Version 1.0 · 2026-10-21 · Implements BR-10 and BR-11

## 1. Delivery batches

| Batch | Size | Content | Gate |
|-------|------|---------|------|
| Seed (H1) | 50 | 48 IBA classics plus 2 Difford's highballs (Tom Collins, Gin Rickey). This seed is QA's verification sample. | Done 2026-10-21: validated, see `data/cocktails.json`. Skews vintage (44/6), so B3–B4 must lean modern to reach ~60/40. |
| B2 | +50 | Remaining IBA official list (~102 total) | |
| B3 | +200 | Well-documented classics from Difford's, PUNCH, Imbibe and classic bar books | |
| B4 | +200 | Modern classics (1980–today), each with a documented creator or bar | H1b = 500 total |

## 2. Target mix

| Dimension | Target |
|-----------|--------|
| Era | ~60% vintage (pre-1960) / ~40% modern |
| Family | Sours 25%, spirit-forward 20%, highballs/collins/fizzes 20%, sparkling 8%, tiki 8%, creamy/flip/dessert 7%, other 12% |
| Base spirit | No single base over 25% (gin and whiskey will lead) |
| Size | At least 15% of recipes with 2–3 counted ingredients, so small inputs still get results |
| Soda water | At least 30 recipes (needed for BR-03 tests) |

## 3. Approved sources (in priority order for recipes)

1. **IBA official cocktails** (iba-world.com): the default recipe and proportions.
2. **Difford's Guide** (diffordsguide.com): non-IBA recipes and history.
3. **PUNCH**, **Imbibe**, **Liquor.com**: history and modern classics.
4. **Classic bar books** (cited by title and edition): *The Savoy Cocktail Book*, *The PDT Cocktail Book*, *Death & Co*, Jerry Thomas's *Bar-Tender's Guide*.
5. **Wikipedia**: a secondary history source only, never the sole source.

When sources disagree on a recipe, use IBA first and record the variant in `researchNotes` during research.

## 4. Content guidelines for `history` and `tasteProfile`

- **Own words only.** No copied sentences from sources.
- **Verifiable only.** Every name, date and place must appear in a cited source. Contested origins use "attributed to" or "often credited to".
- **Length.** History is 1–2 paragraphs and taste is 1 paragraph, each 40–110 words.
- **Taste profile.** Cover balance (sweet/sour/bitter/strong), dominant flavours, texture, and when to drink it. Avoid empty adjectives ("delicious", "amazing").
- **Tone.** Warm, knowledgeable, concise, like a good bartender talking.
- No brand promotion beyond what's historically relevant (e.g. "Gosling's" in the Dark 'n' Stormy story).

## 5. Research & review workflow

1. Researcher fetches the recipe and history pages and drafts the record with `sources` and `researchNotes`.
2. Dictionary check: every ingredient ID resolves, or a new ID is proposed and added to `ingredients.json`.
3. `scripts/validate-data` passes (schema and cross-file rules).
4. Second-pass review of 10% of records: re-open the source URLs and confirm the amounts and facts.
5. Merge into `data/cocktails.json`. Raw research batches stay in `data/_research/` for traceability.
