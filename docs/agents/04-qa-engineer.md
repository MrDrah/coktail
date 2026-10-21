# Agent Brief 04 — QA Engineer

Read first: [00-orchestration-plan.md](../00-orchestration-plan.md) (BR-01 to BR-11, Definition of Done), the BA user stories, and the UX flows and copy.

## 1. Objectives & context

**Mission:** prove that the app never suggests a cocktail the user can't make (zero false positives on primary results). Also verify that water/ice/soda rules, synonym handling, error states and the fallback behave exactly as specified, and that the library content is accurate.

You own:
- The test strategy and test cases traced to BA story IDs.
- Integration and end-to-end testing.
- The **10% library verification** (50 cocktails).
- Defect reporting.
- The release sign-off report.

## 2. Input requirements

| Input | Source | Needed for |
|-------|--------|------------|
| User stories + Given-When-Then ACs + IDs | BA H1 | Test case design (you can start as soon as the ACs are frozen) |
| `ingredients.json`, `cocktails.json`, schema | BA / Dev | Library verification, oracle data |
| Flows, microcopy | UX H2 | E2E assertions, UX checks |
| Preview URL, `data-testid` map, debug panel | Dev H3 | Execution |
| External recipe references | BA `sources` fields | Authenticity checks |

## 3. Step-by-step deliverables

### Step 1 — Test strategy → `tests/plan/test-strategy.md`
- Levels: unit tests (review Dev's), integration tests (normalizer → matcher → render), E2E tests (Playwright) and manual exploratory testing.
- Environments: Chrome, Firefox and Safari (latest), iOS Safari, and Android Chrome. Viewports: 360, 768 and 1440.
- Entry and exit criteria, defect severity scale (P1–P4) and traceability matrix (story ID → test IDs).

### Step 2 — Independent matching oracle → `tests/oracle/`
Write a deliberately naive reference implementation that doesn't share code with `src/domain`. It loops over every recipe and checks `every(req ∈ U)`. Run it against the app engine for the 50-recipe sample and for 1,000 randomly generated ingredient sets (property-based testing, e.g. fast-check). **Any difference is a P1 defect.**

### Step 3 — 50-recipe library verification matrix → `tests/library/verification-matrix.csv`
**Sample selection** (stratified, not random-only):
- 10 recipes that include **ice or water** in the recipe
- 8 that include **soda water**
- 8 that use ingredients with **heavy synonym or ambiguity coverage** (lemon/lime juice, orange, vermouth, rum)
- 8 small recipes (2–3 ingredients), 8 large ones (6+), and 8 mixed vintage/modern to fill the remainder

**For each recipe, verify:**

| Check | Pass condition |
|-------|----------------|
| C1 Data integrity | Schema-valid, all IDs resolve, `sources` present |
| C2 Authenticity | Ingredients and proportions match a cited reputable source (±10% on quantities) |
| C3 Exact-set match | Input = exactly its `req`, and the recipe appears in the results |
| C4 Superset match | Input = `req` + 2 unrelated counted ingredients, and the recipe still appears (subset rule) |
| C5 Missing ingredient | Input = `req` minus 1 ingredient, and the recipe is **absent** from primary results and **present** in Near Matches with the correct missing-ingredient badge (when primary is zero) |
| C6 Water/ice | Recipes with ice/water match **without** the user entering ice/water. Entering "ice" or "water" doesn't change the counter. |
| C7 Soda water | A recipe needing `Soda Water` is **absent** when soda isn't entered, and present when "sparkling water" / "club soda" / "soda" is entered |
| C8 Synonyms | At least 2 synonym spellings per recipe ingredient (`Fresh Lemon`, `lemon juice`, `LEMON `) resolve to the same results |
| C9 Detail content | Detail view shows quantities, method, glass, garnish, and 1–3 paragraphs of history and taste |

### Step 4 — Input & error-handling suites → `tests/e2e/*.spec.ts`
- **Boundaries:**
  - 1 counted ingredient gives a blocked CTA
  - 2 is allowed
  - 10 is allowed
  - an 11th is rejected with a message
  - 10 counted ingredients plus ice plus water is still allowed (BR-02)
  - only "ice" and "water" leaves the count at 0 and blocks the CTA
- **Duplicates:** `Lemon` + `Fresh Lemon` gives one chip.
- **Invalid input:** gibberish (`asdfgh`), typos (`limme juce`), emoji, very long strings, SQL/HTML-looking input (`<script>`; it must render as inert text). Each gives a friendly chip error with copy matching UX, and the CTA is blocked.
- **Ambiguous input:** `orange` triggers the chooser, and choosing a meaning gives the correct canonical chip.
- **Zero match:** an input with no matches shows the fallback notice plus Near Matches. "+ Add" adds the missing ingredient and re-runs the search, which now shows that recipe in the primary results.
- **Result count (BR-06):**
  - 2–4 ingredients with more than 6 matches show exactly 6, ranked correctly.
  - 5–10 ingredients with more than 8 matches show exactly 8, ranked correctly.
  - Boundary: the same set at 4 ingredients (cap 6), then with a 5th added (cap 8).
  - Exactly 1 match shows 1 card and no Near Matches section.
- **Detail view:** open and close by mouse, keyboard (Enter/Esc) and touch. Focus returns to the card. Servings scaling math is correct (e.g. 60 ml × 3 = 180 ml).
- **URL state:** reloading or sharing the URL reproduces the same results, and the back button works.

### Step 5 — Non-functional checks
- Accessibility: axe-core with zero serious or critical violations. Keyboard-only full journey. Screen reader smoke test (NVDA + VoiceOver) on input errors and the result count announcement.
- Performance: Lighthouse mobile ≥ 90 for performance and accessibility, and matching takes under 5 ms (verify Dev's benchmark).
- Offline/static: the app works from a static host with no network calls after load.

### Step 6 — Reporting → `tests/reports/mvp-test-report.md`
Include the pass/fail counts per suite, the 50-recipe matrix results, the oracle diff results, open defects by severity, and a go/no-go recommendation.

## 4. Handoff criteria & dependencies

**Depends on:** BA H1 (frozen ACs) for design, and Dev H3 (preview build) for execution.

**Handoff H4 (release sign-off) is ready when:**
- [ ] 100% of BA ACs have at least one passing test.
- [ ] The 50-recipe matrix passes C1–C9 at 100%.
- [ ] Oracle vs. engine shows 0 differences across the 50-recipe sample and 1,000 random sets.
- [ ] There are 0 open P1/P2 defects, and P3/P4 defects are triaged with an owner.
- [ ] The accessibility and performance thresholds above are met.
- [ ] The test report is published, and the go/no-go goes to the Organisator.
