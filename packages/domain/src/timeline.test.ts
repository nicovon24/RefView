import { describe, expect, it } from "vitest";
import {
  createTimelineFixture,
  serializeWorldState,
  worldStateChecksum,
  type TimelineFixtureInput,
} from "./index";

function input(): TimelineFixtureInput {
  return {
    ref: { scenarioId: "synthetic", version: 1 },
    durationTicks: 2,
    samples: [0, 1, 2].map((tick) => ({
      tick,
      actors: [
        { actorId: "z", position: { x: tick, y: 0, z: 1 }, yawRad: 0, clipId: "idle", phaseQ: 0 },
        { actorId: "a", position: { x: -0, y: 0, z: 1 }, yawRad: -0, clipId: "idle", phaseQ: 0 },
      ],
      ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } },
    })),
    events: [
      { eventId: "late", tick: 2, ordinal: 0, kind: "phaseMarker", actorIds: [], payload: {} },
      { eventId: "second", tick: 1, ordinal: 1, kind: "contact", actorIds: ["a"], payload: {} },
      { eventId: "first", tick: 1, ordinal: 0, kind: "ballTouch", actorIds: ["z"], payload: {} },
      { eventId: "start", tick: 0, ordinal: 0, kind: "phaseMarker", actorIds: [], payload: {} },
    ],
  };
}

describe("complete-sample timeline fixture", () => {
  it("accepts both inclusive tick endpoints and sorts events canonically", () => {
    const timeline = createTimelineFixture(input());
    expect(timeline.snapshot(0).tick).toBe(0);
    expect(timeline.snapshot(2).tick).toBe(2);
    expect(timeline.events.map((event) => event.eventId)).toEqual(["start", "first", "second", "late"]);
  });

  it("indexes complete authored samples by tick regardless of input order", () => {
    const source = input();
    source.samples.reverse();
    const timeline = createTimelineFixture(source);
    expect(timeline.snapshot(0).tick).toBe(0);
    expect(timeline.snapshot(2).tick).toBe(2);
  });

  it.each([-1, 3, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid requested tick %s",
    (tick) => expect(() => createTimelineFixture(input()).snapshot(tick)).toThrow(),
  );

  it("rejects missing or duplicate complete samples", () => {
    const missing = input();
    missing.samples.splice(1, 1);
    expect(() => createTimelineFixture(missing)).toThrow();
    const duplicate = input();
    duplicate.samples[1]!.tick = 0;
    expect(() => createTimelineFixture(duplicate)).toThrow();
  });

  it.each([-1, 3, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid authored tick %s",
    (tick) => {
      const fixture = input();
      fixture.samples[1]!.tick = tick;
      expect(() => createTimelineFixture(fixture)).toThrow();
    },
  );

  it("rejects duplicate actor IDs, event IDs, and ordinals within a tick", () => {
    const actors = input();
    actors.samples[0]!.actors[1]!.actorId = "z";
    expect(() => createTimelineFixture(actors)).toThrow();
    const eventIds = input();
    eventIds.events[1]!.eventId = "late";
    expect(() => createTimelineFixture(eventIds)).toThrow();
    const ordinals = input();
    ordinals.events[1]!.ordinal = 0;
    expect(() => createTimelineFixture(ordinals)).toThrow();
  });

  it("rejects nonfinite transforms and noninteger clip phase", () => {
    const actor = input();
    actor.samples[0]!.actors[0]!.position.x = Number.NaN;
    expect(() => createTimelineFixture(actor)).toThrow();
    const yaw = input();
    yaw.samples[0]!.actors[0]!.yawRad = Number.POSITIVE_INFINITY;
    expect(() => createTimelineFixture(yaw)).toThrow();
    const ball = input();
    ball.samples[0]!.ball.orientation.qw = Number.NEGATIVE_INFINITY;
    expect(() => createTimelineFixture(ball)).toThrow();
    const phase = input();
    phase.samples[0]!.actors[0]!.phaseQ = 0.5;
    expect(() => createTimelineFixture(phase)).toThrow();
  });

  it("isolates snapshots and events from source mutation", () => {
    const source = input();
    const timeline = createTimelineFixture(source);
    source.samples[0]!.actors[0]!.position.x = 99;
    source.events[0]!.eventId = "changed";
    expect(timeline.snapshot(0).actors[1]!.position.x).toBe(0);
    expect(timeline.events.at(-1)!.eventId).toBe("late");
    expect(Object.isFrozen(timeline.snapshot(0).actors[0]!.position)).toBe(true);
    expect(Object.isFrozen(timeline.events[0])).toBe(true);
  });

  it("keeps snapshot bounds fixed after source duration changes", () => {
    const source = input();
    const timeline = createTimelineFixture(source);
    source.durationTicks = 0;
    expect(timeline.snapshot(2).tick).toBe(2);
    source.durationTicks = 3;
    expect(() => timeline.snapshot(3)).toThrow(RangeError);
    expect(timeline.durationTicks).toBe(2);
  });

  it("rejects unknown event kinds and invalid actor references", () => {
    const kind = input();
    kind.events[0]!.kind = "invented" as typeof kind.events[number]["kind"];
    expect(() => createTimelineFixture(kind)).toThrow();

    for (const actorIds of [[""], ["missing"], ["a", "a"]]) {
      const fixture = input();
      fixture.events[1]!.actorIds = actorIds;
      expect(() => createTimelineFixture(fixture)).toThrow();
    }
  });

  it.each(["a", { 0: "a", length: 1 }, new Set(["a"])])(
    "rejects non-array event actorIds %s",
    (actorIds) => {
      const fixture = input();
      fixture.events[1]!.actorIds = actorIds as unknown as string[];
      expect(() => createTimelineFixture(fixture)).toThrow();
    },
  );

  it.each([null, [], "text", new Date(0)])(
    "rejects non-record event payload %s",
    (payload) => {
      const fixture = input();
      fixture.events[1]!.payload = payload as unknown as Record<string, unknown>;
      expect(() => createTimelineFixture(fixture)).toThrow();
    },
  );

  it("preserves own __proto__ payload keys without changing prototypes", () => {
    const source = input();
    source.events[0]!.payload = JSON.parse('{"__proto__":{"flag":true},"nested":{"__proto__":{"flag":false}}}') as Record<string, unknown>;
    const timeline = createTimelineFixture(source);
    const payload = timeline.events.at(-1)!.payload;
    const nested = payload.nested as Record<string, unknown>;
    expect(Object.hasOwn(payload, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(payload)).toBeNull();
    expect(Object.hasOwn(nested, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(nested)).toBeNull();
    expect(JSON.stringify(payload)).toBe('{"__proto__":{"flag":true},"nested":{"__proto__":{"flag":false}}}');
  });

  it("serializes the exact authored tuple and hashes its UTF-8 bytes", () => {
    const state = createTimelineFixture(input()).snapshot(0);
    expect(serializeWorldState(state)).toBe(
      '["refview-world-v1","synthetic",1,0,[["a",0,0,1,0,"idle",0],["z",0,0,1,0,"idle",0]],[0,0,0,0,0,0,1]]',
    );
    expect(worldStateChecksum(state)).toBe("fnv64:a4f7e85f0ea67c56");
    expect("camera" in state).toBe(false);
    expect("referee" in state).toBe(false);
  });

  it("excludes camera and controlled referee data from authored snapshots and digest", () => {
    const source = input();
    Object.assign(source.samples[0]!, { camera: { x: 17 }, referee: { x: 42 } });
    const timeline = createTimelineFixture(source);
    const state = timeline.snapshot(0);
    expect(Object.keys(state).sort()).toEqual(["actors", "ball", "ref", "tick"]);
    expect(worldStateChecksum(state)).toBe("fnv64:a4f7e85f0ea67c56");
  });
});
