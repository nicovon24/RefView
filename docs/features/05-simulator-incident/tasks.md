<a id="01-playable-incident"></a>

<a id="01-playable-incident--first-playable-incident-task-contracts"></a>
## First playable incident task contracts

Task status lives only in [`../../specs/tasks.md`](../../specs/tasks.md). Paths below are ownership surfaces to create when the workspace exists; they are not claims that implementation is present.

<a id="01-playable-incident--rv-002-incident-content-brief"></a>
## RV-002 - Incident content brief

- Requirements: INC-REQ-001, INC-REQ-003, INC-REQ-005.
- Dependencies: RV-001 verified.
- Ownership: coordinator documents; focused official-source research is read-only.
- Deliver: [`incident-brief.md`](incident-brief.md), including chronology, geometry, actors, evidence, Laws edition, competition settings, direct sources, design inferences, and Nicolas review checklist.
- Verify: source links, coordinate/tick consistency, no contradictory perspective, and explicit unresolved visual assumptions.
- Completion boundary: Nicolas can approve the proposed football facts and evidence plan before the 3D scene exists. Actual animation/camera readability remains a separate RV-008/RV-011 acceptance gate.

<a id="01-playable-incident--rv-003-shared-contracts"></a>
## RV-003 - Shared contracts

- Requirements: INC-REQ-001 through INC-REQ-009.
- Dependencies: RV-002 may be drafted during contract review but must be approved/`Verified` before RV-003 freezes; any later domain-review change reopens affected contracts.
- Ownership: coordinator only until frozen.
- Deliver: all files under `docs/contracts/`, the testing strategy, state machine, valid/invalid examples, server authority, anonymous/user ownership, and idempotent finalization.
- Verify: independent read-only review; every invalid example maps to a future Zod/domain/database test; renderer, client, physics, and AI have no scoring authority.
- Stop condition: do not implement domain or persistence behavior while coordinate, time, public/private, decision, or persistence semantics remain unresolved. RV-004 may proceed within its scenario-independent boundary.

<a id="01-playable-incident--rv-004-workspace-and-test-foundation"></a>
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

<a id="01-playable-incident--rv-005-deterministic-timeline-and-observation-core"></a>
## RV-005 - Deterministic timeline and observation core

- Requirements: INC-REQ-001, INC-REQ-003, INC-REQ-006, part of INC-REQ-007.
- Dependencies: RV-003, RV-004.
- Exclusive owner/writes: `packages/domain/src/**`, `packages/simulation/src/**`, and focused tests. No Prisma, React, R3F, or authored production scenario.
- Deliver: branded IDs/contracts; scenario validation; fixed-step clock; stable events; pause/seek/replay; world-state checksum; observation sampling/summary; state-machine domain adapter.
- Red/green acceptance: tests first fail, then pass for same-tick ordering, 30/60/144 render-cadence equivalence, pause/focus semantics, seek checksum, good/poor trace contrast, and correct guess without observation.
- TDD order: first validate a narrow complete-sample timeline fixture and prove tick/event/replay behavior with focused red tests; then add observation and scoring-authority tests after pinning their versioned calibration parameters. Do not mark RV-005 complete from the timeline-only slice.
- First-slice handoff A: `packages/domain/src/**` only, after coordinator-owned package setup and RV-003 freeze. Red tests must assert inclusive tick bounds, complete samples, finite transforms, unique actor/event IDs, unique same-tick ordinals, immutable snapshots, and the exact canonical serialization/checksum. Green must not claim full `ScenarioManifest` or public/private projection validation.
- First-slice handoff B: `packages/simulation/src/**` only, dependent on A. Red tests must assert exact event sequence including tick `0`, 30/60/144 FPS equivalence over eight seconds, pause/pointer/visibility baseline reset, bounded long-frame recovery, replay-only seek with no live side effects, four replay speeds, and one-tick frame stepping. Green must not claim browser readability or observation scoring.
- Follow-on handoff C1: deterministic geometry/measurement under the reviewed synthetic v1 baseline in `../../contracts/observation-evaluation.md#observation-and-camera`. Exclusive writes: dedicated observation-geometry implementation and tests under `packages/simulation/src/**`. Red cases include complete private geometry validation, first-/third-person viewpoint reconstruction and collision, same-tick all-anchor joint readability, camera-only, eye-only, neither, alternating viewpoints/anchors, and unchanged authored world checksum. This is diagnostic geometric availability, not live eligibility, human perception, or scoring.
- Dependent handoff C2: validated active-live trace, coverage and locomotion bounds, consecutive-duration summary, and independent observation scoring under the reviewed versioned [`../../contracts/observation-evaluation.md#observation-trace-v1`](../../contracts/observation-evaluation.md#observation-trace-v1). Split into bounded C2-A validation, C2-B summary/scoring, and C2-C clock/input/render capture handoffs. Red cases include paused/hidden/unlocked live-receipt rejection, replay exclusion from credit, duplicate/reversed/missing ticks, implausible movement, intermittent joint ticks, and a correct guess without observed evidence. Do not infer per-tick observer poses from the final render-frame pose when playback crosses multiple ticks.
- Integration gate: unit tests, typecheck, and deterministic fixture hashes pass; no DOM or database dependency enters the pure core.
- Recovery handoff after the stopped XState branch: use the reviewed main-referee presentation boundary in `../../contracts/simulator-timeline.md#session-and-persistence`. A bounded worker owns only `packages/simulation/src/session-workflow.ts`, its tests, and the C1 geometry module/tests if exporting shared view validation is necessary. TDD must cover strict public binding, C1/field-bounded run start, detached immutable inputs, public handle decision, same choice/key after uncertain finalization, and bound active/finalized restore. Independent review is required before barrel export or browser integration. The controller's sealed trace and server action remain separate RV-009 work.
- Local incident playtest handoff (architecture review PASS, 2026-11-03): implement a public-only playback fixture and field-aware input adapter first under new `apps/web/src/features/simulator/incident/playtest/` files, with 30/60/144 cadence and C2 input TDD. After their review, implement the local XState live controller and C2 capture against that frozen interface; after its review, implement a synchronous exact-scene adapter and review it before browser wiring. A bounded integration worker may own only new `IncidentPlaytest.tsx`, `incident-playtest.css`, and the thin `/[locale]/simulator/incident-playtest/page.tsx` route under the reviewed integration boundary in `design.md`; the coordinator owns integration verification, tracker and documentation. Verify pointer lock, focus/visibility/resize, trace sealing and visual WebGL with Playwright CLI. No server workflow events, synthetic authoring presets, private timeline/rubric, attempt persistence or observation score enter this diagnostic route. The scored RV-009 route remains dependent on trusted publication and owner-bound start.

<a id="01-playable-incident--rv-006-versioned-postgresql-persistence"></a>
## RV-006 - Versioned PostgreSQL persistence

- Requirements: INC-REQ-007, INC-REQ-009.
- Dependencies: RV-003, RV-004. May run beside RV-005 only with disjoint ownership.
- Exclusive owner/writes: `packages/data/**`, `apps/web/prisma/**`, database test helpers, and persistence tests. Schema/migration changes remain coordinator-integrated.
- Deliver: Prisma models/migrations for competition profiles, immutable scenario versions, audited scenario publication lifecycle, session plans, attempts, bounded observation traces, decisions, and evaluations; repositories and transactional finalization.
- Red/green acceptance against real PostgreSQL: immutable referenced versions; reviewed/retired publication behavior; unique initial decision; same-key retry; conflicting same-key payload; wrong-owner rejection; anonymous cookie owner; rollback on evaluation failure; completed-attempt recovery; and explicit mid-play reload restart.
- Stop conditions: SQLite substitutes, broad ORM mocks as evidence, ID-only authorization, or non-transactional debrief transition.
- Authored-publication recovery is split after two unsuccessful broad-contract corrections: first freeze a v2 canonical-event schema and full-source compiler contract, then implement pure compilation, then PostgreSQL admission/review storage, then migrate lifecycle/finalization consumers. The existing synthetic v1 persistence remains scoped; no v2 training publication or Nicolas rendered approval is inferred from it. See `../../contracts/learning-publication.md#authoring-and-publication-v2` for the proposed source boundary.
- Full-source compiler implementation is divided into independent bounded parts after the reviewed v2 contracts: core source/profile/timeline/facts normalization in `packages/content/src/source-core-v2.*`; asset record/byte-resolution validation in `asset-registry-v2.*`; then supplemental observation/rendering/source/rubric/debrief normalization; then coordinator composition, full hash and projections. Each part uses assertion-level RED/GREEN and independent read-only review. No part alone is a publication credential. Shared package setup and lockfile remain coordinator-owned.
- The dependent composition gate requires a pure geometry-correspondence verifier for every authored evidence sample against the exact actor rig/clip phase, ball track, and field-point resolver, plus a challenge-safe v2 projector with opaque actor/asset handles. These have exclusive `geometry-correspondence-v2.*` and `public-projection-v2.*` paths and independent reviews before the coordinator composes the full source hash. Neither helper is evidence that WebGL displayed the geometry. PostgreSQL admission follows only a reviewed complete compiler, and rendered approval remains a separate Nicolas gate.
- Anonymous-session transport handoff: after the shared cookie/origin/test-runtime contract in `design.md`, implement an explicit isolated-test Server Action and server read with a strict empty mutation payload, exact configured origin, Secure/HttpOnly/SameSite=Lax cookie, and safe response DTO. Reuse an unexpired owner without sliding expiry; only explicit establishment can replace a missing/invalid/expired cookie. The technical page and action both reject production and a non-isolated database. Use real PostgreSQL for create/reuse/expiry/failure tests and Playwright CLI for actual browser cookie transmission. This handoff does not create or publish an incident and requires independent authority/configuration review.

<a id="01-playable-incident--rv-007-playable-field-input-and-stabilized-camera"></a>
## RV-007 - Playable field, input, and stabilized camera

- Requirements: INC-REQ-002, INC-REQ-003, INC-REQ-010.
- Dependencies: RV-004 and reviewed RV-005 C1 for the limited RV-007A controls shell; complete RV-005 including C2 and challenge-safe projection before scored-incident integration and RV-007 completion.
- RV-007A exclusive writes: `apps/web/src/features/simulator/controls/**` and the exact thin route `apps/web/src/app/[locale]/simulator/controls/page.tsx`. Preview copy, styles, and tests stay feature-local; root locale dictionaries, global styles, shared components, package scripts, and the existing neutral home preview remain coordinator-owned. Before accepting RV-007A, the coordinator updates the web test script so its pure movement/camera tests run in the standard `pnpm test` path; the worker may use focused Vitest commands for red/green evidence. Later RV-007 renderer/input/camera ownership is assigned in a separate bounded handoff.
- Deliver: metric field shell; quality/loading/error states; WASD movement, sprint, look, pointer lock, static collisions, pause/focus recovery, reduced motion, sensitivity/invert-Y, and adjustable stable third-person/first-person cameras.
- RV-007A bounded preview: add a separate Spanish-first/English `/[locale]/simulator/controls` technical route over neutral synthetic field content. It may implement real WASD/sprint movement, mouse look, pointer-lock/pause/focus lifecycle, field bounds, camera mode/distance/lateral framing, keyboard help, and responsive desktop-only notice. Label it clearly as a controls preview with no authored incident, observation score, decision, replay authority, or saved attempt. Pure movement/camera logic receives assertion-level red/green tests. The live page receives Playwright CLI desktop interaction, focus/pause, locale, and mobile-notice checks plus visual inspection. It must not receive a private `TimelineFixture` or evidence definition. The existing home field remains intact until coordinator integration.
- Acceptance: Playwright CLI verifies control lifecycle in a named Chrome environment; deterministic camera snapshots validate position/yaw; manual visual check covers comfort, scale, line readability, and no unintended tick advance.
- Performance evidence: record device, browser version, viewport, quality preset, load observation, and frame-time/FPS sample. No target is claimed before measurement.

<a id="01-playable-incident--rv-008-authored-penalty-incident"></a>
## RV-008 - Authored penalty incident

- Requirements: INC-REQ-001 through INC-REQ-005.
- Dependencies: RV-002 approved/`Verified`, RV-005, RV-007.
- Exclusive owner/writes: first scenario content/validation fixtures in `packages/content/**`; its renderer/audio adapters under the simulator feature; asset register entries. No evaluation or persistence changes.
- Deliver: all eight actors, ball, onside pass snapshot, challenge/contact, reactions, lighting, restrained sound, authored cameras, and public/private projections from the same timeline.
- Acceptance: the exact contact/offence position and tick validate; live/replay checksums match; deterministic good/poor screenshots show the intended evidence difference; animation shows careless challenge-for-ball rather than recklessness; sources/licences are recorded.
- Domain gate: Nicolas performs the rendered-evidence checkpoint defined by the RV-002 brief, as part of RV-008/RV-011 acceptance. Failure changes scenario version/content, not the Law label in isolation.
- Motion-readability correction after the independent normal-speed review: keep authored facts and existing authoring controls, add an explicit fullscreen stage with compact operable controls on exclusive `IncidentPreview.tsx` and `incident.css` paths, then use Playwright CLI to compare actual canvas dimensions and inspect contact/fall at normal speed. Re-review independently. If two corrections do not converge, stop this visual branch and report the remaining limitation rather than marking RV-008 complete.

<a id="01-playable-incident--rv-009-complete-deterministic-simulator-flow"></a>
## RV-009 - Complete deterministic simulator flow

- Requirements: INC-REQ-004 through INC-REQ-009.
- Dependencies: RV-005, RV-006, RV-008.
- Exclusive owner/writes: simulator workflow, Server Actions, domain adapters, attempt pages, and integration tests. Shared contracts change only through coordinator review.
- Deliver: loading, briefing, ready, playing, pause, deciding, finalizing, debrief, replay, complete, recoverable error, and abandoned states; immutable initial decision; server evaluation; durable refresh recovery; prepared debrief.
- Red/green acceptance: transition guards, malformed decision, valid incorrect decision, idempotent retry, no replay before finalization, server-failure recovery, separate `notApplicable` dimensions, and replay of the same scenario ref/tick.
- End-to-end gate: browser to PostgreSQL and back to debrief succeeds without an AI key.

<a id="01-playable-incident--rv-010-spanish-first-accessible-simulator-interface"></a>
## RV-010 - Spanish-first accessible simulator interface

- Requirements: INC-REQ-010 plus presentation of INC-REQ-004/008.
- Dependencies: RV-009 and RV-018 approved design system.
- Exclusive owner/writes: locale dictionaries; shared components in `apps/web/src/components/**`; simulator presentation styles/components. No domain scoring changes.
- Deliver: Spanish default and complete English alternative; accessible decision dialog and confirmation; keyboard help; focus management; status/error feedback; replay/debrief hierarchy; responsive shell outside the desktop-only play surface.
- Acceptance: Playwright CLI checks Spanish default, persisted English, keyboard traversal, focus return, error retry, responsive shell, and the primary flow. Visual review covers hierarchy, contrast, typography, restrained gameplay overlay, and honest illustrative labels.
- Review: use `web-design-guidelines` for the formal UI audit; fix and re-review material findings.

<a id="01-playable-incident--rv-011-first-incident-mvp-acceptance"></a>
## RV-011 - First-incident MVP acceptance

- Requirements: all INC-REQs.
- Dependencies: RV-009, RV-010, and Nicolas's RV-008 rendered-evidence approval against the RV-002 brief.
- Ownership: coordinator verification; independent reviewer is read-only.
- Acceptance run: clean install/setup; migrate a real PostgreSQL database; unit/integration suite; lint; strict typecheck; production build; Playwright CLI complete flow; deterministic visual evidence; reload/idempotency/error paths; measured browser/device performance.
- Independent review: request `gpt-6-sol` / `high`; review requirement coverage, authority boundaries, security-sensitive ownership/finalization, visual evidence, and exact test scope. Runtime identity remains separate.
- Close only when tracker, CHECKLOG, README run instructions, limitations, asset register, review record, and next milestone all match observed behavior.

<a id="01-playable-incident--next-milestone-handoff"></a>
## Next milestone handoff

After RV-011, configurable sessions and role expansion continue in [`../03-simulator-expansion/tasks.md`](tasks.md#03-simulator-expansion). That feature owns RV-012 onward; this first-incident feature does not duplicate its contract or status.

---

<a id="03-simulator-expansion"></a>

<a id="03-simulator-expansion--simulator-expansion-task-contracts"></a>
## Simulator expansion task contracts

<a id="03-simulator-expansion--rv-012-freeze-configurable-session-and-role-contracts"></a>
## RV-012 - Freeze configurable-session and role contracts

- Requirements: SES-REQ-001 through SES-REQ-005, ROLE-REQ-001, AR-REQ-001, VAR-REQ-001.
- Dependencies: RV-011.
- Deliver: reviewed session/catalog/match-state/role-decision/evidence-permission contracts, valid/invalid examples, version migration plan, and updated implementation tickets.
- Acceptance: independent read-only review; no contradiction with canonical facts, publication lifecycle, replay secrecy, or persistence.

<a id="03-simulator-expansion--rv-013-deterministic-authored-session-composer"></a>
## RV-013 - Deterministic authored-session composer

- Requirements: SES-REQ-001 through SES-REQ-004.
- Dependencies: RV-012.
- Ownership: pure domain/simulation paths only.
- Deliver: seeded composer, compatibility/precondition checks, stable ordering, duration result/explanation, and explicit transitions.
- Red/green evidence: same seed/snapshot, no eligible content, insufficient variety, duration bounds, incompatible entry state, effect ordering, retirement, and no unintended repetition.

<a id="03-simulator-expansion--rv-014-session-setup-progression-and-recovery"></a>
## RV-014 - Session setup, progression, and recovery

- Requirements: all SES requirements.
- Dependencies: RV-013 and the current accepted simulator flow.
- Deliver: bilingual configuration UI, immutable plan persistence, item progression, debrief/continue, visible time jumps, retry, and recovery.
- Acceptance: real PostgreSQL owner/idempotency tests and Playwright CLI complete session flow. One production incident is represented honestly.

<a id="03-simulator-expansion--rv-015-meaningful-assistant-referee-task"></a>
## RV-015 - Meaningful assistant-referee task

- Requirements: ROLE-REQ-001, AR-REQ-001, SIM-ACC-001.
- Dependencies: RV-012, RV-014, and one separately reviewed assistant-compatible scenario brief.
- Deliver: touchline locomotion/alignment, observation window, flag/signal decision, structured communication, dimensional evaluation, replay, and debrief.
- Acceptance: canonical checksum across roles, good/poor alignment captures, TDD, persistence, Playwright flow, and Nicolas's football/visual approval.

<a id="03-simulator-expansion--rv-016-meaningful-var-workspace-and-protocol-task"></a>
## RV-016 - Meaningful VAR workspace and protocol task

- Requirements: ROLE-REQ-001, VAR-REQ-001, SIM-ACC-001.
- Dependencies: RV-012, RV-014, and a reviewed VAR-compatible scenario/initial-decision record.
- Deliver: synchronized feeds, timeline, step, speeds, relevant phase, check/recommendation flow, structured communication, finalization, and protocol debrief.
- Acceptance: TDD for synchronization/permissions/intervention states, persistence/idempotency, Playwright workspace flow, deterministic visual evidence, and Nicolas's protocol review.

<a id="03-simulator-expansion--rv-017-simulator-foundation-acceptance"></a>
## RV-017 - Simulator foundation acceptance

- Requirements: all requirements in this feature.
- Dependencies: RV-014 through RV-016.
- Deliver: named-browser/device/quality acceptance record, human test protocol/results, performance observations, limitations, catalog coverage, and independent review.
- Acceptance: all roles and configured session complete without AI; visual evidence and comfort are human-reviewed; claims match measured behavior.

RV-017 is the product-order gate for Academy. It does not require a large scenario catalog or autonomous match.

---

<a id="09-simulator-research"></a>

<a id="09-simulator-research--later-simulator-expansion-task-contracts"></a>
## Later simulator expansion task contracts

<a id="09-simulator-research--rv-070-expand-the-reviewed-scenario-catalog"></a>
## RV-070 - Expand the reviewed scenario catalog

- Requirements: all CAT requirements.
- Dependencies: RV-017. May proceed opportunistically alongside wider product work but does not block it.
- Deliver: a separately frozen numeric case list and topic/difficulty/role coverage matrix, followed by scenario-sized assignments.
- Acceptance: per-case schema/projection/checksum tests, evidence captures, sources/licences, Nicolas review, and honest filtered variety.

<a id="09-simulator-research--rv-071-multi-incident-authored-sequence"></a>
## RV-071 - Multi-incident authored sequence

- Requirements: MUL-REQ-001, MUL-REQ-002, EXP-REQ-001.
- Dependencies: RV-014, RV-070, and independently reviewed multi-decision contract extension.
- Deliver: one bounded several-minute sequence with explicit actor/time budget and multiple related decisions.
- Acceptance: event/decision order, secrecy, immutable decisions, effects exactly once, persistence/concurrency/reload, replay checksum, full browser run, performance, and visual review.

<a id="09-simulator-research--rv-072-expansion-acceptance-and-autonomous-research-decision"></a>
## RV-072 - Expansion acceptance and autonomous-research decision

- Requirements: all requirements in this feature.
- Dependencies: RV-071 and user-demand evidence.
- Deliver: representative stress/acceptance record and a proceed/defer ADR for any autonomous-match research, including maximum scope and success/failure criteria.
- Limit: `defer` is a valid completed result. This ticket does not start autonomous-match implementation.
