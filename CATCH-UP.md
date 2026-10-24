# CATCH-UP — read this first

> **To an AI assistant opening this repo:** you are taking over as the **Organisator Agent** for this project. Read this whole file, then [docs/agents/00-organisator.md](docs/agents/00-organisator.md). Confirm the current state against the repo (`git log`, `npm test`), then tell the product owner, in a short summary, where things stand and what you propose to do next. Don't redo work that's marked done.
>
> **To the product owner:** on a new device, clone the repo, open it in Claude Code and say: *"Read CATCH-UP.md and catch up."*

Last updated: 2026-10-24 · Repo: https://github.com/MrDrah/coktail · Live site: https://mrdrah.github.io/coktail/ (moved from quentinmilavec-sutrix/coktail on 2026-10-24; the old repo and site are frozen)

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
| BA | User stories E1–E6 with Given-When-Then; schema; naming standard; **ingredient dictionary v1.2 (170 ingredients, 15 ambiguity groups)**; research brief | `docs/ba/*`, `data/schema/cocktail.schema.md`, `data/ingredients.json` |
| Library | **300 sourced cocktails.** All pass C1, C3–C9. C2 authenticity: all 50 seed records, plus a 10% sample (30) of the 250 new ones; 12 minor wording/method issues found and fixed. Library-wide wording-overlap audit done for all 250 new records | `data/cocktails.json` (built from `data/_research/batch-a.json` … `batch-g.json`) |
| UX | "Frost" design system (lime primary, orange secondary, light/dark), 6 component specs, flows, a11y, copy, preview | `design/*` |
| Dev engine | Normaliser (synonyms, typos, ambiguity), subset matcher, `provides` (fruit → juice, Champagne/Prosecco → sparkling wine), caps 6/8, near matches, best addition, serving scaling | `src/domain/*` |
| Dev UI | React app implementing C1–C6, URL state `?i=`, theme toggle | `src/ui/*` |
| QA | Unit + UI + library tests (2,841), Playwright e2e desktop + mobile (89), axe WCAG AA, library verification matrix, test report. Every story ID (38) is named by an active test, checked by the App boilerplate `validate.mjs trace`. JS bundle 230 KB gzipped (budget 400) | `tests/**`, `tests/reports/mvp-test-report.md` |
| Deploy safety | Deploy verifies a successful CI run for the exact commit on main, for automatic and manual (`workflow_dispatch`) runs | `.github/workflows/deploy.yml` |
| Framework | app-boilerplate v0.5.0 ([MrDrah/boiler-plate-agent](https://github.com/MrDrah/boiler-plate-agent)): agents (incl. `metrics`), skills, hooks, quality gate in `.claude/`; updates arrive as `framework/vX.Y.Z` PRs. Project rules and the name mapping are in `CLAUDE.md` §6 | `.claude/`, `quality-gate.json`, `CLAUDE.md` |
| MVP evidence | Milestone `mvp` frozen for commit `217726c`: overall **PASS** (functional 38/38 stories, QA 2,930 passed / 0 failed, CI + deploy + live check passed); cost and recovery UNVERIFIED. Published in `engineering-evidence/index.json`; never edited (corrections: `collect --revise`) | `engineering-evidence/`, `docs/evidence/events.jsonl` |
| CI/CD | GitHub Actions CI on every push. GitHub Pages deploys after CI passes on `main` | `.github/workflows/ci.yml`, `deploy.yml` |

### In progress 🔄 (as of the last update)
- Nothing running. The 300 library is live, and the library-wide wording audit is done: 147 copied sentences were rewritten (details in the test report). `docs/cocktail-list.txt` is a human-readable list of every cocktail and its ingredients; it is a snapshot and must be regenerated if the library changes.

### Next 📋
1. Unused candidate ranks for future growth: 316–325, 332–350 and 357–378 in `data/_research/candidates.json`. Any new research batch should go through the same wording-overlap scan before merging.
2. Data review items from research: grapefruit bitters → `orange-bitters` (Blinker), crème de noyaux → `amaretto` (Pink Squirrel), red chilli → `jalapeno` (Spicy Fifty), Venetian Spritz vs Spritz overlap. Candidates for new IDs: `creme-de-noyaux`, `apricot-eau-de-vie`, a generic chilli.
3. Open BA observations from QA: Kir's second recipe source disagrees with IBA; Mai Tai's two rums are merged into one line; teaspoon amounts are stored as `barspoon`.
4. UI gaps vs the design spec: mobile bottom-sheet chooser, sticky mobile CTA, "how it works" idle strip, card stagger animation.
5. Manual QA: Safari, Firefox and mobile devices, NVDA/VoiceOver, Lighthouse on the live site.
6. Evidence for the next milestone (`beta-0.5`): log interventions, defects, interruptions and resumes as they happen (`evidence.mjs event …`, skill `milestone-evidence` §1); number acceptance criteria in stories (`US-E1-01/AC1`) and name them in tests; set `evidence.smokeMarker` to a build-specific string and tag release commits; token usage is now snapshotted automatically at every session start into `docs/evidence/usage.jsonl` (commit it with your work; run `evidence.mjs usage` on any other machine you use); add list prices to `evidence.pricing` for a dollar estimate; run one controlled recovery test from `CATCH-UP.md`.

**Lesson for future research dispatches:** give each agent its own scratchpad subfolder in the prompt (they share one scratchpad root and overwrote each other's helper scripts), and tell them never to shorten a candidate's name when another candidate shares the base name.

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
