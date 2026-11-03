# Versioned authored-scenario contract

## Identity and immutability

A scenario uses a stable slug and immutable positive integer version. Any change to tracks, events, evidence windows, facts, sources, public options, or evaluation key creates a new version and content hash.

```ts
type ScenarioRef = Readonly<{ scenarioId: string; version: number }>;

type ScenarioManifest = Readonly<{
  ref: ScenarioRef;
  schemaVersion: 1;
  contentHash: `sha256:${string}`;
  classification: "clear" | "interpretative" | "inconclusive";
  lawsEdition: "IFAB-2026-27";
  competitionProfileId: string;
  field: FieldGeometry;
  durationTicks: number;
  tickRateHz: 60;
  decisionGate: Readonly<{
    opensAtTick: number;
    closesAtTick: number;
    forcePauseAtTick: number;
  }>;
  supportedRoles: readonly ("mainReferee" | "assistantReferee" | "var")[];
  actors: readonly ActorTrack[];
  ball: BallTrack;
  events: readonly CanonicalEvent[];
  evidence: readonly EvidenceDefinition[];
  entryState: MatchState;
  exitEffects: readonly MatchEffect[];
}>;

type ScenarioPublication = Readonly<{
  ref: ScenarioRef;
  state: "draft" | "reviewed" | "retired";
  reviewRecordId: string | null;
  reviewedAt: string | null;
  retiredAt: string | null;
  revision: number;
}>;
```

The content manifest is immutable. Publication is a separate, audited lifecycle record: review or retirement increments its revision without changing content or the scenario ref. New challenge attempts require `state=reviewed`; retirement blocks new attempts but never changes or invalidates attempts already pinned to that immutable version.

## Public and private projections

The internal manifest is server/content-authoring data. The challenge-safe playable projection is an explicit allowlist containing field geometry, actor/ball rendering tracks, safe animation/audio cues, decision-gate timing, role-permitted prompts/options, and public rule-edition metadata. It excludes:

- Expected decision and answer key.
- Evidence definitions, anchors, windows, thresholds, and semantic labels.
- Canonical events whose kind or payload states `offence`, `contact`, reviewed location, intensity, offside status, or disciplinary meaning.
- Evaluation weights, thresholds, and private evidence meaning.
- Debrief explanations before finalization.

```ts
type PlayableScenario = Readonly<{
  ref: ScenarioRef;
  contentHash: `sha256:${string}`;
  field: FieldGeometry;
  durationTicks: number;
  tickRateHz: 60;
  decisionGate: ScenarioManifest["decisionGate"];
  role: "mainReferee" | "assistantReferee" | "var";
  actors: readonly PublicActorTrack[];
  ball: PublicBallTrack;
  cues: readonly Readonly<{
    cueId: `cue-${number}`; // serialized IDs must match ^cue-[0-9]{3}$
    tick: number;
    ordinal: number;
    kind: "animationCue" | "audioCue";
    assetId: string;
  }>[];
  decisionOptions: readonly PublicDecisionOption[];
  lawsEdition: "IFAB-2026-27";
}>;
```

Playable IDs are opaque (`cue-001`), never names such as `EV-TRIP-CONTACT`. The client records only tick-stamped view/input data and selected decisions; the server joins those traces to private evidence definitions during evaluation.

The private projection adds reviewed facts, source references, allowed interpretations, deterministic rubric, debrief content, and review record. Server-side evaluation consumes both the submitted attempt trace and this private projection.

This boundary reduces accidental answer leakage; it is not an anti-cheat guarantee for a browser-rendered scenario.

## Tracks and events

- Authored actors and ball have stable IDs and deterministic state at every integer tick.
- Tracks may use keyframes plus named animation clips, but sampling the same tick must return the same canonical transform and clip phase.
- Events use the ordering contract in [`clocks-and-events.md`](clocks-and-events.md).
- Rapier may resolve the user referee against static geometry. It does not simulate or rewrite authored player/ball tracks.

For RV-005's first pure-core slice, use a narrow `TimelineFixture` rather than claiming to validate the entire `ScenarioManifest`. It contains the immutable scenario ref, inclusive duration, complete authored actor and ball samples at each integer tick, and canonical events. Each actor sample has a stable actor ID, finite metre position, finite yaw in radians, an animation clip ID, and integer clip phase in millionths of a cycle. Each ball sample has a finite metre centre and finite quaternion orientation. No user-controlled referee pose or camera belongs to the authored state. Production keyframe compression and animation-asset mapping are later adapters; they must produce the same integer-tick samples and may not alter authored facts.

`MatchState` and `MatchEffect` remain session-composition placeholders for RV-012; the first-slice validator does not assert those contracts. Public/private projection and reviewed first-incident content also remain separate tasks. This is a scope boundary, not a claim that the full manifest or projection has been implemented.

## Valid and invalid examples

Valid manifest-header excerpt (not a complete `ScenarioManifest` fixture):

```json
{
  "ref": { "scenarioId": "penalty-boundary-trip", "version": 1 },
  "schemaVersion": 1,
  "contentHash": "sha256:<64-lowercase-hex>",
  "classification": "clear",
  "lawsEdition": "IFAB-2026-27",
  "competitionProfileId": "refview-training-senior-var-v1",
  "durationTicks": 480,
  "tickRateHz": 60,
  "decisionGate": {
    "opensAtTick": 360,
    "closesAtTick": 480,
    "forcePauseAtTick": 480
  },
  "supportedRoles": ["mainReferee"]
}
```

Invalid:

- Reusing version `1` after moving the contact point.
- Opening decision capture before the authored decision gate.
- Sending `expectedRestart: "penaltyKick"` to the challenge client.
- Sending `EV-TRIP-CONTACT`, private evidence anchors/windows, or an `offence` event to the challenge client.
- Supporting `var` with cameras but no check/recommendation task.
- Reading current physics transforms as the reviewed incident facts.
- Publishing a scenario as `reviewed` without a source edition and domain review record.

Projection tests must parse the serialized playable DTO, assert the exact allowlist, recursively reject private field names, and compare against a fixture that deliberately contains answer-key, evidence, offence, and semantic-ID leaks.
