# Observation and camera contract

## Principle

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
  pointerLocked: boolean;
  paused: boolean;
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

## Initial visibility model

At fixed canonical sampling ticks, calculate and retain separately for the referee eye and the rendered camera:

- Distance from each viewpoint to evidence anchors.
- Whether anchors fall inside the camera frustum and central/peripheral zones.
- Authored-actor and environment occlusion.
- Whether the user looked during the evidence window.
- Whether the configured minimum readable duration was met.

Only a tick at which the same required evidence is readable from both viewpoints contributes to referee observation credit. Readability from different ticks or viewpoints cannot be combined. Evidence visible only from the offset camera may inform the user's decision, but earns no referee observation or positioning credit. Evidence available to the referee eye but absent from the displayed view also earns no observation credit. The debrief distinguishes these cases after finalization. Camera help explains this rule without revealing private evidence during the attempt.

The private rubric maps jointly readable ticks and the minimum readable duration to `confidenceBand`. A single ray hit is never sufficient by itself. Thresholds are versioned and calibrated against deterministic screenshots/recordings plus human review. Camera framing changes never move the referee eye or retroactively alter observation history; turning the look control changes referee-eye orientation. Replay never adds credit to the finalized live attempt.

The client may calculate provisional visibility for feedback/debugging, but finalization submits a bounded tick-stamped trace of referee position/look, camera mode/framing, viewport aspect ratio, field of view, and focus/pause state. Camera-rig, eye-calibration, and visibility-model versions are pinned to the attempt. The server validates ordering, framing bounds, and plausible locomotion; reconstructs both viewpoints (including camera collision adjustments) against the canonical timeline; and recomputes the authoritative summary. Submitted camera coordinates or client visibility summaries are not authoritative. This limits accidental or trivial score forgery; it is not a competitive anti-cheat system.

## Main-referee camera

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

## Executable RV-005 C1 geometry baseline

This is a deliberately narrow, versioned synthetic measurement contract, not a validated human-perception threshold or the complete scenario/evaluation model. C1 computes geometric availability only; C2 validates an active-live trace and maps measurements to confidence. No client-provided visibility boolean or camera coordinate becomes authoritative.

- An `ObservationFixture` is pinned to the exact scenario ref and `durationTicks` of a validated `TimelineFixture`. It declares `visibilityModelVersion: 1`, `cameraRigVersion: 1`, and `eyeCalibrationVersion: 1`; unknown versions or mismatched refs/durations fail validation. Evidence IDs are unique. Each evidence has an inclusive integer window inside `0..durationTicks`, one or more stable required anchor IDs, and a complete sample for every tick in its window. Every sample provides world-space positions for every required anchor and zero or more authored, ID-stable, axis-aligned occlusion boxes. No skeletal attachment or inferred player mesh is claimed in C1. Samples, anchors, and boxes are defensively copied and frozen.
- The narrow C1 input shape is `ref`, `scenarioContentHash`, `durationTicks`, the three versions above, `cameraColliders: Box[]`, and `evidence: { evidenceId, fromTick, toTick, requiredAnchorIds: string[], samples: { tick, anchors: { anchorId, position }[], occluders: Box[] }[] }[]`. A `Box` is `{ boxId, min: Vec3m, max: Vec3m }`. `samples` cover every integer tick of that evidence window; anchor and occluder IDs are unique within a sample. An evidence with missing or duplicate samples, missing anchors, or unknown tick is invalid. `scenarioContentHash` must be a `sha256:` plus 64 lowercase hex characters and match an expected hash supplied by the trusted caller. Synthetic C1 tests supply a fixture hash; production supplies the reviewed published manifest hash. These private geometry definitions are immutable scenario-version content covered by that manifest hash and pinned to an attempt. The isolated C1 validator checks the declared identity and shape, not the cryptographic derivation of a whole manifest; the content publication pipeline must verify that derivation later. The observation fixture is server-only and excluded from the challenge-safe playable projection. C1 is main-referee geometry only; role-specific evidence and private rubric projection remain separate.
- All coordinates are metres in the canonical right-handed world. Each box has finite ordered `min`/`max` corners, positive extent on all axes, and a stable ID. A sight segment is blocked when it intersects a box interior at a distance strictly between `0.001 m` from the viewpoint and `0.001 m` before the anchor. Process boxes in ID order for reproducible diagnostics. Do not globally ignore an evidence owner's body: a box can screen its own lower-leg anchor. World-state checksums exclude these observation definitions and never change with a viewpoint.
- Eye pose is the validated referee ground position plus `(0, 1.70, 0)` metres, with independent look yaw and pitch. Yaw `0` faces `+z`, positive yaw turns toward `+x`, and positive pitch looks up. For yaw `Y` and pitch `P`, forward is `(sin(Y) cos(P), sin(P), cos(Y) cos(P))`; right is `(cos(Y), 0, -sin(Y))`; up is `forward × right`. First-person rendered pose equals eye pose exactly.
- In third person, the unobstructed desired camera point is `eye - horizontalForward * cameraDistanceM + right * cameraLateralOffsetM + (0, 0.40, 0)`, where `horizontalForward=(sin(Y),0,cos(Y))`. Its target is `eye + forward * 10 m`; `viewForward` is the normalized vector from the resolved camera point to that target. Use world up `(0,1,0)` and a roll-free basis: `right = normalize(worldUp × viewForward)`, then `up = viewForward × right`. For camera collision, use a separate list of authored static AABBs and the nearest segment/box entry from eye to desired point. Travel along eye → desired by `max(0, entryDistanceM - 0.10 m)`; if the eye starts inside a camera collider, use the eye point. This adjustment never moves the referee eye or authored world. Ties use box ID order.
- C1 rejects nonfinite inputs. For the synthetic rig, referee ground `y=0`, pitch is `-1.2..1.2 rad`, third-person distance `2..8 m`, lateral offset `-3..3 m`, viewport aspect ratio `0.75..2.5`, and vertical FOV `0.785..1.31 rad`; first-person retains bounded distance/lateral preference values but ignores their offsets for pose reconstruction. Eye yaw may be any finite radian value. Later C2 additionally validates plausible movement and per-tick input changes.
- C1 accepts finite look yaw and finite look pitch within `-1.2..1.2 rad`; C2 will enforce trace-level order and locomotion bounds. C1 measures eye visibility using a fixed synthetic half-FOV of `55°` horizontal and `45°` vertical. It measures rendered-camera visibility using the validated sample's vertical FOV and aspect ratio, with horizontal half-FOV `atan(tan(verticalFovRad/2) * aspectRatio)`. For each anchor, project its direction onto viewpoint right/up/forward; behind-view anchors fail. An anchor is geometrically readable only if its distance is at most `30 m`, it is inside both FOV axes, it is inside the central zone (`30°` horizontal and `25°` vertical), and its sight segment is not blocked. Angle boundaries and the `30 m` distance boundary are inclusive. Peripheral/frustum-only results may be retained diagnostically but do not earn C1 readability.
- One tick is `joint` only if **every required anchor** is readable from both the referee eye and rendered camera on that same tick. C1 classifies any queried tick inside an evidence window as `joint`, `cameraOnly`, `eyeOnly`, or `neither` using the all-anchors result for each viewpoint; the validated view sample's tick must equal the queried tick. Seeing anchor A from the eye and anchor B from the camera does not compose into joint evidence. Live eligibility belongs to C2. C1 does not infer that a render frame was presented or attended to.
- Synthetic C1 test inputs use `60 Hz`, the `1.70 m` eye height, `30 m` maximum anchor distance, and the angles above. They are engineering test constants, not claims that a real referee can interpret contact under those conditions. RV-008 captures and Nicolas's rendered-evidence review must calibrate production thresholds and animation proxies before observation scores are accepted.

## RV-005 C2 trace and confidence decisions to freeze next

The live trace must distinguish live from replay, document-visible from hidden, pointer-locked from released, and active from paused. A replay cursor's `isInputActive` flag is not observation eligibility. A frame that advances multiple canonical ticks must not assign its final pose to unseen earlier ticks. C2 will define coverage, ordering, movement/framing bounds, and the adapter's per-tick pose reconstruction before server-authoritative credit is implemented. Until then, C1 measurements are diagnostic geometry only.
