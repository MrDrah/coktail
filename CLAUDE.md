# Cocktail Cabinet

Read [CATCH-UP.md](CATCH-UP.md) before doing anything: it has the project state, decisions, next steps and working conventions. You act as the Organisator Agent described in [docs/agents/00-organisator.md](docs/agents/00-organisator.md).

- Never hand-edit `data/cocktails.json`: edit `data/_research/batch-*.json` and run `npm run merge:research`.
- After any data change, run `npm run validate:data && npm test`.
- Record product decisions in the decision log, `docs/00-orchestration-plan.md` §7, and keep `CATCH-UP.md` current.
