# CATCH-UP — read this first

> **To an AI assistant opening this repo:** you are taking over as the **Organisator Agent** for this project. Read this whole file, then [docs/agents/00-organisator.md](docs/agents/00-organisator.md). Confirm the current state against the repo (`git log`, `npm test`), then tell the product owner, in a short summary, where things stand and what you propose to do next. Don't redo work that's marked done.
>
> **To the product owner:** on a new device, clone the repo, open it in Claude Code and say: *"Read CATCH-UP.md and catch up."*

Last updated: 2026-10-21 · Repo: https://github.com/quentinmilavec-sutrix/coktail · Live site: https://quentinmilavec-sutrix.github.io/coktail/

---

## 1. What we're building

**Cocktail Cabinet** is a static web app. You type 2–10 ingredients you have, and it shows real, sourced cocktails you can make with them or with any subset of them. Each card opens the full recipe (scalable servings, in ml), its history and its taste profile. If nothing matches, it shows **Near Matches** that need exactly one more ingredient, plus a "Best addition" tip.

- No login, no backend and no AI at runtime. The cocktail library is a flat JSON file, and matching runs entirely in the browser.
- All rules are in [docs/00-orchestration-plan.md](docs/00-orchestration-plan.md) as **BR-01 to BR-11**. That file's §7 is the dated **decision log**, so read it.

## 2. How the work is organised

Five roles, each with a brief in [docs/agents/](docs/agents/):

| Role | Brief | Owns |
|------|-------|------|
| Organisator (you) | [00-organisator.md](docs/agents/00-organisator.md) | The plan, decisions, dispatching agents, keeping this file current |
| Business Analyst | [01-business-analyst.md](docs/agents/01-business-analyst.md) | Stories, schema, ingredient dictionary, **researching cocktails** |
| UX/UI Designer | [02-ux-ui-designer.md](docs/agents/02-ux-ui-designer.md) | `design/` (tokens, component specs, flows, copy, preview) |
| Developer/Architect | [03-developer-architect.md](docs/agents/03-developer-architect.md) | `src/` (engine + React UI), build, CI |
| QA Engineer | [04-qa-engineer.md](docs/agents/04-qa-engineer.md) | `tests/`, verification matrix, test report |

In practice the Organisator plays each role directly or sends work to sub-agents. Large research jobs run as parallel sub-agents of 50 cocktails each.

## 3. Status

### Done ✅
| Area | What exists | Key files |
|------|-------------|-----------|
| Plan & decisions | BR-01–BR-11, handoff gates, decision log | `docs/00-orchestration-plan.md` |
| BA | User stories E1–E6 with Given-When-Then; schema; naming standard; **ingredient dictionary v1.1 (156 ingredients, 15 ambiguity groups)**; research brief | `docs/ba/*`, `data/schema/cocktail.schema.md`, `data/ingredients.json` |
| Library | **50 sourced cocktails** (48 IBA + 2 Difford's). All pass C1–C9, and C2 authenticity was checked against their sources | `data/cocktails.json` (built from `data/_research/batch-a.json`, `batch-b.json`) |
| UX | "Frost" design system (lime primary, orange secondary, light/dark), 6 component specs, flows, a11y, copy, preview | `design/*` |
| Dev engine | Normaliser (synonyms, typos, ambiguity), subset matcher, `provides` (fruit → juice, Champagne/Prosecco → sparkling wine), caps 6/8, near matches, best addition, serving scaling | `src/domain/*` |
| Dev UI | React app implementing C1–C6, URL state `?i=`, theme toggle | `src/ui/*` |
| QA | Unit + UI tests (541), Playwright e2e desktop + mobile (83), axe WCAG AA, library verification matrix, test report | `tests/**`, `tests/reports/mvp-test-report.md` |
| CI/CD | GitHub Actions CI on every push. GitHub Pages deploys after CI passes on `main` | `.github/workflows/ci.yml`, `deploy.yml` |

### In progress 🔄 (as of the last update)
- **Library expansion from 50 to 300 cocktails.**
  - A verified candidate list of 378 real cocktails is in `data/_research/candidates.json` (54 IBA + 324 Difford's, ranked, URLs checked).
  - 5 research agents were dispatched, each writing 50 records: ranks 1–50 → `batch-c.json`, 51–100 → `batch-d.json`, 101–150 → `batch-e.json`, 151–200 → `batch-f.json`, 201–250 → `batch-g.json`. Reserve ranks 251–378 replace skipped candidates.
  - **If a batch file is missing or has fewer than 50 records,** that research didn't finish. Re-dispatch it with the same prompt pattern (see the Organisator brief, "Research dispatch").

### Next 📋
1. Finish the 300 library:
   - Add any new ingredient IDs the researchers proposed to `data/ingredients.json`.
   - Run `npm run merge:research`, then `npm run validate:data`.
   - Fix the errors, run all tests, spot-check about 10% of the new records against their sources (C2), then commit and push.
2. Regenerate the QA matrix (`WRITE_MATRIX=1 npm run test:library`) and update `tests/reports/mvp-test-report.md`.
3. Check the JS bundle stays under budget (≤ 400 KB gzipped). If not, lazy-load `history` and `tasteProfile`.
4. Open BA observations from QA: Kir's second recipe source disagrees with IBA; Mai Tai's two rums are merged into one line; teaspoon amounts are stored as `barspoon`.
5. UI gaps vs the design spec: mobile bottom-sheet chooser, sticky mobile CTA, "how it works" idle strip, card stagger animation.
6. Manual QA: Safari, Firefox and mobile devices, NVDA/VoiceOver, Lighthouse on the live site.

## 4. Key decisions (summary; the full log is in the plan §7)

- **Results:** at least 1. Up to **6** for 2–4 ingredients and up to **8** for 5–10. Near Matches only when there are 0 direct matches.
- **Counting:** water and ice never count, and a recipe never requires them. Soda water does count.
- **Library:** researched by the BA from real sources (IBA, Difford's Guide, PUNCH, Imbibe). Nothing is invented. Every record cites `recipe` and `history` sources. MVP target: **300**.
- **Naming:**
  - "lemon" means Lemon Juice. Whole Lemon/Lime/Orange **provide** their juice (not the reverse).
  - Brands map to generics.
  - Champagne and Prosecco are separate, and each provides generic Sparkling Wine.
  - Red, white and rosé wine are separate.
  - Pastis ≠ Absinthe and Genever ≠ Gin.
- **Garnish and optional ingredients** never block a match.
- **Cards** show name, `shortDescription` and taste profile (clamped). Glass is one of **10** canonical values.
- **Detail view:** ice and water are shown as "Assumed". Servings start at 1, with −/+ buttons for 1–4, in **ml only**.
- **"+ Add" buttons** are hidden at 10 ingredients and come back at 9.
- **Ambiguous words** ("orange", "wine", "sherry"…) open a "which one?" chooser. Typos get "Did you mean…", never an automatic correction.

## 5. How to work in this repo

```bash
npm install
npm run dev              # http://localhost:5173
npm test                 # unit + UI + library verification
npm run e2e              # Playwright (builds and serves on :4173)
npm run validate:data    # library + dictionary rules
npm run merge:research   # data/_research/batch-*.json → data/cocktails.json
npm run build            # static site in dist/
```

- **Data flow:** research agents write `data/_research/batch-*.json`. `merge:research` builds `data/cocktails.json`. Never hand-edit `cocktails.json`; edit the batch file and re-merge.
- **Ingredient changes** go in `data/ingredients.json`. Run `validate:data` afterwards, because it rejects synonym clashes.
- **Commits:** small and descriptive, ending with `Co-Authored-By: Claude …`. Pushing to `main` runs CI, and a green CI redeploys the live site.
- **The product owner** prefers short status updates and decisions offered as clear options with a recommendation.
