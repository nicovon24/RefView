# First playable referee incident

Status is tracked only in `../../specs/tasks.md`.

## Route and objective

**Delegated SDD.** This feature crosses product UI, deterministic simulation, 3D rendering, persistence, football interpretation, and browser acceptance. Shared contracts must be resolved before independent implementation tasks begin.

The objective is to let a desktop user brief, play, decide, review, and replay one authored penalty-area incident, with evidence availability affected by referee positioning and no dependency on an AI provider.

## Scope

- Main referee role with a stabilized third-person camera behind the referee by default, first-person toggle, and adjustable distance and lateral framing.
- One clear authored incident with approximately six to ten relevant player actors.
- Onside buildup, careless trip just inside the penalty area, covering defender, penalty kick, and no card.
- Keyboard/mouse locomotion and view control.
- Decision capture for continue/stop, restart, and discipline.
- Deterministic evaluation, debrief, and replay.
- Spanish initial interface and English alternative.
- Versioned Laws edition and competition settings.
- Local persistence of the completed attempt through PostgreSQL once RV-006 is implemented.

## Limits

- Assistant referee and VAR are designed against the shared timeline but are not complete until they have meaningful playable tasks.
- Mobile simulator controls are excluded.
- Autonomous football-player behavior and continuous full matches are excluded.
- AI-generated facts, scoring, or answer keys are excluded.
- Visual realism is a target to validate, not a completion claim.

## Observable acceptance

- **INC-REQ-001:** One immutable scenario version defines actor, ball, event, and evidence state on a canonical integer-tick timeline used by live play and replay.
- **INC-REQ-002:** The main referee can move with keyboard controls, sprint, look independently with pointer lock, switch between third-person and first-person cameras, adjust distance and lateral framing, pause safely, and recover from focus/pointer loss.
- **INC-REQ-003:** At least one documented good position exposes the decisive contact and at least one poor position genuinely occludes it without changing incident facts. Deterministic captures validate both positions in first person and default third person; framing that reveals camera-only evidence must not earn referee observation credit.
- **INC-REQ-004:** The user must take and confirm an initial decision: continue or stop, relevant restart, and disciplinary action.
- **INC-REQ-005:** The reviewed answer is penalty kick with no card, supported by versioned scenario facts, competition settings, official references, and Nicolas's domain review.
- **INC-REQ-006:** Replay seeking the same tick reproduces the same authored world state and provides only perspectives permitted after the attempt.
- **INC-REQ-007:** Evaluation reports decision quality, observation/positioning, communication, and protocol separately and does not award strong observation for an unsupported correct guess. Observation credit requires simultaneous referee-eye and displayed-camera readability; camera-only evidence is identified after finalization.
- **INC-REQ-008:** The debrief connects observed and missed evidence to the reviewed decision and offers a replay or next action without requiring an AI provider.
- **INC-REQ-009:** A completed attempt records scenario version, session context, timeline markers, movement/observation summary, decisions, and deterministic evaluation idempotently.
- **INC-REQ-010:** The complete flow works in Spanish by default and in English, includes loading/error/quality states, and is verified in a named desktop Chrome environment using Playwright CLI plus visual inspection.

## Required evidence

- Unit tests for timeline, replay, public/private scenario boundaries, observation, and evaluation.
- PostgreSQL integration tests for versioned attempt persistence and idempotency.
- Playwright CLI flow from briefing through debrief and replay.
- Deterministic screenshots or recordings from defined ticks and viewpoints.
- Measured frame-rate and loading observations on the declared device/browser.
- Football-content review by Nicolas.
- Independent integrated review against these requirements.

## Next step

Obtain independent review of the RV-003 contracts and Nicolas's review of the RV-002 football proposal. After reconciliation, RV-004 may bootstrap the application. Rendered visual approval remains a later RV-008/RV-011 gate.
