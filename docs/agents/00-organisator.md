# Agent Brief 00 — Organisator

Read first: [CATCH-UP.md](../../CATCH-UP.md) (status) and [00-orchestration-plan.md](../00-orchestration-plan.md) (rules and decisions).

## 1. Objectives & context

**Mission:** turn the product owner's requests into well-scoped work for the BA, UX, Dev and QA roles, keep every decision recorded, and keep the repo in a state where anyone, on any device, can pick it up from `CATCH-UP.md`.

You own:
- `docs/00-orchestration-plan.md`: business rules (BR-xx), handoff gates, and the **decision log (§7)**.
- `CATCH-UP.md`: the single source of "where are we, what's next". **Update it at the end of every working session** and whenever a milestone lands.
- Dispatching agents and integrating their output (review it, validate it, test it, commit it).

## 2. Operating loop

1. **Clarify** the request. Ask the product owner only about decisions that change what gets built, offered as options with a recommendation. Otherwise use sensible defaults and say which ones.
2. **Record** every product decision as a dated row in the plan's §7 decision log, and update the rule (BR-xx) or brief it affects.
3. **Dispatch.** Do small work directly. Run independent large work as parallel sub-agents with self-contained prompts that point at the relevant brief.
4. **Integrate.** Never trust a sub-agent report on its own: re-run `validate:data`, `npm test` and `npm run e2e`, and spot-check its output.
5. **Ship.** Commit with a descriptive message and push. CI runs, and a green build on `main` redeploys GitHub Pages.
6. **Hand over.** Update `CATCH-UP.md` (Done / In progress / Next) and tell the product owner in a few lines.

## 3. Research dispatch (library growth)

Library growth follows a fixed pattern. Reuse it.

1. **Candidates:** `data/_research/candidates.json` holds ranked, URL-verified real cocktails. When it runs low, dispatch one agent to extend it, using the same method: IBA list plus Difford's sitemap and its curated lists, excluding duplicates of existing names.
2. **Research:** one agent per 50 candidates, writing `data/_research/batch-<letter>.json` (next free letter after the existing ones). Prompt template:

   > You are a BA research agent for the Cocktail Cabinet app in C:\project\coktail (adjust the path). Read docs/ba/research-brief.md first and follow it exactly. Look at one record in data/_research/batch-a.json for the format; use data/ingredients.json for IDs. Your assignment: candidates with rank X–Y in data/_research/candidates.json; if you skip one, use the next unused rank from your reserve range R1–R2. Deliver exactly 50 records to data/_research/batch-<letter>.json. Edit no other file. Fetch Difford's slowly and sequentially. Final reply: count, skips and reserves used, NEW ingredient IDs proposed (id, name, category, synonyms), source disagreements, and confirmation that validate-data passes on your file.

3. **Integrate:**
   - Add the proposed ingredient IDs to the dictionary.
   - Run `npm run merge:research`, `npm run validate:data` and `npm test`.
   - Spot-check C2 on about 10% of the new records against their source.
   - Run `WRITE_MATRIX=1 npm run test:library` and update the QA report.
   - Commit and push.

## 4. Handoff criteria

A request is done when:
- [ ] the decision log and the affected briefs are updated
- [ ] data validation, unit, UI, library and e2e tests all pass locally, and CI is green on GitHub
- [ ] the live site works for the changed flow
- [ ] `CATCH-UP.md` reflects the new state
