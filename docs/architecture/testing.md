# Verification and TDD strategy

## Test layers

| Layer | Tool | Required proof |
| --- | --- | --- |
| Pure domain | Vitest | Contract validation, coordinates, event order, state transitions, decision consistency, evaluation reason codes |
| Simulation | Vitest | Fixed-tick advance, pause, seek, replay checksum, FPS independence, observation windows |
| Persistence | Vitest plus real PostgreSQL | Constraints, transactions, ownership, idempotency, immutable versions, refresh recovery |
| Component/integration | Vitest where valuable | Decision steps, locale behavior, loading/errors, state-machine adapters |
| Browser flow | Playwright CLI | Spanish default, English persistence, pointer/focus lifecycle, decision, finalization, debrief, replay, responsive shell |
| WebGL evidence | Deterministic ticks/cameras plus screenshots/recording | Good/poor evidence contrast, animation/contact readability, camera comfort, visual regressions |
| Performance | Named browser/device and quality preset | Load observations, frame-time/FPS sample, long-frame recovery, resource limits |

## TDD rule

For deterministic behavior, record the intended failing assertion before implementation and the focused passing result afterward. Red evidence must fail for the missing behavior, not for a broken test environment. Static prose, visual exploration, and aesthetic polish do not need artificial red tests.

Each task records exact commands, observed results, Git reference or precise diff scope, and limitations. A later relevant edit invalidates affected evidence.

## Required fixtures

- One valid and multiple invalid scenario contracts.
- A negative playable-projection fixture containing answer-key, evidence, semantic-ID, and offence-event leaks.
- Tick/event fixtures at boundaries and same-tick ordering.
- 30/60/144 render-cadence equivalence.
- Good/poor view traces for the same canonical incident.
- Four referee-eye/rendered-camera readability cases: both, camera only, referee eye only, neither. Alternating visibility at different ticks must not count as simultaneous visibility.
- Camera mode switching, maximum permitted distance/lateral offsets, collision-adjusted camera pose, and replay isolation from live observation credit.
- Correct guess without decisive evidence.
- Duplicate finalization with same and conflicting payloads.
- Concurrent finalization under different idempotency keys.
- Anonymous-owner and wrong-owner access attempts.
- Spanish default and persisted English preference.

Browser automation follows the project `AGENTS.md`: use the `playwright-cli` skill and command. A formal UI-guideline audit uses `web-design-guidelines`. DOM assertions alone cannot accept the visual incident.
