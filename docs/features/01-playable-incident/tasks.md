# First playable incident task contracts

Task status lives only in [`../../specs/tasks.md`](../../specs/tasks.md). Paths below are ownership surfaces to create when the workspace exists; they are not claims that implementation is present.

## RV-002 - Incident content brief

- Requirements: INC-REQ-001, INC-REQ-003, INC-REQ-005.
- Dependencies: RV-001 verified.
- Ownership: coordinator documents; focused official-source research is read-only.
- Deliver: [`incident-brief.md`](incident-brief.md), including chronology, geometry, actors, evidence, Laws edition, competition settings, direct sources, design inferences, and Nicolas review checklist.
- Verify: source links, coordinate/tick consistency, no contradictory perspective, and explicit unresolved visual assumptions.
- Completion boundary: Nicolas can approve the proposed football facts and evidence plan before the 3D scene exists. Actual animation/camera readability remains a separate RV-008/RV-011 acceptance gate.

## RV-003 - Shared contracts

- Requirements: INC-REQ-001 through INC-REQ-009.
- Dependencies: RV-002 may be drafted during contract review but must be approved/`Verified` before RV-003 freezes; any later domain-review change reopens affected contracts.
- Ownership: coordinator only until frozen.
- Deliver: all files under `docs/contracts/`, the testing strategy, state machine, valid/invalid examples, server authority, anonymous/user ownership, and idempotent finalization.
- Verify: independent read-only review; every invalid example maps to a future Zod/domain/database test; renderer, client, physics, and AI have no scoring authority.
- Stop condition: do not implement domain or persistence behavior while coordinate, time, public/private, decision, or persistence semantics remain unresolved. RV-004 may proceed within its scenario-independent boundary.

## RV-004 - Workspace and test foundation

- Requirements: INC-REQ-010.
- Dependencies: RV-001 verified and this scenario-independent bootstrap boundary reconciled across tracker, requirements, design, and review addendum. RV-003 freeze is not required for RV-004; it remains required for RV-005 and RV-006.
- Ownership/writes: coordinator-owned root manifests, lockfile, shared configuration, initial application boundaries, and connection-only database setup.
- Scope boundary: infrastructure, Spanish/English shell, shared visual foundation, client Canvas lifecycle, unit-test tooling, and real PostgreSQL connectivity only. Do not implement or encode scenario coordinates, clocks, events, evidence, decisions, evaluation, ownership, publication, attempts, or persistence models.
- Deliver: Next.js App Router with strict TypeScript; Spanish/English locale skeleton; Radix/Tailwind/CVA foundation; pinned Three/R3F/Drei/Rapier/XState/Zod; pinned stable Prisma 7; Vitest; PostgreSQL test connection; Playwright CLI instructions.
- Acceptance: reproducible locked install; development server; one server-rendered route with Spanish default and English alternative; client Canvas loading, ready, unsupported-WebGL, and error presentation; one meaningful unit test; one generated-Prisma-client smoke test against real PostgreSQL; lint, strict typecheck, production build, Playwright CLI browser smoke, and independent read-only review of shared configuration.
- Completion boundary: verifies the application/test foundation only. It does not verify INC-REQ-010's complete simulator flow, approve RV-002, freeze RV-003, or satisfy later simulator/persistence acceptance.
- TDD: a deliberate environment smoke test may begin red for missing setup, then pass. Do not fabricate red tests for generated static files.
- Stop conditions: Prisma 7/runtime incompatibility, unpinned critical versions, or no reproducible PostgreSQL path.

## RV-005 - Deterministic timeline and observation core

- Requirements: INC-REQ-001, INC-REQ-003, INC-REQ-006, part of INC-REQ-007.
- Dependencies: RV-003, RV-004.
- Exclusive owner/writes: `packages/domain/src/**`, `packages/simulation/src/**`, and focused tests. No Prisma, React, R3F, or authored production scenario.
- Deliver: branded IDs/contracts; scenario validation; fixed-step clock; stable events; pause/seek/replay; world-state checksum; observation sampling/summary; state-machine domain adapter.
- Red/green acceptance: tests first fail, then pass for same-tick ordering, 30/60/144 render-cadence equivalence, pause/focus semantics, seek checksum, good/poor trace contrast, and correct guess without observation.
- TDD order: first validate a narrow complete-sample timeline fixture and prove tick/event/replay behavior with focused red tests; then add observation and scoring-authority tests after pinning their versioned calibration parameters. Do not mark RV-005 complete from the timeline-only slice.
- First-slice handoff A: `packages/domain/src/**` only, after coordinator-owned package setup and RV-003 freeze. Red tests must assert inclusive tick bounds, complete samples, finite transforms, unique actor/event IDs, unique same-tick ordinals, immutable snapshots, and the exact canonical serialization/checksum. Green must not claim full `ScenarioManifest` or public/private projection validation.
- First-slice handoff B: `packages/simulation/src/**` only, dependent on A. Red tests must assert exact event sequence including tick `0`, 30/60/144 FPS equivalence over eight seconds, pause/pointer/visibility baseline reset, bounded long-frame recovery, replay-only seek with no live side effects, four replay speeds, and one-tick frame stepping. Green must not claim browser readability or observation scoring.
- Follow-on handoff C1: deterministic geometry/measurement under the reviewed synthetic v1 baseline in `docs/contracts/observation-and-camera.md`. Exclusive writes: dedicated observation-geometry implementation and tests under `packages/simulation/src/**`. Red cases include complete private geometry validation, first-/third-person viewpoint reconstruction and collision, same-tick all-anchor joint readability, camera-only, eye-only, neither, alternating viewpoints/anchors, and unchanged authored world checksum. This is diagnostic geometric availability, not live eligibility, human perception, or scoring.
- Dependent handoff C2: validated active-live trace, coverage and locomotion bounds, consecutive-duration summary, and independent observation scoring after its separate versioned trace/rubric contract is frozen. Red cases include paused/hidden/unlocked/replay exclusion, duplicate/reversed/missing ticks, implausible movement, intermittent joint ticks, and a correct guess without observed evidence. Do not infer per-tick observer poses from the final render-frame pose when playback crosses multiple ticks.
- Integration gate: unit tests, typecheck, and deterministic fixture hashes pass; no DOM or database dependency enters the pure core.

## RV-006 - Versioned PostgreSQL persistence

- Requirements: INC-REQ-007, INC-REQ-009.
- Dependencies: RV-003, RV-004. May run beside RV-005 only with disjoint ownership.
- Exclusive owner/writes: `packages/data/**`, `apps/web/prisma/**`, database test helpers, and persistence tests. Schema/migration changes remain coordinator-integrated.
- Deliver: Prisma models/migrations for competition profiles, immutable scenario versions, audited scenario publication lifecycle, session plans, attempts, bounded observation traces, decisions, and evaluations; repositories and transactional finalization.
- Red/green acceptance against real PostgreSQL: immutable referenced versions; reviewed/retired publication behavior; unique initial decision; same-key retry; conflicting same-key payload; wrong-owner rejection; anonymous cookie owner; rollback on evaluation failure; completed-attempt recovery; and explicit mid-play reload restart.
- Stop conditions: SQLite substitutes, broad ORM mocks as evidence, ID-only authorization, or non-transactional debrief transition.

## RV-007 - Playable field, input, and stabilized camera

- Requirements: INC-REQ-002, INC-REQ-003, INC-REQ-010.
- Dependencies: RV-004, RV-005.
- Exclusive owner/writes: simulator renderer/input/camera modules under `apps/web/src/features/simulator/**`; shared visual primitives only through coordinator-owned `apps/web/src/components/**` changes.
- Deliver: metric field shell; quality/loading/error states; WASD movement, sprint, look, pointer lock, static collisions, pause/focus recovery, reduced motion, sensitivity/invert-Y, and adjustable stable third-person/first-person cameras.
- Acceptance: Playwright CLI verifies control lifecycle in a named Chrome environment; deterministic camera snapshots validate position/yaw; manual visual check covers comfort, scale, line readability, and no unintended tick advance.
- Performance evidence: record device, browser version, viewport, quality preset, load observation, and frame-time/FPS sample. No target is claimed before measurement.

## RV-008 - Authored penalty incident

- Requirements: INC-REQ-001 through INC-REQ-005.
- Dependencies: RV-002 approved/`Verified`, RV-005, RV-007.
- Exclusive owner/writes: first scenario content/validation fixtures in `packages/content/**`; its renderer/audio adapters under the simulator feature; asset register entries. No evaluation or persistence changes.
- Deliver: all eight actors, ball, onside pass snapshot, challenge/contact, reactions, lighting, restrained sound, authored cameras, and public/private projections from the same timeline.
- Acceptance: the exact contact/offence position and tick validate; live/replay checksums match; deterministic good/poor screenshots show the intended evidence difference; animation shows careless challenge-for-ball rather than recklessness; sources/licences are recorded.
- Domain gate: Nicolas performs the rendered-evidence checkpoint defined by the RV-002 brief, as part of RV-008/RV-011 acceptance. Failure changes scenario version/content, not the Law label in isolation.

## RV-009 - Complete deterministic simulator flow

- Requirements: INC-REQ-004 through INC-REQ-009.
- Dependencies: RV-005, RV-006, RV-008.
- Exclusive owner/writes: simulator workflow, Server Actions, domain adapters, attempt pages, and integration tests. Shared contracts change only through coordinator review.
- Deliver: loading, briefing, ready, playing, pause, deciding, finalizing, debrief, replay, complete, recoverable error, and abandoned states; immutable initial decision; server evaluation; durable refresh recovery; prepared debrief.
- Red/green acceptance: transition guards, malformed decision, valid incorrect decision, idempotent retry, no replay before finalization, server-failure recovery, separate `notApplicable` dimensions, and replay of the same scenario ref/tick.
- End-to-end gate: browser to PostgreSQL and back to debrief succeeds without an AI key.

## RV-010 - Spanish-first accessible simulator interface

- Requirements: INC-REQ-010 plus presentation of INC-REQ-004/008.
- Dependencies: RV-009 and RV-018 approved design system.
- Exclusive owner/writes: locale dictionaries; shared components in `apps/web/src/components/**`; simulator presentation styles/components. No domain scoring changes.
- Deliver: Spanish default and complete English alternative; accessible decision dialog and confirmation; keyboard help; focus management; status/error feedback; replay/debrief hierarchy; responsive shell outside the desktop-only play surface.
- Acceptance: Playwright CLI checks Spanish default, persisted English, keyboard traversal, focus return, error retry, responsive shell, and the primary flow. Visual review covers hierarchy, contrast, typography, restrained gameplay overlay, and honest illustrative labels.
- Review: use `web-design-guidelines` for the formal UI audit; fix and re-review material findings.

## RV-011 - First-incident MVP acceptance

- Requirements: all INC-REQs.
- Dependencies: RV-009, RV-010, and Nicolas's RV-008 rendered-evidence approval against the RV-002 brief.
- Ownership: coordinator verification; independent reviewer is read-only.
- Acceptance run: clean install/setup; migrate a real PostgreSQL database; unit/integration suite; lint; strict typecheck; production build; Playwright CLI complete flow; deterministic visual evidence; reload/idempotency/error paths; measured browser/device performance.
- Independent review: request `gpt-6-sol` / `high`; review requirement coverage, authority boundaries, security-sensitive ownership/finalization, visual evidence, and exact test scope. Runtime identity remains separate.
- Close only when tracker, CHECKLOG, README run instructions, limitations, asset register, review record, and next milestone all match observed behavior.

## Next milestone handoff

After RV-011, configurable sessions and role expansion continue in [`../03-simulator-expansion/tasks.md`](../03-simulator-expansion/tasks.md). That feature owns RV-012 onward; this first-incident feature does not duplicate its contract or status.
