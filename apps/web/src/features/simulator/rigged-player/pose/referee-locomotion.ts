import { gaitCycleDistance, smoothGaitWeight } from './locomotion';

export type RefereeTrackSample = Readonly<{
  tick: number;
  position: Readonly<{ x: number; y: number; z: number }>;
  lookYaw: number;
}>;

export type RefereeMotionSample = Readonly<{
  tick: number;
  phaseCycles: number;
  idleWeight: number;
  walkWeight: number;
  jogWeight: number;
  bodyYawOffsetRad: number;
}>;

export type RefereeLocomotionState = Readonly<{
  previous: RefereeTrackSample;
  rawSpeeds: readonly number[];
  rawJogFractions: readonly number[];
  visualHeading: number;
  sample: RefereeMotionSample;
}>;

const filterWeights = [5, 4, 3, 2, 1] as const;
const filterWeightTotal = 15;
const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const validTrack = (track: RefereeTrackSample) => Number.isInteger(track.tick) && track.tick >= 0 &&
  [track.position.x, track.position.y, track.position.z, track.lookYaw].every(Number.isFinite);
const weighted = (values: readonly number[]) => filterWeights.reduce((sum, weight, index) =>
  sum + weight * (values[index] ?? 0), 0) / filterWeightTotal;
const prepend = (value: number, values: readonly number[]) => Object.freeze([value, ...values.slice(0, 4)]);

export function stationaryRefereeMotion(tick: number): RefereeMotionSample {
  if (!Number.isInteger(tick) || tick < 0) throw new RangeError('Invalid referee motion tick');
  return Object.freeze({ tick, phaseCycles: 0, idleWeight: 1, walkWeight: 0, jogWeight: 0, bodyYawOffsetRad: 0 });
}

export function createRefereeLocomotion(initial: RefereeTrackSample): RefereeLocomotionState {
  if (!validTrack(initial) || initial.tick !== 0) throw new RangeError('Invalid initial referee track sample');
  const previous = Object.freeze({ tick: initial.tick,
    position: Object.freeze({ ...initial.position }), lookYaw: initial.lookYaw });
  return Object.freeze({ previous, rawSpeeds: Object.freeze([]), rawJogFractions: Object.freeze([]),
    visualHeading: initial.lookYaw, sample: stationaryRefereeMotion(0) });
}

export function advanceRefereeLocomotion(previous: RefereeLocomotionState,
  next: RefereeTrackSample): RefereeLocomotionState {
  if (!validTrack(next) || next.tick !== previous.sample.tick + 1) {
    throw new RangeError('Expected consecutive finite referee integration ticks');
  }
  const dx = next.position.x - previous.previous.position.x;
  const dz = next.position.z - previous.previous.position.z;
  const distance = Math.hypot(dx, dz);
  const rawSpeeds = prepend(distance * 60, previous.rawSpeeds);
  const speed = weighted(rawSpeeds);
  const rawJogFractions = prepend(smoothGaitWeight(2, 3.2, speed), previous.rawJogFractions);
  const movement = smoothGaitWeight(0.05, 0.25, speed);
  const jogFraction = weighted(rawJogFractions);
  const idleWeight = 1 - movement;
  const walkWeight = movement * (1 - jogFraction);
  const jogWeight = movement * jogFraction;
  const phaseCycles = previous.sample.phaseCycles + (distance > 0 && movement > 0
    ? distance / gaitCycleDistance(movement, walkWeight, jogWeight) : 0);
  const desiredHeading = distance > 1e-10 ? Math.atan2(dx, dz) : next.lookYaw;
  const delta = wrapAngle(desiredHeading - previous.visualHeading);
  const visualHeading = previous.visualHeading + Math.max(-0.2, Math.min(0.2, delta));
  const sample = Object.freeze({ tick: next.tick, phaseCycles, idleWeight, walkWeight, jogWeight,
    bodyYawOffsetRad: wrapAngle(visualHeading - next.lookYaw) });
  return Object.freeze({ previous: Object.freeze({ tick: next.tick,
    position: Object.freeze({ ...next.position }), lookYaw: next.lookYaw }),
  rawSpeeds, rawJogFractions, visualHeading, sample });
}

export function buildRefereeLocomotionPlan(track: readonly RefereeTrackSample[]): readonly RefereeMotionSample[] {
  let state = createRefereeLocomotion(track[0]!);
  const samples = [state.sample];
  for (const next of track.slice(1)) {
    state = advanceRefereeLocomotion(state, next);
    samples.push(state.sample);
  }
  return Object.freeze(samples);
}
