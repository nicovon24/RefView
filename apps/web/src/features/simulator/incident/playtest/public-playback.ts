import { createTimelineFixture, worldStateChecksum, type TimelineFixture } from "@refview/domain";
import { createLivePlayback, type LivePlayback } from "@refview/simulation";

/** Structural public slice of PlayableScenarioV2; no private source type crosses the client boundary. */
export type PublicPlaybackSource = Readonly<{
  ref: Readonly<{ scenarioId: string; version: number }>;
  durationTicks: number;
  tickRateHz: number;
  actors: readonly Readonly<{ tick: number; actors: readonly Readonly<{
    actorHandle: string; position: Readonly<{ x: number; y: number; z: number }>;
    yawRad: number; clipHandle: string; phaseQ: number;
  }>[] }>[];
  ball: readonly Readonly<{ tick: number; ball: Readonly<{
    position: Readonly<{ x: number; y: number; z: number }>;
    orientation: Readonly<{ qx: number; qy: number; qz: number; qw: number }>;
  }> }>[];
}>;

/** The checksum is for the detached public frame, never the private source timeline. */
export function createPublicPlayback(scenario: PublicPlaybackSource): Readonly<{
  fixture: TimelineFixture; clock: LivePlayback; publicFrameChecksum: string;
}> {
  if (scenario.tickRateHz !== 60) throw new RangeError("public playback requires 60 Hz");
  if (scenario.durationTicks !== 480) throw new RangeError("public playback requires 480 authored ticks");
  if (scenario.actors.length !== scenario.durationTicks + 1 || scenario.ball.length !== scenario.durationTicks + 1)
    throw new RangeError("incomplete public timeline");
  const samples = scenario.actors.map((entry, tick) => {
    const ball = scenario.ball[tick];
    if (entry.tick !== tick || ball?.tick !== tick) throw new RangeError("misaligned public timeline");
    return { tick, actors: entry.actors.map((actor) => ({ actorId: actor.actorHandle,
      position: { ...actor.position }, yawRad: actor.yawRad, clipId: actor.clipHandle, phaseQ: actor.phaseQ })),
      ball: { position: { ...ball.ball.position }, orientation: { ...ball.ball.orientation } } };
  });
  const fixture = createTimelineFixture({ ref: { ...scenario.ref }, durationTicks: scenario.durationTicks,
    samples, events: [] });
  return Object.freeze({ fixture, clock: createLivePlayback(fixture, { maxCatchUpTicks: 6 }),
    publicFrameChecksum: worldStateChecksum(fixture.snapshot(0)) });
}
