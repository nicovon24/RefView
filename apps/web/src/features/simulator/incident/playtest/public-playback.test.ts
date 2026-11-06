import { describe, expect, it } from "vitest";
import { createPublicPlayback, type PublicPlaybackSource } from "./public-playback";

const scenario = {
  ref: { scenarioId: "incident-001", version: 2 }, durationTicks: 480, tickRateHz: 60,
  actors: Array.from({ length: 481 }, (_, tick) => ({ tick, actors: [{ actorHandle: "actor-001", position: { x: tick, y: 0, z: 0 }, yawRad: 0, clipHandle: "asset-001", phaseQ: tick }] })),
  ball: Array.from({ length: 481 }, (_, tick) => ({ tick, ball: { position: { x: 0, y: 0, z: tick }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
  privateReview: { hidden: true },
} as PublicPlaybackSource & { privateReview: { hidden: boolean } };

describe("public incident playback", () => {
  it("detaches public handles and samples without private data or events", () => {
    const { fixture, clock, publicFrameChecksum } = createPublicPlayback(scenario);
    expect(fixture.events).toEqual([]);
    expect(fixture.snapshot(3).actors[0]?.actorId).toBe("actor-001");
    expect(fixture.snapshot(3).actors[0]?.clipId).toBe("asset-001");
    expect(fixture.snapshot(3).ball.position.z).toBe(3);
    expect(JSON.stringify(fixture)).not.toContain("hidden");
    expect(clock.maxCatchUpTicks).toBe(6);
    expect(publicFrameChecksum).toMatch(/^fnv64:[0-9a-f]{16}$/);
    (scenario.actors[3]!.actors[0]!.position as { x: number }).x = 99;
    expect(fixture.snapshot(3).actors[0]?.position.x).toBe(3);
  });

  for (const fps of [30, 60, 144]) {
    it(`keeps canonical crossed ticks at ${fps} fps`, () => {
      const { clock } = createPublicPlayback(scenario);
      clock.start(0);
      const crossed: number[] = [];
      let previous = 0;
      for (let frame = 1; frame <= fps / 3; frame++) {
        clock.advance(Math.ceil(frame * 1_000_000 / fps));
        for (let tick = previous + 1; tick <= clock.tick; tick++) crossed.push(tick);
        previous = clock.tick;
      }
      expect(crossed).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
      expect(clock.state.actors[0]?.position.x).toBe(20);
    });
  }

  it("performance pauses when a frame crosses more than six ticks", () => {
    const { clock } = createPublicPlayback(scenario);
    clock.start(0);
    clock.advance(120_000);
    expect(clock.tick).toBe(0);
    expect(clock.status).toBe("performancePaused");
  });

  it("rejects shortened or other non-authored duration", () => {
    expect(() => createPublicPlayback({ ...scenario, durationTicks: 10,
      actors: scenario.actors.slice(0, 11), ball: scenario.ball.slice(0, 11) })).toThrow(/480/);
    expect(() => createPublicPlayback({ ...scenario, durationTicks: 481,
      actors: [...scenario.actors, scenario.actors[480]!],
      ball: [...scenario.ball, scenario.ball[480]!] })).toThrow(/480/);
  });
});
