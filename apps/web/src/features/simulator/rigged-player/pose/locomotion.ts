export type PublicTrackFrame = Readonly<{
  tick: number;
  actors: readonly Readonly<{
    actorHandle: string;
    position: Readonly<{ x: number; y: number; z: number }>;
  }>[];
}>;

export type LocomotionSample = Readonly<{
  phaseCycles: number;
  idleWeight: number;
  walkWeight: number;
  jogWeight: number;
  legacyBaseWeight: number;
}>;

export type PublicLocomotionPlan = Readonly<Record<string, readonly LocomotionSample[]>>;

export const WALK_CYCLE_M = 1.23582;
export const JOG_CYCLE_M = 4.90824;
const initialPhaseCycles: Readonly<Record<string, number>> = Object.freeze({
  'actor-001': 0.05422175745358748,
  'actor-002': 0.10823690701824873,
  'actor-003': 0.44624205514324555,
  'actor-004': 0,
  'actor-005': 0.49212363054613817,
  'actor-006': 0.9749406070383015,
  'actor-007': 0.9623639442738912,
});
export const smoothGaitWeight = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};
const smooth = smoothGaitWeight;

export function gaitCycleDistance(movement: number, walkWeight: number, jogWeight: number): number {
  return Math.max(0.5,
    (walkWeight * WALK_CYCLE_M + jogWeight * JOG_CYCLE_M) / Math.max(0.001, movement));
}

function legacyWeight(actorHandle: string, tick: number) {
  if (actorHandle === 'actor-002') return smooth(338, 350, tick);
  if (actorHandle === 'actor-006') {
    if (tick < 356) return smooth(344, 356, tick);
    if (tick <= 386) return 1;
    return 1 - smooth(386, 398, tick);
  }
  return 0;
}

export function buildPublicLocomotionPlan(frames: readonly PublicTrackFrame[], tickRate = 60): PublicLocomotionPlan {
  if (tickRate !== 60 || frames.length !== 481) throw new RangeError('Expected 481 ordered 60 Hz public frames');
  const handles = frames[0]?.actors.map((actor) => actor.actorHandle).sort() ?? [];
  if (!handles.length || new Set(handles).size !== handles.length || handles.some((handle) => !/^actor-\d{3}$/.test(handle))) {
    throw new TypeError('Invalid public actor roster');
  }
  const paths = new Map(handles.map((handle) => [handle, [] as { x: number; z: number }[]]));
  for (let tick = 0; tick < 481; tick += 1) {
    const frame = frames[tick];
    if (!frame || frame.tick !== tick || frame.actors.length !== handles.length ||
      frame.actors.map((actor) => actor.actorHandle).sort().some((handle, index) => handle !== handles[index])) {
      throw new TypeError(`Invalid public actor frame ${tick}`);
    }
    for (const actor of frame.actors) {
      if (![actor.position.x, actor.position.y, actor.position.z].every(Number.isFinite)) {
        throw new RangeError(`Invalid public actor position at ${tick}`);
      }
      paths.get(actor.actorHandle)!.push({ x: actor.position.x, z: actor.position.z });
    }
  }
  const result: Record<string, readonly LocomotionSample[]> = Object.create(null);
  for (const [handle, positions] of paths) {
    const steps = positions.map((position, tick) => tick === 0 ? 0 :
      Math.hypot(position.x - positions[tick - 1]!.x, position.z - positions[tick - 1]!.z));
    const filteredSpeed = positions.map((_, tick) => {
      let weightedSpeed = 0;
      let totalWeight = 0;
      for (let offset = -4; offset <= 4; offset += 1) {
        const sourceTick = Math.max(1, Math.min(480, tick + offset));
        const weight = 5 - Math.abs(offset);
        weightedSpeed += steps[sourceTick]! * tickRate * weight;
        totalWeight += weight;
      }
      return weightedSpeed / totalWeight;
    });
    const rawJogFraction = filteredSpeed.map((speed) => smooth(2, 3.2, speed));
    let phaseCycles = initialPhaseCycles[handle] ?? 0;
    result[handle] = Object.freeze(positions.map((_, tick) => {
      let weightedJog = 0;
      let totalWeight = 0;
      for (let offset = -4; offset <= 4; offset += 1) {
        const sourceTick = Math.max(0, Math.min(480, tick + offset));
        const weight = 5 - Math.abs(offset);
        weightedJog += rawJogFraction[sourceTick]! * weight;
        totalWeight += weight;
      }
      const speed = filteredSpeed[tick]!;
      const movement = smooth(0.05, 0.25, speed);
      const jogFraction = weightedJog / totalWeight;
      const idleWeight = 1 - movement;
      const walkWeight = movement * (1 - jogFraction);
      const jogWeight = movement * jogFraction;
      if (tick > 0 && movement > 0) {
        const cycleDistance = gaitCycleDistance(movement, walkWeight, jogWeight);
        phaseCycles += steps[tick]! / cycleDistance;
      }
      return Object.freeze({ phaseCycles, idleWeight, walkWeight, jogWeight,
        legacyBaseWeight: legacyWeight(handle, tick) });
    }));
  }
  return Object.freeze(result);
}
