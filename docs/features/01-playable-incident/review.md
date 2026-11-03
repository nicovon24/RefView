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
