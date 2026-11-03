# RefView CHECKLOG

This is a manually verified orientation note, not an automatic changelog or the source of task status. Before acting, compare it with Git, code, `PRODUCT.md`, active feature requirements, and `docs/specs/tasks.md`.

## Current state

- Current phase: RV-002 and RV-003 are in review; authoritative task status remains in `docs/specs/tasks.md`.
- What exists: product definition, product journeys/roadmap, project agent policy, orchestration plan, technology decision, initial ADRs, canonical tracker, source-backed first-incident brief, shared contracts, testing strategy, adjustable tickets, and a bilingual interactive static product prototype with a documented design system.
- What does not exist: Next.js application workspace, database, playable 3D simulator, production tests, or deployment. The prototype's generated scene images are visual concepts, not validated animation or evidence.
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

## Resume next

1. Read `docs/specs/tasks.md` for the current task state.
2. Capture Nicolas's review of RV-002. RV-003 passed independent contract review but remains pending that authoring decision.
3. Bootstrap the application foundation without treating the draft incident as accepted content; freeze affected scenario contracts after RV-002 review.
