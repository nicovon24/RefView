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
