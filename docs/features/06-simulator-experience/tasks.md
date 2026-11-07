<a id="10-visual-motion-refresh"></a>

<a id="10-visual-motion-refresh--task-contracts"></a>
## Task contracts

Canonical status lives in `../../specs/tasks.md`.

1. Assess current motion and define a bounded implementation with canonical invariants; read-only, no dependencies.
2. Refine home and navigation under the established design system; depends on VIS acceptance, exclusive home paths, bilingual responsive browser evidence.
3. Refine authoring workspace; depends on current renderer inspection, retains every existing control and scene state.
4. Improve deterministic procedural motion; depends on assessment and explicit pose/contact invariants; tests-first, update mirrored asset bytes and source bindings together where required.
5. Integrate and verify; run relevant gates and Playwright desktop/mobile, reduced-motion, deterministic ticks and normal-speed motion.
6. Independent read-only review and evidence/documentation handoff; required before final acceptance.

---

<a id="11-player-model-refresh"></a>

<a id="11-player-model-refresh--task-contracts"></a>
## Task contracts

Canonical status is in `../../specs/tasks.md`.

1. Establish baseline targeted model/exact-scene tests and current WebGL captures.
2. Extract a shared feature-local player model while preserving node/transform contracts; verify same tick appearance in authoring and playtest.
3. Improve only the shared model's silhouette and kit detail; verify contact readability, B screening, normal-speed fall, and resource disposal.
4. Integrate tests, lint, typecheck, build, Playwright CLI evidence and independent read-only review.

---

<a id="12-site-interface-refinement"></a>

<a id="12-site-interface-refinement--task-contracts"></a>
## Task contracts

Canonical status is in `../../specs/tasks.md`.

1. Capture current desktop/mobile home, authoring, local playtest and neutral-controls baselines. Freeze existing route, renderer and camera constraints.
2. Coordinator creates the shared presentation-only header contract and route labels. Verify both locales and no authoring font/asset dependency.
3. Refine authoring field/timeline/transport/viewpoint hierarchy, without changing WebGL camera or canonical state.
4. Refine local playtest ready/playing/paused/end states and make immediate controls visible at desktop target sizes. Keep diagnostics secondary and controller unchanged.
5. Refine home and neutral controls to the shared shell, product truth and mobile limitations.
6. Integrate, visually inspect fixed A/B contact and fall, verify route interactions and responsive/reduced-motion behavior, run tests/lint/typecheck/build, obtain independent read-only review and record evidence.

---

<a id="13-immersive-playtest"></a>

<a id="13-immersive-playtest--task-contracts"></a>
## Task contracts

Status is tracked only in `../../specs/tasks.md`.

1. Coordinator freezes IMM requirements, environment dimensions, appearance mapping and ownership. Preserve existing local changes and root configuration.
2. Immersive UI slice owns local playtest component/CSS and focused presentation tests. Gate entry on settled aspect and permission, keep active-play controls out of visibility/tab order, and demonstrate pause/restart/completion/denials in Spanish and English. Do not edit controller authority or canonical source without coordinator review and TDD.
3. Environment slice owns a new feature-local factory and focused tests only. Deliver original stadium/goal geometry, explicit resource disposal and authoring/playtest integration instructions; do not edit either scene adapter.
4. Player slice owns the shared model factory and its tests only. Deliver smoother human silhouette, fixed shirt numbers, unchanged joint/boot contracts, parity and disposal checks.
5. Coordinator integrates the environment into both scene adapters after the exclusive slices finish, resolves overlap, runs full checks and Playwright CLI fixed-tick/fullscreen/normal-speed visual review, records performance/provenance and requests independent read-only review. A relevant correction reopens review.

---

<a id="14-stadium-character-motion"></a>

<a id="14-stadium-character-motion--task-contracts"></a>
## Task contracts

Status is tracked only in `../../specs/tasks.md`.

1. Coordinator freezes SCM requirements, baseline evidence hashes, ownership, source synchronization and UI direction before delegation.
2. Environment slice exclusively edits `apps/web/src/features/simulator/incident/environment.ts` and its focused test, with any helper named in the assignment. Deliver a tiered populated stadium, fixed seeded turf, preserved field/goal coordinates, bounded batches and explicit resource disposal. Report tests and visual limitations.
3. Character slice exclusively edits `player-model.ts` and its focused test and creates a shared referee presentation factory/test. Preserve actor node/boot contracts, numbers and exact-route parity. Report tests and visual limitations.
4. Motion slice exclusively edits clip assets `asset-002.mjs` through `asset-004.mjs` and a focused test file. Begin with red tests for the protected baseline hashes and transition behavior. Preserve rig and authority; report clip changes and all deterministic evidence results. The coordinator alone synchronizes public copies and hashes.
5. Coordinator integrates the referee and UI in both scene adapters, synchronizes the source candidate, reviews A/B and normal-speed WebGL evidence, runs full gates and Playwright CLI flow/performance checks, and requests an independent read-only review after the last relevant edit.

---

<a id="15-rigged-football-presentation"></a>

<a id="15-rigged-football-presentation--work-contracts"></a>
## Work contracts

1. **Asset audition and license record** — Build an isolated viewer, inspect one selected rig and actual clips at match camera distance, and record bytes, skeleton/clip inventory, quality, performance and exact license. Dependency: none. Handoff: candidate decision and documented gaps; no canonical incident edit.
2. **Pitch/material/lighting slice** — Implement a bounded field pass without moving authoritative geometry or weakening A/B readability. Dependency: current shared environment contract. Handoff: fixed-tick before/after captures, resource ownership and measured render cost.
3. **Versioned GLB/resource loading contract** — Add strict typed loader, resource manifest, source/public parity, errors/retry and complete renderer identity. Dependency: selected asset and license. Handoff: deterministic loading and integrity tests; coordinator owns shared contract/configuration.
4. **Skeletal animation candidate** — Retarget and bake run/stop/challenge/fall as needed, with canonical-tick sampling, shared actor adapter and independent skeleton instances. Dependency: tasks 1 and 3. Handoff: red/green deterministic pose tests and normal-speed footage.
5. **Evidence geometry and calibration** — Derive attachments/occluders from the same final pose, preserve football facts/tracks/event timing, recompute all evidence windows and review A/B observation. Dependency: task 4. Handoff: source hashes, diagnostic results and fresh human-review captures.
6. **Integration and acceptance** — Exercise both routes, all lifecycle/error states, bilingual UI, WebGL visual matrix, performance, full package gates and independent read-only review. Dependency: tasks 2–5. Handoff: `review.md` with exact commands, results, provenance and remaining limitations; only then update canonical task status.


<a id="15-rigged-football-presentation--selected-player-continuation-contracts"></a>
## Selected-player continuation contracts

- **Distance-driven locomotion:** derive detached actor plans from the canonical public tracks; sample Idle/Walk/Jog absolutely and preserve every protected attack/contact/fall tick. Verify actual-source seven-actor coverage and normal-speed playback. Contract: `../../contracts/simulator-presentation.md#rigged-presentation-candidate-v1`.
- **Selected-skeleton referee appearance:** use the shared selected body as an unnumbered dark orientation ghost, absolute idle, existing transparency and unchanged root/camera inputs. First-person and elevated review hide it. Preserve procedural comparison and validate owned-resource cleanup. The reduced fallback hides layered accessories; detailed referee kit and live locomotion phase remain separate.
- **Diagnostic posed surfaces:** after `number: null` supports canvas-free construction, export actual production-skinned indexed surfaces, regional broad-phase bounds and explicit bone/surface landmarks under `rigged-player/evidence/`. Cover all existing evidence ticks without connecting scoring, source resolvers or persistence. Contract: `../../contracts/simulator-presentation.md#rigged-diagnostic-geometry-v1`.
- **Defender leg continuity:** replace the moving left-foot target and unconstrained CCD with an absolute-tick trajectory and fixed-length two-bone IK. Preserve attacker poses, authoritative transforms and contact timing; prove actual boot-surface continuity, deterministic seeking and contact readability. This intentionally replaces the former defender pose candidate. Contract: `../../contracts/simulator-presentation.md#rigged-defender-continuity-v1`.
- **Pure surface queries:** compute real triangle-to-triangle witnesses and double-sided segment hits over detached candidate geometry, preserving limb gaps and deterministic ordering. Use fixture TDD before binding any real contact attachment or calibration report. Contract: `../../contracts/simulator-presentation.md#rigged-surface-query-v1`.
- **Local calibration pilot:** freeze candidate contact surface witnesses at tick 366 and derive 92 contact/area rows across A/B and first-/third-person views. Keep raw ray, near clipping and geometric gates distinct; include owner bodies as occluders and reject identity/pose/topology drift. Produce a separately fingerprinted local-resource report without publication or scoring. Contract: `../../contracts/simulator-presentation.md#rigged-calibration-pilot-v1`.
- **Contact layer comparison:** compare v1's buried body witness with a camera-independent selection excluding only body triangles with proven boot-shell counterparts. Keep every original occluder, preserve all 60 area rows and historical artifacts, and report both complete candidates without adopting a training attachment. Contract: `../../contracts/simulator-presentation.md#rigged-contact-layer-comparison-v1`.
- **Anatomical contact feature diagnostic:** freeze the pre-contact ankle approach direction and probe complete owner surfaces from opposing sides. Reject missing or wrong-region first hits, retain fixed triangle/barycentric witnesses through the contact window, and report honest separation without training adoption. Contract: `../../contracts/simulator-presentation.md#rigged-contact-feature-v1`.
- **Visual contact review and defender-pose correction:** inspect paired marked/unmarked A/B and diagnostic lateral views, prove the current boot/low-leg overlap with camera-independent full-part geometry, then adjust only the defender left-leg target under retained continuity and canonical-authority guards. Preserve historical reports, issue a new candidate identity and repeat visual review before calibration. Dependency: anatomical feature diagnostic and frozen visual-review evidence. Handoff: RED/GREEN surface evidence, fresh captures and independent review. Contracts: `../../contracts/simulator-presentation.md#rigged-contact-visual-review-v1` and `../../contracts/simulator-presentation.md#rigged-contact-pose-correction-v1`.
- **Axial-frame recovery diagnostic:** replay the rejected trial peak and Hermite entry candidate with actual resources, isolate the tick-366-to-367 calf frame discontinuity under three explicit normal-reference modes, and preserve the old production sampler. Dependency: rejected full-window Hermite audit. Handoff: reproducible RED measures, frame/joint/boot comparison, resource identity and independent review; no pose or training adoption. Contract: `../../contracts/simulator-presentation.md#rigged-contact-axial-frame-v1`.

- **Running opening and authored fall refresh:** diagnose the active motion states, coordinate real root speed with gait, and replace the repeating-jog fall with an absolute one-shot stumble/brace/landing/settle. Preserve selected appearance and football facts; verify TDD, exact contact, seek parity, grounding and rendered motion. Contract: `../../contracts/simulator-presentation.md#rigged-motion-refresh-v2`.

---

<a id="16-coherent-match-experience"></a>

<a id="16-coherent-match-experience--task-contracts"></a>
## Task contracts

Status lives only in `../../specs/tasks.md`. The coordinator owns shared reference cameras, visual resource contracts, acceptance evidence and integration. Independent workers get exclusive files and must report exact verification.

1. **CME-01 — Reference and field audit** (`CME-REQ-001..002`). Fix baseline cameras/ticks and inventory field markings against IFAB Law 1. Record existing error and expected geometry before implementation. Name the reference device/browser, capture baseline frame intervals at 1920 x 1080, and freeze the numerical budget (provisional median <= 16.7 ms, p95 <= 25 ms). Blocks field and stadium acceptance.
2. **CME-02 — Field and light candidate** (`CME-REQ-001..003`). Own the shared environment material/light implementation after CME-01. Compare grass at near/far scales, fixed ticks and normal speed, then measure frame cost. Preserve canonical tracks and evidence geometry.
3. **CME-03 — Stadium structure and crowd** (`CME-REQ-004`). Depends on CME-01 and the lighting contract from CME-02. Own stadium geometry/material/LOD and provenance. Review first-person/third-person/goalward composition and measured performance.
4. **CME-04 — Product shell** (`CME-REQ-005`). Independent of CME-02/03 after shared visual tokens are agreed. Own site header, implemented home, reusable button variants and responsive navigation. Keep illustrative prototype content out of production claims.
5. **CME-05 — Immersive interaction** (`CME-REQ-006..007`). Own playtest and authoring shell after the shared stage/menu contract. Add explicit menu state and safe pause/resume/fallback tests; verify browser fullscreen, pointer lock, keyboard, focus and mobile behavior.
6. **CME-06 — Final rig audition and integration** (`CME-REQ-001, CME-REQ-008`; remaining `RFP-REQ-001..007`). Choose a natural-proportion rig using exact licensed assets and match-scene captures. Only after CME-02/03 and selection, implement versioned deterministic pose/resource/observation binding and renewed A/B calibration. Keep the current procedural candidate until independent visual and domain review passes.
7. **CME-07 — Staged acceptance** (`CME-REQ-001..008`). Accept RV-019F environment and UI independently against `CME-REQ-001..007`, including the frozen named-device frame-time budget. Later, after RV-019E rig integration, run combined fixed-tick and normal-speed WebGL, source/resource, A/B evidence, both-locale, responsive and performance checks against `CME-REQ-008` and `RFP-REQ-001..007`. Obtain independent read-only review after the final relevant edit. Nicolas reviews football interpretation before training content approval.
