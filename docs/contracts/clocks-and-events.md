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

Valid: at 30, 60, and 144 rendered frames per second, event `contact-1` occurs once at tick `366`.

Invalid:

- `scenarioTick += deltaSeconds * 60` stored as a floating-point value.
- Firing a decision submission again after seeking past its visual marker.
- Advancing play while pointer lock is unexpectedly lost.
- Hiding a five-minute session jump without an explicit transition.
