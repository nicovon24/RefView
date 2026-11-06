# Candidate RV-005 C2 live-observation trace contract

Status: reviewed synthetic v1 contract for RV-005 C2 implementation. It refines the C1 geometry model in [`observation-and-camera.md`](observation-and-camera.md). Its trace shape and validation rules passed independent read-only review on 2026-11-03; it does not calibrate human perception or authorize a production observation score for the first rendered incident.

## Authority and identity

The trusted server binds one trace to `scenarioRef`, cryptographic `scenarioContentHash`, `attemptId`, `runRevision`, and versions `traceVersion=1`, `visibilityModelVersion=1`, `cameraRigVersion=1`, `eyeCalibrationVersion=1`, `observationRubricVersion=1`. The immutable published scenario version supplies the authored main-referee ground spawn and initial look orientation. Before entering `playing`, a server-validated `AttemptRunStart` record pins that spawn, validated camera mode/distance/lateral framing/FOV preferences, validated viewport aspect, role `mainReferee`, and current `runRevision`. The session plan selects the scenario version/role; it is **not** the source of the full initial camera pose. The trace itself is untrusted input. Reload while playing atomically increments the persisted attempt `runRevision`, returns it to `ready` at tick zero, and invalidates the old uncommitted trace; a stale revision cannot finalize. The server checks identity, versions, role, initial view, and bounds against the attempt run start and private observation fixture. It never accepts client visibility booleans, evidence IDs, scores, camera world coordinates, or an answer-derived observation claim.

`stopTick` is a trace/finalization claim, not a pre-known server value. The server requires `trace.stopTick === initialDecision.decisionTick`, an integer inside the published scenario's decision window and `0..fixture.durationTicks`, with an eligible `playing -> deciding` transition for the same run revision. The trace may end before an evidence window ends; that is not a validation error. These persistence/workflow fields are contract requirements for RV-006/RV-009, not claims that the current schema implements them.

The C2 synthetic maximum is `stopTick <= 480` (eight seconds at 60 Hz). This is an MVP resource bound, not a content or session-length promise. A future longer session needs a versioned chunk protocol rather than silently raising this limit.

## Records

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

`ObservationTraceV1` contains the bound identity and versions, `views`, `renderReceipts`, and `breaks`. `ViewSample` means the exported C1 geometric shape (`tick`, referee position/look, camera mode/framing, aspect, FOV); it does **not** carry `pointerLocked` or `paused`. Those lifecycle claims exist only on receipts and breaks. The illustrative `ViewSample` in `observation-and-camera.md` now matches this shape. The trace has exactly one view for every integer tick `0..stopTick`, in index/tick order, including ticks crossed by a render frame. The input integrator samples every canonical tick; it must never backfill crossed ticks with the final render-frame pose. A view is a claim about the controlled referee and camera state at that tick, not proof that the browser displayed it. A receipt records that the renderer submitted that exact canonical state after resolving its view; it is still not proof that the compositor displayed it or the human attended to it. An interpolated frame cannot earn credit in v1. It may be drawn, but only a receipt of a non-interpolated canonical state is eligible.

`views.length` is at most 481; normalized eligible live `(epoch,tick)` receipts are at most 481; raw receipts are at most 1024; breaks are at most 64. Payload byte limits also belong at the HTTP boundary. Reject missing, duplicate, reversed, out-of-range, nonfinite, or unknown-version views rather than sorting or interpolating them. Require each receipts/breaks array to have increasing integer `sequence`, require unique sequence values across both arrays, then merge by sequence for lifecycle validation; no original interleaved array order is assumed. Validate epoch/tick against the active segment at each event. Reject a live receipt referencing a missing view, wrong epoch, or an earlier tick than the previous live receipt. In particular, an old-epoch same-tick receipt **after** a break is invalid even if its flags say playing/visible/locked. A `source=live` receipt in a finalization trace must have `workflowState=playing`, visible document, pointer lock, and `paused=false`; otherwise reject it as an invalid lifecycle record. The adapter emits a break and suppresses live receipts during inactivity. Repeated valid live receipts for one `(epoch,tick)` (for example at 144 fps) coalesce to one eligibility tick. Replay receipts are bounded diagnostics, never credit; a finalization payload should normally have none, but their presence cannot create eligibility. `source=live` and `workflowState=playing` alone do not establish eligibility without the other flags and correct event ordering.

## Segments and physical bounds

Epoch 0 starts at view tick 0. Each nonterminal break ends the current epoch after its `afterTick < stopTick`, has `nextEpoch=currentEpoch+1`, and the next view starts that epoch at `afterTick+1`. Breaks are strictly ordered; no empty, skipped, or overlapping epoch. An explicit pause, hidden document, lost pointer lock, performance pause, viewport/FOV change, camera mode/framing change, or transition to deciding closes the eligible segment. One active epoch gets one break reason; additional setting changes while inactive apply at the next tick without adding empty epochs. No canonical tick advances during inactivity. Controls, framing, and FOV may be adjusted while inactive only by applying their effect to the next active tick; they must not retroactively rewrite a recorded view or render receipt. Resume requires a fresh clock baseline and a new epoch. Exactly one **terminal** `deciding` break is required for a finalization trace, with `afterTick=stopTick` and `nextEpoch=null`; it is the last live event, has no following view, and no live receipt can follow it. C2-A rejects any other null successor, a nonterminal deciding break, or a terminal break with a numeric successor. A pause/hidden/unlocked/performance break with no following view is an abandoned/incomplete run, not a valid finalization trace. A held tick rendered after a pause is not eligible for the new epoch.

C1 validates each view's finite coordinates, ground `y=0`, pitch, camera distance/lateral offset, aspect, and FOV. C2 additionally checks the server-bound initial position and orientation, pitch, mode, framing, aspect, and FOV at tick 0. The synthetic v1 movement envelope is ground-field bounds from the trusted scenario configuration, walking displacement `<=5/60 m` per active tick and sprinting `<=9/60 m` per active tick, with `1e-6 m` numeric tolerance. Sprint applies to the destination tick. Within an epoch, the shortest wrapped yaw change is `<=12/60 rad`, pitch change `<=6/60 rad`, and camera distance/lateral change `<=12/60 m` per tick. FOV and viewport aspect remain constant within an epoch. At an epoch boundary, the next pose still obeys ground bounds and cannot teleport; movement from prior view position to next view position is zero while inactive plus at most the destination tick's normal movement budget. Orientation, mode, and framing may change at the boundary, but the new values apply only at the next active tick, after the break, and still satisfy C1 bounds. Mode changes require a break. These are validation ceilings, not movement speeds or user-facing sensitivity defaults.

The adapter must produce view ticks using the same deterministic fixed-step input integrator as the displayed controlled referee, and associate renderer receipts with the view actually used for that render submission. Input and camera changes during replay cannot modify the finalized live trace. The pure `ReplayPlayback.isInputActive` getter is not a live-observation permission and must not be used for eligibility.

## Synthetic confidence computation

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

## TDD and staged handoffs

1. **C2-A:** pure trace identity, shape, ordering, epoch, bounds, and locomotion validator in `packages/simulation/src/**`. Red tests assert specific rejected/accepted records with a real importable function or behavior-level stub; module-load errors and zero assertions do not count.
2. **C2-B:** pure C1-measurement-to-eligible-live summary and synthetic rubric score, with replay/hidden/unlocked/paused exclusions, intermittent joint frames, good/poor positions, and correct-guess independence. Same assertion-level red/green rule.
3. **C2-C:** clock/input/render adapter that emits every tick view and exact render submissions across 30/60/144 cadence, pause/focus/reload breaks, and no retroactive mutation. Browser visual inspection is still necessary; a DOM assertion alone cannot prove contact readability.

The pure C2-C adapter requests input separately for each crossed canonical tick. Its exact-render callback must submit the current immutable view before it records a receipt. An inactive lifecycle snapshot closes the active epoch and suppresses held-tick receipts until a new active tick. The callback and lifecycle values remain browser claims; R3F wiring, compositor presentation, and human readability are later integration and visual-review gates.

The coordinator owns this contract and any shared schema/HTTP integration. Each implementation slice requires a bounded handoff and independent read-only review before authority claims. There is no claim here that the 3D incident, persistence, or decision flow is implemented.
