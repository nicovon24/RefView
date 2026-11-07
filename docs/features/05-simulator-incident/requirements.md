<a id="01-playable-incident"></a>

<a id="01-playable-incident--first-playable-referee-incident"></a>
## First playable referee incident

Status is tracked only in `../../specs/tasks.md`.

<a id="01-playable-incident--route-and-objective"></a>
## Route and objective

**Delegated SDD.** This feature crosses product UI, deterministic simulation, 3D rendering, persistence, football interpretation, and browser acceptance. Shared contracts must be resolved before independent implementation tasks begin.

The objective is to let a desktop user brief, play, decide, review, and replay one authored penalty-area incident, with evidence availability affected by referee positioning and no dependency on an AI provider.

<a id="01-playable-incident--scope"></a>
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

<a id="01-playable-incident--limits"></a>
## Limits

- Assistant referee and VAR are designed against the shared timeline but are not complete until they have meaningful playable tasks.
- Mobile simulator controls are excluded.
- Autonomous football-player behavior and continuous full matches are excluded.
- AI-generated facts, scoring, or answer keys are excluded.
- Visual realism is a target to validate, not a completion claim.

<a id="01-playable-incident--observable-acceptance"></a>
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

<a id="01-playable-incident--required-evidence"></a>
## Required evidence

- Unit tests for timeline, replay, public/private scenario boundaries, observation, and evaluation.
- PostgreSQL integration tests for versioned attempt persistence and idempotency.
- Playwright CLI flow from briefing through debrief and replay.
- Deterministic screenshots or recordings from defined ticks and viewpoints.
- Measured frame-rate and loading observations on the declared device/browser.
- Football-content review by Nicolas.
- Independent integrated review against these requirements.

<a id="01-playable-incident--next-step"></a>
## Next step

RV-002 football-brief approval, RV-003 shared-contract freeze, and RV-004 application foundation are verified. RV-005 pure timeline, C1/C2, evaluation, and workflow adapter are implemented and scoped-reviewed; browser live capture and production scoring remain. RV-006 has isolated PostgreSQL draft/start/finalize/restore proof and a cookie-only browser session proof; real publication and owner-bound browser attempts remain. RV-008's redesigned WebGL authoring scene passed scoped independent visual review, and Nicolas gave positive scoped feedback with later interface/full-screen/character improvements requested. Bind that feedback to exact source/build/capture evidence and complete the remaining training gate before publication. Continue by satisfying publication and live-capture dependencies before integrating the saved/scored RV-009 flow; keep task status in `../../specs/tasks.md`.

---

<a id="03-simulator-expansion"></a>

<a id="03-simulator-expansion--simulator-expansion"></a>
## Simulator expansion

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Shared role, session, replay-permission, and match-state contracts must be reviewed before implementation.

<a id="03-simulator-expansion--objective"></a>
## Objective

Extend the accepted main-referee incident into honest configurable authored sessions and meaningful assistant-referee and VAR tasks without requiring autonomous matches.

<a id="03-simulator-expansion--observable-acceptance"></a>
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

<a id="03-simulator-expansion--limits"></a>
## Limits

- No camera-only role card counts as playable.
- No multiplayer officials, speech recognition, automatic offence detection, generated answer keys, mobile simulator controls, or autonomous full match.
- A learner's incorrect decision does not rewrite canonical future facts.
- Production may expose only one eligible incident until distinct reviewed content exists.

<a id="03-simulator-expansion--next-contracts-to-resolve"></a>
## Next contracts to resolve

- Define `MatchState` and `MatchEffect` rather than leaving them as placeholders.
- Generalize one decision gate to role-specific and later multi-decision contracts.
- Make replay/evidence permissions role-aware so VAR can inspect evidence without exposing educational answers.

---

<a id="09-simulator-research"></a>

<a id="09-simulator-research--later-simulator-expansion-and-research"></a>
## Later simulator expansion and research

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

These tickets are hypotheses after the simulator and wider product foundations. They do not block Academy, Community, Assessments, Profile, or prepared Coach mode.

<a id="09-simulator-research--observable-acceptance"></a>
## Observable acceptance

- **CAT-REQ-001:** Every additional scenario has immutable reviewed facts, tracks, rubric, references, publication, and asset provenance.
- **CAT-REQ-002:** Discoverability and duration claims reflect real compatible published variety.
- **CAT-REQ-003:** Interpretative/inconclusive cases have reviewed allowed outcomes and evidence limits.
- **MUL-REQ-001:** Multi-incident sequences use ordered versioned decision identities and preserve canonical chronology/state.
- **MUL-REQ-002:** Reload/retry applies decisions and effects exactly once without exposing later facts.
- **EXP-REQ-001:** Longer sessions pass declared human-readability, memory, performance, recovery, and deterministic-replay gates.
