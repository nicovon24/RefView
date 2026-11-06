# Canonical event source v2

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
