# Observation, evaluation, and review evidence

This document groups reusable system contracts by domain. Stable contract IDs are preserved in section anchors; implementation and task status remain in [`../specs/tasks.md`](../specs/tasks.md). Feature-specific acceptance remains under `docs/features/`.

## Contents

- [observation and camera](observation-evaluation.md#observation-and-camera)
- [observation trace v1](observation-evaluation.md#observation-trace-v1)
- [decision and evaluation](observation-evaluation.md#decision-and-evaluation)
- [renderer fingerprint v1](observation-evaluation.md#renderer-fingerprint-v1)
- [review evidence v1](observation-evaluation.md#review-evidence-v1)

<a id="observation-and-camera"></a>
## Observation and camera contract

### Principle

Observation estimates evidence available to the controlled referee and presented to the user during active live play. It never changes facts and must not claim to measure human perception perfectly. The referee-eye viewpoint is anchored to the validated referee position, calibrated eye height, and independent look orientation. The rendered camera is a separate presentation viewpoint, starting behind the referee with bounded distance and lateral framing and a first-person toggle.

```ts
type EvidenceDefinition = Readonly<{
  evidenceId: string;
  window: Readonly<{ fromTick: number; toTick: number }>;
  anchors: readonly string[];
  role: "mainReferee" | "assistantReferee" | "var";
  requiredFor: readonly ("decision" | "restart" | "discipline" | "protocol")[];
  visibilityModelVersion: number;
}>;

type ViewSample = Readonly<{
  tick: number;
  refereePosition: Vec3m;
  lookYaw: number;
  lookPitch: number;
  cameraMode: "thirdPerson" | "firstPerson";
  cameraDistanceM: number;
  cameraLateralOffsetM: number;
  viewportAspectRatio: number;
  verticalFovRad: number;
}>;

type EvidenceObservation = Readonly<{
  evidenceId: string;
  sampledTicks: number;
  refereeEyeReadableTicks: number;
  renderedCameraReadableTicks: number;
  jointlyReadableTicks: number;
  cameraOnlyTicks: number;
  refereeEyeOnlyTicks: number;
  closestRefereeEyeDistanceM: number | null;
  confidenceBand: "none" | "weak" | "supported";
}>;
```

### Initial visibility model

At fixed canonical sampling ticks, calculate and retain separately for the referee eye and the rendered camera:

- Distance from each viewpoint to evidence anchors.
- Whether anchors fall inside the camera frustum and central/peripheral zones.
- Authored-actor and environment occlusion.
- Whether the user looked during the evidence window.
- Whether the configured minimum readable duration was met.

Only a tick at which the same required evidence is readable from both viewpoints contributes to referee observation credit. Readability from different ticks or viewpoints cannot be combined. Evidence visible only from the offset camera may inform the user's decision, but earns no referee observation or positioning credit. Evidence available to the referee eye but absent from the displayed view also earns no observation credit. The debrief distinguishes these cases after finalization. Camera help explains this rule without revealing private evidence during the attempt.

The private rubric maps jointly readable ticks and the minimum readable duration to `confidenceBand`. A single ray hit is never sufficient by itself. Thresholds are versioned and calibrated against deterministic screenshots/recordings plus human review. Camera framing changes never move the referee eye or retroactively alter observation history; turning the look control changes referee-eye orientation. Replay never adds credit to the finalized live attempt.

The client may calculate provisional visibility for feedback/debugging, but finalization submits a bounded tick-stamped trace of referee position/look, camera mode/framing, viewport aspect ratio, field of view, and separate focus/pause render receipts and breaks. Camera-rig, eye-calibration, and visibility-model versions are pinned to the attempt. The server validates ordering, framing bounds, and plausible locomotion; reconstructs both viewpoints (including camera collision adjustments) against the canonical timeline; and recomputes the authoritative summary. Submitted camera coordinates or client visibility summaries are not authoritative. This limits accidental or trivial score forgery; it is not a competitive anti-cheat system.

### Main-referee camera

- Default presentation is stabilized third person behind the controllable referee. First person places the rendered camera at the referee-eye viewpoint, initially 1.70 m high and configurable for accessibility/calibration.
- Third-person distance and lateral offset have versioned bounds; camera collision avoidance may change the rendered pose but never the referee-eye viewpoint.
- Locomotion root and view orientation are separate; the user can look without changing the authored play.
- Default horizontal field of view target: 80-90 degrees, derived from a stored vertical FOV and viewport aspect ratio.
- Head-bob is off by default; sprint shake is restrained and reducible.
- Pointer capture, release, focus loss, pause, recapture, and keyboard help are explicit UI states.
- Mouse sensitivity, invert-Y, motion reduction, and quality settings persist as preferences.

Valid: a correct penalty decision with `EV-TRIP-CONTACT = none` can score well for decision quality and poorly for observation.

Invalid:

- Awarding observation points because the final answer was correct.
- Revealing replay-only anchors before attempt finalization.
- Moving the contact so it enters the user's view.
- Treating an off-screen broadcast feed as live referee evidence.
- Awarding observation credit for evidence visible only because the third-person camera looks around an occluder.

### Executable RV-005 C1 geometry baseline

This is a deliberately narrow, versioned synthetic measurement contract, not a validated human-perception threshold or the complete scenario/evaluation model. C1 computes geometric availability only; C2 validates an active-live trace and maps measurements to confidence. No client-provided visibility boolean or camera coordinate becomes authoritative.

- An `ObservationFixture` is pinned to the exact scenario ref and `durationTicks` of a validated `TimelineFixture`. It declares `visibilityModelVersion: 1`, `cameraRigVersion: 1`, and `eyeCalibrationVersion: 1`; unknown versions or mismatched refs/durations fail validation. Evidence IDs are unique. Each evidence has an inclusive integer window inside `0..durationTicks`, one or more stable required anchor IDs, and a complete sample for every tick in its window. Every sample provides world-space positions for every required anchor and zero or more authored, ID-stable, axis-aligned occlusion boxes. No skeletal attachment or inferred player mesh is claimed in C1. Samples, anchors, and boxes are defensively copied and frozen.
- The narrow C1 input shape is `ref`, `scenarioContentHash`, `durationTicks`, the three versions above, `cameraColliders: Box[]`, and `evidence: { evidenceId, fromTick, toTick, requiredAnchorIds: string[], samples: { tick, anchors: { anchorId, position }[], occluders: Box[] }[] }[]`. A `Box` is `{ boxId, min: Vec3m, max: Vec3m }`. `samples` cover every integer tick of that evidence window; anchor and occluder IDs are unique within a sample. An evidence with missing or duplicate samples, missing anchors, or unknown tick is invalid. `scenarioContentHash` must be a `sha256:` plus 64 lowercase hex characters and match an expected hash supplied by the trusted caller. Synthetic C1 tests supply a fixture hash; production supplies the reviewed published manifest hash. These private geometry definitions are immutable scenario-version content covered by that manifest hash and pinned to an attempt. The isolated C1 validator checks the declared identity and shape, not the cryptographic derivation of a whole manifest; the content publication pipeline must verify that derivation later. The observation fixture is server-only and excluded from the challenge-safe playable projection. C1 is main-referee geometry only; role-specific evidence and private rubric projection remain separate.
- All coordinates are metres in the canonical right-handed world. Each box has finite ordered `min`/`max` corners, positive extent on all axes, and a stable ID. A sight segment is blocked when it intersects a box interior at a distance strictly between `0.001 m` from the viewpoint and `0.001 m` before the anchor. Process boxes in ID order for reproducible diagnostics. Do not globally ignore an evidence owner's body: a box can screen its own lower-leg anchor. World-state checksums exclude these observation definitions and never change with a viewpoint.
- Eye pose is the validated referee ground position plus `(0, 1.70, 0)` metres, with independent look yaw and pitch. Yaw `0` faces `+z`, positive yaw turns toward `+x`, and positive pitch looks up. For yaw `Y` and pitch `P`, forward is `(sin(Y) cos(P), sin(P), cos(Y) cos(P))`; right is `(cos(Y), 0, -sin(Y))`; up is `forward × right`. First-person rendered pose equals eye pose exactly.
- In third person, the unobstructed desired camera point is `eye - horizontalForward * cameraDistanceM + right * cameraLateralOffsetM + (0, 0.40, 0)`, where `horizontalForward=(sin(Y),0,cos(Y))`. Its target is `eye + forward * 10 m`; `viewForward` is the normalized vector from the resolved camera point to that target. Use world up `(0,1,0)` and a roll-free basis: `right = normalize(worldUp × viewForward)`, then `up = viewForward × right`. For camera collision, use a separate list of authored static AABBs and the nearest segment/box entry from eye to desired point. Travel along eye → desired by `max(0, entryDistanceM - 0.10 m)`; if the eye starts inside a camera collider, use the eye point. This adjustment never moves the referee eye or authored world. Ties use box ID order.
- C1 rejects nonfinite inputs. For the synthetic rig, referee ground `y=0`, pitch is `-1.2..1.2 rad`, third-person distance `2..8 m`, lateral offset `-3..3 m`, viewport aspect ratio `0.75..2.5`, and vertical FOV `0.785..1.31 rad`; first-person retains bounded distance/lateral preference values but ignores their offsets for pose reconstruction. Eye yaw may be any finite radian value. Later C2 additionally validates plausible movement and per-tick input changes.
- The RV-005 workflow run-start guard must use this same executable C1 view validation for its tick-zero public response and the C2 referee field bounds. The exact transport shape is checked before geometric validation. A weaker independent set of camera bounds in the presentation adapter is invalid.
- C1 accepts finite look yaw and finite look pitch within `-1.2..1.2 rad`; C2 will enforce trace-level order and locomotion bounds. C1 measures eye visibility using a fixed synthetic half-FOV of `55°` horizontal and `45°` vertical. It measures rendered-camera visibility using the validated sample's vertical FOV and aspect ratio, with horizontal half-FOV `atan(tan(verticalFovRad/2) * aspectRatio)`. For each anchor, project its direction onto viewpoint right/up/forward; behind-view anchors fail. An anchor is geometrically readable only if its distance is at most `30 m`, it is inside both FOV axes, it is inside the central zone (`30°` horizontal and `25°` vertical), and its sight segment is not blocked. Angle boundaries and the `30 m` distance boundary are inclusive. Peripheral/frustum-only results may be retained diagnostically but do not earn C1 readability.
- One tick is `joint` only if **every required anchor** is readable from both the referee eye and rendered camera on that same tick. C1 classifies any queried tick inside an evidence window as `joint`, `cameraOnly`, `eyeOnly`, or `neither` using the all-anchors result for each viewpoint; the validated view sample's tick must equal the queried tick. Seeing anchor A from the eye and anchor B from the camera does not compose into joint evidence. Live eligibility belongs to C2. C1 does not infer that a render frame was presented or attended to.
- Synthetic C1 test inputs use `60 Hz`, the `1.70 m` eye height, `30 m` maximum anchor distance, and the angles above. They are engineering test constants, not claims that a real referee can interpret contact under those conditions. RV-008 captures and Nicolas's rendered-evidence review must calibrate production thresholds and animation proxies before observation scores are accepted.

### RV-005 C2 trace and confidence decisions

The live trace must distinguish live from replay, document-visible from hidden, pointer-locked from released, and active from paused. A replay cursor's `isInputActive` flag is not observation eligibility. A frame that advances multiple canonical ticks must not assign its final pose to unseen earlier ticks. Until C2 is implemented and the rendered incident is calibrated, C1 measurements are diagnostic geometry only.

The reviewed executable C2 contract is in [`observation-evaluation.md#observation-trace-v1`](observation-evaluation.md#observation-trace-v1). Its synthetic confidence thresholds still require rendered-scene calibration and Nicolas's evidence review before production use.

<a id="observation-trace-v1"></a>
## Candidate RV-005 C2 live-observation trace contract

Status: reviewed synthetic v1 contract for RV-005 C2 implementation. It refines the C1 geometry model in [`observation-evaluation.md#observation-and-camera`](observation-evaluation.md#observation-and-camera). Its trace shape and validation rules passed independent read-only review on 2026-11-03; it does not calibrate human perception or authorize a production observation score for the first rendered incident.

### Authority and identity

The trusted server binds one trace to `scenarioRef`, cryptographic `scenarioContentHash`, `attemptId`, `runRevision`, and versions `traceVersion=1`, `visibilityModelVersion=1`, `cameraRigVersion=1`, `eyeCalibrationVersion=1`, `observationRubricVersion=1`. The immutable published scenario version supplies the authored main-referee ground spawn and initial look orientation. Before entering `playing`, a server-validated `AttemptRunStart` record pins that spawn, validated camera mode/distance/lateral framing/FOV preferences, validated viewport aspect, role `mainReferee`, and current `runRevision`. The session plan selects the scenario version/role; it is **not** the source of the full initial camera pose. The trace itself is untrusted input. Reload while playing atomically increments the persisted attempt `runRevision`, returns it to `ready` at tick zero, and invalidates the old uncommitted trace; a stale revision cannot finalize. The server checks identity, versions, role, initial view, and bounds against the attempt run start and private observation fixture. It never accepts client visibility booleans, evidence IDs, scores, camera world coordinates, or an answer-derived observation claim.

`stopTick` is a trace/finalization claim, not a pre-known server value. The server requires `trace.stopTick === initialDecision.decisionTick`, an integer inside the published scenario's decision window and `0..fixture.durationTicks`, with an eligible `playing -> deciding` transition for the same run revision. The trace may end before an evidence window ends; that is not a validation error. These persistence/workflow fields are contract requirements for RV-006/RV-009, not claims that the current schema implements them.

The C2 synthetic maximum is `stopTick <= 480` (eight seconds at 60 Hz). This is an MVP resource bound, not a content or session-length promise. A future longer session needs a versioned chunk protocol rather than silently raising this limit.

### Records

```ts
type LiveViewTickV1 = Readonly<{
  tick: number;                 // exact canonical integer tick, including tick 0
  epoch: number;                // active-play segment, starting at 0
  sprint: boolean;
  view: ViewSample;             // C1 fields; view.tick === tick
}>;

type RenderReceiptV1 = Readonly<{
  sequence: number;             // global monotonically increasing trace-event sequence
  tick: number;                 // exact non-interpolated canonical state submitted
  epoch: number;
  source: "live" | "replay";
  workflowState: "playing" | "other";
  documentVisible: boolean;
  pointerLocked: boolean;
  paused: boolean;
}>;

type TraceBreakV1 = Readonly<{
  sequence: number;             // same global sequence as render receipts
  afterTick: number;            // last view tick in the prior epoch
  nextEpoch: number | null;     // previous epoch + 1, or null for terminal deciding
  reason: "pause" | "hidden" | "pointerReleased" |
          "performancePause" | "viewportChanged" | "cameraChanged" | "deciding";
}>;
```

`ObservationTraceV1` contains the bound identity and versions, `views`, `renderReceipts`, and `breaks`. `ViewSample` means the exported C1 geometric shape (`tick`, referee position/look, camera mode/framing, aspect, FOV); it does **not** carry `pointerLocked` or `paused`. Those lifecycle claims exist only on receipts and breaks. The illustrative `ViewSample` in `observation-evaluation.md#observation-and-camera` now matches this shape. The trace has exactly one view for every integer tick `0..stopTick`, in index/tick order, including ticks crossed by a render frame. The input integrator samples every canonical tick; it must never backfill crossed ticks with the final render-frame pose. A view is a claim about the controlled referee and camera state at that tick, not proof that the browser displayed it. A receipt records that the renderer submitted that exact canonical state after resolving its view; it is still not proof that the compositor displayed it or the human attended to it. An interpolated frame cannot earn credit in v1. It may be drawn, but only a receipt of a non-interpolated canonical state is eligible.

`views.length` is at most 481; normalized eligible live `(epoch,tick)` receipts are at most 481; raw receipts are at most 1024; breaks are at most 64. Payload byte limits also belong at the HTTP boundary. Reject missing, duplicate, reversed, out-of-range, nonfinite, or unknown-version views rather than sorting or interpolating them. Require each receipts/breaks array to have increasing integer `sequence`, require unique sequence values across both arrays, then merge by sequence for lifecycle validation; no original interleaved array order is assumed. Validate epoch/tick against the active segment at each event. Reject a live receipt referencing a missing view, wrong epoch, or an earlier tick than the previous live receipt. In particular, an old-epoch same-tick receipt **after** a break is invalid even if its flags say playing/visible/locked. A `source=live` receipt in a finalization trace must have `workflowState=playing`, visible document, pointer lock, and `paused=false`; otherwise reject it as an invalid lifecycle record. The adapter emits a break and suppresses live receipts during inactivity. Repeated valid live receipts for one `(epoch,tick)` (for example at 144 fps) coalesce to one eligibility tick. Replay receipts are bounded diagnostics, never credit; a finalization payload should normally have none, but their presence cannot create eligibility. `source=live` and `workflowState=playing` alone do not establish eligibility without the other flags and correct event ordering.

### Segments and physical bounds

Epoch 0 starts at view tick 0. Each nonterminal break ends the current epoch after its `afterTick < stopTick`, has `nextEpoch=currentEpoch+1`, and the next view starts that epoch at `afterTick+1`. Breaks are strictly ordered; no empty, skipped, or overlapping epoch. An explicit pause, hidden document, lost pointer lock, performance pause, viewport/FOV change, camera mode/framing change, or transition to deciding closes the eligible segment. One active epoch gets one break reason; additional setting changes while inactive apply at the next tick without adding empty epochs. No canonical tick advances during inactivity. Controls, framing, and FOV may be adjusted while inactive only by applying their effect to the next active tick; they must not retroactively rewrite a recorded view or render receipt. Resume requires a fresh clock baseline and a new epoch. Exactly one **terminal** `deciding` break is required for a finalization trace, with `afterTick=stopTick` and `nextEpoch=null`; it is the last live event, has no following view, and no live receipt can follow it. C2-A rejects any other null successor, a nonterminal deciding break, or a terminal break with a numeric successor. A pause/hidden/unlocked/performance break with no following view is an abandoned/incomplete run, not a valid finalization trace. A held tick rendered after a pause is not eligible for the new epoch.

C1 validates each view's finite coordinates, ground `y=0`, pitch, camera distance/lateral offset, aspect, and FOV. C2 additionally checks the server-bound initial position and orientation, pitch, mode, framing, aspect, and FOV at tick 0. The synthetic v1 movement envelope is ground-field bounds from the trusted scenario configuration, walking displacement `<=5/60 m` per active tick and sprinting `<=9/60 m` per active tick, with `1e-6 m` numeric tolerance. Sprint applies to the destination tick. Within an epoch, the shortest wrapped yaw change is `<=12/60 rad`, pitch change `<=6/60 rad`, and camera distance/lateral change `<=12/60 m` per tick. FOV and viewport aspect remain constant within an epoch. At an epoch boundary, the next pose still obeys ground bounds and cannot teleport; movement from prior view position to next view position is zero while inactive plus at most the destination tick's normal movement budget. Orientation, mode, and framing may change at the boundary, but the new values apply only at the next active tick, after the break, and still satisfy C1 bounds. Mode changes require a break. These are validation ceilings, not movement speeds or user-facing sensitivity defaults.

The adapter must produce view ticks using the same deterministic fixed-step input integrator as the displayed controlled referee, and associate renderer receipts with the view actually used for that render submission. Input and camera changes during replay cannot modify the finalized live trace. The pure `ReplayPlayback.isInputActive` getter is not a live-observation permission and must not be used for eligibility.

### Synthetic confidence computation

The server reconstructs C1 viewpoints and measures each evidence window's intersection with `0..stopTick` from the private canonical fixture and validated views. It does not invent a view for later ticks. It keeps eye-readable, camera-readable, jointly readable, camera-only, and eye-only diagnostics separate. Only an exact `(epoch,tick)` eligible live render receipt with `workflowState=playing`, visible document, pointer lock, and `paused=false` can make a C1 `joint` tick eligible. A geometric joint tick with no eligible receipt is not presented evidence.

For each evidence ID, find contiguous runs of C1 `joint` ticks within one epoch. Inside each run, collect distinct eligible receipt ticks; split a receipt chain whenever the next eligible tick is more than two canonical ticks later. The chain's span is `lastTick - firstTick`; intermediate ticks without receipts must not be called presented. The strongest chain gives:

| Band | Minimum distinct eligible receipts | Minimum span |
| --- | ---: | ---: |
| `none` | fewer than two, or no qualifying chain | n/a |
| `weak` | 2 | 1 tick |
| `supported` | 3 | 4 ticks |

The synthetic observation score is `none=0`, `weak=40`, `supported=100`, taking the minimum across one or more rubric-required evidence IDs; an empty required-evidence set is invalid for this scoped rubric. No eligible live receipt anywhere in the attempt yields `insufficientEvidence` with `score=null`, not a fabricated zero. If eligible live rendering occurred but a required evidence window is wholly after `stopTick`, or its sampled ticks were never joint/readable, that evidence receives `none` and the result is `scored: 0`. Decision correctness cannot raise observation. Private evidence definitions and thresholds remain unavailable in challenge play; debrief may reveal reviewed evidence after finalization. Other evaluation dimensions are outside this C2 slice.

The C2-B implementation receives required evidence IDs only through a trusted private rubric bound to scenario ref, content hash, and rubric version. The server must construct that rubric from the published private scenario; request data must not select or narrow its required evidence set.

These thresholds are engineering examples for contrast tests, not a validated perceptual standard. Thirty, sixty, and 144 rendered FPS must preserve the same authored facts and per-tick movement and may reach the same band on a sufficiently long visible window; they do **not** promise identical literal receipt sets or identical confidence on every short window. RV-008 must calibrate against deterministic captures and Nicolas's visual review before production scoring.

### TDD and staged handoffs

1. **C2-A:** pure trace identity, shape, ordering, epoch, bounds, and locomotion validator in `packages/simulation/src/**`. Red tests assert specific rejected/accepted records with a real importable function or behavior-level stub; module-load errors and zero assertions do not count.
2. **C2-B:** pure C1-measurement-to-eligible-live summary and synthetic rubric score, with replay/hidden/unlocked/paused exclusions, intermittent joint frames, good/poor positions, and correct-guess independence. Same assertion-level red/green rule.
3. **C2-C:** clock/input/render adapter that emits every tick view and exact render submissions across 30/60/144 cadence, pause/focus/reload breaks, and no retroactive mutation. Browser visual inspection is still necessary; a DOM assertion alone cannot prove contact readability.

The pure C2-C adapter requests input separately for each crossed canonical tick. Its exact-render callback must submit the current immutable view before it records a receipt. An inactive lifecycle snapshot closes the active epoch and suppresses held-tick receipts until a new active tick. The callback and lifecycle values remain browser claims; R3F wiring, compositor presentation, and human readability are later integration and visual-review gates.

The coordinator owns this contract and any shared schema/HTTP integration. Each implementation slice requires a bounded handoff and independent read-only review before authority claims. There is no claim here that the 3D incident, persistence, or decision flow is implemented.

<a id="decision-and-evaluation"></a>
## Decision and evaluation contract

### Initial decision

```ts
type InitialDecision = Readonly<{ // canonical persisted record, never the browser DTO
  attemptId: string;
  scenarioRef: ScenarioRef;
  decisionId: string;
  decisionTick: number;
  stopPlay: boolean;
  restart: "playOn" | "penaltyKick" | "directFreeKick" | "indirectFreeKick" | "droppedBall";
  discipline: "none" | "yellow" | "red";
  offenderActorId: string | null;
  confirmedAt: string;
  idempotencyKey: string;
}>;
```

The UI may collect the fields in steps, but confirmation creates one immutable initial decision. A later VAR/final decision is a separate record linked to it; it never overwrites the initial choice.

The challenge transport uses `offenderActorHandle`, an opaque public actor handle. For a non-null choice, the server resolves it through the pinned scenario's private canonical-to-public mapping and stores the canonical `offenderActorId` shown above. Unknown handles and submitted canonical IDs fail. The normalized canonical decision, not the untrusted handle string, enters the finalization digest and evaluation. Owner-bound public attempt views convert the canonical ID back to its public handle.

The browser presentation workflow may retain only the exact public transport choice and its pinned public roster. It must copy/freeze the choice on confirmation. An uncertain finalization failure keeps that choice and its idempotency key for an identical retry or owner-bound restoration; it cannot allow editing a possibly committed initial decision. The server remains the sole authority for canonical normalization and evaluation.

Validation examples:

- Valid browser choice: `stopPlay=true`, `restart=penaltyKick`, `discipline=none`, and an offender handle from the pinned playable roster such as `actor-006` (the server resolves the handle before storing a canonical actor ID).
- Valid incorrect answer: `stopPlay=false`, `restart=playOn`, `discipline=none`. It must be accepted and evaluated, not rejected as malformed.
- Invalid: `stopPlay=false` with `restart=penaltyKick`.
- Invalid: a discipline choice with an actor not in the scenario.
- Invalid: a decision tick outside the permitted decision window.

### Deterministic evaluation

The server evaluates a finalized decision and a server-recomputed observation summary against the immutable private rubric for the exact scenario version. It validates the bounded view/input trace against tick order, movement constraints, and the canonical scenario before deriving observation; it does not trust a client-supplied score or confidence band.

```ts
type DimensionResult = Readonly<{
  status: "scored" | "notApplicable" | "insufficientEvidence";
  score: number | null; // integer 0..100 only when scored
  reasonCodes: readonly string[];
  evidenceIds: readonly string[];
}>;

type EvaluationResult = Readonly<{
  evaluationVersion: number;
  decisionQuality: DimensionResult;
  observationAndPositioning: DimensionResult;
  communication: DimensionResult;
  protocolApplication: DimensionResult;
  debriefContentId: string;
}>;
```

Rules:

- Dimensions remain separate. The first MVP has no authoritative aggregate score.
- `notApplicable` is not converted to 100 or 0.
- Decision quality uses answer-key alternatives appropriate to `clear`, `interpretative`, or `inconclusive` content.
- Observation uses only eligible live evidence, not replay or final-answer correctness.
- Communication can score authored inputs such as whistle timing and selected signal after those inputs and their timing contract exist; it does not pretend to analyze speech. The first synthetic v1 below reports it as `notApplicable` until then.
- Protocol is `notApplicable` for the initial main-referee/no-VAR task.
- Reason codes and debrief copy are versioned; AI output cannot alter any result.

The client displays returned results but does not calculate the authoritative evaluation.

### Initial clear main-referee evaluation v1

The first incident uses a narrow immutable private rubric. This defines a conservative synthetic implementation before rendered-evidence calibration; it does not assign partial-credit weights that have not been reviewed.

```ts
type ClearPenaltyMainRefereeRubricV1 = Readonly<{
  evaluationVersion: 1;
  classification: "clear";
  role: "mainReferee";
  decision: Readonly<{
    mode: "exactSemanticMatch";
    expected: Readonly<{
      stopPlay: true;
      restart: "penaltyKick";
      discipline: "none";
      offenderActorId: string;
    }>;
    allowUnspecifiedOffenderWhenNoCard: true;
    evidenceIds: readonly string[];
  }>;
  observation: Readonly<{
    observationRubricVersion: 1;
    requiredEvidenceIds: readonly string[];
  }>;
  communication: Readonly<{ mode: "notApplicable"; reason: "noAuthoredCommunicationInput" }>;
  protocol: Readonly<{ mode: "notApplicable"; reason: "initialMainRefereeNoVar" }>;
  debriefContentId: string;
}>;
```

Validate exact keys and literal scope, a canonical offender in the pinned roster, nonempty unique evidence IDs contained in the pinned private observation fixture, and an immutable prepared debrief ID for the same scenario version. For the actual `incident-001` publication, the required set must include `EV-TRIP-CONTACT` and `EV-INSIDE-AREA`; the reviewed content gate must also decide whether `EV-NO-BALL-TOUCH` and `EV-NON-DOGSO` are jointly readable enough to require. A synthetic test fixture may use other named evidence, but its scores are not training claims. The authored rubric omits `scenarioContentHash` to avoid a self-referential hash. After source validation, the server binds the rubric to the verified scenario ref and derived content hash; it does not accept a client-supplied bound rubric or observation summary.

Normalize only declared semantic decision fields. `decisionTick` must be a safe integer in the pinned decision gate and equal the server-recorded deciding tick and trace stop tick. `stopPlay` must equal whether `restart` differs from `playOn`. A card requires a non-null known offender handle. Without a card, a null offender is valid; any supplied handle must still resolve to a roster actor. Wrong but structurally valid decisions remain accepted. Unknown handles, submitted canonical actor IDs, client scores/rubrics, and undeclared fields are rejected. Resolve the public handle to the canonical ID before digesting, evaluating, or storing.

Decision quality scores `100` only for stop, penalty kick, no card, and either no offender selection or the expected canonical offender; otherwise it scores `0`. Emit `stopMismatch` when stop differs, `restartMismatch` when restart differs, `disciplineMismatch` when discipline differs, and `offenderMismatch` only when a non-null selected canonical actor differs from the expected actor. Emit codes in that order; a correct decision has no mismatch code. Supporting decision evidence IDs describe authored rationale, not what the referee observed. The server recomputes observation with C2 from the exact pinned trace and private rubric: `none=0`, `weak=40`, `supported=100`, taking the minimum required-evidence band. No eligible live receipt yields `insufficientEvidence` with a null score. A correct guess does not alter observation. Communication is `notApplicable` with null score and `noAuthoredCommunicationInput`; protocol is `notApplicable` with null score and `initialMainRefereeNoVar`. Neither claims a perfect score or voice analysis. `decisionTick` is not a measured whistle/signal input. Evaluation version `1` fixes these rules and reason-code semantics, with no aggregate score.

The approved incident brief includes whistle timing and a clear signal as communication feedback intent. The first synthetic implementation has no authored whistle/signal input distinct from decision confirmation, so it must show that dimension as unavailable instead of awarding a fabricated score. RV-009 may add a separately recorded whistle/signal action and an authored timing rubric; doing so reopens this contract and requires dedicated tests. This deferral does not waive Nicolas's later rendered-evidence review or claim the approved communication feedback is already implemented.

<a id="renderer-fingerprint-v1"></a>
## Local incident renderer fingerprint v1

This contract identifies local rendering inputs for retrospective comparison with Nicolas's scoped first-incident scene response. It is a rendering-input identity, not proof of the code loaded by a development server, an emitted Next build hash, authenticated approval, or a production deployment credential. It cannot authorize reviewed catalog/start reads. Nicolas's seven rendered-review answers are recorded as conversation evidence; publication remains draft while trusted attribution/import, calibration acceptance, and a separate immutable running-build identity are incomplete.

### Manifest and digest

The server compiles `incident-001` version 1 from the canonical source with verified asset bytes. It derives `sourceContentHash` and `playableProjectionHash`; the latter is SHA-256 over UTF-8 canonical JSON of `["refview-playable-v1", compiled.playable]`. The manifest has exact keys `schemaVersion: 1`, those two hashes, `execution: { nodeVersion, pnpmVersion, mode: "development", sessionTestMode: false }`, and `files: [{ path, byteLength, sha256 }]`. The full fingerprint is SHA-256 over UTF-8 canonical JSON of `["refview-renderer-input-v1", manifest]`.

Canonical JSON sorts object keys ordinally, preserves array order and string bytes, normalizes negative zero, rejects nonfinite numbers, undefined, functions, sparse arrays, and non-JSON objects. Manifest file paths use repository-relative forward slashes, are sorted ordinally, and are unique case-insensitively. Hash exact file bytes; never normalize line endings. Reject missing files, symlinks, path escape, duplicate/case-colliding paths, and any mismatch between canonical asset bytes and the served public counterpart. The manifest is recomputed from fixed membership, not supplied by the browser.

Fixed v1 configuration and browser entrypoint membership:

```text
apps/web/src/features/simulator/incident/IncidentPreview.tsx
apps/web/src/features/simulator/incident/incident.css
apps/web/src/features/simulator/incident/load-incident.ts
apps/web/src/features/simulator/controls/controls.ts
apps/web/src/app/[locale]/simulator/incident-preview/page.tsx
apps/web/src/app/[locale]/layout.tsx
apps/web/src/app/globals.css
apps/web/src/lib/i18n/locale.ts
apps/web/next.config.ts
apps/web/postcss.config.mjs
apps/web/package.json
packages/content/package.json
packages/domain/package.json
packages/simulation/package.json
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
tsconfig.packages.json
apps/web/tsconfig.json
packages/content/tsconfig.json
packages/domain/tsconfig.json
packages/simulation/tsconfig.json
```

Also recursively enumerate every regular file with extension `.ts`, `.tsx`, `.js`, `.mjs`, `.css`, or `.json` under `apps/web/src`, `packages/content/src`, `packages/domain/src`, and `packages/simulation/src`. Exclude only basenames matching `*.test.*`, `*.spec.*`, `*.d.ts`, `*.d.mts`, or `*.d.cts`, and the exact `apps/web/src/generated/prisma/` prefix. No fixture path is excluded in v1. Reject a symlink instead of silently following it. Include every canonical procedural module referenced by the compiled playable asset manifest under `packages/content/assets/` and its exact `apps/web/public/assets/` served copy. Do not include `.next` outputs, screenshots, documents, Git metadata, or absolute machine paths. Resolve and validate the actual local runtime import graph: any import escaping this membership is a failure. A new build configuration file or unsupported runtime-file extension requires a fingerprint-version amendment and renewed review. This deliberately includes unrelated source whose change might not alter pixels; conservative invalidation is acceptable for this local v1.

### Retrospective capture comparison

The historical fingerprint is `null`: no such digest existed when Nicolas replied. Record a reconstructed fingerprint with this method and preserve provenance for the files, reviewer capture, and fresh capture. File modification times alone do not prove what a running development server loaded. Reproduce exactly A/B x first/third person x ticks 360, 366, 371, 386 plus elevated pass tick 120 in Chrome at a 1280x720 CSS viewport. Preserve a separate byte hash for each original and fresh PNG. Record each capture's tick, pose, camera mode/settings, pass-view state, viewport, canvas rectangle and backing dimensions, DPR, browser identity, time when known, and source-file provenance. Mark reconstructed metadata explicitly. Require identical relevant capture settings and full canvas coverage by the comparison crop.

For this local v1 the current measured canvas rectangle is `x=91`, `y=109.1875`, `width=1098`, `height=458` CSS pixels. Compare decoded RGB pixels with no scaling, masks, blur, or tolerance inside the outward-rounded rectangle `(x=91, y=109, width=1098, height=459)`. All 17 pairs must have zero differing pixels and zero channel delta. A single missing pair, any PNG failing its own separately recorded byte hash, changed capture metadata, or nonidentical compared pixel fails the retrospective comparison. Paired whole-PNG byte equality is not required; bytes outside the crop and encoding may differ. The 17 preserved reviewer captures and fresh captures currently match exactly inside that rectangle, as independently checked. Normal-speed motion and the seven brief questions remain separate human-review gates.

A later renderer/input change needs new captures and review. A future reviewed catalog/start operation must derive a separate identity from an immutable emitted build and verify its served asset bytes and binding to this reviewed evidence. That running-build design and implementation require their own contract and independent review. A browser argument, hardcoded constant, or fresh filesystem hash beside a development build is never sufficient authority.

### Selected skinned-player candidate amendment

The local diagnostic membership now also includes every public resource in the fixed `PLAYER_RESOURCE_MANIFEST` from `apps/web/src/features/simulator/rigged-player/resources/manifest.ts`. Each entry's public URL maps to `apps/web/public` plus that URL; its exact byte length and SHA-256 must match before it is included. This binds the selected body, hair, animation, binary buffers and textures even though these resources are not yet canonical scenario assets. Source code and the manifest itself are already covered by recursive source membership. Reject missing, altered or unsafe resources. This conservative membership amendment invalidates all prior fingerprints and requires new captures; it cannot confer training/publication authority or reuse the historical procedural calibration.

<a id="review-evidence-v1"></a>
## Local first-incident review evidence v1

This is a candidate evidence format for a future trusted local import. It grants no publication authority by itself. Nicolas's seven rendered-checkpoint answers are recorded in the conversation and `incident-brief.md`, but no trusted attributed bundle has been imported; the current PostgreSQL review table does not enforce this format.

The exact v1 object shapes are:

```ts
type Sha256 = `sha256:${string}`; // validate lowercase prefix plus 64 hex digits
type EvidenceDate =
  | { precision: "date"; value: string }       // ISO YYYY-MM-DD only
  | { precision: "datetime"; value: string }   // ISO instant with UTC offset
  | { precision: "unknown"; value: null };
type ArtifactRecord = {
  artifactId: string; relativePath: string; byteLength: number;
  sha256: Sha256; mediaType: "image/png" | "video/webm" | "application/json" | "text/plain";
};
type TranscriptExcerpt = {
  artifactId: string; startByte: number; endByte: number; verbatim: string;
  speaker: "Nicolas" | "assistant"; conversationRef: string;
  originalWhen: EvidenceDate;
};
type TranscriptExchange = { question: TranscriptExcerpt; reply: TranscriptExcerpt };
type TrustedAttestation = {
  subjectDigest: Sha256; outcome: "pass" | "fail" | "unclear";
  reviewerPrincipal: string; reviewedWhen: EvidenceDate;
  source: { kind: "trustedConversation"; conversationRef: string;
    excerpt: TranscriptExcerpt };
  evidenceArtifactIds: string[];
};
type CheckpointId = "onsidePose" | "carelessChallenge" | "contactInsideArea" |
  "nonDogso" | "noCardAndSpa" | "goodPoorVisibility" | "teachingCredibility";
type CheckpointAnswer = {
  checkpointId: CheckpointId; question: TranscriptExcerpt; answer: TranscriptExcerpt;
  outcome: "approved" | "rejected" | "unclear";
  presentedContentHash: Sha256; presentedRendererFingerprint: Sha256;
  presentedCaptureIds: string[]; verification: TrustedAttestation;
};
type Capture = {
  captureId: string; artifactId: string; tick: number;
  preset: "A" | "B" | "elevatedPass";
  cameraMode: "firstPerson" | "thirdPerson" | "authoringElevated";
  refereePose: { x: number; z: number; yaw: number; pitch: number } | null;
  camera: { position: [number, number, number]; target: [number, number, number];
    verticalFovDeg: number; distanceM: number | null; lateralOffsetM: number | null };
  passReview: boolean; scenarioContentHash: Sha256; rendererFingerprint: Sha256 | null;
  screenshotPixels: { width: 1280; height: 720 };
  canvasCssRect: { x: number; y: number; width: number; height: number };
  drawingBufferPixels: { width: number; height: number };
  dpr: number; viewportCssPixels: { width: 1280; height: 720 };
  locale: "es" | "en"; zoom: number;
  motion: "default" | "reduced"; quality: "default" | "low" | "high";
  browserVersion: string | null; os: string | null;
  webglVendor: string | null; webglRenderer: string | null;
  executionMode: "development" | "production";
  capturedWhen: EvidenceDate;
  provenance: { kind: "contemporaneous" | "reconstructed";
    evidenceArtifactIds: string[] };
};
type CapturePair = { pairId: string; original: Capture; fresh: Capture };
type PairResult = { pairId: string; originalSha256: Sha256; freshSha256: Sha256;
  differingPixels: 0; maximumChannelDelta: 0 };
type Comparison = {
  algorithm: "decoded-rgb-canvas-exact-v1";
  crop: { x: 91; y: 109; width: 1098; height: 459 };
  results: PairResult[]; reportDigest: Sha256; verification: TrustedAttestation;
};
type ReviewedReport = { artifactId: string; reportDigest: Sha256;
  verification: TrustedAttestation };
type MotionEvidence = {
  kind: "runningScene" | "recording";
  route: string | null; artifactId: string | null;
  fromTick: 360; toTick: 386;
  scenarioContentHash: Sha256; rendererFingerprint: Sha256;
  verification: TrustedAttestation;
};
type EvidenceBundleV1 = {
  schemaVersion: 1; purpose: "incident001TrainingReview";
  scenario: { scenarioId: "incident-001"; version: number; contentHash: Sha256 };
  renderer: { fingerprintVersion: 1; fingerprint: Sha256;
    manifest: RendererManifestV1; historicalFingerprint: null;
    bindingMethod: "retrospectiveCaptureComparison" };
  artifacts: ArtifactRecord[]; historicalFeedback: TranscriptExchange;
  briefApproval: TranscriptExchange;
  renderedAnswers: Record<CheckpointId, CheckpointAnswer | null>;
  captures: CapturePair[]; comparison: Comparison; motionEvidence: MotionEvidence;
  calibration: ReviewedReport; sourceAndAssetReview: ReviewedReport;
};
```

Every listed shape has exactly the listed keys. Arrays declared as sets have unique IDs and canonical ordinal sorting. `CapturePair.pairId` is one of `A|B` + `firstPerson|thirdPerson` + `360|366|371|386`, or `elevatedPass120`; every required value appears exactly once. An original capture has `rendererFingerprint: null` because none was recorded then; its fresh counterpart carries the reconstructed fingerprint. `elevatedPass120` uses `authoringElevated` and `passReview: true`; all other pairs have `passReview: false`. Original and fresh pair members must match tick/preset/mode/pose/camera/viewport/canvas/DPR/locale/zoom/motion/quality except fields explicitly marked reconstructed. Unknown historical browser, WebGL, or time values remain `null`/`unknown`, never guessed. Every checkpoint answer must have `answer.speaker === "Nicolas"`, and the trusted-source attestation must verify that attribution. `historicalFeedback.reply` and `briefApproval.reply` have the same speaker requirement.

Digest preimages are noncircular. A checkpoint subject digest is SHA-256 of canonical JSON `["refview-checkpoint-answer-v1", checkpoint answer without verification]`. `Comparison.reportDigest` is SHA-256 of canonical JSON `["refview-capture-comparison-v1", {algorithm, crop, results}]`; its verification subject digest must equal that report digest. A reviewed report digest is the exact SHA-256 of its artifact bytes, and its verification subject digest must equal that value. Motion evidence subject digest is SHA-256 of canonical JSON `["refview-motion-evidence-v1", motion evidence without verification]`. Every `TrustedAttestation` must have `outcome: "pass"`, a subject digest equal to the applicable preimage, and a source excerpt verified against a trusted conversation record that identifies the reviewer and makes their approval explicit. Matching bytes in a locally authored text file or a self-declared `reviewerPrincipal` is insufficient. The importer's separate locally derived principal proves only who performed import. A trusted conversation export or equivalent independently verifiable source is not yet available in the repository, so no attestation is currently importable.

Motion evidence uses either `kind: "runningScene"`, the reviewed local route, and `artifactId: null`, or `kind: "recording"`, a `video/webm` artifact ID, and `route: null`. The trusted attestation must explicitly say the reviewer inspected normal-speed motion across ticks 360–386 and bind the source/fingerprint. Neither a paused frame nor a file path alone is proof of motion review.

### Strict bundle

`EvidenceBundleV1` has exactly `schemaVersion: 1`, `purpose: "incident001TrainingReview"`, `scenario`, `renderer`, `artifacts`, `historicalFeedback`, `briefApproval`, `renderedAnswers`, `captures`, `comparison`, `motionEvidence`, `calibration`, and `sourceAndAssetReview`. Unknown keys, duplicate JSON keys, non-JSON values, sparse arrays, unsafe integer fields, nonfinite numbers, path traversal, symlinks, duplicate artifact IDs, and case-colliding paths fail. Every referenced local file must be inside the fixed bundle directory and must match its declared exact byte length and SHA-256. Each artifact record has exactly `{ artifactId, relativePath, byteLength, sha256, mediaType }`.

`scenario` has exactly `{scenarioId: "incident-001", version, contentHash}`. `renderer` has exactly `{fingerprintVersion: 1, fingerprint, manifest, historicalFingerprint: null, bindingMethod: "retrospectiveCaptureComparison"}`. The renderer manifest follows [`observation-evaluation.md#renderer-fingerprint-v1`](observation-evaluation.md#renderer-fingerprint-v1); no digest is represented as if it existed at the time of Nicolas's reply.

`renderedAnswers` has exactly these seven keys, corresponding in order to the questions in `incident-brief.md`: `onsidePose`, `carelessChallenge`, `contactInsideArea`, `nonDogso`, `noCardAndSpa`, `goodPoorVisibility`, and `teachingCredibility`. A candidate may use `null` for unanswered checkpoints. Import requires seven non-null answers, each with its matching `checkpointId`, exact question and answer transcript excerpts, `outcome: "approved"`, the presented source hash, renderer fingerprint, and capture IDs. `rejected` or `unclear` blocks import. The existing general positive reply is preserved in `historicalFeedback`; it cannot be copied into seven answer records. A shared later transcript message may support multiple records only if it explicitly answers each named checkpoint.

Each transcript excerpt records the artifact ID, exact UTF-8 byte interval and verbatim bytes, speaker, conversation reference, and original date/time at its actual known precision. Date-only evidence remains date-only. An importer checks excerpts against the artifact bytes and provenance. `historicalFeedback` and `briefApproval` each hold the question and reply excerpts separately; neither invents an authenticated account action or a new server approval time.

The bundle digest is SHA-256 over UTF-8 canonical JSON of `["refview-review-evidence-v1", bundle]`; it excludes the digest itself and server-generated import metadata. Canonical JSON sorts object keys ordinally, preserves transcript text and explicitly ordered sequences, normalizes negative zero, and rejects exotic values. Declared set arrays are sorted by stable ID before serialization.

### Captures and calibration

Exactly 17 original/fresh pairs are required: A and B, first and third person, each at ticks 360, 366, 371, and 386; plus elevated pass at tick 120. Each record carries artifact IDs, preset/tick, exact camera/referee configuration, source/fingerprint, screenshot and canvas dimensions, DPR, viewport, locale, zoom, motion/quality settings, browser/OS/WebGL identity, execution mode, and whether each metadata field was contemporaneous or reconstructed with its evidence. No reconstructed value may be passed off as contemporaneous.

The v1 comparison decodes each PNG to RGB and compares every pixel in `(91, 109, 1098, 459)` at a 1280x720 CSS viewport without scale, masks, blur, or tolerance. The fractional canvas rectangle is `(91, 109.1875, 1098, 458)`; the integer crop must cover its full envelope. Each original and each fresh PNG must independently match its recorded byte digest. Paired PNG bytes may differ outside the crop or in encoding. Inside the crop, the required maximum differing pixels and channel delta are both zero. Missing pairs, mismatched metadata, changed artifact bytes, incomplete canvas coverage, or a single different crop pixel fail. The 17 currently preserved pairs match at pixel level, pending formal evidence-bundle verification.

The calibration report records the source hash, renderer fingerprint, implementation/version identities, all 92 C1 results across both evidence windows and four A/B camera combinations, 12 valid C2 traces across 30/60/144 nominal fps, trace digests, exact bands/receipts/qualifying spans, and camera-only/replay/inactive/interrupted/correct-guess negative cases. Its digest covers the full report. An independent technical review must bind that exact digest and explicitly assess the three-receipt/four-tick `supported` heuristic against the rendered sequence. A passing numeric model alone does not approve human perception.

`sourceAndAssetReview` binds the same source/fingerprint and records independent source, license, and served-asset checks. The old scoped reply and 17 stills do not establish normal-speed challenge intensity; the seven-checkpoint review must include the running scene or a documented normal-speed recording.

### Import boundary

Only a trusted local CLI may eventually convert a complete bundle into a review record. It must derive importer identity locally, record import time at execution, verify all file bytes and source/build/capture/calibration identities, and atomically bind the review and publication audit under the PostgreSQL row lock. Normal authoring JSON never supplies reviewer identity, timestamps, approval flags, or a build digest. The web application database role must not be able to insert manual-review records. A synthetic test record remains synthetic even on a test database and is never accepted by normal catalog/start reads.

The current persistence schema and test helper do not provide this boundary; they remain synthetic-only evidence. Publication stays `draft` until the exact bundle validator, isolated-PostgreSQL guard, running-build binding, independent review, and all seven explicit checkpoint answers are present.
