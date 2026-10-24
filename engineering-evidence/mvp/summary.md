# Cocktail Cabinet — MVP engineering evidence

Source commit `217726c856a92260aa02fae7748edd06fbd2af73` · collected 2026-10-24T03:00:53.426Z by app-boilerplate/evidence.mjs 0.4.0 · framework app-boilerplate 0.4.0

Overall: **PASS**

<!-- Generated from metrics.json. Do not edit the numbers here; metrics.json is the record. -->

| Category | Status | Figures |
|---|---|---|
| Functional | PASS | 38 of 38 criteria passing (stories), 0 failing, 0 unverified, 0 deferred; completion 100% |
| Human intervention | PASS | 2 interventions, 1 corrective; 0 of 0 agent tasks without correction |
| QA | PASS | 2930 passed / 0 failed / 1 skipped; defects 0 found, 0 open; requirement coverage 100%, code coverage 100% |
| Development cost | UNVERIFIED | billing unknown; tokens n/a (unavailable); API cost n/a (unavailable); infrastructure n/a (unavailable) |
| Recovery | UNVERIFIED | 0 interruptions, 0 resumed, 0 failed; recovery tests 0 passed |
| Delivery | PASS | CI success, deploy success, smoke pass; 0 blockers |

## Blockers
- none recorded

## Missing or unverifiable
- `cost.totalTokens`: no usage export supplied (evidence.mjs collect --usage <file>)
- `cost.apiCostUsd`: no usage export supplied (evidence.mjs collect --usage <file>)
- `cost.infrastructureCostUsd`: no usage export supplied (evidence.mjs collect --usage <file>)
- `delivery.releaseRef`: no tag points at the measured commit

## Limitations
- 38 of 38 stories have no AC IDs, so they are counted as one criterion each.
- Intervention, defect and recovery counts come from the project event log and are only as complete as that log.
- Code coverage shows which lines ran during tests; it is not evidence that the code has no defects.
- Development cost is incomplete: no usage export supplied (evidence.mjs collect --usage <file>).
- No controlled recovery test in this window: the absence of recorded failures is not evidence that work can be resumed reliably.
- The live check has no version marker (evidence.smokeMarker), so it shows the site is up, not that it serves this commit.

## Findings (Metrics agent)

- Functional, QA and delivery are PASS for the measured commit: all 38 stories have at least one executed passing test naming their ID, nothing failed, and CI and deploy both succeeded for that commit. Overall PASS rests on those three categories only.
- Spot-check agreed with the collector: the JUnit files contain 90 and 2841 testcases (2931 in total), 1 skipped and none failing, which matches 2930 executed and passed. The one skip is a keyboard journey test marked as a desktop-only check; it is outside the functional figures as reported.
- Both result files are needed for the 38 of 38 figure: US-E4-04, US-NF-03, US-NF-05 and US-E1-01 are named only by the unit results (junit-2.xml), and US-NF-02 only by the end-to-end results (junit-1.xml). (Corrected by the Orchestrator: the first draft of this bullet had the two files swapped.)
- Completion is counted per story, not per acceptance criterion, because the stories carry no AC numbers. 100% therefore means every story has a passing test, not that every individual Given-When-Then clause was checked.
- Requirement coverage (every story has a test) and code coverage (100% of lines) show what ran, not that the product is free of defects. The collected coverage totals show branch coverage slightly below the line figure.
- Intervention counts are recorded, not reconstructed: the log was started at this milestone, so corrections and failures during earlier MVP development are not captured. The 1 corrective event (Pages enablement) and 0 agent tasks reflect only this window. The log matches the package copy (2 events).
- Delivery is up but not tied to this commit by content: CI and deploy run ids and conclusions match the measured head_sha, and the live check returned HTTP 200, but no version marker is configured, so it does not prove the site serves this commit. No release tag points at the commit (releaseRef is missing).
- Cost is UNVERIFIED: no usage export exists and the project ran on a subscription, so tokens, API cost and infrastructure cost are all missing and must not be read as zero. Next: export usage and run `node .claude/skills/milestone-evidence/scripts/evidence.mjs collect --milestone mvp --revise --reason "add usage export" --usage <file>`.
- Recovery is UNVERIFIED: no interruption, resume or controlled recovery test is recorded, so the ability to resume from CATCH-UP.md is untested. Next: run a fresh-session restore and record it with `node .claude/skills/milestone-evidence/scripts/evidence.mjs event recovery-test --outcome success|failure --summary "..."`.
- Not measurable yet: regression failures (no earlier frozen package) and detection effectiveness (no seeded-defect baseline). Defect counts are zero only because no defect events were logged; QA should record defects with the `defect` event type from now on.
- To strengthen delivery, set `evidence.smokeMarker` in quality-gate.json to a build-specific string served by the page, and tag the release commit, before the next milestone collection.
