# First playable incident design

## Design status

Nicolas approved the proposed incident football brief on 2026-11-03. The original shared contracts and executable timeline addendum passed independent review. The full v2 source compiler and pure workflow adapter now pass scoped reviews; trusted publication and browser integration remain open. Nicolas answered the seven rendered-scene prompts, gave scoped positive feedback on the running authoring scene, and requested later interface, full-screen, and character improvements. His answers are recorded in `incident-brief.md`; trusted evidence import, immutable running-build identity, and training calibration remain open. The selected camera starts behind the referee and offers first person as a toggle.

RV-004 is a verified scenario-independent bootstrap: application/tooling, bilingual shell, neutral Canvas lifecycle, and real database connection proof. Domain and persistence work may now follow the frozen RV-003 contracts; rendered scenario evidence remains an RV-008/RV-011 gate.

## Canonical incident

At an authored match minute, an attacking midfielder sends a through pass into the right channel. The receiver is onside by a visible margin. A pursuing defender fails to play the ball and carelessly trips the attacker just inside the penalty area. A covering defender is positioned to prevent a DOGSO interpretation. The reviewed outcome is a penalty kick with no disciplinary sanction.

The contact should be unequivocally inside the area while remaining visually close enough to the boundary to test positioning. An exactly-on-the-line case is deferred because it would mix geometry ambiguity with the first movement and visibility validation.

## Required clocks

- `scenarioTick`: canonical authored time.
- `sessionElapsed`: active user-session duration.
- `matchClock`: displayed football time, including explicit authored jumps.
- `videoFrame`: derived VAR/replay timebase when later required.

XState controls workflow states but does not own a competing simulation clock.

## Main referee flow

```text
loading -> briefing -> ready -> playing -> deciding -> debrief -> replay -> complete
```

Failure and pause states must preserve or safely restore the relevant snapshot.

The live camera follows the referee from behind by default. The player can adjust distance and lateral framing and switch to stabilized first person without changing the canonical timeline or evidence facts. The playable scene must establish whether these controls preserve orientation and reveal meaningful changes in visible evidence.

## Observation model

Evidence is defined independently from the answer key. The initial implementation must account for:

- Camera-to-evidence distance.
- Camera orientation and field of view.
- Actor and environment occlusion.
- Evidence timing window.
- Whether the user looked toward the evidence during that window.

The first model may be deliberately simple, but its limitations must be measured and documented. A single unobstructed ray must not be presented as proof of human perception.

## Public and private content

The playable client receives only data necessary to render and run the incident. The reviewed rubric and private evaluation details remain behind a server boundary. This reduces accidental leakage but is not an anti-cheat guarantee for a client-rendered scene.

## Planned module boundaries

```text
domain: IDs, clocks, scenario/session/attempt contracts
simulation: deterministic playback, input sampling, observation summaries, replay
content: versioned authored incident and public/private projections
data: Prisma/PostgreSQL persistence
web: product shell, simulator UI, R3F rendering, server boundaries
```

## Contract documents

- [`../../contracts/coordinates.md`](../../contracts/coordinates.md)
- [`../../contracts/scenario.md`](../../contracts/scenario.md)
- [`../../contracts/canonical-events-v2.md`](../../contracts/canonical-events-v2.md)
- [`../../contracts/authoring-and-publication-v2.md`](../../contracts/authoring-and-publication-v2.md)
- [`../../contracts/clocks-and-events.md`](../../contracts/clocks-and-events.md)
- [`../../contracts/observation-and-camera.md`](../../contracts/observation-and-camera.md)
- [`../../contracts/decision-and-evaluation.md`](../../contracts/decision-and-evaluation.md)
- [`../../contracts/session-and-persistence.md`](../../contracts/session-and-persistence.md)
- [`../../architecture/testing.md`](../../architecture/testing.md)
- [`incident-brief.md`](incident-brief.md)

Detailed implementation ownership and gates are in [`tasks.md`](tasks.md).

## Recovery design route

This continuation uses delegated SDD for the stopped workflow and full publication authority: coordinator-owned shared contracts and independent review first, then bounded test-first implementation with exclusive paths and independent code reviews. The workflow slice is a pure public presentation adapter. Full authored-source compilation and reviewed publication form a separate sequential authority slice; the existing narrow synthetic path retains its limited identity until consumers migrate. The rendered incident and Nicolas's visual evidence decision remain later gates.

## Risks

- Animation quality may prevent the intended contact from reading clearly.
- Camera motion may cause discomfort or undermine observation.
- A simplistic visibility metric may overstate what was observable.
- Player/ball physics may drift from authored facts if responsibilities are not separated.
- A correct rule label can still be visually unsupported; Nicolas must review both.

## Isolated anonymous-session transport slice

The next RV-006 slice exercises browser ownership without admitting the draft incident. A technical Server Action accepts only an empty payload and an exact configured origin, then reads an HttpOnly cookie. It reuses an unexpired session without extending its absolute seven-day expiry, or creates one only when explicitly asked to establish a session. Protected attempt operations must reject a missing or expired owner; they never create a replacement owner. The action returns only an active status and ISO expiry, never token, owner ID, hash, or raw database rows. A separate server read returns only active/missing status.

The technical page and action are both gated to a development-only isolated `*_test` PostgreSQL target on loopback, distinct from the application database. They create no scenario, plan, attempt, decision, or publication. The application database remains untouched during this proof. The Server Action raw body cap is 262,144 bytes; the final trace JSON bound is checked separately. Exact origin and cookie properties are checked in PostgreSQL tests and a real local Chrome flow. This slice does not satisfy rendered approval or a saved attempt.

## Incident live-controller integration proposal

The authoring preview is a seekable inspection surface; its A/B teleport presets and elevated pass camera never earn live observation credit. A separate local incident playtest may exercise locomotion and C2 capture while publication remains draft, provided it is clearly labeled unsaved and unscored. The scored route will later reuse the same canonical public projection only after trusted publication and owner-bound start. Neither route may receive private evidence windows or rubric in the browser.

At each canonical 60 Hz tick, the controller samples input separately, applies a deterministic field-aware integrator, and appends one immutable `ViewSample`. Incident field bounds are x `-34..34` and z `-52.5..52.5`; the neutral controls preview's swapped axes are not reused as the incident integrator. Walking and sprinting defaults must remain below the C2 `5/60` and `9/60` metre-per-tick ceilings. Mouse look and camera framing are applied at tick boundaries under the C2 yaw/pitch/framing bounds. A camera mode, FOV, or viewport change closes the active epoch before new settings apply; hidden/focus/pointer loss pauses without advancing ticks. A reload starts a fresh diagnostic run rather than filling missing views.

The existing declarative authoring renderer receives React `tick` state and cannot establish an exact render receipt when a frame crosses multiple ticks. The live renderer needs a testable per-frame adapter that updates actor rig/ball transforms and the camera from the **same** immutable canonical tick before a synchronous `gl.render(scene, camera)` submission. Only then may `LiveCapture.submitExact` append a receipt, at most once for that submitted frame and only while visible, pointer-locked, and playing. Skipped canonical ticks still receive views but no receipt; interpolated or replay frames receive no live credit. The adapter must not use camera-only visibility or a DOM tick label as proof of WebGL presentation. A browser capture at known ticks and A/B positions, plus independent visual inspection, remains mandatory.

The local playtest initially returns only diagnostics and a sealed trace to its own page memory. It creates no attempt and exposes no score. Its own XState lifecycle is `loading -> ready -> playing`, `playing <-> paused`, and `playing -> sealed` only after the final exact submission, with explicit error and restart paths. A paused run resumes or restarts; it cannot seal while inactive. It never fabricates the owner-bound `SERVER_RUN_STARTED` or `SERVER_DECIDING_CONFIRMED` events. Each local run has a diagnostic UUID; a restart increments its local revision, while reload makes a fresh UUID at revision zero. At tick 480 the controller submits the final exact frame, seals the trace, stops the clock, and only then releases pointer lock. It records no more than one receipt per canonical tick, including when 144 FPS renders repeated frames; all crossed ticks still receive immutable views. A failed render or lost context creates no receipt. Pause clears held controls and pending look input, closes one epoch, and stops the clock; repeated inactive changes create no new epochs. Resume requires a new pointer lock, time baseline, and active tick. Break-limit exhaustion enters a clear error/restart state.

The clock uses a detached public `TimelineFixture` assembled from `PlayableScenarioV2.actors` and `.ball`, retaining opaque handles and `events: []`, with `createLivePlayback` and a fixed six-tick catch-up ceiling. Browser input receives neither private compiled timeline nor rubric. Its public-frame checksum is labeled separately from the private canonical checksum. Each crossed tick integrates its own sampled input; a late event cannot backfill earlier crossed ticks. The input adapter consumes mouse deltas once, normalizes diagonals, clamps look changes to C2 bounds, and maps screen-right to field `-x` for the existing Three camera facing `+z`. Forward/right input and mouse yaw must be checked visually against this convention. Intentional mode, distance, lateral framing, FOV, and viewport changes close the active epoch; settings changed while paused apply at the next active tick. `ViewSample.viewportAspectRatio` equals the actual submitted Three camera aspect, computed from the canvas CSS render rectangle; detect resize before a credited submission. Record backing dimensions and DPR separately. Entry is disabled outside the C1 `0.75..2.5` aspect interval. FOV is radians in `ViewSample` and degrees in Three; the projection matrix updates before exact submission. The pure C1 camera pose is applied without frame-dependent smoothing. This slice assumes the current authored scene has no camera colliders and makes no general collision claim.

The live scene has one R3F positive-priority frame subscriber owning `gl.render`. It synchronously applies every actor root, articulated limb, ball and referee transform and the camera/projection from the same public tick. Eligible rendering occurs inside `submitExact`'s callback. The same sole render owner may draw ready, paused, sealed, or repeated frames without calling `submitExact`; those draws create no receipts. React state reports diagnostics after submission and never determines scene transforms for a credited frame. A default R3F render, missing asset, stale transform, hidden frame, or WebGL failure cannot create a receipt. The later saved flow obtains an active anonymous owner from the reviewed cookie boundary, starts the reviewed incident under PostgreSQL publication lock, seals the trace on a valid deciding transition, and submits the same trace/decision/idempotency key on retries. The server revalidates the owner, pinned source, current build, trace, private rubric, and transaction. No authoring-only camera or seek action is admitted to this scored flow. Adding the playtest runtime changes the recursive renderer fingerprint, so earlier scene evidence requires renewed source/build binding before publication.

## Authoring preview motion-readability correction

An independent normal-speed visual pass at 1280x720 found the connected fall readable but the decisive leg-to-leg trip too small and brief in the existing 1098x458 canvas. Before changing authored football facts or claiming motion acceptance, add an explicit fullscreen control to the separate authoring preview. Fullscreen must show the WebGL stage across the display while keeping playback, A/B, camera and tick controls operable in a compact overlay; Escape and the button leave fullscreen. The original inline layout and both locales remain available. This is a reversible presentation correction and changes the renderer source fingerprint, so scoped visual comparison and motion review must run again. It does not publish training content or grant live observation credit.

## Local playtest browser integration boundary

The bilingual `/[locale]/simulator/incident-playtest` route uses the public `loadIncident001Preview()` projection as a local diagnostic input only. It must clearly say unsaved and unscored. It loads and byte-verifies the public procedural modules before enabling play. A real user gesture acquires pointer lock on the canvas; `pointerlockchange`, focus, visibility, and resize events control pause/resume. WASD, sprint and mouse look use timestamps from the same monotonic clock as R3F frame submissions. The page offers first/third person and bounded distance/lateral controls without seek, playback speed, A/B teleport, private evidence, or initial decision UI. The controller owns all canonical tick advancement; React state displays diagnostics afterward and never selects a credited WebGL frame. One positive-priority R3F frame subscriber owns every `gl.render`; eligible submissions go through the reviewed exact-scene adapter inside `LiveCapture.submitExact`, while ready/paused/terminal redraws earn no receipt. Tick 480 seals in memory before pointer release. The route creates no anonymous owner, database row or evaluation. Actual Chrome pointer-lock and scene movement, responsive desktop notice, both locales, lifecycle recovery, canvas/camera parity and pixel-level normal-speed incident readability remain integration acceptance gates.
