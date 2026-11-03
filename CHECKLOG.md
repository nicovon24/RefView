# RefView CHECKLOG

This is a manually verified orientation note, not an automatic changelog or the source of task status. Before acting, compare it with Git, code, `PRODUCT.md`, active feature requirements, and `docs/specs/tasks.md`.

## Current state

- Current phase: RV-002 football brief, RV-003 shared contracts, and RV-004 foundation are verified; RV-005 TDD core is in progress. Authoritative task status remains in `docs/specs/tasks.md`.
- What exists: the previous product/design/documentation foundation plus a Next.js App Router workspace, Spanish/English routes, a neutral WebGL field preview, pinned dependencies, Vitest locale tests, a generated-Prisma-client connection smoke test against local PostgreSQL, a reviewed pure canonical-timeline fixture/checksum slice, and reviewed pure fixed-step live/replay cursors. The root test suite passes 46 tests.
- What does not exist: an authored or playable incident, referee movement, complete scenario validation, observation logic, persistence models/migrations, scored attempts, AI requests, or deployment. The static prototype's generated scene images remain visual concepts, not validated animation or evidence.
- Repository baseline before the foundation: branch `master`, commit `c9e5204 Initial commit`, and an existing zero-byte untracked `prompt.md` that remains untouched. The user subsequently supplied the GitHub repository URL for versioning.

## Decisions

- Use a deterministic authored timeline as the truth of each incident.
- Use a modular Next.js application with a client-side R3F simulator.
- Use Prisma ORM 7 with PostgreSQL.
- Use Radix Primitives with a custom RefView visual system.
- Use TDD for deterministic behavior and Playwright CLI for browser verification.
- Keep AI optional and non-authoritative.
- Compose early sessions from authored sequences with explicit time jumps.
- Start the main-referee experience behind the referee, with first-person toggle and adjustable camera distance/lateral framing; validate comfort in the playable scene.
- Request Astra xhigh for fundamental planning and Astra high for other substantial planning; retain the established Sol/Luna implementation, research, and review roles.

## Recent changes

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-11-02 | Established and independently reviewed the RefView product, SDD, model-routing, and orchestration foundation. | Root documents, `docs/architecture/orchestration.md`, initial ADRs, `docs/features/01-playable-incident/`, and `docs/features/00-foundation/review.md`. |
| 2026-11-02 | Drafted the IFAB 2026/27 incident brief, shared domain/persistence/testing contracts, product journeys, stack rationale, and RV-004-RV-011 task contracts. Independent review passed after seven contract corrections. | `docs/features/01-playable-incident/incident-brief.md`, `docs/features/01-playable-incident/review.md`, `docs/contracts/`, `docs/architecture/technology-stack.md`, `docs/architecture/testing.md`, and `docs/product/`. |
| 2026-11-02 | Added an adjustable full-product backlog for visual concept, simulator roles/sessions, Academy, Community, Assessments, Profile, Coach, and later simulator research. Independent consistency review passed after three corrections. | `docs/features/README.md`, `docs/features/00-foundation/backlog-review.md`, feature directories `02` through `09`, and `docs/specs/tasks.md`. |
| 2026-11-03 | Built and visually reviewed the bilingual static product prototype; documented the RefView design system. The independent finish review returned SHIP for the visual concept, while gameplay and several supporting concept states remain pending. | `docs/prototype/`, `DESIGN.md`, `.impeccable/design.json`, and RV-018 in `docs/specs/tasks.md`. |
| 2026-11-03 | Verified scenario-independent RV-004 bootstrap. Locked install, Prisma generate/validate, Vitest, real PostgreSQL smoke, lint/typecheck/build, Chrome desktop/mobile navigation, simulated no-WebGL fallback, and independent shared-config review passed. | `apps/web/`, `compose.yaml`, `pnpm-lock.yaml`, `docs/features/01-playable-incident/review.md`, and RV-004 in `docs/specs/tasks.md`. |
| 2026-11-03 | Nicolas approved the RV-002 first-incident football brief. Rendered-evidence approval remains separate. A fresh read-only audit identified executable RV-005 contract details to reconcile before freezing RV-003. | `docs/features/01-playable-incident/incident-brief.md`, `docs/features/01-playable-incident/review.md`, and RV-002/RV-003 in `docs/specs/tasks.md`. |
| 2026-11-03 | Frozen RV-003 after an executable timeline addendum and independent `FIX`/correction/`PASS` review; prepared coordinator-owned domain/simulation package configuration. Began RV-005 with sequential TDD handoffs. | `docs/contracts/clocks-and-events.md`, `docs/contracts/scenario.md`, `packages/domain/`, `packages/simulation/`, and `docs/features/01-playable-incident/review.md`. |
| 2026-11-03 | Completed the narrow RV-005 handoff A fixture/checksum slice with tests-first red/green evidence and independent `PASS` after two focused correction rounds. Playback, observation, and scoring remain open. | `packages/domain/src/`, `docs/features/01-playable-incident/review.md`. |
| 2026-11-03 | Completed RV-005 handoff B pure playback with red/green evidence and independent `PASS` after removing a callback path that could skip events. Observation, scoring authority, and UI integration remain open. | `packages/simulation/src/`, `docs/contracts/clocks-and-events.md`, `docs/features/01-playable-incident/review.md`. |

## Resume next

1. Read `docs/specs/tasks.md` for the current task state.
2. Pin the RV-005 observation calibration contract, then implement and independently review its TDD slice. The initial referee scene remains a later ticket.
3. Keep the neutral field distinct from incident evidence. RV-006 PostgreSQL persistence may begin independently only with bounded schema ownership and real database tests.
