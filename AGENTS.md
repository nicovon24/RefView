# RefView agent guide

RefView is a Spanish-first, bilingual football refereeing product. The current delivery order is Academy Law summaries and controlled lesson publication, Assessments, the clearly fictional Community visual journey, and early Profile, followed last by the local 3D playtest and saved/scored first authored simulator incident. Cosmetic simulator refinement follows functional acceptance. Evidence-critical incident defects still block training publication. Code, identifiers, configuration, comments, and technical documentation must be written in English.

## Resume protocol

Before changing the project:

1. Inspect the Git branch, commit, and local changes.
2. Read this file, `PRODUCT.md`, `README.md`, and `CHECKLOG.md`.
3. Read `docs/specs/tasks.md` and the active feature requirements.
4. Inspect the relevant implementation or confirm that it does not exist.
5. Reconcile conflicting claims before editing.

`docs/specs/tasks.md` is the only source of task status. `CHECKLOG.md` is a manually verified orientation note, not a second task board. Feature task files define work contracts without duplicating status.

## Product boundaries

- The simulator, curated facts, deterministic scoring, rule references, and prepared debrief must work without an AI provider.
- The AI Coach may explain an already evaluated attempt. It must not create scenario facts, change answer keys, score attempts, or expose hidden facts during an attempt.
- Authored scenario facts are canonical. Camera position, orientation, distance, and occlusion affect observable evidence, never the underlying incident.
- Physics may support locomotion, collisions, and presentation. It must not determine the reviewed football facts of an authored incident.
- Live play, replay, assistant, and VAR perspectives must use one versioned canonical timeline.
- Community demonstration content must be fictional and clearly labeled.
- Do not claim that illustrated, planned, or mocked behavior is implemented.

## Technical direction

- Next.js App Router and strict TypeScript.
- Server Components for server-side reads, Server Actions for owner-validated same-origin mutations (authenticated user or anonymous session), and Route Handlers for HTTP endpoints and streaming.
- Prisma ORM 7 pinned to a stable version with PostgreSQL.
- Radix Primitives, Tailwind CSS, CVA, and custom RefView components.
- Shared application components live in `apps/web/src/components`; feature-specific components stay with their feature.
- Three.js, React Three Fiber, Drei, and Rapier for the browser simulator.
- XState for session workflow and Zod for runtime contracts.
- Spanish is the initial locale; English must remain supported.

## TDD and verification

TDD is required for deterministic domain behavior, including timeline, replay, session transitions, observation, evaluation, scoring, persistence, and authority boundaries.

- Use Vitest for pure and integration behavior.
- Test persistence against PostgreSQL behavior rather than replacing it with SQLite or broad ORM mocks.
- Use the `playwright-cli` skill and command for browser navigation, interactions, responsive checks, screenshots, and user-flow verification.
- Use `web-design-guidelines` for explicit UI accessibility or design-guideline audits.
- WebGL acceptance requires deterministic ticks/cameras plus visual inspection; DOM assertions alone do not prove incident readability.
- Record the exact commands and observed outcomes. A passing test before a relevant later edit is not evidence for the edited behavior.

## SDD workflow

Use proportional SDD under `docs/features/<slug>/`:

- `requirements.md`: objective, scope, limits, observable `REQ-*` acceptance, and evidence links.
- `design.md`: contracts, alternatives, boundaries, and risks.
- `tasks.md`: task contracts and dependencies without status columns.
- `review.md`: independent review evidence when required.

The coordinator owns shared contracts, project documentation, root configuration, the lockfile, schema coordination, integration, and task status. Resolve shared contracts before delegating dependent work.

## Delegation and model policy

Only the coordinator delegates. Keep at most four subagents active, subject to the runtime's actual session limit. Delegate only bounded, independent tasks with satisfied dependencies, observable acceptance, exclusive paths, required verification, and an expected handoff. Subagents must not delegate, update the canonical tracker, revert other work, stage broadly, or modify files outside their assignment.

Request models as follows:

| Work | Requested model | Effort |
| --- | --- | --- |
| Fundamental product, domain, architecture, authority, or shared-contract decisions | `gpt-6-astra` | `high` |
| Substantial but non-fundamental planning, decomposition, and coordination | `gpt-6-astra` | `high` |
| Bounded implementation | `gpt-6-sol` | `medium` |
| Focused research | `gpt-6-luna` | `high` |
| Independent read-only review | `gpt-6-sol` | `high` |

Record requested model/effort separately from runtime-confirmed model/effort. Use `unconfirmed` when the runtime does not expose confirmation. A task name, profile, or global default is not proof of the effective runtime model.

Prefer Astra `high` for planning and coordination to conserve usage. Reserve Astra `xhigh` for exceptional decisions where the additional reasoning is clearly justified; do not select it by default.

Every delegated task must return changed files, requirements covered, red/green evidence where TDD applies, commands and observed results, remaining limitations, and requested versus runtime-confirmed identity.

## Review policy

An independent read-only review is required for delegated implementation, shared configuration, authentication, authorization, privacy, persistence contracts, scoring authority, and final milestone acceptance. A relevant edit after review reopens the affected review. After two correction rounds without convergence, reduce or redesign the task.

## Safety and ownership

- Preserve user changes and unrelated work. The untracked `prompt.md` predates project scaffolding and must not be modified without explicit direction.
- Keep implementation changes local by default. Do not stage files, create commits, or push to GitHub without Nicolas's explicit permission for that action, even if an earlier turn authorized a previous commit or push. A request to continue implementation is not Git authorization.
- Do not create a remote repository, deploy, purchase assets, or enable a paid provider unless the user asks.
- Check licenses and document the origin of every external asset, animation, sound, rule excerpt, and reference.
