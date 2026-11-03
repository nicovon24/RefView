# Simulator expansion

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Shared role, session, replay-permission, and match-state contracts must be reviewed before implementation.

## Objective

Extend the accepted main-referee incident into honest configurable authored sessions and meaningful assistant-referee and VAR tasks without requiring autonomous matches.

## Observable acceptance

- **SES-REQ-001:** Configuration includes role, target duration, topic, difficulty, Laws edition, and competition profile, showing unavailable combinations honestly.
- **SES-REQ-002:** A seed plus immutable eligible-catalog snapshot reproduces the same ordered session plan.
- **SES-REQ-003:** Explicit transitions preserve reviewed match state and display source/destination match time; omitted football is never presented as simulated.
- **SES-REQ-004:** Duration and variety claims reflect actual eligible published content.
- **SES-REQ-005:** Owner-validated progression, retry, reload, and partial completion are durable and idempotent.
- **ROLE-REQ-001:** Every supported role has meaningful movement or evidence work, decisions, communication, permissions, and separate evaluation dimensions.
- **AR-REQ-001:** The assistant task requires touchline movement/alignment, observation, signaling, and communication on the canonical timeline.
- **VAR-REQ-001:** The VAR task provides synchronized authorized feeds, scrub/frame step/speeds, check versus recommendation, and preservation of the referee's initial decision.
- **SIM-ACC-001:** Supported simulator flows work without an AI provider and pass declared human-readability, comfort, browser, and performance gates.

## Limits

- No camera-only role card counts as playable.
- No multiplayer officials, speech recognition, automatic offence detection, generated answer keys, mobile simulator controls, or autonomous full match.
- A learner's incorrect decision does not rewrite canonical future facts.
- Production may expose only one eligible incident until distinct reviewed content exists.

## Next contracts to resolve

- Define `MatchState` and `MatchEffect` rather than leaving them as placeholders.
- Generalize one decision gate to role-specific and later multi-decision contracts.
- Make replay/evidence permissions role-aware so VAR can inspect evidence without exposing educational answers.
