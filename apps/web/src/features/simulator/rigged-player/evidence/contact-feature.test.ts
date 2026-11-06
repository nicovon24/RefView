import { describe, expect, it } from 'vitest';
import type { CandidateGeometrySample } from './geometry';
import { selectContactFeature, trackContactFeature } from './contact-feature';

type Point = { x: number; y: number; z: number };
const p = (x: number, y = 0, z = 0): Point => ({ x, y, z });
const bounds = { min: p(-10, -10, -10), max: p(10, 10, 10) };
function mesh(name: string, x: number, region: 'leftBoot' | 'leftShin' | 'torso', ids: [number, number, number] = [10, 20, 30]) {
  return { meshId: `0:${name}`, vertices: [
    { vertexId: ids[0], position: p(x, -1, -1) },
    { vertexId: ids[1], position: p(x, 1, -1) },
    { vertexId: ids[2], position: p(x, 0, 1) },
  ], triangles: [ids], regions: { [region]: { triangleIds: [0], broadPhaseBounds: bounds } }, broadPhaseBounds: bounds };
}
function sample(actorHandle: string, tick: number, ankleX: number, meshes: CandidateGeometrySample['meshes'], yawRad = 0): CandidateGeometrySample {
  const ankle = p(ankleX);
  return { actorHandle, tick, root: { position: p(0), yawRad }, meshes,
    landmarks: { headBone: p(0), torsoBone: p(0), leftAnkleBone: ankle, rightAnkleBone: p(0), groundRoot: p(0),
      leftBootToeSurface: { meshId: meshes[0]?.meshId ?? 'none', vertexId: 10, position: p(0) },
      rightBootToeSurface: { meshId: meshes[0]?.meshId ?? 'none', vertexId: 10, position: p(0) } } };
}
const pair = () => ({ defender350: sample('def', 350, 0, []), attacker350: sample('att', 350, 2, []),
  defender366: sample('def', 366, 0, [mesh('SuperHero_Male', 0.4, 'leftBoot'), mesh('AuditionBoots', 0.6, 'leftBoot')]),
  attacker366: sample('att', 366, 2, [mesh('AuditionBoots', 1.4, 'leftBoot')]),
  defenderHandle: 'def', attackerHandle: 'att', geometryIdentity: 'geometry-v1' });

describe('diagnostic exterior contact feature', () => {
  it('selects first exterior shell hit before buried skin and freezes sparse vertex binding', () => {
    const input = pair(); const before = JSON.stringify(input);
    const result = selectContactFeature(input);
    expect(result.status).toBe('accepted');
    if (result.status !== 'accepted') return;
    expect(result.defender.binding).toMatchObject({ meshId: '0:AuditionBoots', vertexIds: [10, 20, 30] });
    expect(result.defender.firstEntry.distanceM).toBeCloseTo(0.01);
    expect(result.defender.position.x).toBeCloseTo(0.6);
    expect(result.attacker.position.x).toBeCloseTo(1.4);
    expect(JSON.stringify(input)).toBe(before);
    expect(selectContactFeature({ ...input, defender366: { ...input.defender366,
      meshes: [...input.defender366.meshes].reverse() } })).toEqual(result);
  });

  it('reports the actual first blocker, wrong region, and missing or degenerate surfaces', () => {
    const input = pair();
    const blocked = selectContactFeature({ ...input, defender366: sample('def', 366, 0,
      [...input.defender366.meshes, mesh('Shirt', 0.8, 'torso')]) });
    expect(blocked).toMatchObject({ status: 'failed', reason: 'defender-blocked', firstEntry: { meshId: '0:Shirt' } });
    expect(selectContactFeature({ ...input, attacker366: sample('att', 366, 2,
      [mesh('AuditionBoots', 1.4, 'torso')]) })).toMatchObject({ status: 'failed', reason: 'attacker-wrong-region' });
    expect(selectContactFeature({ ...input, defender366: sample('def', 366, 0, []) })).toMatchObject({ status: 'failed', reason: 'defender-missing' });
    const degenerate = mesh('AuditionBoots', 0.6, 'leftBoot');
    expect(selectContactFeature({ ...input, defender366: sample('def', 366, 0,
      [{ ...degenerate, vertices: degenerate.vertices.map((vertex) => ({ ...vertex, position: p(0.6) })) }]) }))
      .toMatchObject({ status: 'failed', reason: 'defender-missing' });
    expect(selectContactFeature({ ...input, defender366: sample('def', 366, 0,
      [mesh('AuditionBoots', 0.6, 'leftBoot'), mesh('DuplicateBoot', 0.6, 'leftBoot')]) }))
      .toMatchObject({ status: 'failed', reason: 'defender-ambiguous' });
  });

  it('uses world yaw, rejects a degenerate axis, and retains fixed barycentric points through new near surfaces', () => {
    const input = pair();
    expect(selectContactFeature({ ...input, attacker350: sample('att', 350, 0, []) }))
      .toMatchObject({ status: 'failed', reason: 'degenerate-axis' });
    const yawInput = { ...input,
      defender350: sample('def', 350, 0, []),
      attacker350: { ...sample('att', 350, 0, []), landmarks: { ...sample('att', 350, 0, []).landmarks,
        leftAnkleBone: p(0, 0, -2) } },
      defender366: sample('def', 366, 0, [mesh('AuditionBoots', 0.6, 'leftBoot')], Math.PI / 2),
      attacker366: sample('att', 366, 2, [mesh('AuditionBoots', 1.4, 'leftBoot')], Math.PI / 2) };
    const yawResult = selectContactFeature(yawInput);
    expect(yawResult.status).toBe('accepted');
    if (yawResult.status === 'accepted') {
      expect(yawResult.defender.position.z).toBeCloseTo(-0.6);
      expect(yawResult.attacker.position.z).toBeCloseTo(-1.4);
      expect(yawResult.signedSeparationM).toBeCloseTo(0.8);
    }
    const translated = { ...yawInput,
      defender350: { ...sample('def', 350, 0, []), root: { position: p(10, 0, 5), yawRad: Math.PI / 2 } },
      attacker350: { ...sample('att', 350, 2, []), root: { position: p(10, 0, 5), yawRad: Math.PI / 2 } },
      defender366: { ...sample('def', 366, 0, [mesh('AuditionBoots', 0.6, 'leftBoot')]),
        root: { position: p(10, 0, 5), yawRad: Math.PI / 2 } },
      attacker366: { ...sample('att', 366, 2, [mesh('AuditionBoots', 1.4, 'leftBoot')]),
        root: { position: p(10, 0, 5), yawRad: Math.PI / 2 } } };
    const translatedResult = selectContactFeature(translated);
    expect(translatedResult.status).toBe('accepted');
    if (translatedResult.status === 'accepted') {
      expect(translatedResult.axis.z).toBeCloseTo(-1);
      expect(translatedResult.defender.position.x).toBeCloseTo(10);
      expect(translatedResult.defender.position.z).toBeCloseTo(4.4);
      expect(translatedResult.attacker.position.z).toBeCloseTo(3.6);
    }
    const chosen = selectContactFeature(input);
    expect(chosen.status).toBe('accepted');
    if (chosen.status !== 'accepted') return;
    const tracked = trackContactFeature({ feature: chosen, tick: 367, geometryIdentity: 'geometry-v1',
      defender: sample('def', 367, 0, [...input.defender366.meshes,
        mesh('NewNearer', 0.9, 'leftBoot')]), attacker: sample('att', 367, 2, input.attacker366.meshes) });
    expect(tracked).toMatchObject({ status: 'tracked', defender: { x: 0.6 } });
    if (tracked.status === 'tracked') {
      expect(tracked.separationM).toBeCloseTo(0.8);
      expect(tracked.signedSeparationM).toBeCloseTo(0.8);
    }
    expect(trackContactFeature({ feature: chosen, tick: 367, geometryIdentity: 'changed',
      defender: sample('def', 367, 0, input.defender366.meshes), attacker: sample('att', 367, 2, input.attacker366.meshes) }))
      .toMatchObject({ status: 'failed', reason: 'identity-mismatch' });
    expect(trackContactFeature({ feature: chosen, tick: 367, geometryIdentity: 'geometry-v1',
      defender: sample('def', 367, 0, [mesh('AuditionBoots', 0.6, 'leftBoot', [10, 20, 31])]),
      attacker: sample('att', 367, 2, input.attacker366.meshes) })).toMatchObject({ status: 'failed', reason: 'topology-mismatch' });
    const reversed = trackContactFeature({ feature: chosen, tick: 368, geometryIdentity: 'geometry-v1',
      defender: sample('def', 368, 0, [mesh('SuperHero_Male', 0.4, 'leftBoot'),
        mesh('AuditionBoots', 1.7, 'leftBoot')]),
      attacker: sample('att', 368, 2, [mesh('AuditionBoots', 1.2, 'leftBoot')]) });
    expect(reversed.status).toBe('tracked');
    if (reversed.status === 'tracked') {
      expect(reversed.separationM).toBeCloseTo(0.5);
      expect(reversed.signedSeparationM).toBeCloseTo(-0.5);
    }
  });
});
