# Simulator expansion task contracts

## RV-012 - Freeze configurable-session and role contracts

- Requirements: SES-REQ-001 through SES-REQ-005, ROLE-REQ-001, AR-REQ-001, VAR-REQ-001.
- Dependencies: RV-011.
- Deliver: reviewed session/catalog/match-state/role-decision/evidence-permission contracts, valid/invalid examples, version migration plan, and updated implementation tickets.
- Acceptance: independent read-only review; no contradiction with canonical facts, publication lifecycle, replay secrecy, or persistence.

## RV-013 - Deterministic authored-session composer

- Requirements: SES-REQ-001 through SES-REQ-004.
- Dependencies: RV-012.
- Ownership: pure domain/simulation paths only.
- Deliver: seeded composer, compatibility/precondition checks, stable ordering, duration result/explanation, and explicit transitions.
- Red/green evidence: same seed/snapshot, no eligible content, insufficient variety, duration bounds, incompatible entry state, effect ordering, retirement, and no unintended repetition.

## RV-014 - Session setup, progression, and recovery

- Requirements: all SES requirements.
- Dependencies: RV-013 and the current accepted simulator flow.
- Deliver: bilingual configuration UI, immutable plan persistence, item progression, debrief/continue, visible time jumps, retry, and recovery.
- Acceptance: real PostgreSQL owner/idempotency tests and Playwright CLI complete session flow. One production incident is represented honestly.

## RV-015 - Meaningful assistant-referee task

- Requirements: ROLE-REQ-001, AR-REQ-001, SIM-ACC-001.
- Dependencies: RV-012, RV-014, and one separately reviewed assistant-compatible scenario brief.
- Deliver: touchline locomotion/alignment, observation window, flag/signal decision, structured communication, dimensional evaluation, replay, and debrief.
- Acceptance: canonical checksum across roles, good/poor alignment captures, TDD, persistence, Playwright flow, and Nicolas's football/visual approval.

## RV-016 - Meaningful VAR workspace and protocol task

- Requirements: ROLE-REQ-001, VAR-REQ-001, SIM-ACC-001.
- Dependencies: RV-012, RV-014, and a reviewed VAR-compatible scenario/initial-decision record.
- Deliver: synchronized feeds, timeline, step, speeds, relevant phase, check/recommendation flow, structured communication, finalization, and protocol debrief.
- Acceptance: TDD for synchronization/permissions/intervention states, persistence/idempotency, Playwright workspace flow, deterministic visual evidence, and Nicolas's protocol review.

## RV-017 - Simulator foundation acceptance

- Requirements: all requirements in this feature.
- Dependencies: RV-014 through RV-016.
- Deliver: named-browser/device/quality acceptance record, human test protocol/results, performance observations, limitations, catalog coverage, and independent review.
- Acceptance: all roles and configured session complete without AI; visual evidence and comfort are human-reviewed; claims match measured behavior.

RV-017 is the product-order gate for Academy. It does not require a large scenario catalog or autonomous match.
