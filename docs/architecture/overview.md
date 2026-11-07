# RefView architecture overview

## Initial shape

RefView begins as a modular Next.js application with a pure deterministic simulation core and a client-only 3D renderer.

```text
Next.js product shell
  |-- Server Components: reads and rendered content
  |-- Server Actions: owner-validated same-origin mutations
  |-- Route Handlers: auth, AI streaming, webhooks, telemetry
  |-- Prisma/PostgreSQL: users, versions, attempts, progress, community
  `-- Client simulator
       |-- session workflow
       |-- canonical timeline core
       |-- observation and evaluation contracts
       `-- R3F renderer, input, audio, and auxiliary physics
```

## Authority boundaries

- Authored scenario data establishes incident facts.
- The timeline establishes the state at an integer tick.
- The renderer presents timeline state and must not redefine it.
- User movement affects viewpoint and evidence access, not the authored play.
- Deterministic evaluation owns scoring.
- The database persists versions and attempts.
- The AI Coach receives permitted results and has no write path to facts or scores.

## Initial repository boundaries

Create packages only after their contracts exist:

```text
apps/web
packages/domain
packages/simulation
packages/content
packages/data
```

Avoid additional services, queues, realtime infrastructure, vector databases, or autonomous-match systems until a verified requirement demands them.

## Detailed contracts

- [Technology stack](technology-stack.md)
- [Coordinates](../contracts/simulator-timeline.md#coordinates)
- [Scenario versions](../contracts/simulator-timeline.md#scenario)
- [Clocks and events](../contracts/simulator-timeline.md#clocks-and-events)
- [Observation and camera](../contracts/observation-evaluation.md#observation-and-camera)
- [Decision and evaluation](../contracts/observation-evaluation.md#decision-and-evaluation)
- [Session and persistence](../contracts/simulator-timeline.md#session-and-persistence)
- [Testing](testing.md)
