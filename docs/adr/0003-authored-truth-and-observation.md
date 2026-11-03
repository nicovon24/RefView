# ADR-0003: Separate authored truth from observable evidence

- Status: Accepted
- Date: 2026-11-02

## Decision

Scenario facts remain invariant. A user's position, camera orientation, distance, occlusion, and timing determine what evidence was reasonably observable. Evaluation records decision quality and observation separately.

## Rationale

RefView must not reward correct guesses made without seeing decisive evidence. It also must not change the answer when a user adopts another viewpoint.

## Consequences

- Observation requires explicit evidence definitions and measurable visibility conditions.
- Replay may reveal evidence only after the attempt reaches an authorized state.
- Overall scoring cannot hide the separate dimensions.
