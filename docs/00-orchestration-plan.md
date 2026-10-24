# Orchestration Plan — Cocktail Discovery Web App (MVP)

Owner: AI Organisator Agent
Status: v1.0 — ready for agent dispatch
Date: 2026-10-21

## 1. Product summary

Users enter **2–10 ingredients** they have on hand. The app returns **at least 1 and at most 6 or 8 authentic cocktails** (6 for 2–4 ingredients, 8 for 5–10) (vintage or modern) that can be made from those ingredients **or a subset of them**. Each result is a clickable card; expanding it shows the full recipe plus 1–3 paragraphs of history and taste profile. If nothing matches, a fallback view explains that and offers **Near Matches** that need exactly one extra ingredient.

There's no login. The cocktail library (300 recipes) ships to the browser as **flat JSON**, and all search runs client-side.

## 2. Agent roster and briefs

| # | Agent | Brief | Primary output |
|---|-------|-------|----------------|
| 1 | Business Analyst (BA) | [agents/01-business-analyst.md](agents/01-business-analyst.md) | User stories with acceptance criteria, data schema, canonical ingredient dictionary |
| 2 | UX/UI Designer | [agents/02-ux-ui-designer.md](agents/02-ux-ui-designer.md) | Design tokens, component specs, screen flows |
| 3 | Developer & Solution Architect | [agents/03-developer-architect.md](agents/03-developer-architect.md) | Architecture, normalizer, matching engine, UI implementation |
| 4 | QA Engineer | [agents/04-qa-engineer.md](agents/04-qa-engineer.md) | Test strategy, 50-recipe verification matrix, automated tests, sign-off report |

## 3. Shared business rules

Every agent must use these rules. Only the Organisator can change them, and any change gets logged in §7.

| ID | Rule |
|----|------|
| **BR-01** | Input must contain **2–10 counted ingredients**, after normalization and de-duplication. |
| **BR-02** | **Plain/tap water** and **standard ice** (cubed, crushed, "ice") are *excluded*: they're silently dropped and never count toward the limit. A recipe that uses them never requires the user to enter them. |
| **BR-03** | **Sparkling water / soda water / club soda** is a *valid, counted* ingredient. Canonical name: `Soda Water`. |
| **BR-04** | Canonical names are **noun-first, Title Case, no adjectives of freshness or form**: `Lemon` not `Fresh Lemon`, `Lemon Juice` stays distinct from `Lemon` only if the BA dictionary says so (see BA open question Q3). |
| **BR-05** | **Positive matching:** a recipe is a primary result only if `requiredIngredients(recipe) ⊆ userIngredients`. A primary result never needs anything outside the user's list. |
| **BR-06** | Primary results show **at least 1 card**. The maximum depends on how many counted ingredients the user entered: **2–4 ingredients → max 6 results**, **5–10 ingredients → max 8 results**. If there are more matches than the cap, rank them and show the top N. If there is at least 1 match, show only the matches; Near Matches appear only on zero matches (BR-07). |
| **BR-07** | **Zero match:** show the dedicated fallback notice plus a **Near Matches** list. A near match is a recipe where `|required \ user| = 1`. Rank near matches by how common the missing ingredient is as a pairing (e.g. citrus juice with a base spirit). |
| **BR-08** | **Ambiguous or unparseable input** never fails silently. Show a friendly inline error on that specific chip, with "Did you mean…" suggestions when there are any. Searching is blocked until it's fixed or removed. |
| **BR-09** | Each detail view shows the full recipe (ingredients, quantities, method, glass, garnish) plus **1–3 paragraphs** of history and taste profile. |
| **BR-10** | Data source: one static, client-side flat JSON file holding **300 authentic cocktails** for the MVP (revised from 500 on 2026-10-21). No backend and no AI/LLM at runtime: the app is deterministic matching logic over static data. |
| **BR-11** | **The BA researches and builds the cocktail library.** Every recipe, history and taste note comes from real cocktails found online in reputable sources (e.g. IBA official list, Difford's Guide, established bar books and publications), with each source cited in the record. Nothing is invented or AI-generated. The Developer builds the logic, not the content. |

## 4. Shared data contracts

The BA owns the semantics and the Developer owns the physical format. Both sign off on the final version in `data/schema/`. Draft starting point:

```jsonc
// data/ingredients.json — canonical dictionary
{
  "version": "1.0.0",
  "ingredients": [
    {
      "id": "lemon-juice",            // kebab-case, stable, never reused
      "name": "Lemon Juice",          // canonical display name (BR-04)
      "category": "citrus",           // spirit | liqueur | wine-fortified | citrus | juice | syrup-sweetener | bitters | mixer | dairy-egg | herb-spice | fruit | other
      "classification": "counted",    // counted | excluded (water/ice only)
      "synonyms": ["fresh lemon juice", "juice of a lemon", "lemon"],
      "pairingWeight": 0.9            // 0–1, how common/easy it is as the missing near-match ingredient
    }
  ]
}

// data/cocktails.json — flat library of 300 records
{
  "version": "1.0.0",
  "cocktails": [
    {
      "id": "daiquiri",
      "name": "Daiquiri",
      "era": "vintage",               // vintage | modern
      "yearCreated": 1898,            // nullable
      "glass": "Coupe",
      "method": "shake",              // shake | stir | build | blend | throw | swizzle
      "ingredients": [
        { "id": "white-rum",   "amount": 60, "unit": "ml", "optional": false },
        { "id": "lime-juice",  "amount": 30, "unit": "ml", "optional": false },
        { "id": "simple-syrup","amount": 15, "unit": "ml", "optional": false },
        { "id": "ice",         "amount": null, "unit": null, "optional": false }
      ],
      "garnish": "Lime wheel",        // free text, never part of matching (see BA Q2)
      "instructions": ["Shake all ingredients with ice.", "Fine-strain into a chilled coupe."],
      "history": "…",                 // 1–3 paragraphs total across history + tasteProfile
      "tasteProfile": "…",
      "tags": ["sour", "citrus", "classic"],
      "popularity": 95,               // 0–100, ranking tiebreaker
      "sources": ["…"]                // provenance for authenticity checks
    }
  ]
}
```

## 5. Phases, dependencies and handoffs

```
Phase 0  Kick-off (Organisator) ── this plan
            │
Phase 1  BA: stories + schema + dictionary + library research (300, sourced) ──┐
            │ (stories ready)                                │ (schema draft)
Phase 2  UX: tokens, components, flows ◄────────── Dev: architecture + data pipeline + normalizer/matcher
            │ (design specs)                                 │
Phase 3  Dev: UI build ◄─────────────────────────────────────┘
            │                       QA: test plan + 50-recipe matrix (starts once BA's ACs are frozen)
Phase 4  QA: integration + library verification ─► defects ─► Dev fixes ─► QA regression
            │
Phase 5  Organisator: release gate review → MVP ready
```

| Handoff | From → To | Gate (must be true before the handoff) |
|---------|-----------|----------------------------------------|
| H1 | BA → UX, Dev, QA | Every story has Given-When-Then ACs. Schema v1 and the ingredient dictionary (≥ every ingredient used by the library) are published. Open questions are resolved or explicitly deferred. A sourced seed of at least 50 recipes is available. |
| H1b | BA → Dev, QA | Full library of 300 researched recipes, each with at least one reputable source URL/reference, passes schema validation. Required before H3. |
| H2 | UX → Dev | Tokens exported as CSS variables/JSON. Every component has its states specified (default, hover, focus, error, loading, empty). Mobile and desktop layouts are covered. WCAG AA contrast is verified. |
| H3 | Dev → QA | Matching engine and normalizer have ≥ 90% unit test coverage. Full journey is deployable on a preview URL. Library passes schema validation. |
| H4 | QA → Organisator | All P1/P2 defects are closed. 50-recipe matrix is 100% pass. Test report is published. |

## 6. Definition of Done (MVP)

- [ ] All BA user stories meet their acceptance criteria (verified by QA).
- [ ] `cocktails.json` holds 300 schema-valid records, every ingredient ID resolves in `ingredients.json`, and every record has sources.
- [ ] Matching satisfies BR-05/06/07 on the QA 50-recipe sample with zero false positives.
- [ ] Water/ice exclusion and soda water inclusion are verified (BR-02/03).
- [ ] Invalid and ambiguous inputs produce chip-level errors (BR-08).
- [ ] UI matches the UX spec, passes WCAG 2.1 AA (contrast, keyboard, screen reader labels), and works at 360px wide and at desktop width.
- [ ] Static build deploys with no server and loads in under 2.5s on a mid-tier mobile device on 4G.

## 7. Decision & change log

| Date | Decision | By |
|------|----------|----|
| 2026-10-21 | Plan v1.0 issued. | Organisator |
| 2026-10-21 | BR-06 changed: min 1 result; max 6 for 2–4 ingredients, max 8 for 5–10. Near Matches only on zero matches. Resolves BA Q1. | Product owner |
| 2026-10-21 | "AI-powered" dropped from the MVP. BR-11 added: BA researches the 500 cocktails online from reputable sources; Dev builds the logic only. | Product owner |
| 2026-10-21 | Ambiguous input handling (choose-a-meaning step for terms like "orange"; "Did you mean…" for typos) approved. | Product owner |
| 2026-10-21 | BA Q2–Q5 accepted with proposed defaults (garnish/optional never block; Lemon ≠ Lemon Juice; brands → generics; only water/ice excluded). | Product owner |
| 2026-10-21 | UX Q1–Q6 resolved: glass normalised to 10 canonical types; card shows name + new `shortDescription` + taste profile; ice/water shown as "Assumed" rows; "+ Add" hidden at 10 ingredients, back at 9; best-addition tip approved (US-E6-06); servings default 1 with −/+ buttons, ml only. | Product owner |
| 2026-10-21 | Library target set to **300** (50 seed + 250). Ingredient dictionary v1.1: red/rosé wine, Champagne and Prosecco separate from generic Sparkling Wine (specific `provides` generic), sherry styles, pastis ≠ absinthe, genever ≠ gin, fruit ≠ syrup, +60 liqueurs/mixers/syrups for new recipes. | Product owner |
| 2026-10-21 | Library reaches **300** (batches C–G). Dictionary v1.2: +14 ingredients proposed by research (advocaat, apple/ginger/passion-fruit/southern liqueur, oloroso sherry, sugar cane juice, banana, grape, olive brine, orange marmalade, raspberry jam, clove, coriander); oloroso added to the "sherry" chooser, ginger liqueur to "ginger". Vague synonyms "brine" and "orange jam" rejected. Morgenthaler's Amaretto Sour kept as a separate record (`amaretto-sour-morgenthaler`) next to the classic. | Organisator |
| 2026-10-24 | Repository moved to **MrDrah/coktail** (public, so GitHub Pages stays free); live site becomes mrdrah.github.io/coktail. New commits use MrDrah's noreply email. Deploys require a successful CI run for the exact commit on main, including manual runs. | Product owner |
| 2026-10-24 | **Merge rule:** Claude may merge a PR the product owner asked for once its CI is green; it asks first for anything touching deployment, secrets or GitHub repository settings. | Product owner |
| 2026-10-24 | Project adopted into the **app-boilerplate framework v0.3.0** (MrDrah/boiler-plate-agent). Framework files live in `.claude/` and arrive as `framework/vX.Y.Z` PRs; project rules stay in CLAUDE.md §6. CI also runs the framework's docs, traceability, secrets and budget checks. The source-overlap audit stays a manual research step for now. | Product owner |
| 2026-10-24 | Framework **v0.4.0** (milestone evidence) adopted. Milestones: `mvp`, `beta-0.5`, `release-1.0`. Product owner enabled GitHub Pages (source: GitHub Actions) after the repo move, which fixed the failing deploys. **MVP milestone approved**; its evidence package (`engineering-evidence/mvp/`, commit `217726c`) is frozen: overall PASS (functional, QA, delivery PASS; cost and recovery UNVERIFIED). The event log starts at this milestone, so earlier interventions are not counted. | Product owner |
