# Ingredient Naming Standard

Owner: BA Agent · Version 1.0 · 2026-10-21 · Implements BR-04, Q3 and Q4

## Canonical name rules

| # | Rule | ✔ Canonical | ✘ Not canonical |
|---|------|-------------|-----------------|
| N1 | **Base noun first.** Strip freshness, preparation and form adjectives. | `Lemon Juice` | `Fresh Lemon Juice`, `Freshly Squeezed Lemon Juice` |
| N2 | **Title Case, singular.** | `Egg White`, `Mint` | `egg whites`, `Mint Leaves` |
| N3 | **Generic over brand** (Q4). Brands become synonyms. | `Orange Liqueur` | `Cointreau`, `Triple Sec`, `Grand Marnier` |
| N4 | **Keep words that change identity.** | `Whole Lemon` ≠ `Lemon Juice` ≠ `Lemon Peel`. `Dry Vermouth` ≠ `Sweet Vermouth`. `White Rum` ≠ `Dark Rum` | — |
| N5 | **Style qualifiers only when they change matching.** A finer style goes in `RecipeIngredient.note`. | `Tequila` (note: "blanco") | `Blanco Tequila` |
| N6 | **ASCII ID, native name.** | id `cachaca`, name `Cachaça` | — |
| N7 | **One sparkling wine.** Champagne, prosecco and cava are synonyms of `Sparkling Wine`, because at home they're interchangeable for matching. | `Sparkling Wine` | `Champagne` |
| N8 | **Plain water and ice are excluded** (BR-02). Sparkling water is canonical `Soda Water` and counted (BR-03). | `Soda Water` | `Sparkling Water`, `Club Soda` |

## Descriptor stop-words

The normaliser strips these before retrying a lookup. They never change identity.

`fresh`, `freshly`, `squeezed`, `chilled`, `cold`, `good`, `quality`, `premium`, `homemade`, `home-made`, `organic`, `some`, `a`, `an`, `of`, `bottle`, `splash`, `dash`, `wedge`, `wedges`, `slice`, `slices`, `wheel`, `wheels`, `chunk`, `chunks`, `cubes`, `leaves`, `sprig`, `sprigs`

> `wedge` and `slice` are stop-words for retrying, but **"lime wedges" and "lemon wedges" are explicit synonyms of the whole fruit**. The exact-match step runs first, so the user gets `Whole Lime` (which provides `Lime Juice`), not `Lime Juice`.

## Whole fruit vs juice (Q3 refinement)

| User types | Resolves to | Also satisfies |
|------------|-------------|----------------|
| `lemon`, `lemon juice`, `fresh lemon` | `Lemon Juice` | — |
| `whole lemon`, `lemons`, `lemon wedges` | `Whole Lemon` | `Lemon Juice` |
| `lime`, `lime juice`, `fresh lime` | `Lime Juice` | — |
| `whole lime`, `limes`, `lime wedges` | `Whole Lime` | `Lime Juice` |

## Ambiguity groups

When the user types one of these terms, the UI asks them to pick a meaning (BR-08). The authoritative list is in `data/ingredients.json` → `ambiguityGroups`.

| Term | Options |
|------|---------|
| orange | Orange Juice · Orange Liqueur · Orange Bitters |
| vermouth | Sweet Vermouth · Dry Vermouth |
| rum | White Rum · Aged Rum · Dark Rum |
| whiskey / whisky | Bourbon · Rye Whiskey · Scotch Whisky · Irish Whiskey |
| bitters | Angostura Bitters · Orange Bitters · Peychaud's Bitters |
| syrup | Simple Syrup · Honey Syrup · Grenadine · Orgeat |
| wine | Sparkling Wine · Dry White Wine |
| ginger | Ginger Beer · Ginger Ale · Ginger Syrup |
| chartreuse | Green Chartreuse · Yellow Chartreuse |

`cream` and `coffee` are **not** ambiguity terms, because each is the exact canonical name of an ingredient (`Cream`, `Coffee`). The validator forbids a term that is both a name and an ambiguity term. Autocomplete still surfaces `Coconut Cream`, `Espresso` and `Coffee Liqueur` while the user types.

> **Why "Whole Lemon" / "Whole Lime":** per Q3, the bare word "lemon" means `Lemon Juice`, so the fruit can't also be named `Lemon` (one term maps to one ingredient). The fruit's canonical name carries the `Whole` qualifier (rule N4).
