# Microcopy Sheet — Cocktail Discovery MVP

Owner: UX/UI Designer · v1.0 · 2026-10-21
Consumers: Dev (implement **verbatim** in `src/copy.ts`), QA (assert exact strings).

## Conventions

- Tone: friendly, short, bartender-next-to-you. No blame ("we couldn't find" rather than "you entered an invalid…"). No exclamation marks in errors.
- `{name}`-style placeholders are interpolated by Dev. Placeholder values are already-escaped plain text (never HTML, US-E2-04).
- Plural keys use `_one` / `_other` suffixes (feed into `Intl.PluralRules('en')`).
- Ingredient and cocktail names are shown exactly as in the data (canonical Title Case).
- Typography: use the real ellipsis `…`, en dash `–`, em dash `—`, curly apostrophe `’`, and `×` for remove icons (icon only, never as text content).
- Strings marked **SR** are screen-reader-only (visually hidden or `aria-label`).

---

## 1. App shell

| Key | Text | Notes |
|---|---|---|
| `app.title` | Cocktail Cabinet | `<title>` and header wordmark |
| `app.tagline` | Tell us what’s in your cabinet. We’ll tell you what to pour. | Under H1 on landing |
| `app.heading` | What’s in your cabinet? | H1 |
| `app.skipLink` | Skip to results | SR/visible on focus |
| `app.themeToggle.light` | Switch to light theme | SR, `aria-label` |
| `app.themeToggle.dark` | Switch to dark theme | SR, `aria-label` |
| `app.footer` | Recipes researched from IBA, Difford’s Guide and other published sources. | Footer |

## 2. Ingredient input (US-E1-01 … US-E1-07, US-E2-*)

| Key | Text | Notes |
|---|---|---|
| `input.label` | Your ingredients | Visible `<label>` |
| `input.placeholder` | Type an ingredient, e.g. gin, lime, mint | Empty state, 0 chips |
| `input.placeholderMore` | Add another… | ≥ 1 chip |
| `input.placeholderFull` | That’s 10 — remove one to add more | 10 chips (input stays focusable) |
| `input.helper` | Press Enter or comma to add. Ice and water are always assumed. | Static helper under field |
| `input.counter` | {count} / 10 ingredients | Visible counter, e.g. "3 / 10 ingredients" |
| `input.counterSr` | {count} of 10 ingredients added | SR, polite live region |
| `input.listLabel` | Selected ingredients | SR, `aria-label` on chip list |
| `listbox.label` | Ingredient suggestions | SR, `aria-label` on listbox |
| `listbox.synonym` | {typed} → {canonical} | Option text when matched via synonym, e.g. "Fresh lemon → Lemon Juice" |
| `listbox.alreadyAdded` | Already added | Suffix on options already chosen (option `aria-disabled`) |
| `listbox.noResults` | No matches yet — press Enter to add it anyway | Shown when typed text has no suggestion |
| `listbox.countSr_one` | 1 suggestion available | SR |
| `listbox.countSr_other` | {count} suggestions available | SR |
| `chip.remove` | Remove {name} | SR, `aria-label` on × |
| `chip.removedSr` | {name} removed | SR, polite |
| `chip.addedSr` | {name} added | SR, polite |
| `chip.backspaceArmedSr` | {name} selected. Press Backspace again to remove. | SR, polite (US-E1-02) |
| `chip.duplicate` | {name} is already on your list | SR + chip flash (US-E1-07) |
| `chip.edit` | Edit {text} | SR, `aria-label` on error-chip text button |
| `chip.optional` | optional | Detail view tag (US-E3-05) |

## 3. Hints & limits

| Key | Text | Notes |
|---|---|---|
| `hint.excluded` | Ice & water are always assumed. No need to add them. | Info hint, auto-hides after 4 s (US-E1-05) |
| `hint.min` | Add at least 2 ingredients to search. | Helper under CTA when 0–1 counted (US-E1-03) |
| `hint.minOne` | Add 1 more ingredient to search. | When exactly 1 counted |
| `hint.onlyExcluded` | Ice and water don’t count — add at least 2 other ingredients. | Only water/ice entered (US-E1-05) |
| `error.tooMany` | You’ve hit the 10-ingredient limit. Remove one to add {name}. | Inline, assertive (US-E1-04) |
| `error.tooManyGeneric` | You’ve hit the 10-ingredient limit. Remove one to add another. | When name unknown |
| `hint.fixChips_one` | Fix or remove the highlighted ingredient to search. | CTA helper when 1 chip invalid/ambiguous (US-E2-05) |
| `hint.fixChips_other` | Fix or remove the {count} highlighted ingredients to search. | Same, plural |

## 4. Error chip & suggestions (US-E2-02, US-E2-04)

| Key | Text | Notes |
|---|---|---|
| `error.unrecognised` | We don’t know “{text}” yet. Check the spelling or try another name. | No suggestions |
| `error.didYouMean` | We don’t know “{text}”. Did you mean: | Followed by suggestion buttons |
| `error.suggestionButton` | {name} | Button label; SR: `error.suggestionSr` |
| `error.suggestionSr` | Replace {text} with {name} | SR, `aria-label` |
| `error.chipSr` | {text}, not recognised | SR, chip accessible name |
| `error.replacedSr` | Replaced {text} with {name} | SR, polite |

## 5. Ambiguity chooser (US-E2-03)

| Key | Text | Notes |
|---|---|---|
| `ambiguity.prompt` | Which “{term}” do you mean? | Popover heading |
| `ambiguity.help` | Pick one — they make very different drinks. | Sub-text |
| `ambiguity.chipSr` | {term}, needs a choice | SR, chip accessible name |
| `ambiguity.chipBadge` | Choose | Visible badge text on the pending chip |
| `ambiguity.cancel` | Remove “{term}” | Text button at bottom of popover |
| `ambiguity.resolvedSr` | {term} set to {name} | SR, polite |

## 6. Primary CTA (US-E1-03, US-E2-05)

| Key | Text | Notes |
|---|---|---|
| `cta.search` | Find cocktails | Default |
| `cta.searching` | Finding cocktails… | Loading (shown only if > 150 ms) |
| `cta.searchAgain` | Update results | After first search, when chips changed |
| `cta.clearAll` | Clear all | Tertiary text button beside counter |
| `cta.clearAllSr` | Clear all ingredients | SR |

## 7. Results (US-E4-*)

| Key | Text | Notes |
|---|---|---|
| `results.title` | Your cocktails | H2 |
| `results.count_one` | 1 cocktail you can make right now | Visible sub-heading |
| `results.count_other` | {count} cocktails you can make right now | |
| `results.countSr_one` | 1 cocktail found | SR, polite live region (US-E4-05) |
| `results.countSr_other` | {count} cocktails found | SR |
| `results.capped` | Showing the top {shown} of {total} matches. | When matches > cap (US-E4-01) |
| `results.single` | Just one — but it’s a good one. | Under count when exactly 1 result |
| `results.loadingSr` | Finding cocktails… | SR while skeleton visible |

## 8. Cocktail card (US-E4-03)

| Key | Text | Notes |
|---|---|---|
| `card.era.vintage` | Vintage | Era badge |
| `card.era.modern` | Modern | Era badge |
| `card.eraYear` | {era} · {year} | When `yearCreated` not null, e.g. "Vintage · 1898" |
| `card.glass` | {glass} | Glass label next to its icon: the `glass` enum value verbatim (one of 10) |
| — | *(data)* `shortDescription` | Shown verbatim under the name. Not a copy key |
| — | *(data)* `tasteProfile` | Shown verbatim and clamped to about 3 lines on the card, in full in the detail view. Not a copy key |
| `card.uses_one` | Uses 1 of yours | Meta line |
| `card.uses_other` | Uses {count} of yours | |
| `card.matchedSr` | you have it | SR suffix on highlighted ingredients |
| `card.open` | View recipe for {name} | SR, card accessible description |
| `card.openHint` | View recipe | Visible affordance (desktop hover / always on mobile) |

## 9. Detail dialog (US-E5-*)

| Key | Text | Notes |
|---|---|---|
| `detail.close` | Close | `aria-label` on × |
| `detail.ingredients` | Ingredients | H3 |
| `detail.method` | Method | H3 |
| `detail.glass` | Glass | Label |
| `detail.garnish` | Garnish | Label |
| `detail.garnishNone` | No garnish | When `garnish` is null |
| `detail.technique.shake` | Shaken | Method meta |
| `detail.technique.stir` | Stirred | |
| `detail.technique.build` | Built in the glass | |
| `detail.technique.blend` | Blended | |
| `detail.technique.throw` | Thrown | |
| `detail.technique.swizzle` | Swizzled | |
| `detail.technique.muddle-build` | Muddled & built | |
| `detail.history` | The story | H3 |
| `detail.taste` | How it tastes | H3 |
| `detail.sources` | Sources | H3 |
| `detail.sourceLink` | {publisher}: {title} | Link text; opens new tab |
| `detail.sourceNewTabSr` | (opens in a new tab) | SR suffix |
| `detail.servings` | Servings | Stepper label |
| `detail.servingsValue_one` | 1 serving | Stepper value |
| `detail.servingsValue_other` | {count} servings | |
| `detail.servingsDecrease` | Fewer servings | SR |
| `detail.servingsIncrease` | More servings | SR |
| `detail.servingsSr` | Amounts updated for {count} servings | SR, polite |
| `detail.youHave` | You have this | Badge on matched ingredient row |
| `detail.youNeed` | You’ll need this | Badge on missing row (near-match detail only) |
| `detail.assumed` | Assumed | Chip on ice and water rows |
| `detail.assumedAmount` | — | Amount column for ice/water rows (`aria-hidden`) |
| `detail.assumedSr` | {name}, assumed. You don’t need to add it. | SR name for ice/water rows |
| `detail.unit.ml` | {amount} ml | ml only. There are no oz strings: the MVP has no unit toggle |
| `detail.unit.dash_one` | {amount} dash | |
| `detail.unit.dash_other` | {amount} dashes | |
| `detail.unit.drop_one` | {amount} drop | |
| `detail.unit.drop_other` | {amount} drops | |
| `detail.unit.barspoon_one` | {amount} barspoon | |
| `detail.unit.barspoon_other` | {amount} barspoons | |
| `detail.unit.piece` | {amount} × | e.g. "1 ×" Sugar (sugar cube) |
| `detail.unit.leaf_one` | {amount} leaf | |
| `detail.unit.leaf_other` | {amount} leaves | |
| `detail.unit.sprig_one` | {amount} sprig | |
| `detail.unit.sprig_other` | {amount} sprigs | |
| `detail.unit.pinch_one` | {amount} pinch | |
| `detail.unit.pinch_other` | {amount} pinches | |
| `detail.unit.top` | Top up | Never scales (US-E5-02) |
| `detail.unit.splash` | A splash | Never scales |
| `detail.unit.unknown` | To taste | `amount` null with a countable unit (note explains) |

## 10. Zero match & near matches (US-E6-*)

| Key | Text | Notes |
|---|---|---|
| `fallback.title` | No direct matches found | H2 (US-E6-01) |
| `fallback.body` | Nothing in our library uses only what you have — but you’re close. | |
| `fallback.tip` | Tip: a citrus juice or a sweetener unlocks the most drinks. | Shown instead of the best-addition callout when `bestAddition` is null or the user has 10 ingredients |
| `bestAddition.label` | Best addition | Overline in the callout |
| `bestAddition.text_one` | Add {name} to unlock 1 cocktail | `unlocks` = 1 |
| `bestAddition.text_other` | Add {name} to unlock {count} cocktails | e.g. "Add Simple Syrup to unlock 4 cocktails" |
| `bestAddition.button` | + Add {name} | One-tap add, which re-runs the search |
| `bestAddition.buttonSr` | Add {name} to your ingredients and search again | SR `aria-label` |
| `bestAddition.liveSr_one` | Adding {name} unlocks 1 cocktail. | Appended to `fallback.liveSr` |
| `bestAddition.liveSr_other` | Adding {name} unlocks {count} cocktails. | Appended to `fallback.liveSr` |
| `fallback.liveSr` | No direct matches. {count} near matches found. | SR, polite |
| `nearMatches.title` | Near Matches — missing 1 ingredient | H2 (US-E6-02) |
| `nearMatches.subtitle` | Add the missing ingredient and we’ll search again. | |
| `nearMatches.missingLabel` | Missing | Overline on card above the badge |
| `nearMatches.addButton` | + Add {name} | Badge/button (US-E6-04) |
| `nearMatches.addButtonSr` | Add {name} to your ingredients and search again | SR `aria-label` |
| `nearMatches.addedSr` | {name} added. Searching again. | SR, polite |
| `nearMatches.adding` | Adding… | Button label while the re-search runs |
| `nearMatches.missingName` | {name} | Static pill that replaces the hidden "+ Add" at 10 ingredients |
| `empty.title` | Nothing to pour… yet | H2 (US-E6-05) |
| `empty.body` | We couldn’t find a cocktail that uses these, even with one more ingredient. | |
| `empty.tip` | Try a base spirit (gin, rum, whiskey), a citrus juice and a sweetener — that combo opens hundreds of classics. | |
| `empty.action` | Start over | Clears chips, focuses input |
| `empty.liveSr` | No cocktails found. Try different ingredients. | SR, polite |

## 11. Generic

| Key | Text | Notes |
|---|---|---|
| `error.dataLoad` | We couldn’t load the cocktail library. Check your connection and try again. | Fatal load error |
| `error.dataLoadRetry` | Try again | Button |
| `common.loading` | Loading… | |
| `share.copy` | Copy link to these ingredients | US-NF-04 (Should) |
| `share.copied` | Link copied | Toast, polite |
