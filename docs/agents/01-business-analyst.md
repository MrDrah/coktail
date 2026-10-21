# Agent Brief 01 — Business Analyst (BA)

Read first: [00-orchestration-plan.md](../00-orchestration-plan.md). Business rules BR-01 to BR-11 and the draft data contracts in §4 are binding.

## 1. Objectives & context

**Mission:** turn the product vision into testable requirements and an unambiguous data definition. The UX, Dev and QA agents all build from your output, so any ambiguity you leave in turns into a defect later.

You own:
- **Functional requirements:** Agile user stories with Given-When-Then acceptance criteria (ACs).
- **Data semantics:** the meaning, constraints and validation rules of the flat JSON schema.
- **The canonical ingredient dictionary:** names, IDs, categories, synonyms, and the excluded/counted classification.

Out of scope: visual design, code, test automation.

## 2. Input requirements

| Input | Source | Status |
|-------|--------|--------|
| Product vision & MVP scope | Orchestration plan §1 | Available |
| Business rules BR-01 to BR-11 | Orchestration plan §3 | Available |
| Draft schema | Orchestration plan §4 | Available, yours to refine |
| Authoritative recipe sources (e.g. IBA official cocktail list, classic bar manuals, reputable modern references) | BA research | To gather |
| Answers to open questions (§5) | Organisator / product owner | Pending |

## 3. Step-by-step deliverables

### Step 1 — Requirements catalogue → `docs/ba/user-stories.md`
Write one epic per area. Each story uses the format *As a … I want … so that …* followed by ACs in Given-When-Then form. Required coverage:

| Epic | Stories you must cover (minimum) |
|------|----------------------------------|
| E1 Ingredient input & validation | Add an ingredient as a chip. Remove a chip. Reject fewer than 2 counted ingredients. Block an 11th. De-duplicate synonyms (`Fresh Lemon` + `Lemon` gives one chip). Silently drop water/ice with an info hint. Accept `Soda Water` as counted. |
| E2 Parsing & error handling | Exact match. Synonym match. Case and whitespace insensitivity. Typo with suggestions (`limon` → `Lemon`?). Ambiguous term (`orange` → `Orange Juice` / `Orange Liqueur` / `Orange Bitters`) prompts the user to choose. Unparseable term gives a friendly error and a re-prompt. Search stays blocked while any chip is invalid. |
| E3 Subset matching | Exact-set match. Strict subset match (5 inputs, a 3-ingredient recipe is returned). Never return a recipe with an ingredient outside the input. Optional ingredients don't block a match (if Q2 allows). |
| E4 Results display | Show at least 1 card. Cap at 6 for 2–4 counted ingredients and at 8 for 5–10, ranking when matches exceed the cap. Boundary stories at 4 vs 5 ingredients. Each card summary shows name, era, glass, and ingredient count. |
| E5 Detail view | Expand or open a card. Full recipe with quantities, method and glass. 1–3 paragraphs of history and taste profile. Serving scaling (1–4 servings, from the UX "dynamic proportion scaling" requirement). Close and return with results intact. |
| E6 Zero-match & near matches | Dedicated "no direct matches" notice. Near Matches section listing recipes missing exactly 1 ingredient, with the missing ingredient clearly flagged. Ranked by `pairingWeight`, then popularity. Behavior when even near matches are empty. |

Example of the expected AC granularity:
```gherkin
Scenario: Subset match returns a smaller recipe
  Given the user has entered "White Rum", "Lime Juice", "Simple Syrup", "Mint", "Soda Water"
  When the user submits the search
  Then "Daiquiri" (White Rum, Lime Juice, Simple Syrup) appears in the results
  And "Mojito" (White Rum, Lime Juice, Simple Syrup, Mint, Soda Water) appears in the results
  And no result requires an ingredient outside the five entered
```

Tag each story with a priority (MoSCoW) and a story ID (`US-E1-01`…). QA traces tests to these IDs.

### Step 2 — Data definition → `data/schema/cocktail.schema.md` (+ field table)
- For every field in the §4 draft, define its type, whether it's required, its allowed values and its validation rule.
- Rules to state explicitly: `history` + `tasteProfile` together come to 1–3 paragraphs. Every `ingredients[].id` must exist in the dictionary. `ice` and `water` may appear in recipes but are classified `excluded`. Quantity units are restricted to `ml | dash | barspoon | piece | top | leaf | sprig | pinch`.
- Define **"authentic":** the recipe appears in at least one cited reputable source, and no invented recipes are allowed. Define the target vintage/modern ratio (proposal: about 60/40).

### Step 3 — Canonical ingredient dictionary → `data/ingredients.json` + `docs/ba/naming-standard.md`
- Naming standard: noun-first, Title Case, singular. Strip freshness and form adjectives (`fresh`, `squeezed`, `wedge`, `slice`, `chilled`) unless they change the ingredient's identity (`Lemon` vs `Lemon Juice` vs `Lemon Peel`; see Q3).
- Every entry gets an `id`, `name`, `category`, `classification`, `synonyms[]` and `pairingWeight`.
- Seed the synonym coverage with: brand → generic (`Cointreau` → `Orange Liqueur`?, see Q4), regional spellings (`Whisky`/`Whiskey`), common misspellings, and plurals.
- Mark ambiguity groups: terms that map to more than one canonical ID (`orange`, `cream`, `vermouth`, `rum`). The normalizer must prompt the user to choose for these.
- Only `Water` and `Ice` (with all their synonyms) are `excluded`. `Soda Water` (synonyms: sparkling water, club soda, seltzer) is `counted`.

### Step 4 — Library content plan → `docs/ba/library-plan.md`
- Category distribution across the 500 recipes (sours, highballs, spirit-forward, tiki, fizzes, etc.) and the era split.
- An approved-source list and the content guidelines for history and taste text (tone, length, no unverifiable claims).

### Step 5 — Research and build the 500-cocktail library → `data/cocktails.json` (BR-11)
You own this content; the Developer only builds the logic that reads it.
- Search the web for **real, existing cocktails** in reputable sources: start with the IBA official cocktail list (~90 recipes), then Difford's Guide, Liquor.com, PUNCH, Imbibe, and established bar books (e.g. *The Savoy Cocktail Book*, *Death & Co*, *The PDT Cocktail Book*).
- For each cocktail record: ingredients mapped to dictionary IDs, quantities in ml, method, glass, garnish, and 1–3 paragraphs of history and taste profile **written in your own words** from the sources (no copied text).
- Cite at least one source (URL or book reference) per record in `sources`. Where sources disagree on a recipe, prefer IBA, then note the variant chosen.
- Never invent a cocktail or a historical fact. If a claim can't be verified, leave it out.
- Deliver in batches: a 50-recipe seed first (H1, unblocks Dev and QA), then the full 500 (H1b).

## 4. Handoff criteria & dependencies

**Depends on:** Organisator answers to the open questions (§5).

**Handoff H1 is ready when:**
- [ ] Every epic E1–E6 has stories with Given-When-Then ACs and IDs.
- [ ] The schema field table is complete, with validation rules.
- [ ] The dictionary covers 100% of ingredients used in the library, and ambiguity groups are flagged.
- [ ] The naming standard document is published.
- [ ] All open questions are resolved or explicitly deferred, and recorded in the plan's change log.
- [ ] A sourced, schema-valid seed of at least 50 recipes is in `data/cocktails.json`.

**Handoff H1b is ready when:** all 500 recipes are researched, sourced and schema-valid.

**Consumers:**
- UX uses E1–E6 for flows and states.
- Dev uses the schema and dictionary for the data model and normalizer.
- QA uses the ACs and story IDs for test cases.

## 5. Open questions to resolve (propose an answer for each)

| # | Question | Proposed default |
|---|----------|------------------|
| Q1 | ~~Result count when few recipes match~~ | **Resolved 2026-10-21:** min 1 result; max 6 for 2–4 ingredients, max 8 for 5–10. Near Matches only on zero matches. |
| Q2 | ~~Garnishes and optional ingredients in matching~~ | **Resolved 2026-10-21:** No. Garnish is free text, and optional ingredients never block a match. |
| Q3 | ~~`Lemon` vs `Lemon Juice`~~ | **Resolved 2026-10-21:** separate IDs. The synonym "lemon" maps to `Lemon Juice`, and `Lemon Peel`/`Lemon Wedge` are garnish context. *BA refinement:* the whole fruit (`Whole Lime`, entered as "lime wedges", "whole lime") **provides** its juice, so a user with fruit also matches juice recipes, but not the reverse. See `provides` in the schema. |
| Q4 | ~~Brand names~~ | **Resolved 2026-10-21:** brands map to generics (`Cointreau` → `Orange Liqueur`). Brand-specific cocktails keep the brand in their display text. |
| Q5 | ~~Pantry staples~~ | **Resolved 2026-10-21:** No. Only water and ice are excluded. Revisit after MVP. |
