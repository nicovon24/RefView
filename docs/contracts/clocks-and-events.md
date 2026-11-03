# Clocks, ticks, and events contract

## Canonical time

- `scenarioTick` is an integer in `0..durationTicks`, sampled at exactly 60 Hz.
- The state at a tick is a pure result of scenario version plus tick.
- A render frame may interpolate between adjacent tick states for presentation. Interpolation never creates facts or events.
- Events are ordered by `(tick, ordinal, eventId)`. `ordinal` is unique within a tick.
- Seeking first reconstructs canonical state, then exposes events according to replay mode; it never re-submits side effects.

## Distinct clocks

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

## Playback

- The accumulator advances whole ticks independently of render FPS.
- A long frame may process a bounded number of catch-up ticks. Exceeding the bound pauses with a recoverable performance state instead of skipping canonical events.
- Pointer-lock loss, tab visibility loss, or an explicit pause stops tick advancement and input sampling.
- Replay speeds initially supported: `0.25`, `0.5`, `1`, and `2`; frame step changes exactly one canonical tick.
- Live and replay checksums for the same scenario ref/tick must match.

## Executable RV-005 first-slice baseline

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
