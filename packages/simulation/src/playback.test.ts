import { createTimelineFixture, type CanonicalEvent } from "@refview/domain";
import { describe, expect, it } from "vitest";
import { createLivePlayback, createReplayPlayback } from "./index";

// @ts-expect-error the pure clock has no callback channel
const callbackOption: Parameters<typeof createLivePlayback>[1] = { maxCatchUpTicks: 1, onEvent: () => {} };
void callbackOption;

const events: CanonicalEvent[] = [
  { eventId: "early", tick: 1, ordinal: 2, kind: "ballTouch", actorIds: [], payload: {} },
  { eventId: "start", tick: 0, ordinal: 0, kind: "phaseMarker", actorIds: [], payload: {} },
  { eventId: "before-early", tick: 1, ordinal: 0, kind: "phaseMarker", actorIds: [], payload: {} },
  { eventId: "contact", tick: 366, ordinal: 0, kind: "contact", actorIds: [], payload: {} },
  { eventId: "late", tick: 480, ordinal: 0, kind: "phaseMarker", actorIds: [], payload: {} },
];

function fixture() {
  return createTimelineFixture({
    ref: { scenarioId: "clock-test", version: 1 },
    durationTicks: 480,
    samples: Array.from({ length: 481 }, (_, tick) => ({
      tick,
      actors: [{ actorId: "referee", position: { x: tick, y: 0, z: 0 }, yawRad: 0, clipId: "idle", phaseQ: 0 }],
      ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } },
    })),
    events,
  });
}

describe("canonical playback", () => {
  it("exposes tick zero once and emits only events in (a, b]", () => {
    const live = createLivePlayback(fixture(), { maxCatchUpTicks: 480 });
    const delivered = [...live.start(0)];
    expect(delivered.map((event) => event.eventId)).toEqual(["start"]);
    expect(live.start(0)).toEqual([]);
    expect(live.advance(0)).toEqual([]);
    const early = live.advance(2_000_000);
    delivered.push(...early);
    expect(early.map((event) => event.eventId)).toEqual(["before-early", "early"]);
    expect(live.tick).toBe(120);
    expect(live.advance(2_000_000)).toEqual([]);
    const late = live.advance(8_000_000);
    delivered.push(...late);
    expect(late.map((event) => event.eventId)).toEqual(["contact", "late"]);
    expect(delivered.map((event) => event.eventId)).toEqual(["start", "before-early", "early", "contact", "late"]);
  });

  it.each([30, 60, 144])("reaches identical 8-second state and one contact at %i FPS", (fps) => {
    const live = createLivePlayback(fixture(), { maxCatchUpTicks: 20 });
    const delivered = [...live.start(0)];
    for (let frame = 1; frame <= fps * 8; frame++) {
      delivered.push(...live.advance(Math.round(frame * 8_000_000 / (fps * 8))));
    }
    expect(live.tick).toBe(480);
    expect(live.remainder).toBe(0);
    expect(delivered.filter((event) => event.eventId === "contact")).toHaveLength(1);
  });

  it.each(["pause", "losePointerLock", "hide"] as const)("preserves fractional time and resets baseline after %s", (method) => {
    const live = createLivePlayback(fixture(), { maxCatchUpTicks: 10 });
    live.start(0);
    live.advance(8_333);
    expect(live.tick).toBe(0);
    const remainder = live.remainder;
    live[method]();
    expect(live.isInputActive).toBe(false);
    expect(live.advance(1_000_000)).toEqual([]);
    expect(live.remainder).toBe(remainder);
    live.resume(1_000_000);
    expect(live.advance(1_000_000)).toEqual([]);
    expect(live.tick).toBe(0);
    live.advance(1_008_334);
    expect(live.tick).toBe(1);
  });

  it("performance-pauses before a long frame changes state, then recovers without event loss", () => {
    const live = createLivePlayback(fixture(), { maxCatchUpTicks: 2 });
    const delivered = [...live.start(0)];
    live.advance(8_333);
    const remainder = live.remainder;
    expect(live.advance(1_000_000)).toEqual([]);
    expect(live.status).toBe("performancePaused");
    expect(live.tick).toBe(0);
    expect(live.remainder).toBe(remainder);
    live.resume(1_000_000);
    const recovered = live.advance(1_008_334);
    delivered.push(...recovered);
    expect(recovered.map((event) => event.eventId)).toEqual(["before-early", "early"]);
    expect(delivered.map((event) => event.eventId)).toEqual(["start", "before-early", "early"]);
  });

  it("returns complete frozen batches even if a downstream consumer throws", () => {
    const live = createLivePlayback(fixture(), { maxCatchUpTicks: 2 });
    const initial = live.start(0);
    expect(Object.isFrozen(initial)).toBe(true);
    const crossed = live.advance(16_667);
    expect(Object.isFrozen(crossed)).toBe(true);
    expect(crossed.map((event) => event.eventId)).toEqual(["before-early", "early"]);
    const consume = () => {
      for (const event of crossed) {
        if (event.eventId === "before-early") throw new Error("adapter failed");
      }
    };
    expect(consume).toThrow("adapter failed");
    expect(crossed.map((event) => event.eventId)).toEqual(["before-early", "early"]);
    expect(live.tick).toBe(1);
    expect(live.advance(33_334)).toEqual([]);
    expect(live.tick).toBe(2);
  });

  it("keeps replay seek and marker delivery separate from live effects", () => {
    const source = fixture();
    const live = createLivePlayback(source, { maxCatchUpTicks: 480 });
    const liveInitial = live.start(0);
    const replay = createReplayPlayback(source, { maxCatchUpTicks: 480 });
    replay.seek(365);
    replay.start(0);
    expect(replay.advance(33_334).map((event) => event.eventId)).toEqual(["contact"]);
    replay.seek(365);
    replay.resume(1_000_000);
    expect(replay.advance(1_033_334).map((event) => event.eventId)).toEqual(["contact"]);
    expect(live.tick).toBe(0);
    expect(liveInitial.map((event) => event.eventId)).toEqual(["start"]);
    expect(() => replay.seek(-1)).toThrow(RangeError);
    expect(() => replay.seek(481)).toThrow(RangeError);
    expect("seek" in live).toBe(false);
  });

  it.each([[0.25, 15], [0.5, 30], [1, 60], [2, 120]] as const)("advances at %s speed", (speed, ticks) => {
    const replay = createReplayPlayback(fixture(), { maxCatchUpTicks: 120 });
    replay.setSpeed(speed);
    replay.start(0);
    replay.advance(1_000_000);
    expect(replay.tick).toBe(ticks);
  });

  it("steps exactly one bounded tick and stops at inclusive terminal tick", () => {
    const source = fixture();
    const replay = createReplayPlayback(source, { maxCatchUpTicks: 480 });
    replay.seek(365);
    expect(replay.step(1).map((event) => event.eventId)).toEqual(["contact"]);
    expect(replay.tick).toBe(366);
    expect(replay.step(-1)).toEqual([]);
    expect(replay.tick).toBe(365);
    replay.seek(480);
    expect(replay.step(1)).toEqual([]);
    expect(replay.tick).toBe(480);
    replay.seek(0);
    expect(replay.step(-1)).toEqual([]);
    expect(replay.tick).toBe(0);
    const live = createLivePlayback(source, { maxCatchUpTicks: 480 });
    live.start(0);
    live.advance(8_000_000);
    expect(live.tick).toBe(480);
    expect(live.advance(28_000_000)).toEqual([]);
    expect(live.tick).toBe(480);
    expect(live.status).toBe("running");
  });

  it("uses the same authored checksum for live and replay at one tick", () => {
    const source = fixture();
    const live = createLivePlayback(source, { maxCatchUpTicks: 480 });
    live.start(0);
    live.advance(6_100_000);
    const replay = createReplayPlayback(source, { maxCatchUpTicks: 480 });
    replay.seek(366);
    expect(live.tick).toBe(366);
    expect(live.state).toEqual(replay.state);
    expect(live.checksum).toBe(replay.checksum);
  });
});
