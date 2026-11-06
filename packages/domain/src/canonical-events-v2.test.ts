import { describe, expect, it } from "vitest";
import { createTimelineFixture, type TimelineFixtureInput } from "./timeline";
import { normalizeCanonicalEventsV2 } from "./canonical-events-v2";

const context = { durationTicks: 2, canonicalActorIds: ["a", "b", "c"] };

function event(kind = "contact", actorIds = ["b", "a"]) {
  return { eventId: "contact", tick: 1, ordinal: 0, kind, actorIds, payload: {} };
}

function normalized(value: unknown) {
  return normalizeCanonicalEventsV2(value, context);
}

describe("canonical events v2", () => {
  it("sorts unordered event and participant sets into detached frozen values", () => {
    const later = event();
    const earlier = { ...event("ballTouch", ["c"]), eventId: "pass", tick: 0 };
    const input = [later, earlier];
    const result = normalized(input);
    expect(result.map((item) => item.eventId)).toEqual(["pass", "contact"]);
    expect(result[1]!.actorIds).toEqual(["a", "b"]);
    expect(normalized([earlier, { ...later, actorIds: ["a", "b"] }])).toEqual(result);
    later.actorIds[0] = "c";
    input.reverse();
    expect(result[1]!.actorIds).toEqual(["a", "b"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[1])).toBe(true);
    expect(Object.isFrozen(result[1]!.actorIds)).toBe(true);
    expect(Object.isFrozen(result[1]!.payload)).toBe(true);
  });

  it.each([
    ["ballTouch", ["a"], true], ["ballTouch", [], false],
    ["contact", ["a", "b"], true], ["contact", ["a"], false],
    ["offence", ["a", "b"], true], ["offence", ["a", "b", "c"], false],
    ["whistleWindow", [], true], ["whistleWindow", ["a"], false],
    ["phaseMarker", [], true], ["phaseMarker", ["a"], false],
  ])("validates %s participant count %j", (kind, actors, accepted) => {
    const run = () => normalized([event(kind as string, actors as string[])]);
    if (accepted) expect(run).not.toThrow();
    else expect(run).toThrow();
  });

  it("rejects unknown and duplicate participants, event IDs, and tick ordinals", () => {
    expect(() => normalized([event("contact", ["a", "missing"])] )).toThrow();
    expect(() => normalized([event("contact", ["a", "a"])] )).toThrow();
    expect(() => normalized([event(), { ...event(), tick: 2 }])).toThrow();
    expect(() => normalized([event(), { ...event(), eventId: "other" }])).toThrow();
  });

  it.each([[-1, 0], [3, 0], [0.5, 0], [NaN, 0], [Infinity, 0], [1, -1], [1, 0.5], [1, Infinity]])(
    "rejects invalid tick %s or ordinal %s", (tick, ordinal) => {
      expect(() => normalized([{ ...event(), tick, ordinal }])).toThrow();
    },
  );

  it("rejects invalid kind and empty event ID", () => {
    expect(() => normalized([{ ...event(), kind: "invented" }])).toThrow();
    expect(() => normalized([{ ...event(), eventId: "" }])).toThrow();
  });

  it("rejects sparse or decorated participant and event arrays", () => {
    const sparse = new Array<string>(3);
    sparse[0] = "a";
    sparse[2] = "b";
    expect(() => normalized([event("contact", sparse as string[])])).toThrow();
    const decorated = ["a", "b"];
    Object.defineProperty(decorated, "extra", { value: true });
    expect(() => normalized([event("contact", decorated)])).toThrow();
    const events = [event()];
    Object.defineProperty(events, Symbol("extra"), { value: true });
    expect(() => normalized(events)).toThrow();
  });

  it("rejects nonplain, missing, unknown, hidden, symbol, and accessor event fields without calling getters", () => {
    const base = event();
    expect(() => normalized([Object.create(base)])).toThrow();
    const withoutTick: Record<string, unknown> = { ...base };
    delete withoutTick.tick;
    expect(() => normalized([withoutTick])).toThrow();
    expect(() => normalized([{ ...base, payload: undefined }])).toThrow();
    expect(() => normalized([{ ...base, extra: true }])).toThrow();
    const hidden = { ...base };
    Object.defineProperty(hidden, "hidden", { value: true });
    expect(() => normalized([hidden])).toThrow();
    const symbol = { ...base };
    Object.defineProperty(symbol, Symbol("hidden"), { value: true });
    expect(() => normalized([symbol])).toThrow();
    let calls = 0;
    const accessor = { ...base };
    Object.defineProperty(accessor, "tick", { get() { calls++; throw new Error("getter executed"); } });
    expect(() => normalized([accessor])).toThrow();
    expect(calls).toBe(0);
  });

  it("requires a zero-key plain payload without calling its getters", () => {
    expect(() => normalized([{ ...event(), payload: { extra: true } }])).toThrow();
    expect(() => normalized([{ ...event(), payload: JSON.parse('{"__proto__":1}') }])).toThrow();
    expect(() => normalized([{ ...event(), payload: [] }])).toThrow();
    const symbolPayload = { [Symbol("hidden")]: true };
    expect(() => normalized([{ ...event(), payload: symbolPayload }])).toThrow();
    let calls = 0;
    const payload = {};
    Object.defineProperty(payload, "secret", { get() { calls++; throw new Error("getter executed"); } });
    expect(() => normalized([{ ...event(), payload }])).toThrow();
    expect(calls).toBe(0);
  });

  it("keeps the v1 nested payload and actor order unchanged", () => {
    const fixture: TimelineFixtureInput = {
      ref: { scenarioId: "v1", version: 1 }, durationTicks: 0,
      samples: [{ tick: 0, actors: ["a", "b"].map((actorId) => ({ actorId, position: { x: 0, y: 0, z: 0 }, yawRad: 0, clipId: "idle", phaseQ: 0 })), ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } }],
      events: [{ eventId: "legacy", tick: 0, ordinal: 0, kind: "contact", actorIds: ["b", "a"], payload: { nested: { accepted: true } } }],
    };
    const legacy = createTimelineFixture(fixture).events[0]!;
    expect(legacy.actorIds).toEqual(["b", "a"]);
    expect(legacy.payload).toEqual({ nested: { accepted: true } });
  });
});
