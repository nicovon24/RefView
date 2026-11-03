# ADR-0002: Use one deterministic canonical timeline

- Status: Accepted
- Date: 2026-11-02

## Decision

Every authored incident uses one versioned timeline with integer ticks and stable event ordering. Main referee, assistant, VAR, replay, and debrief query the same timeline.

## Rationale

Changing perspective must not change the play. Deterministic seeking, replay, evaluation, regression tests, and shared role evidence depend on a single source of temporal truth.

## Consequences

- Rendering frame rate does not define simulation time.
- Visual interpolation may smooth between ticks without changing facts.
- Physics cannot author the reviewed foul or ball-contact facts at runtime.
- Session clock, match clock, and sequence time remain distinct.
