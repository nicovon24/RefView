# Canonical simulator and timeline

This document groups reusable system contracts by domain. Stable contract IDs are preserved in section anchors; implementation and task status remain in [`../specs/tasks.md`](../specs/tasks.md). Feature-specific acceptance remains under `docs/features/`.

## Contents

- [coordinates](simulator-timeline.md#coordinates)
- [scenario](simulator-timeline.md#scenario)
- [canonical events v2](simulator-timeline.md#canonical-events-v2)
- [clocks and events](simulator-timeline.md#clocks-and-events)
- [session and persistence](simulator-timeline.md#session-and-persistence)

<a id="coordinates"></a>
## Coordinate and field contract

### Canonical world

- Units are metres and radians.
- The world is right-handed: `+y` is up, `+z` is the first-half attacking direction for the authored attacking team, and `+x` is that team's right.
- The field origin is the centre spot at ground level.
- A standard 105 x 68 m field occupies `x = -34..34` and `z = -52.5..52.5`.
- `yaw = 0` faces `+z`; positive yaw turns toward `+x`. Pitch and roll are zero for authored player roots unless an animation explicitly supplies them.
- Positions use `{ x, y, z }`; ground locations use `{ x, z }` and imply `y = 0`.

The near edge of the `+z` penalty area is `z = 36.0`; its lateral limits are `x = -20.16..20.16`. Boundary lines belong to the areas they enclose. Authoring tools must render the line width consistently but resolve legal location from the canonical boundary, not a sampled texture pixel.

### Invariants

- A scenario declares its field dimensions and attack direction; it never relies on renderer defaults.
- Actor roots, ball centres, contact points, camera eyes, and offence ground locations are distinct values.
- The renderer may transform canonical coordinates for a camera or engine adapter but must provide an invertible mapping.
- Runtime physics must not replace authored actor, ball, contact, or offence coordinates.
- Stored coordinates use at least millimetre precision; UI labels may round.

### Example

```ts
type Vec3m = Readonly<{ x: number; y: number; z: number }>;
type GroundPointM = Readonly<{ x: number; z: number }>;

type FieldGeometry = Readonly<{
  lengthM: 105;
  widthM: 68;
  goalWidthM: 7.32;
  penaltyAreaDepthM: 16.5;
  penaltyAreaExtraWidthEachSideM: 16.5;
  lineWidthM: 0.12;
  attackDirection: "positiveZ" | "negativeZ";
}>;
```

Valid: an authored contact point at `(13.8, 0.34, 36.8)` resolves to a ground offence inside the `+z` penalty area.

Invalid:

- Determining the offence from the ball position.
- Switching `x` and `z` only inside the Three.js scene.
- Letting a collision response move the reviewed contact outside the area.
- Treating the visible centre of the painted line as an unversioned legal boundary.

<a id="scenario"></a>
## Versioned authored-scenario contract

### Identity and immutability

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

### Public and private projections

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

For the main-referee v1, canonical authored actor IDs such as `defence-04` remain in the private timeline, events, evidence, and stored decisions. Canonical actor IDs must not match the reserved public-handle pattern `^actor-[0-9]{3}$`. The challenge projection derives a deterministic bijection from the Unicode-code-unit-sorted canonical roster to `actor-001`, `actor-002`, and so on; it rejects a roster beyond `actor-999`. Public tracks use only those handles, consistently at every tick and in replay. The inverse mapping remains server-side and is reconstructed from the attempt's pinned scenario version. The user submits `offenderActorHandle` in the transport decision; the server rejects unknown handles and resolves the canonical `offenderActorId` before validating, digesting, evaluating, or storing the decision. Public attempt views map it back to the handle. The user-controlled referee is outside the authored roster.

A separate immutable asset registry contains unique canonical animation/audio IDs, content fingerprints, and license/origin references. Sort those IDs by Unicode code units and assign `asset-001` onward, rejecting more than 999 entries. Every clip and cue asset ID must have exactly one registry binding; missing, duplicate, unknown, or unused bindings are invalid for v1. One handle must identify the same asset across tracks and cues. Only opaque handles and licensed rendering data enter the playable projection; private registry identifiers and semantic event/evidence IDs do not. Actor and asset mappings are part of the immutable scenario content. The first authored scenario must use a neutral public scenario ID such as `incident-001`; a ruling-revealing slug is not challenge-safe.

The trusted authoring boundary derives `contentHash` from the complete immutable canonical source, excluding the hash field itself and mutable publication metadata. Serialize the tuple `["refview-scenario-content-v1", normalizedSource]` as JSON: recursively sort object keys, normalize negative zero to zero, reject non-JSON and nonfinite values, UTF-8 encode, then SHA-256 hash the bytes. Normalize timeline samples by tick, actors by canonical ID, events by `(tick, ordinal, eventId)`, evidence definitions by evidence ID with samples by tick, cues by `(tick, ordinal, cueId)`, options by option ID, official sources by unique source ID, and asset registry by canonical asset ID before hashing. Preserve any other explicitly authored ordered arrays. The source includes ref/schema, competition profile identity and hash, geometry, canonical tracks/events, facts/evidence/rubric, safe options/cues, official sources, and asset bindings/fingerprints. Public and private stored projections must derive from this same validated source; independently supplied JSON blobs or a caller-supplied expected hash alone do not prove correspondence. Review record IDs and review/retirement timestamps belong only to `ScenarioPublication` and are joined after content hashing. The FNV world-state checksum remains a separate diagnostic over canonical authored state; public projected-state checksums require their own comparison and cannot be equated to the canonical checksum.

The private projection adds authored facts, source references, allowed interpretations, deterministic rubric, and prepared debrief content. A separate publication read joins review metadata only after content validation. Server-side evaluation consumes both the submitted attempt trace and the pinned private projection.

This boundary reduces accidental answer leakage; it is not an anti-cheat guarantee for a browser-rendered scenario.

The full authored-training source/compiler and publication admission contract is specified in [`learning-publication.md#authoring-and-publication-v2`](learning-publication.md#authoring-and-publication-v2). Its `schemaVersion: 2` source, derived digest, and compiled DTOs are distinct from this document's v1 manifest excerpt and the existing narrow pure `ScenarioInput` derivation. Neither v1 hash is the full-source hash or an authored-training publication credential.

### Tracks and events

- Authored actors and ball have stable IDs and deterministic state at every integer tick.
- Tracks may use keyframes plus named animation clips, but sampling the same tick must return the same canonical transform and clip phase.
- Events use the ordering contract in [`simulator-timeline.md#clocks-and-events`](simulator-timeline.md#clocks-and-events).
- Rapier may resolve the user referee against static geometry. It does not simulate or rewrite authored player/ball tracks.

For RV-005's first pure-core slice, use a narrow `TimelineFixture` rather than claiming to validate the entire `ScenarioManifest`. It contains the immutable scenario ref, inclusive duration, complete authored actor and ball samples at each integer tick, and canonical events. Each actor sample has a stable actor ID, finite metre position, finite yaw in radians, an animation clip ID, and integer clip phase in millionths of a cycle. Each ball sample has a finite metre centre and finite quaternion orientation. No user-controlled referee pose or camera belongs to the authored state. Production keyframe compression and animation-asset mapping are later adapters; they must produce the same integer-tick samples and may not alter authored facts.

`MatchState` and `MatchEffect` remain session-composition placeholders for RV-012; the first-slice validator does not assert those contracts. Public/private projection and reviewed first-incident content also remain separate tasks. This is a scope boundary, not a claim that the full manifest or projection has been implemented.

### Valid and invalid examples

Valid manifest-header excerpt (not a complete `ScenarioManifest` fixture):

```json
{
  "ref": { "scenarioId": "incident-001", "version": 1 },
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

<a id="canonical-events-v2"></a>
## Canonical event source v2

This narrow contract repairs the event shape needed by the proposed full-source v2 compiler. It does not change the reviewed v1 `CanonicalEvent`, timeline fixture, world-state checksum, or narrow scenario hash.

```ts
type CanonicalEventV2 = Readonly<{
  eventId: string;
  tick: number;
  ordinal: number;
  kind: "ballTouch" | "contact" | "offence" | "whistleWindow" | "phaseMarker";
  actorIds: readonly string[];
  payload: Readonly<Record<string, never>>;
}>;
type TimelineFixtureInputV2 = Omit<TimelineFixtureInput, "events"> & {
  events: readonly CanonicalEventV2[];
};
```

An event has exactly these six own fields and a plain `Object.prototype` or null prototype. Inspect all own descriptors and `Reflect.ownKeys` before reading any field: inherited, hidden, symbol, or accessor fields are rejected without executing getters. `eventId` is nonempty, `tick` is a safe integer in `0..durationTicks`, `ordinal` is a safe nonnegative integer, and `kind` is one declared value. Its `actorIds` are a dense, undecorated `Array.prototype` array of unique canonical roster IDs. `ballTouch` has exactly one participant; `contact` and `offence` have exactly two; `whistleWindow` and `phaseMarker` have none. The array is an unordered participant set, never a positional offender/receiver assignment. Every event participant must belong to the complete authored roster. A duplicate event ID or duplicate `(tick, ordinal)` is invalid.

`payload` is an exact plain object with zero own keys, checked with property descriptors and `Reflect.ownKeys` without executing accessors. Unknown, hidden, symbol, getter, `__proto__`, or any other nonempty payload field is rejected rather than stripped. Reviewed football facts, offender/receiver roles, contact position/intensity, and answer keys live in the typed source `facts`, evidence, and rubric. Canonical event markers remain private; the client receives only separately reviewed safe cues.

Normalization copies and deeply freezes the event and arrays, sorts participants by Unicode code-unit order, sorts events by `(tick, ordinal, eventId)`, and emits literal `{}` payloads. Input mutation cannot change the normalized result. The v2 full-source hash includes this normalized list; participant/event permutations preserve the hash, whereas changed membership, ID, kind, tick, or ordinal changes it or fails validation. A v2 adapter makes a separate detached mutable-shape copy when calling the existing v1 `createTimelineFixture`; it must not pass readonly arrays directly or use v1's open payload validation as v2 authoring validation.

The bounded implementation owns only a new `packages/domain/src/canonical-events-v2.ts` and matching tests. Assertion-level RED/GREEN tests cover ordering invariance, duplicate/unknown participants, invalid kind/tick/ordinal, sparse/decorated arrays, exact field shape, malicious descriptors on a known event field (such as `tick`) and payload without getter execution, and deep immutability. A v1 compatibility sentinel proves its current nested payload and actor order remain intact.

<a id="clocks-and-events"></a>
## Clocks, ticks, and events contract

### Canonical time

- `scenarioTick` is an integer in `0..durationTicks`, sampled at exactly 60 Hz.
- The state at a tick is a pure result of scenario version plus tick.
- A render frame may interpolate between adjacent tick states for presentation. Interpolation never creates facts or events.
- Events are ordered by `(tick, ordinal, eventId)`. `ordinal` is unique within a tick.
- Seeking first reconstructs canonical state, then exposes events according to replay mode; it never re-submits side effects.

### Distinct clocks

| Clock | Meaning | Advances while paused? | Persisted form |
| --- | --- | --- | --- |
| `scenarioTick` | Authored incident time | No | Integer tick |
| `sessionElapsedMs` | Active practice time | No | Integer milliseconds from a monotonic source |
| `matchClock` | Displayed football time | Only through authored mapping | Period plus milliseconds |
| `videoFrame` | Derived replay/VAR frame | No | Derived from tick and feed frame rate |

`matchClock` is mapped by explicit segments. A configurable session transition stores both source and destination match time and is shown to the user; it does not pretend that omitted football was simulated.

```ts
type CanonicalEvent = Readonly<{
  eventId: string;
  tick: number;
  ordinal: number;
  kind: "ballTouch" | "contact" | "offence" | "whistleWindow" | "phaseMarker";
  actorIds: readonly string[];
  payload: Readonly<Record<string, unknown>>;
}>;
```

### Playback

- The accumulator advances whole ticks independently of render FPS.
- A long frame may process a bounded number of catch-up ticks. Exceeding the bound pauses with a recoverable performance state instead of skipping canonical events.
- Pointer-lock loss, tab visibility loss, or an explicit pause stops tick advancement and input sampling.
- Replay speeds initially supported: `0.25`, `0.5`, `1`, and `2`; frame step changes exactly one canonical tick.
- Live and replay checksums for the same scenario ref/tick must match.

### Executable RV-005 first-slice baseline

- The pure core receives monotonic integer microsecond timestamps from its caller; it never reads wall time. Its integer remainder accumulates `deltaMicroseconds * 60 * speedQuarters` against a `4_000_000`-unit tick threshold, where replay speed quarters are `1`, `2`, `4`, or `8` for `0.25`, `0.5`, `1`, or `2` times speed. Only whole ticks advance. This preserves cadence equivalence despite rounded frame timestamps.
- Starting live play exposes tick-`0` events once. A forward advance from `a` to `b` exposes events in `(a, b]`, ordered by `(tick, ordinal, eventId)`. Repeating a timestamp emits no events. Duplicate event IDs and duplicate ordinals within one tick are invalid.
- Pause, pointer-lock loss, and hidden-tab transitions stop tick advancement and input sampling. They preserve the fractional active-time remainder; resuming establishes a fresh timestamp baseline, so inactive wall time is never caught up.
- `maxCatchUpTicks` is explicit. If a frame would require more than the cap, the core enters a recoverable performance pause before changing the tick, remainder, or emitted-event cursor. The oversized delta is discarded; resume uses a fresh baseline. No canonical event is skipped.
- Seeking requires an integer in `0..durationTicks`, reconstructs state without live event side effects, and never submits a decision. Replay frame-step changes exactly one bounded tick. Forward advancement stops at the inclusive terminal tick.
- The pure core separates a monotonic live cursor from a replay cursor. Live play cannot seek. Each advancement returns a frozen batch of canonical events; the pure core does not invoke application callbacks or submit decisions. The live adapter owns event-consumer error handling and idempotent side effects. The replay cursor may seek backward and re-present event markers after subsequent forward playback, but its batches are presentation-only and never enter the live event-consumer or decision-submission path. RV-009's workflow guard permits construction/use of replay only after server-confirmed finalization; this first slice does not claim to enforce that application authority boundary.
- Authored state at a tick consists only of scenario ref, tick, actor transforms and animation phases sorted by stable ID, and ball transform. Controlled referee, camera, workflow, and render interpolation are excluded. Serialize the tuple `["refview-world-v1", scenarioId, version, tick, actors, ball]`, where each actor is `[actorId, x, y, z, yawRad, clipId, phaseQ]` and ball is `[x, y, z, qx, qy, qz, qw]`. Actor IDs sort by Unicode code-unit order. Require finite numbers, normalize negative zero to positive zero, and apply `JSON.stringify` without rounding. Encode that JSON as UTF-8; hash the bytes with FNV-1a 64-bit (offset `14695981039346656037`, prime `1099511628211`, modulo `2^64`). The diagnostic digest is `fnv64:` plus 16 lowercase hexadecimal digits. It is not the cryptographic scenario-content hash. Live and replay must serialize the exact same authored state before digest comparison.
- First fixtures store complete samples for every tick `0..durationTicks`. A later keyframe adapter may compress storage only if sampling is bit-for-bit equivalent at canonical integer ticks.

Valid: at 30, 60, and 144 rendered frames per second, event `contact-1` occurs once at tick `366`.

Invalid:

- `scenarioTick += deltaSeconds * 60` stored as a floating-point value.
- Firing a decision submission again after seeking past its visual marker.
- Advancing play while pointer lock is unexpectedly lost.
- Hiding a five-minute session jump without an explicit transition.

<a id="session-and-persistence"></a>
## Session, state, and persistence contract

### Session plan

```ts
type SessionPlan = Readonly<{
  sessionPlanId: string;
  planVersion: number;
  seed: string;
  owner: Readonly<{ kind: "user"; userId: string }> | Readonly<{ kind: "anonymous"; sessionId: string }>;
  locale: "es" | "en";
  role: "mainReferee" | "assistantReferee" | "var";
  competitionProfileId: string;
  items: readonly Readonly<{
    order: number;
    scenarioRef: ScenarioRef;
    transitionFromPrevious: null | Readonly<{
      fromMatchMs: number;
      toMatchMs: number;
      reason: "authoredTimeJump";
    }>;
  }>[];
}>;
```

The first MVP plan has one item. Later composition may filter a reviewed catalog by requested duration, topic, difficulty, role, edition, and competition profile. A seed plus catalog snapshot must reproduce the same plan. The UI must not claim unavailable variety.

### Attempt state machine

```text
created -> loading -> briefing -> ready -> playing <-> paused
playing -> deciding -> finalizing -> debrief <-> replay -> completed
loading|playing|finalizing -> recoverableError -> previous safe state
created|loading|briefing|ready|paused -> abandoned
```

Only server-confirmed finalization enters `debrief`. Replay is unavailable before that transition. The MVP restores completed attempts. A reload during active play returns the same unfinalized attempt to `ready`, clears its uncommitted observation buffer, and restarts the canonical scenario at tick `0`; it does not attempt frame-by-frame mid-play recovery.

#### Main-referee presentation adapter boundary (RV-005 recovery)

The XState machine is a presentation adapter. Construct it from an owner-bound public attempt binding: nonempty attempt ID, safe nonnegative run revision, exact `sha256:` plus 64 lowercase hex scenario content hash, `0..480` scenario duration, finite ordered referee field bounds, decision gate satisfying `0 <= opens <= closes <= forcePause <= duration`, and the complete public actor-handle roster derived from the pinned playable projection. Handles are unique and match `^actor-[0-9]{3}$`. The binding also carries `entryState: "new" | "activeRecovery" | "finalizedRecovery"` from an owner-bound server read; this is presentation routing data, not client authorization. The server, not the machine, establishes ownership and authored spawn. All nested initializer data is copied and frozen before the machine retains it. A run-start response has exact fields `{ attemptId, runRevision, scenarioContentHash, initialView }`, matches the binding, and contains an exact tick-zero `ViewSample` satisfying the same C1 framing limits and field bounds used by C2. The response is copied and frozen; neither caller mutation nor mutation through an actor snapshot may change a future transition.

The machine's confirmed decision is the **public transport shape** `{ decisionTick, stopPlay, restart, discipline, offenderActorHandle }`. It never stores canonical `offenderActorId`, private evidence, a rubric, or a score. Strict validation rejects undeclared fields, nonfinite/unsafe ticks, unknown public handles, impossible stop/restart combinations, invalid enum strings, and a card without a selected offender. Structurally valid wrong football decisions remain valid submissions. The server resolves the handle and performs authoritative normalization against the pinned attempt, deciding tick, and C2 stop tick.

`SERVER_DECIDING_CONFIRMED` has exact fields `{ attemptId, runRevision, tick }`. The adapter accepts it only from playing when identity/revision match and the safe integer tick is inside the bound gate and duration. `CONFIRM_DECISION.decisionTick` must equal that recorded tick. Its idempotency key must be a nonempty string of at most 128 characters, matching the persistence boundary; undeclared choice/event fields fail.

At confirmation, the controller generates one high-entropy idempotency key and seals the current C2 live trace. It stores an immutable submission package `{ choice, idempotencyKey, sealedTrace }` for the lifetime of the attempt. The machine's exact `CONFIRM_DECISION` event carries the public choice and key; it copies and freezes both, while the controller retains the trace. A retry must reuse the same key, choice, and exact sealed trace; neither side reconstructs them from mutable controls. The machine alone proves only choice/key preservation, not end-to-end idempotency. If finalization fails with an uncertain commit outcome, it retains the choice/key and returns from `recoverableError` to `finalizing`. It must not offer a fresh initial decision until the server proves no decision was committed.

`SERVER_FINALIZED` has exact public fields `{ attemptId, runRevision, decisionId, evaluationId, finalizedAt }` with matching attempt/revision, nonempty durable IDs, and a valid canonical ISO timestamp; only finalizing accepts it. `SERVER_RESTORED_FINALIZED` is an owner-bound response accepted from loading only when `entryState="finalizedRecovery"`; it has those same durable fields plus `scenarioContentHash` and `state: "debrief" | "completed"`, all bound to the initializer. It enters the returned state without restarting play. `SERVER_RESTORED_ACTIVE` has exact fields `{ attemptId, previousRunRevision, runRevision, scenarioContentHash, previousState: "playing" | "deciding", state: "ready", tick: 0 }`. Loading accepts it only when `entryState="activeRecovery"`; an active run or its recovery error accepts it only when no durable result exists. The previous revision must equal the current revision, the next revision must be a safe integer exactly one greater, and the hash must match. It clears the discarded run's volatile data only after validation. Recovery responses are produced by owner-validated server operations; spoofing a machine event does not authorize a database mutation or grant observation credit.

### Durable records

- `CompetitionProfile`: immutable settings/version.
- `ScenarioVersion`: immutable content metadata, hashes, sources, and public/private content references.
- `ScenarioPublication`: audited draft/reviewed/retired lifecycle for one immutable version; retirement blocks new attempts only.
- `SessionPlan`: immutable ordered scenario refs and explicit time jumps.
- `Attempt`: owner, plan item, state, started/finalized times, last safe tick, locale, role, client/build metadata.
- `ObservationTrace`: bounded, validated samples or compressed segments plus derived summary and model version.
- `Decision`: immutable initial and later review decisions.
- `Evaluation`: deterministic result and rubric version.

Finalization first resolves the current authenticated or anonymous-session owner; every initial request and retry must pass the same owner check. One PostgreSQL transaction then:

1. Locks the attempt and validates its owner and pinned scenario/run identity.
2. Strictly normalizes the semantic decision and exact bounded trace, then calculates the server-side canonical digest.
3. Checks an existing scoped idempotency claim and completed result **before** active-state validation. A matching digest returns only the prior durable result; a different digest conflicts. A different key may alias the completed result only if its digest matches.
4. For a new finalization, validates the active state, server-recorded deciding transition and decision gate, and current run revision; claims the scoped key.
5. Validates/persists bounded observation data and recomputes the observation summary from the private pinned rubric.
6. Inserts one immutable initial decision under a database uniqueness constraint for `(attemptId, decisionKind=initial)`.
7. Computes/persists evaluation and moves the attempt to `debrief`.

A retry revalidates the owner before reading the prior result. The same scoped key plus the same digest returns that result; the same key with a different digest is a conflict. Concurrent different keys cannot create two initial decisions: the uniqueness constraint permits one winner, and the other request returns the existing result only when its canonical payload digest matches, otherwise a conflict. IDs or idempotency keys alone never authorize access.

The first MVP requires no account. Anonymous ownership is supported only through a high-entropy, `Secure`, `HttpOnly`, `SameSite=Lax` session cookie and the RV-006 retention policy below. Authentication can later attach eligible attempts through an explicit server operation. IDs alone never authorize access.

#### RV-006 local persistence baseline

- Anonymous sessions use a server-generated 256-bit random token. PostgreSQL stores only its SHA-256 hash, creation time, and an absolute seven-day expiry. Server code resolves the unexpired session on every operation; the token is never a request body field or a public owner ID. The cookie uses `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`, and a matching maximum age. Anonymous history can be restored only while this cookie and session remain valid. At expiry, owner-bound plans, attempts, decisions, traces, and evaluations are inaccessible and eligible for deletion by an explicit purge operation. The local prototype has no scheduled purge or guaranteed deletion deadline; this must be resolved before production use.
- Durable attempt states are `ready`, `playing`, `deciding`, `debrief`, `completed`, and `abandoned`. Loading, briefing, pause, and presentation errors map to the nearest safe durable state. Starting a run records one immutable `AttemptRunStart` per `(attemptId, runRevision)`, with a server-validated initial view and pinned scenario hash. A guarded server transition from `playing` to `deciding` records the revision and decision tick. Finalization requires this marker and the exact trace stop tick; the client cannot assert transition eligibility.
- Recovery of any unfinalized active run (`playing` or `deciding`) locks the attempt, requires its expected revision, increments the revision once, clears the pending decision marker, and returns to `ready` at tick zero. A repeated stale recovery request fails without incrementing again. A completed/debrief attempt restores its durable result. Recovery and finalization lock the same attempt row.
- The server generates decision ID, confirmation time, and finalization time. The canonical finalization digest is SHA-256 over a stable serialization of pinned scenario/run identity, normalized semantic decision, and the exact validated observation trace. Object keys sort recursively, array order is preserved, finite numbers normalize negative zero to zero, and unknown keys are rejected before digesting. The idempotency key and server-generated values are excluded.
- Publication allows `draft -> reviewed -> retired` only. Review requires a review record and source edition; retirement cannot revert to reviewed without a new scenario version. Every transition increments a checked revision and writes an append-only event with actor, reason, previous/new states, and server time. A reviewed-to-retired transition and new-attempt creation lock the same publication row. Retirement blocks only new attempts; previously pinned attempts may finish. A synthetic reviewed fixture with review metadata and source edition may be used **only in the isolated PostgreSQL test database**. Publishing the actual first incident as training content remains gated on Nicolas's rendered-evidence review.
- The JSON transport boundary rejects payloads above 256 KiB before parsing. C2's per-array limits still apply after parsing. This is a local MVP bound; no longer-session payload promise is made.
- Public reads expose only the challenge-safe scenario projection and permitted owner-bound attempt views. They never return private content references, evidence/rubric definitions, anonymous token hashes, or another owner's attempts.

### Server boundary

- Server Components read durable views.
- Server Actions handle same-origin user mutations such as create plan, start attempt, finalize decision, update preferences, and save content.
- Route Handlers serve streaming/HTTP integrations such as the optional AI provider, webhooks, or telemetry ingestion.
- Zod validates every trust-boundary payload. Prisma models storage; domain types do not import Prisma types.

Invalid:

- Mutating a `ScenarioVersion` used by an attempt.
- Finalizing twice into two decisions.
- Authorizing an attempt solely because the caller knows its ID.
- Saving every rendered frame without a bounded observation contract.
- Entering debrief on the client before the durable transaction succeeds.
