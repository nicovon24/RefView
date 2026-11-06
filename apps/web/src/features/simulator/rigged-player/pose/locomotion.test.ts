import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { buildPublicLocomotionPlan } from './locomotion';

function frames(speedMps: number, handle = 'actor-001') {
  return Array.from({ length: 481 }, (_, tick) => ({ tick, actors: [{ actorHandle: handle,
    position: { x: 0, y: 0, z: tick * speedMps / 60 }, yawRad: 0,
    clipHandle: 'asset-003', phaseQ: tick }] }));
}

describe('public distance driven locomotion plan', () => {
  it('uses a continuous running gait on the authored opening', () => {
    const files: Record<string, string> = { 'player-rig': 'asset-001.mjs',
      'run-clip': 'asset-002.mjs', 'trip-clip': 'asset-003.mjs', 'challenge-clip': 'asset-004.mjs' };
    const playable = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
      resolveAssetBytes: (id, path) => {
        const name = files[id];
        return name && path === `/assets/${name}`
          ? readFileSync(new URL(`../../../../../../../packages/content/assets/${name}`, import.meta.url))
          : undefined;
      },
      ...createIncident001GeometryResolverV2(),
    }).playable;
    const plan = buildPublicLocomotionPlan(playable.actors, 60);
    const incidentPhaseModulo: Record<number, readonly number[]> = {
      353: [0.308152893942, 0.397505461894, 0.424583762952, 0.122604037626,
        0.872903436124, 0.589447753594, 0.372079619017],
      366: [0.363996523999, 0.724630777257, 0.633100525237, 0.166411385222,
        0.902203024508, 0.792268007464, 0.567483358898],
      386: [0.458494325125, 0.001429121025, 0.985949641846, 0.240541559365,
        0.933732499422, 0.084855627945, 0.583870708963],
    };
    for (const [tickText, phases] of Object.entries(incidentPhaseModulo)) {
      const tick = Number(tickText);
      for (const [index, expected] of phases.entries()) {
        const handle = `actor-${String(index + 1).padStart(3, '0')}`;
        expect(plan[handle]![tick]!.phaseCycles % 1).toBeCloseTo(expected, 10);
      }
    }
    for (const index of [1, 2, 3, 5, 6, 7]) {
      const handle = `actor-${String(index).padStart(3, '0')}`;
      for (let tick = 0; tick <= 269; tick++) {
        expect(plan[handle]![tick]!.jogWeight).toBeGreaterThan(0.99);
      }
    }
  });
  it('starts each authored actor at its chosen phase and unknown handles at zero', () => {
    const origins: Record<string, number> = {
      'actor-001': 0.05422175745358748,
      'actor-002': 0.10823690701824873,
      'actor-003': 0.44624205514324555,
      'actor-004': 0,
      'actor-005': 0.49212363054613817,
      'actor-006': 0.9749406070383015,
      'actor-007': 0.9623639442738912,
      'actor-008': 0,
    };
    for (const [handle, origin] of Object.entries(origins)) {
      const sample = buildPublicLocomotionPlan(frames(0, handle), 60)[handle]!;
      expect(sample[0]!.phaseCycles).toBe(origin);
      expect(sample[480]!.phaseCycles).toBe(origin);
      expect(sample[0]).toMatchObject({ idleWeight: 1, walkWeight: 0, jogWeight: 0 });
    }
  });

  it('keeps distance phase increments and speed weights independent of the chosen origin', () => {
    const authored = buildPublicLocomotionPlan(frames(4, 'actor-001'), 60)['actor-001']!;
    const unknown = buildPublicLocomotionPlan(frames(4, 'actor-008'), 60)['actor-008']!;
    for (let tick = 0; tick <= 480; tick += 1) {
      expect(authored[tick]!.phaseCycles - unknown[tick]!.phaseCycles).toBeCloseTo(0.05422175745358748, 12);
      expect(authored[tick]!.idleWeight).toBe(unknown[tick]!.idleWeight);
      expect(authored[tick]!.walkWeight).toBe(unknown[tick]!.walkWeight);
      expect(authored[tick]!.jogWeight).toBe(unknown[tick]!.jogWeight);
    }
  });

  it('freezes phase and selects idle for a stationary track', () => {
    const plan = buildPublicLocomotionPlan(frames(0, 'actor-004'), 60);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan['actor-004'])).toBe(true);
    expect(Object.isFrozen(plan['actor-004']![0])).toBe(true);
    expect(plan['actor-004']![480]).toMatchObject({ phaseCycles: 0, idleWeight: 1, walkWeight: 0, jogWeight: 0 });
  });

  it('walks slowly, jogs quickly, and advances phase by distance', () => {
    const keeper = buildPublicLocomotionPlan(frames(0.6, 'actor-004'), 60)['actor-004']!;
    const runner = buildPublicLocomotionPlan(frames(4, 'actor-004'), 60)['actor-004']!;
    expect(keeper[120]!.walkWeight).toBeGreaterThan(0.99);
    expect(keeper[120]!.jogWeight).toBe(0);
    expect(runner[120]!.jogWeight).toBeGreaterThan(0.99);
    expect(runner[120]!.walkWeight).toBe(0);
    expect(keeper[480]!.phaseCycles).toBeCloseTo(4.8 / 1.23582, 3);
    expect(runner[480]!.phaseCycles).toBeCloseTo(32 / 4.90824, 3);
  });

  it('changes walk to jog smoothly and keeps a continuous phase through rests', () => {
    const source = frames(0, 'actor-004');
    for (let tick = 120; tick <= 240; tick += 1) source[tick]!.actors[0]!.position.z =
      source[tick - 1]!.actors[0]!.position.z + 4 / 60;
    for (let tick = 241; tick <= 480; tick += 1) source[tick]!.actors[0]!.position.z = source[240]!.actors[0]!.position.z;
    const samples = buildPublicLocomotionPlan(source, 60)['actor-004']!;
    expect(samples[100]!.phaseCycles).toBe(0);
    expect(samples[160]!.jogWeight).toBeGreaterThan(0.99);
    expect(samples[300]!.idleWeight).toBe(1);
    expect(samples[300]!.phaseCycles).toBe(samples[480]!.phaseCycles);
    expect(Math.max(...samples.slice(115, 126).map((sample, index, array) =>
      index ? Math.abs(sample.jogWeight - array[index - 1]!.jogWeight) : 0))).toBeLessThan(0.5);
    expect(samples.every((sample, index) => index === 0 || sample.phaseCycles >= samples[index - 1]!.phaseCycles)).toBe(true);
  });

  it('rejects missing ticks, roster changes, nonfinite tracks and invalid rate', () => {
    expect(() => buildPublicLocomotionPlan(frames(1).slice(1), 60)).toThrow();
    const changed = frames(1); changed[12]!.actors[0]!.actorHandle = 'actor-009';
    expect(() => buildPublicLocomotionPlan(changed, 60)).toThrow();
    const invalid = frames(1); invalid[20]!.actors[0]!.position.z = Number.NaN;
    expect(() => buildPublicLocomotionPlan(invalid, 60)).toThrow();
    expect(() => buildPublicLocomotionPlan(frames(1), 0)).toThrow();
  });

  it('pins legacy base weight over protected contact and fall ranges', () => {
    const attack = buildPublicLocomotionPlan(frames(2, 'actor-002'), 60)['actor-002']!;
    const defend = buildPublicLocomotionPlan(frames(2, 'actor-006'), 60)['actor-006']!;
    expect(attack[350]!.legacyBaseWeight).toBe(1);
    expect(attack[480]!.legacyBaseWeight).toBe(1);
    expect(defend[355]!.legacyBaseWeight).toBeGreaterThan(0);
    expect(defend[356]!.legacyBaseWeight).toBe(1);
    expect(defend[386]!.legacyBaseWeight).toBe(1);
    expect(defend[398]!.legacyBaseWeight).toBe(0);
  });
});
