# ADR-0001: Start as a modular Next.js application

- Status: Accepted
- Date: 2026-11-02

## Decision

Build RefView initially as one Next.js App Router application with strict TypeScript. Keep deterministic simulation, authored content, evaluation, and data access behind explicit module boundaries. Do not begin with a separate general-purpose backend or autonomous game service.

## Rationale

The first MVP needs a tightly integrated product shell, a client-side 3D experience, ordinary server mutations, and PostgreSQL persistence. A modular application minimizes operational cost while allowing pure domain packages to remain independent of React and Next.js.

## Consequences

- Server Actions are limited to user mutations, never frame or replay control.
- HTTP streaming and external integration use Route Handlers.
- A separate service requires a demonstrated workload or deployment boundary.
