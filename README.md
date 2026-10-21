# Cocktail Discovery (MVP)

Enter 2–10 ingredients you have and get authentic cocktails (at least 1; up to 6 for 2–4 ingredients, up to 8 for 5–10) you can make with them, or with any subset of them. Each cocktail comes with its full recipe, history and taste notes. If nothing matches, the app suggests near matches that need just one more ingredient.

- No login.
- No backend: a static site with a client-side flat JSON library of 500 cocktails.
- No AI at runtime: the BA researches real cocktails from reputable sources; the app is deterministic matching logic.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # engine + UI tests
npm run build          # static site in dist/
npm run validate:data  # check the cocktail library
```

## Project organisation

This project is delivered by four specialised agents, coordinated by an Organisator.

| Doc | Purpose |
|-----|---------|
| [docs/00-orchestration-plan.md](docs/00-orchestration-plan.md) | Shared business rules (BR-01 to BR-11), data contracts, phases, handoff gates, Definition of Done |
| [docs/agents/01-business-analyst.md](docs/agents/01-business-analyst.md) | BA brief: user stories, schema, ingredient dictionary |
| [docs/agents/02-ux-ui-designer.md](docs/agents/02-ux-ui-designer.md) | UX/UI brief: frosty design system, components, flows |
| [docs/agents/03-developer-architect.md](docs/agents/03-developer-architect.md) | Dev brief: architecture, normalizer, subset matcher, near-match fallback |
| [docs/agents/04-qa-engineer.md](docs/agents/04-qa-engineer.md) | QA brief: test strategy, 50-recipe verification, sign-off |

## Repository layout

```
docs/      plans, agent briefs, and per-agent outputs (ba/, dev/)
design/    UX tokens, component specs, flows, copy
data/      ingredients.json, cocktails.json, schema/
src/       domain/ (pure matching logic), ui/
scripts/   data validation & build tooling
tests/     plan/, oracle/, library/, e2e/, reports/
```

## Workflow

1. BA produces the stories, schema and dictionary (handoff H1).
2. UX produces the design specs (H2), while Dev builds the domain engine against the draft schema.
3. Dev builds the UI and hands over a preview build (H3).
4. QA verifies and signs off (H4).
