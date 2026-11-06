import { describe, expect, it } from 'vitest';
import {
  advanceRefereeLocomotion, buildRefereeLocomotionPlan, createRefereeLocomotion,
  stationaryRefereeMotion,
} from './referee-locomotion';

function track(speed: number, end = 120) {
  return Array.from({ length: end + 1 }, (_, tick) => ({
    tick, position: { x: 0, y: 0, z: tick * speed / 60 }, lookYaw: 0,
  }));
}

describe('causal referee locomotion', () => {
  it('matches its reducer at every tick and leaves earlier samples unchanged by later input', () => {
    const input = track(4);
    let state = createRefereeLocomotion(input[0]!);
    const reduced = [state.sample];
    for (const next of input.slice(1)) {
      state = advanceRefereeLocomotion(state, next);
      reduced.push(state.sample);
    }
    expect(reduced).toEqual(buildRefereeLocomotionPlan(input));
    expect(buildRefereeLocomotionPlan(input.slice(0, 40))).toEqual(reduced.slice(0, 40));
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.sample)).toBe(true);
    expect(Object.isFrozen(buildRefereeLocomotionPlan(input))).toBe(true);
  });

  it('uses walking and running clips, with sprint phase driven by actual distance', () => {
    const walk = buildRefereeLocomotionPlan(track(0.6));
    const run = buildRefereeLocomotionPlan(track(4));
    const sprint = buildRefereeLocomotionPlan(track(8));
    expect(walk[60]!.walkWeight).toBeGreaterThan(0.99);
    expect(walk[60]!.jogWeight).toBe(0);
    expect(run[60]!.jogWeight).toBeGreaterThan(0.99);
    expect(sprint[60]!.jogWeight).toBeGreaterThan(0.99);
    expect(sprint[120]!.phaseCycles - sprint[60]!.phaseCycles).toBeCloseTo(8 / 4.90824, 8);
    expect(run[120]!.phaseCycles - run[60]!.phaseCycles).toBeCloseTo(4 / 4.90824, 8);
  });

  it('stops without advancing phase and starts again from zero on restart', () => {
    const input = track(4);
    for (let tick = 61; tick <= 120; tick += 1) input[tick]!.position.z = input[60]!.position.z;
    const samples = buildRefereeLocomotionPlan(input);
    expect(samples[120]!.idleWeight).toBe(1);
    expect(samples[120]!.phaseCycles).toBe(samples[60]!.phaseCycles);
    expect(createRefereeLocomotion(input[0]!).sample.phaseCycles).toBe(0);
    expect(stationaryRefereeMotion(137)).toEqual({
      tick: 137, phaseCycles: 0, idleWeight: 1, walkWeight: 0, jogWeight: 0, bodyYawOffsetRad: 0,
    });
  });

  it('turns only the visual body toward lateral, backward, and diagonal travel at a capped rate', () => {
    const input = track(0, 35);
    for (let tick = 1; tick <= 35; tick += 1) input[tick]!.position.x = -tick * 4 / 60;
    const side = buildRefereeLocomotionPlan(input);
    for (let tick = 1; tick <= 35; tick += 1) {
      expect(Math.abs(side[tick]!.bodyYawOffsetRad - side[tick - 1]!.bodyYawOffsetRad)).toBeLessThanOrEqual(0.200000001);
    }
    expect(side[35]!.bodyYawOffsetRad).toBeCloseTo(-Math.PI / 2, 8);
    const backward = track(-4, 35).map((entry) => ({ ...entry, lookYaw: 0 }));
    expect(Math.abs(buildRefereeLocomotionPlan(backward)[35]!.bodyYawOffsetRad)).toBeCloseTo(Math.PI, 8);
    const diagonal = track(4, 35);
    for (let tick = 1; tick <= 35; tick += 1) diagonal[tick]!.position.x = diagonal[tick]!.position.z;
    expect(buildRefereeLocomotionPlan(diagonal)[35]!.bodyYawOffsetRad).toBeCloseTo(Math.PI / 4, 8);
  });

  it('rejects a missing integration tick and nonfinite coordinates', () => {
    const initial = createRefereeLocomotion(track(0, 0)[0]!);
    expect(() => advanceRefereeLocomotion(initial, { tick: 2, position: { x: 0, y: 0, z: 1 }, lookYaw: 0 })).toThrow();
    expect(() => createRefereeLocomotion({ tick: 0, position: { x: 0, y: NaN, z: 0 }, lookYaw: 0 })).toThrow();
    expect(() => buildRefereeLocomotionPlan([])).toThrow();
  });
});
