# ADR-0004: Compose early sessions from authored sequences

- Status: Accepted
- Date: 2026-11-02

## Decision

Build configurable sessions by selecting compatible versioned authored sequences. Preserve score, cards, competition settings, and match time while showing explicit transitions when time jumps.

## Rationale

This provides configurable practice duration without requiring autonomous football-player behavior or low-value continuous filler.

## Consequences

- Each sequence needs preconditions, entry state, exit effects, duration, topics, roles, and difficulty.
- A seeded composer must reproduce the same session plan.
- The UI must not claim variety beyond the authored catalog.
- Fully autonomous matches remain optional future research.
