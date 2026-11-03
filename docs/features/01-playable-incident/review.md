# RV-002/RV-003 documentation review

- Review date: 2026-11-02.
- Scope: incident brief, shared contracts, testing strategy, task contracts, tracker/CHECKLOG consistency, and authority boundaries.
- Requested reviewer model/effort: `gpt-6-sol` / `high`.
- Runtime-confirmed model/effort: `unconfirmed`.
- Mode: independent, read-only; the reviewer changed no files.

## First review findings

The initial verdict was `FIX`:

1. RV-002 required a rendered scene before verification even though RV-008, which creates that scene, depended on RV-002.
2. Task text still attributed the later rendered checkpoint to RV-002 after the first correction.
3. Semantic evidence IDs and canonical offence payloads could leak the answer through the playable projection.
4. Retry/idempotency semantics did not require owner validation on every request, a canonical payload digest, or protection against concurrent different keys.
5. Scenario content was called immutable while review/retirement status lived inside the same record.
6. Server Action wording assumed authenticated accounts despite the anonymous no-account MVP.
7. RV-006/RV-008 task contracts had not yet incorporated scenario publication and the approved-brief dependency.

## Corrections

- Split Nicolas's RV-002 authoring-brief approval from RV-008/RV-011 rendered-evidence acceptance.
- Defined an exact challenge-safe playable projection with opaque cue IDs and negative leakage fixtures.
- Required owner validation before every retry, owner/attempt-scoped keys, canonical payload digests, transactional finalization, and a unique initial decision.
- Separated immutable `ScenarioVersion` content from audited `ScenarioPublication` lifecycle.
- Aligned authenticated and anonymous-session ownership language.
- Updated RV-006 publication tests, RV-008 dependencies, tracker, and task contracts.

## Re-review result

**PASS.** The reviewer reported no remaining contract findings after the corrections.

Observed evidence:

- Coordinates and 60 Hz tick chronology agree across the brief and contracts.
- The proposed IFAB 2026/27 penalty/no-card interpretation is source-backed and explicitly awaits Nicolas's approval.
- Public/private content, scoring authority, anonymous ownership, transactional retries, and scenario publication boundaries are consistent.
- All local Markdown links resolved.
- Tracker and CHECKLOG agree.
- `prompt.md` remained zero bytes and untouched.

## Open acceptance

RV-004 remains `Planned`. Nicolas must approve or correct the RV-002 authoring brief; only then can RV-002 become `Verified`, RV-003 freeze, and RV-004 move to `Ready`. This review does not validate an application or rendered scene.

## 2026-11-03 gate amendment

The preceding open-acceptance statement records the earlier ordering, not an application review. A separate read-only architecture check found that the RV-004 bootstrap can proceed without freezing scenario semantics if it remains limited to tooling, bilingual application shell, neutral Canvas lifecycle, and PostgreSQL connection proof. RV-002 and RV-003 remain `In review`; RV-005 and RV-006 still require frozen RV-003 contracts. RV-004 shared configuration requires its own independent review before verification.

## 2026-11-03 RV-004 foundation acceptance

The independent read-only shared-configuration review found no blocking issue. The reviewer checked exact dependency pins and lockfile consistency, the no-model Prisma schema, the generated-client PostgreSQL smoke, locale/Canvas boundaries, and project-status consistency. Requested reviewer identity: `gpt-6-sol` / `high`; runtime-confirmed identity: `unconfirmed`. The earlier gate assessment requested `gpt-6-astra` / `xhigh`; runtime-confirmed identity: `unconfirmed`.

Coordinator verification after the final implementation edit:

- `pnpm install --frozen-lockfile`, `pnpm db:generate`, and `pnpm db:validate`: passed. Prisma 7.10.1 generated a client from a PostgreSQL datasource with no models and validated the schema.
- `pnpm test`: two locale tests passed. These tests were written before the helper, but the first executed run was already green; no failing unit-test run is claimed.
- `docker compose up -d postgres` followed by `pnpm test:db`: one generated-Prisma-client query test passed against healthy PostgreSQL 17. The first DB run failed because `TEST_DATABASE_URL` was not loaded; explicitly loading local test configuration corrected it. No SQLite substitute or broad ORM mock was used.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check`: passed after the final code change. Build produced `/es`, `/en`, `/`, and the icon route.
- Playwright CLI in Headless Chrome 156 on Windows, AMD Radeon RX 6700 XT, 16 GB RAM: `/` redirected to `/es`; Spanish and English page language/text and WebGL ready state passed at 1280×720; English at 390×844 had no horizontal overflow; `/prototype/index.html` opened; disabling WebGL contexts through browser test setup showed the translated unsupported alert with no canvas. WebGL2 reported an ANGLE/Direct3D11 AMD renderer. Screenshots were visually inspected locally but remain ignored test artifacts.

Limits: the preview is neutral static geometry, not a football incident or evidence test. Loading and ready were observed; unsupported WebGL was simulated, not tested on a naturally incompatible browser. The rendering-error boundary is implemented but unexercised. One upstream `THREE.Clock` deprecation warning appears in normal Chrome runs; there were no page errors in the final run. No scene FPS, motion fidelity, camera comfort, decision quality, or incident readability measurement is implied. RV-002/RV-003 remain `In review`, and RV-005/RV-006 stay gated on their freeze.

## 2026-11-03 football-brief approval

Nicolas explicitly approved the recommended initial case in the conversation: onside attacker, careless trip just inside the penalty area, covering defender, and penalty kick with no card. RV-002 is therefore `Verified` as an authoring brief. This does not approve the visual evidence or animation, which remain RV-008/RV-011 checks. The roster wording was corrected from “eight player actors” to seven footballers plus the user-controlled referee without changing the approved facts. RV-003 remains in review until the coordinator reconciles executable contract details for the first TDD slice.

## 2026-11-03 RV-003 executable-contract freeze

An Astra xhigh read-only audit (runtime identity unconfirmed) identified the narrow first-slice decisions needed for complete integer-tick fixtures, microsecond accumulation, event edges, pause/resume, replay separation, and diagnostic checksums. The coordinator added those choices to `docs/contracts/clocks-and-events.md` and `docs/contracts/scenario.md`, corrected the manifest-header example and roster wording, and defined sequential RV-005 handoffs in `tasks.md`.

An independent Sol high read-only review (runtime identity unconfirmed) initially returned `FIX` for ambiguous checksum bytes/format, live-versus-replay seek semantics, the partial example label, and stale approval text. After corrections, its re-review returned `PASS` for the RV-003 freeze and first RV-005 timeline TDD slice, with no remaining blocking contradiction. It separately passed the coordinator-owned domain/simulation workspace scaffold: `pnpm install --frozen-lockfile --offline`, `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed. The reviewer changed no files. The coordinator also confirmed both package Vitest commands resolve version 5.1.0.

RV-003 is frozen for dependent work. The first-slice narrow timeline validator does not claim complete scenario-manifest, public/private projection, observation-calibration, persistence, or rendered-incident acceptance. Any substantive change to a frozen shared contract reopens the affected review.

## 2026-11-03 RV-005 handoff A: canonical fixture

The delegated `packages/domain/src/**` slice added complete per-tick synthetic fixtures, stable actor and event validation, immutable snapshots, canonical serialization, and a diagnostic FNV-1a world-state checksum. Requested implementation model/effort: `gpt-6-sol` / `medium`; runtime-confirmed identity: `unconfirmed`.

TDD evidence: the initial behavior tests were red with 16 failures before implementation, then green at 18/18. An independent read-only review (`gpt-6-sol` / `high` requested; runtime unconfirmed) returned `FIX` for mutable snapshot bounds, invalid event kinds/references, and lost own `__proto__` payload keys. Tests for those defects failed 3 times before the correction and passed at 21/21. A second review found that a string `actorIds` and null `payload` were still accepted; the second correction began with 6 failing new assertions and finished at 28/28. The final independent re-review returned `PASS` for the narrow fixture slice. The coordinator independently reran `pnpm --filter @refview/domain test` (28/28), `pnpm --filter @refview/domain typecheck`, and `pnpm --filter @refview/domain lint` (all passed).

This does not verify the complete `ScenarioManifest`, public/private projection, playback clock, observation model, workflow authority, authored incident, or browser experience. RV-005 remains `In progress`; handoff B for pure playback is next.

## 2026-11-03 RV-005 handoff B: pure playback

The delegated `packages/simulation/src/**` slice implemented integer-microsecond fixed-step live/replay cursors, ordered event batches, pause/focus recovery, bounded long-frame performance pause, four replay speeds, seek/step, and same-tick checksums. Requested implementation model/effort: `gpt-6-sol` / `medium`; runtime-confirmed identity: `unconfirmed`.

TDD evidence: 15 behavior tests failed while the playback API was absent, then passed at 15/15. Independent read-only review (`gpt-6-sol` / `high` requested; runtime unconfirmed) returned `FIX` because an application callback could throw after the tick advanced and permanently skip a later event in the frame. The coordinator amended the frozen clock contract to require frozen event batches from the pure core, with consumer errors and side effects owned by an adapter. The correction began with one failing immutability test and a typecheck failure showing the old callback option remained accepted; after removing the callback API, all 16 simulation tests passed. Independent re-review returned `PASS` for both the corrected code and reopened clock-contract wording.

Coordinator verification after the final implementation edit: `pnpm test` passed 46/46 (web 2, domain 28, simulation 16); `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed. This verifies deterministic pure playback only, not browser rendering, observation credit, event-consumer idempotency, replay authorization after finalization, or a playable referee. RV-005 remains `In progress` pending observation/scoring-authority work.
