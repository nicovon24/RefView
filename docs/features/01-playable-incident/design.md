# First playable incident design

## Design status

The incident brief and shared contracts are drafted. The shared contracts passed independent review but remain unfrozen until Nicolas reviews the proposed incident content. The running scene will also require his visual review before it becomes accepted training content. The selected camera starts behind the referee and offers first person as a toggle.

RV-004 is a verified scenario-independent bootstrap: application/tooling, bilingual shell, neutral Canvas lifecycle, and real database connection proof. Scenario facts, contracts, domain behavior, models, and migrations remain gated on the RV-002/RV-003 review and freeze.

## Canonical incident

At an authored match minute, an attacking midfielder sends a through pass into the right channel. The receiver is onside by a visible margin. A pursuing defender fails to play the ball and carelessly trips the attacker just inside the penalty area. A covering defender is positioned to prevent a DOGSO interpretation. The reviewed outcome is a penalty kick with no disciplinary sanction.

The contact should be unequivocally inside the area while remaining visually close enough to the boundary to test positioning. An exactly-on-the-line case is deferred because it would mix geometry ambiguity with the first movement and visibility validation.

## Required clocks

- `scenarioTick`: canonical authored time.
- `sessionElapsed`: active user-session duration.
- `matchClock`: displayed football time, including explicit authored jumps.
- `videoFrame`: derived VAR/replay timebase when later required.

XState controls workflow states but does not own a competing simulation clock.

## Main referee flow

```text
loading -> briefing -> ready -> playing -> deciding -> debrief -> replay -> complete
```

Failure and pause states must preserve or safely restore the relevant snapshot.

The live camera follows the referee from behind by default. The player can adjust distance and lateral framing and switch to stabilized first person without changing the canonical timeline or evidence facts. The playable scene must establish whether these controls preserve orientation and reveal meaningful changes in visible evidence.

## Observation model

Evidence is defined independently from the answer key. The initial implementation must account for:

- Camera-to-evidence distance.
- Camera orientation and field of view.
- Actor and environment occlusion.
- Evidence timing window.
- Whether the user looked toward the evidence during that window.

The first model may be deliberately simple, but its limitations must be measured and documented. A single unobstructed ray must not be presented as proof of human perception.

## Public and private content

The playable client receives only data necessary to render and run the incident. The reviewed rubric and private evaluation details remain behind a server boundary. This reduces accidental leakage but is not an anti-cheat guarantee for a client-rendered scene.

## Planned module boundaries

```text
domain: IDs, clocks, scenario/session/attempt contracts
simulation: deterministic playback, input sampling, observation summaries, replay
content: versioned authored incident and public/private projections
data: Prisma/PostgreSQL persistence
web: product shell, simulator UI, R3F rendering, server boundaries
```

## Contract documents

- [`../../contracts/coordinates.md`](../../contracts/coordinates.md)
- [`../../contracts/scenario.md`](../../contracts/scenario.md)
- [`../../contracts/clocks-and-events.md`](../../contracts/clocks-and-events.md)
- [`../../contracts/observation-and-camera.md`](../../contracts/observation-and-camera.md)
- [`../../contracts/decision-and-evaluation.md`](../../contracts/decision-and-evaluation.md)
- [`../../contracts/session-and-persistence.md`](../../contracts/session-and-persistence.md)
- [`../../architecture/testing.md`](../../architecture/testing.md)
- [`incident-brief.md`](incident-brief.md)

Detailed implementation ownership and gates are in [`tasks.md`](tasks.md).

## Risks

- Animation quality may prevent the intended contact from reading clearly.
- Camera motion may cause discomfort or undermine observation.
- A simplistic visibility metric may overstate what was observable.
- Player/ball physics may drift from authored facts if responsibilities are not separated.
- A correct rule label can still be visually unsupported; Nicolas must review both.
