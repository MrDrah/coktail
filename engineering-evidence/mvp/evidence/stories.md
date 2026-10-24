# User Stories & Acceptance Criteria — Cocktail Discovery MVP

Owner: BA Agent · Version 1.0 · 2026-10-21
Traces to: business rules BR-01 to BR-11 in [00-orchestration-plan.md](../00-orchestration-plan.md)

## Conventions

- **Story ID:** `US-E<epic>-<nn>`. QA test IDs reference these.
- **Priority:** MoSCoW. **M** = Must, **S** = Should, **C** = Could.
- **"Counted ingredient":** a canonical ingredient whose `classification` is `counted`. Water and ice are `excluded` (BR-02).
- **Fixture recipes.** Unless a scenario names a real cocktail, it uses fixtures so the criteria don't depend on library content:

| Fixture | Required counted ingredients |
|---------|------------------------------|
| `FX-SOUR` | White Rum, Lime Juice, Simple Syrup (+ Ice) |
| `FX-HIGHBALL` | Gin, Soda Water, Lemon Juice, Simple Syrup (+ Ice) |
| `FX-STIRRED` | Rye Whiskey, Sweet Vermouth, Angostura Bitters (+ Ice) |
| `FX-OLDFASH` | Bourbon, Sugar, Angostura Bitters (+ Water, Ice) |
| `FX-OPTIONAL` | Gin, Lime Juice + **optional** Simple Syrup |
| `FX-FRUIT` | Cachaça, Whole Lime, Sugar (+ Ice) |

---

## Epic E1 — Ingredient input & validation

### US-E1-01 Add an ingredient as a chip · M
*As a home bartender, I want to type an ingredient and see it become a chip, so that I can build my list quickly.*

```gherkin
Scenario: Committing a recognised ingredient
  Given the ingredient input is empty
  When the user types "gin" and presses Enter
  Then a chip labelled "Gin" is shown
  And the input is cleared
  And the counter reads "1 / 10"

Scenario: Committing with a comma
  When the user types "gin, campari"
  Then two chips "Gin" and "Campari" are shown

Scenario: Selecting from autocomplete
  When the user types "verm"
  Then suggestions include "Sweet Vermouth" and "Dry Vermouth"
  When the user selects "Dry Vermouth"
  Then a chip "Dry Vermouth" is shown
```

### US-E1-02 Remove a chip · M
```gherkin
Scenario: Removing via the chip's remove control
  Given chips "Gin" and "Campari" are shown
  When the user activates the remove control on "Campari"
  Then only "Gin" remains and the counter reads "1 / 10"

Scenario: Removing with Backspace
  Given chips "Gin" and "Campari" and the input is empty and focused
  When the user presses Backspace twice
  Then the "Campari" chip is highlighted on the first press and removed on the second
```

### US-E1-03 Minimum of 2 counted ingredients · M (BR-01)
```gherkin
Scenario: One ingredient blocks the search
  Given a single chip "Gin"
  Then the "Find cocktails" button is disabled
  And helper text says at least 2 ingredients are needed

Scenario: Two ingredients enable the search
  Given chips "Gin" and "Campari"
  Then the "Find cocktails" button is enabled
```

### US-E1-04 Maximum of 10 counted ingredients · M (BR-01)
```gherkin
Scenario: The 11th ingredient is rejected
  Given 10 counted chips are shown
  When the user tries to add "Mint"
  Then no chip is added
  And an inline message explains the 10-ingredient limit
  And the counter reads "10 / 10"
```

### US-E1-05 Water and ice are silently excluded · M (BR-02)
```gherkin
Scenario Outline: Excluded terms don't become counted chips
  Given chips "Gin" and "Campari"
  When the user enters "<term>"
  Then no counted chip is added
  And the counter still reads "2 / 10"
  And a transient info hint says ice and water are always assumed
  Examples:
    | term          |
    | ice           |
    | crushed ice   |
    | ice cubes     |
    | water         |
    | tap water     |
    | still water   |

Scenario: Excluded terms don't count toward the limit
  Given 10 counted chips are shown
  When the user enters "ice"
  Then no "10-ingredient limit" error is shown

Scenario: Only excluded terms
  Given the user has entered only "ice" and "water"
  Then the counter reads "0 / 10" and search is disabled
```

### US-E1-06 Soda water is a counted ingredient · M (BR-03)
```gherkin
Scenario Outline: Sparkling-water synonyms are counted
  When the user enters "<term>"
  Then a chip "Soda Water" is shown and the counter increases by 1
  Examples:
    | term            |
    | soda water      |
    | club soda       |
    | sparkling water |
    | seltzer         |
    | soda            |
```

### US-E1-07 Duplicates collapse to one chip · M
```gherkin
Scenario: Synonym duplicate
  Given a chip "Lemon Juice"
  When the user enters "fresh lemon juice"
  Then no new chip is added
  And the existing "Lemon Juice" chip briefly highlights
  And the counter is unchanged
```

---

## Epic E2 — Parsing & error handling (BR-04, BR-08)

### US-E2-01 Exact and synonym matches resolve to canonical names · M
```gherkin
Scenario Outline: Normalisation
  When the user enters "<input>"
  Then a chip "<canonical>" is shown
  Examples:
    | input              | canonical       |
    | Gin                | Gin             |
    | GIN                | Gin             |
    | "  gin  "          | Gin             |
    | Fresh Lemon Juice  | Lemon Juice     |
    | lemon              | Lemon Juice     |
    | lime wedges        | Whole Lime      |
    | Cointreau          | Orange Liqueur  |
    | triple sec         | Orange Liqueur  |
    | bourbon whiskey    | Bourbon         |
    | prosecco           | Sparkling Wine  |
    | gomme              | Simple Syrup    |
```

### US-E2-02 Typo gets "Did you mean…" suggestions · M
```gherkin
Scenario: Close misspelling
  When the user enters "campary"
  Then a chip "campary" in the error state is shown
  And the message offers "Did you mean: Campari?"
  When the user selects "Campari"
  Then the error chip is replaced by a valid chip "Campari"

Scenario: Fuzzy matches are never auto-accepted
  When the user enters "campary"
  Then no valid "Campari" chip is created without the user choosing it
```

### US-E2-03 Ambiguous term asks the user to choose · M
```gherkin
Scenario: "orange" has several meanings
  When the user enters "orange"
  Then a chooser offers "Orange Juice", "Orange Liqueur" and "Orange Bitters"
  And the pending chip shows the ambiguous state
  When the user picks "Orange Liqueur"
  Then the chip becomes a valid "Orange Liqueur"
```
At minimum the ambiguity groups are `orange`, `vermouth`, `rum`, `whiskey`/`whisky`, `bitters`, `syrup`, `wine`, `ginger`, `chartreuse`. The full list is in `data/ingredients.json` → `ambiguityGroups`.

### US-E2-04 Unparseable input gets a friendly re-prompt · M
```gherkin
Scenario: No plausible match
  When the user enters "asdfgh"
  Then a chip in the error state is shown
  And the message says the ingredient wasn't recognised and asks the user to check spelling or try another name
  And the user can edit the chip text in place or remove it

Scenario: Markup is inert
  When the user enters "<script>alert(1)</script>"
  Then it is shown as plain text in an error chip and nothing executes
```

### US-E2-05 Search is blocked while any chip is invalid or ambiguous · M
```gherkin
Scenario: One bad chip
  Given valid chips "Gin" and "Campari" and an error chip "asdfgh"
  Then "Find cocktails" is disabled
  And helper text points to the chip that needs fixing
  When the user removes "asdfgh"
  Then "Find cocktails" is enabled
```

---

## Epic E3 — Subset matching (BR-05)

### US-E3-01 Exact-set match · M
```gherkin
Scenario:
  Given the user's ingredients are White Rum, Lime Juice, Simple Syrup
  When the user searches
  Then FX-SOUR is in the results
```

### US-E3-02 Strict subset match · M
```gherkin
Scenario: Five inputs return a three-ingredient recipe
  Given the user's ingredients are White Rum, Lime Juice, Simple Syrup, Mint, Soda Water
  When the user searches
  Then FX-SOUR is in the results
```

### US-E3-03 No recipe needs an ingredient outside the input · M
```gherkin
Scenario: Missing one ingredient excludes the recipe from the primary results
  Given the user's ingredients are White Rum, Lime Juice
  When the user searches
  Then FX-SOUR is not in the primary results

Scenario: Invariant
  For every primary result R and the user's set U
  Then every required counted ingredient of R is in U
```

### US-E3-04 Water and ice in recipes never block a match · M (BR-02)
```gherkin
Scenario:
  Given the user's ingredients are Bourbon, Sugar, Angostura Bitters
  When the user searches
  Then FX-OLDFASH is in the results even though it uses water and ice
```

### US-E3-05 Optional ingredients and garnish never block a match · M (Q2)
```gherkin
Scenario:
  Given the user's ingredients are Gin, Lime Juice
  When the user searches
  Then FX-OPTIONAL is in the results
  And its detail view lists Simple Syrup marked "optional"
```

### US-E3-06 Whole fruit provides its juice · S (Q3 refinement)
```gherkin
Scenario: Fruit satisfies the juice
  Given the user's ingredients are Whole Lime, White Rum, Simple Syrup
  When the user searches
  Then FX-SOUR is in the results (Whole Lime provides Lime Juice)

Scenario: Juice doesn't satisfy the fruit
  Given the user's ingredients are Cachaça, Lime Juice, Sugar
  When the user searches
  Then FX-FRUIT is not in the primary results
```

### US-E3-07 Soda water is required where the recipe uses it · M (BR-03)
```gherkin
Scenario:
  Given the user's ingredients are Gin, Lemon Juice, Simple Syrup
  When the user searches
  Then FX-HIGHBALL is not in the primary results
  When the user adds "club soda" and searches again
  Then FX-HIGHBALL is in the results
```

---

## Epic E4 — Results display (BR-06)

### US-E4-01 Result cap depends on input size · M
```gherkin
Scenario Outline:
  Given the user entered <n> counted ingredients
  And <m> recipes match
  When the user searches
  Then exactly <shown> cards are displayed
  Examples:
    | n  | m  | shown |
    | 2  | 1  | 1     |
    | 3  | 9  | 6     |
    | 4  | 6  | 6     |
    | 4  | 7  | 6     |
    | 5  | 7  | 7     |
    | 5  | 12 | 8     |
    | 10 | 40 | 8     |
```

### US-E4-02 Ranking · M
```gherkin
Scenario: More matches than the cap
  When results are capped
  Then recipes are ordered by:
    1. number of the user's ingredients used, descending
    2. popularity, descending
    3. name, A–Z
  And no lower-ranked recipe is shown in place of a higher-ranked one
```

### US-E4-03 Card summary · M
```gherkin
Scenario:
  Then each card shows the name, the short description (shortDescription), the taste profile (clamped to about 3 lines), an era badge (Vintage/Modern), the glass, and the ingredient list with the user's ingredients highlighted
  And the whole card is clickable and keyboard-focusable
```

### US-E4-04 No Near Matches when there's at least 1 result · M
```gherkin
Scenario:
  Given exactly 1 recipe matches
  Then 1 card is shown
  And no "Near Matches" section is shown
```

### US-E4-05 Result count announced · S
```gherkin
Scenario:
  When results load
  Then a screen-reader live region announces "<k> cocktails found"
```

---

## Epic E5 — Detail view (BR-09)

### US-E5-01 Open the full recipe · M
```gherkin
Scenario:
  When the user activates a card
  Then a detail view opens showing:
    | ingredients with amounts in ml, optional ones marked; ice and water shown as "Assumed" rows |
    | method steps                                            |
    | glass and garnish                                        |
    | history (1–2 paragraphs) and taste profile (1 paragraph) |
    | source attribution link(s)                              |
```

### US-E5-02 Serving scaling · M
```gherkin
Scenario: Default and controls
  When the detail view opens
  Then servings shows 1
  And small "−" and "+" buttons change it between 1 and 4
  And "−" is disabled at 1 and "+" is disabled at 4
  And amounts are always shown in ml (no unit toggle)

Scenario Outline: Scaling ml amounts
  Given an ingredient of 45 ml
  When the user selects <servings> servings
  Then it shows <shown>
  Examples:
    | servings | shown  |
    | 1        | 45 ml  |
    | 2        | 90 ml  |
    | 4        | 180 ml |

Scenario: Count units scale and round sensibly
  Given "2 dash" Angostura Bitters
  When the user selects 3 servings
  Then it shows "6 dash"

Scenario: Unquantified units don't scale
  Given "Top" Soda Water
  Then it shows "Top up" at every serving size
```

### US-E5-03 Close and return · M
```gherkin
Scenario:
  Given the detail view is open
  When the user presses Esc, clicks the close control or clicks the backdrop
  Then the view closes
  And focus returns to the card that opened it
  And the results and chips are unchanged
```

---

## Epic E6 — Zero-match & Near Matches (BR-07)

### US-E6-01 Zero-match notice · M
```gherkin
Scenario:
  Given no recipe's required ingredients are a subset of the user's ingredients
  When the user searches
  Then a "No direct matches found" notice is shown
  And it suggests adding a common ingredient (e.g. a citrus juice or a sweetener)
```

### US-E6-02 Near Matches, missing exactly 1 · M
```gherkin
Scenario:
  Given the user's ingredients are White Rum, Lime Juice
  When the user searches and there are 0 primary matches
  Then a "Near Matches — missing 1 ingredient" section is shown
  And FX-SOUR is listed with a "+ Add Simple Syrup" badge
  And no near match is missing 2 or more ingredients
  And every near match uses at least 1 of the user's ingredients
```

### US-E6-03 Near-match ranking and cap · M
```gherkin
Scenario:
  Then near matches are ordered by:
    1. the missing ingredient's pairingWeight, descending
    2. number of the user's ingredients used, descending
    3. popularity, descending
  And at most the same cap as BR-06 applies (6 or 8)
```

### US-E6-04 One-tap add from a near match · S
```gherkin
Scenario:
  When the user activates "+ Add Simple Syrup"
  Then a "Simple Syrup" chip is added
  And the search re-runs automatically
  And FX-SOUR now appears in the primary results

Scenario: Hidden at the 10-ingredient limit
  Given the user has 10 counted ingredients
  Then no "+ Add" buttons are shown on near matches
  When the user removes one ingredient (9 left) and searches
  Then the "+ Add" buttons are shown again
```

### US-E6-06 Best-addition tip · S
```gherkin
Scenario:
  Given there are 0 primary matches and at least 1 near match
  Then the fallback notice shows "Add <ingredient> to unlock <n> cocktails"
  Where <ingredient> is the missing ingredient shared by the most near matches (ties broken by pairingWeight)
  And activating it adds the ingredient and re-runs the search
  And the tip is hidden at the 10-ingredient limit
```

### US-E6-05 Nothing at all · M
```gherkin
Scenario:
  Given there are 0 primary matches and 0 near matches
  Then a friendly empty state suggests trying different or more ingredients
  And no empty "Near Matches" heading is shown
```

---

## Non-functional stories

| ID | Story | Priority |
|----|-------|----------|
| US-NF-01 | Works offline after first load. No network calls during search. | S |
| US-NF-02 | Keyboard-only users can complete the full journey (WCAG 2.1 AA). | M |
| US-NF-03 | Search returns in under 100 ms perceived and under 5 ms in the engine on a mid-tier phone. | M |
| US-NF-04 | The URL encodes the ingredient list so results can be shared and reloaded. | S |
| US-NF-05 | Every recipe in the detail view links to at least one reputable source (BR-11). | M |
