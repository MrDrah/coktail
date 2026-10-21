# Cocktail Research Brief (for BA research agents)

Owner: BA Agent · v1.1 · 2026-10-21 · Implements BR-11. Read with [cocktail.schema.md](../../data/schema/cocktail.schema.md) and [naming-standard.md](naming-standard.md).

## Golden rules

1. **Real cocktails only.** Research only the candidates you're assigned in `data/_research/candidates.json`. Never invent a cocktail, an amount or a historical fact.
2. **Every fact has a fetched source.** Recipes come from the candidate URL (IBA or Difford's Guide). History comes from Difford's "history"/"story" text on the same page, or PUNCH, Imbibe or Wikipedia (Wikipedia only as a secondary source). Record every URL you used.
3. **Own words.** `shortDescription`, `history` and `tasteProfile` must be written fresh, never copied. Where sources disagree, write "attributed to" or "often credited to". Leave out anything you can't verify.
4. **Check the page title, not just HTTP 200.** Difford's returns 200 with a *different* drink when the ID and slug don't match. It also rate-limits with empty HTTP 202 responses, so fetch slowly and one at a time (`curl -s -A "Mozilla/5.0"`, about 3 s between requests), and retry after a pause on 202.
5. **Skip, don't guess.** If a candidate can't be researched properly (wrong page, no usable recipe, needs a house-made ingredient), skip it and take the next one from your reserve range.

## Record format

Each record matches the existing records in `data/_research/batch-a.json`. Required fields:

`id, name, shortDescription, era, yearCreated, glass, method, ingredients[], garnish, instructions[], history, tasteProfile, tags[], popularity, sources[], researchNotes`

| Field | Rule |
|-------|------|
| `id` | kebab-case ASCII of the name (`pina-colada`). Must not clash with an existing id. |
| `shortDescription` | One line, **8–25 words**: what the drink is (key ingredients, style, origin). |
| `era` / `yearCreated` | `vintage` before 1960, else `modern`. Year is the earliest documented year, or `null`. Era must agree with the year. |
| `glass` | **Exactly one of:** `Cocktail Glass`, `Coupe`, `Rocks Glass`, `Highball`, `Flute`, `Wine Glass`, `Copper Mug`, `Julep Cup`, `Hurricane Glass`, `Irish Coffee Glass`. Martini → Cocktail Glass; old fashioned → Rocks Glass; collins/sling/fizz → Highball; goblet/snifter → Wine Glass; tiki mug → Hurricane Glass. |
| `method` | `shake` · `stir` · `build` · `blend` · `throw` · `swizzle` · `muddle-build` |
| `ingredients[]` | `{ id, amount, unit, optional, note }`. Drink contents only, not garnish. Include `ice` when the drink is made or served with ice and `water` when the recipe calls for plain water. Units: `ml` · `dash` · `drop` · `barspoon` · `piece` · `leaf` · `sprig` · `pinch` · `top` · `splash` · `null`. Convert to ml (1 cl = 10 ml, 1 oz = 30 ml; Difford's ml figures can be used as-is). `amount: null` only with unit `top`/`splash`/`null`, or with a `note` such as "a few dashes". Don't repeat the same id within one recipe: merge the lines and explain in `note`. |
| `history` | 1–2 paragraphs separated by `\n\n`, each 40–110 words. |
| `tasteProfile` | Exactly 1 paragraph, 40–110 words: balance, dominant flavours, texture, when to drink it. |
| `tags` | Only from: `sour highball spirit-forward fizz collins tiki sparkling creamy coffee hot bitter herbal fruity citrus savory classic contemporary iba aperitif after-dinner low-abv refreshing floral spicy sweet dry smoky brunch frozen tropical foamy strong`. Don't use spirit names as tags. |
| `popularity` | 0–100 editorial estimate (90+ global icon; 60–89 well-known classic; below 60 niche). Use Difford's star rating and how many lists the drink appears on as a guide. |
| `sources[]` | `{ type: "recipe"|"history", publisher, title, url, accessed: "2026-10-21" }`. At least 1 of each type. |

## Ingredient IDs (dictionary v1.1)

Use **only** IDs from `data/ingredients.json`, which also lists names and synonyms for mapping source wording. Key rules:

- **Brands map to generics:** Cointreau and triple sec → `orange-liqueur`; Chambord → `raspberry-liqueur`; Kahlúa → `coffee-liqueur`; Baileys → `irish-cream`; Pernod → `pastis`.
- **Wine:** use the specific wine the source names (`champagne`, `prosecco`, `red-wine`, `dry-white-wine`, `rose-wine`). Use `sparkling-wine` only when the source says generic sparkling wine, cava or crémant.
- **Fruit vs juice:** muddled or whole fruit → `lime` / `lemon` / `orange-fruit` / `raspberry` etc.; squeezed juice → `lime-juice` etc.
- **Sugar vs syrup:** granulated or cube → `sugar`; syrup → `simple-syrup` / `demerara-syrup` / `honey-syrup`. Gomme counts as simple syrup.
- **Garnish-only items** (cherry, citrus twist, nutmeg dusting) go in `garnish`, never in `ingredients`.
- **No fitting ID?** Use the closest generic one and explain in `note` (e.g. `amaro` with note "Amaro Nonino"). Only if nothing fits, propose a new kebab-case ID and list it in your final report with name, category and synonyms.

## Self-check before reporting

```bash
node scripts/validate-data.mjs data/_research/<your-file>.json
```

Fix every error except `unknown ingredient` for IDs you propose (list those in your report). Warnings about paragraph length must also be fixed.
