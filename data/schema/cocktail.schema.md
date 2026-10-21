# Data Definition — Cocktail Library & Ingredient Dictionary

Owner: BA Agent (semantics) · Dev Agent (physical JSON Schema in `*.schema.json`)
Version 1.0 · 2026-10-21

Two flat JSON files ship to the browser:

| File | Content |
|------|---------|
| `data/ingredients.json` | Canonical ingredient dictionary, synonyms, ambiguity groups |
| `data/cocktails.json` | Cocktail library (seed: 50 recipes; target: 500) |

---

## 1. `ingredients.json`

```jsonc
{
  "version": "1.0.0",
  "ingredients": [ Ingredient, ... ],
  "ambiguityGroups": [ AmbiguityGroup, ... ],
  "descriptorStopWords": [ "fresh", "freshly", "squeezed", ... ]
}
```

### Ingredient

| Field | Type | Req. | Rule |
|-------|------|------|------|
| `id` | string | ✔ | kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`. Unique, stable, never reused. |
| `name` | string | ✔ | Canonical display name, following [naming-standard.md](../../docs/ba/naming-standard.md). Unique. |
| `category` | enum | ✔ | `spirit` · `liqueur` · `aperitif` · `vermouth-fortified` · `wine` · `citrus` · `juice` · `fruit` · `syrup-sweetener` · `bitters` · `mixer` · `dairy-egg` · `herb-spice` · `savory` · `excluded` |
| `classification` | enum | ✔ | `counted` or `excluded`. **Only `ice` and `water` are `excluded`** (BR-02). `soda-water` is `counted` (BR-03). |
| `synonyms` | string[] | ✔ | Lowercase, trimmed. A synonym may map to **one** ingredient only. Terms with several meanings go in `ambiguityGroups`. May be empty. |
| `provides` | string[] | – | IDs this ingredient also satisfies when present in the user's set (Q3 refinement: `lime` → `["lime-juice"]`). One level only, no chains. |
| `pairingWeight` | number 0–1 | ✔ | How common or easy it is as the *missing* near-match ingredient (BR-07). Guide: citrus juice and simple syrup are 0.9–1.0, mixers 0.8, common liqueurs 0.5, niche items 0.1–0.3. Excluded items are 0. |

### AmbiguityGroup

| Field | Type | Req. | Rule |
|-------|------|------|------|
| `term` | string | ✔ | Lowercase user term (e.g. `orange`). It must **not** also be a synonym of any ingredient. |
| `options` | string[] | ✔ | At least 2 ingredient IDs, in the order the UI presents them. |

### Normalisation contract (summary for Dev)
1. Lowercase the input, trim it, collapse whitespace and strip diacritics (`cachaça` → `cachaca`).
2. Exact match on `name` or `synonyms` gives `ok`.
3. Match on `ambiguityGroups.term` gives `ambiguous`.
4. Remove `descriptorStopWords` and retry steps 2–3.
5. Otherwise the result is `invalid`, with fuzzy suggestions. Never auto-accept a fuzzy match.
6. If the resolved ingredient has `classification: excluded`, the result is `excluded`.

---

## 2. `cocktails.json`

```jsonc
{ "version": "1.0.0", "cocktails": [ Cocktail, ... ] }
```

### Cocktail

| Field | Type | Req. | Rule |
|-------|------|------|------|
| `id` | string | ✔ | kebab-case, unique, ASCII. |
| `name` | string | ✔ | Common name as given by the primary recipe source. |
| `shortDescription` | string | ✔ | One line, 8–25 words, shown on the result card under the name. Summarises what the drink is (key ingredients, style, origin) using only facts already in the record and its sources. |
| `era` | enum | ✔ | `vintage` = created before 1960. `modern` = 1960 or later. If the year is unknown, use the IBA category (Unforgettables → vintage). |
| `yearCreated` | integer \| null | ✔ | Earliest documented year. `null` if unknown. Must be consistent with `era`. |
| `glass` | enum | ✔ | One of exactly 10: `Cocktail Glass` · `Coupe` · `Rocks Glass` · `Highball` · `Flute` · `Wine Glass` · `Copper Mug` · `Julep Cup` · `Hurricane Glass` · `Irish Coffee Glass`. Map source wording: martini → Cocktail Glass; old fashioned/double rocks → Rocks Glass; collins/tall tumbler/fizz → Highball; goblet → Wine Glass; champagne flute → Flute. Note any serving alternative in `instructions`. |
| `method` | enum | ✔ | `shake` · `stir` · `build` · `blend` · `throw` · `swizzle` · `muddle-build` |
| `ingredients` | RecipeIngredient[] | ✔ | At least 2 counted, non-optional entries. Order follows the source recipe. |
| `garnish` | string \| null | ✔ | Free text. **Never used for matching** (Q2). |
| `instructions` | string[] | ✔ | 1–8 imperative steps. |
| `history` | string | ✔ | 1–2 paragraphs, separated by `\n\n`. Each paragraph is 40–110 words, written in the BA's own words, with every fact backed by a `sources` entry of type `history`. |
| `tasteProfile` | string | ✔ | Exactly 1 paragraph of 40–110 words. Together with `history` that's 2–3 paragraphs (BR-09). |
| `tags` | string[] | ✔ | Lowercase. Drawn from: `sour` `highball` `spirit-forward` `fizz` `collins` `tiki` `sparkling` `creamy` `coffee` `hot` `bitter` `herbal` `fruity` `citrus` `savory` `classic` `contemporary` `iba` `aperitif` `after-dinner` `low-abv` `refreshing` `floral` `spicy` `sweet` `dry` `smoky` `brunch` `frozen` `tropical` `foamy` `strong`. Don't repeat base spirits or ingredients as tags, since matching already covers them. |
| `popularity` | integer 0–100 | ✔ | BA editorial estimate, used only as a ranking tiebreaker. 90+ = global icon, 60–89 = well-known classic, under 60 = niche. |
| `sources` | Source[] | ✔ | At least 1 `recipe` source and at least 1 `history` source (BR-11). |

### RecipeIngredient

| Field | Type | Req. | Rule |
|-------|------|------|------|
| `id` | string | ✔ | Must exist in `ingredients.json`. |
| `amount` | number \| null | ✔ | Greater than 0. `null` only for units `top`, `splash` and `null`, or when the source gives no quantity ("a few dashes"), in which case `note` must say so. |
| `unit` | enum \| null | ✔ | `ml` · `dash` · `drop` · `barspoon` · `piece` · `leaf` · `sprig` · `pinch` · `top` · `splash` · `null` (`null` is for ice). Convert cl and oz to ml (1 cl = 10 ml, 1 oz = 30 ml). |
| `optional` | boolean | ✔ | `true` means it never blocks a match (Q2). |
| `note` | string \| null | – | Short qualifier shown in the UI, e.g. `"blanco"`, `"Islay, floated"`. |

### Source

| Field | Type | Req. | Rule |
|-------|------|------|------|
| `type` | enum | ✔ | `recipe` or `history` |
| `publisher` | string | ✔ | e.g. `IBA`, `Difford's Guide`, `PUNCH`. |
| `title` | string | ✔ | |
| `url` | string | ✔ | `https://` URL that was fetched during research. |
| `accessed` | date | ✔ | ISO `YYYY-MM-DD`. |

---

## 3. Derived matching fields (computed by Dev, not authored)

- **`req(recipe)`:** the set of IDs of `ingredients` where `optional == false` and `classification == counted`. Water and ice are dropped.
- **`expand(U)`:** the user's set U plus every ID in `provides` of each ingredient in U.
- **Primary match:** `req ⊆ expand(U)`.
- **Near match:** `|req \ expand(U)| == 1` and `|req ∩ expand(U)| ≥ 1`.

## 4. Cross-file validation rules (CI must fail on any)

1. Every `RecipeIngredient.id` resolves in the dictionary.
2. No synonym or name maps to 2 ingredients. No ambiguity term is also a synonym.
3. Every ID referenced in `provides` and `ambiguityGroups.options` exists.
4. Exactly two `excluded` ingredients: `ice` and `water`.
5. Every cocktail has at least 2 counted, non-optional ingredients.
6. `history` is 1–2 paragraphs and `tasteProfile` is 1 paragraph.
7. Every cocktail has at least 1 `recipe` source and at least 1 `history` source.
8. No duplicate cocktail `id` or `name`.
9. Every dictionary ingredient is used by at least 1 recipe *(warning only, so the dictionary can run ahead of the library)*.
