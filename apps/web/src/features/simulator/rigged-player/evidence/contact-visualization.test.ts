import { describe, expect, it } from 'vitest';
import type { CandidateGeometrySample } from './geometry';
import { trackContactFeature, type ContactFeature } from './contact-feature';
import { buildContactVisualization } from './contact-visualization';

const p = (x: number, y = 0, z = 0) => ({ x, y, z });
const vertices = (x: number) => [
  { vertexId: 1, position: p(x, -1, -1) },
  { vertexId: 2, position: p(x, 1, -1) },
  { vertexId: 3, position: p(x, 0, 1) },
];
const mesh = (x: number) => ({ meshId: 'boot', vertices: vertices(x),
  triangles: [[1, 2, 3] as const], regions: {}, broadPhaseBounds: { min: p(-2), max: p(2) } });
function sample(actorHandle: string, tick: number, x: number): CandidateGeometrySample {
  return { actorHandle, tick, root: { position: p(10, 2, 5), yawRad: Math.PI / 2 }, meshes: [mesh(x)],
    landmarks: { headBone: p(0), torsoBone: p(0), leftAnkleBone: p(x, 0, 0), rightAnkleBone: p(0),
      groundRoot: p(0), leftBootToeSurface: { meshId: 'boot', vertexId: 1, position: p(0) },
      rightBootToeSurface: { meshId: 'boot', vertexId: 1, position: p(0) } } };
}
const topology = JSON.stringify({ meshId: 'boot', vertexIds: [1, 2, 3], triangles: [[1, 2, 3]] });
const binding = (actorHandle: string) => ({ actorHandle, meshId: 'boot', triangleId: 0,
  vertexIds: [1, 2, 3] as const, barycentric: [0.25, 0.25, 0.5] as const });
const feature: ContactFeature = { status: 'accepted', geometryIdentity: 'geometry', axis: p(0, 0, -1),
  defender: { binding: binding('def'), firstEntry: { meshId: 'boot', triangleId: 0, distanceM: 0.01, region: 'leftBoot' },
    position: p(10, 2, 4.4), boundMeshTopology: topology },
  attacker: { binding: binding('att'), firstEntry: { meshId: 'boot', triangleId: 0, distanceM: 0.01, region: 'leftShin' },
    position: p(10, 2, 3.6), boundMeshTopology: topology }, separationM: 0.8, signedSeparationM: 0.8 };
const identity = { canonicalContentHash: 'source', resourceDigest: 'resource', publicActorTimelineHash: 'timeline',
  rendererInputFingerprint: 'renderer' };
const ticks = [364, 366, 370, 371] as const;
const pairs = ticks.map((tick) => ({ defender: sample('def', tick, 0.6), attacker: sample('att', tick, 1.4) })) as
  [{ defender: CandidateGeometrySample; attacker: CandidateGeometrySample },
    { defender: CandidateGeometrySample; attacker: CandidateGeometrySample },
    { defender: CandidateGeometrySample; attacker: CandidateGeometrySample },
    { defender: CandidateGeometrySample; attacker: CandidateGeometrySample }];
const input = () => ({ feature, geometryIdentity: 'geometry', identity, samples: pairs });

describe('contact visualization sidecar', () => {
  it('exports bound world vertices and ankles once under translation and yaw, matching tracker', () => {
    const result = buildContactVisualization(input());
    expect(result.identity).toEqual({ ...identity, geometryIdentity: 'geometry' });
    expect(result.rows.map((row) => row.tick)).toEqual(ticks);
    const row = result.rows[0]!;
    expect(row.defender.vertices).toEqual([p(9, 1, 4.4), p(9, 3, 4.4), p(11, 2, 4.4)]);
    expect(row.defender.point).toEqual(p(10, 2, 4.4));
    expect(row.defender.leftAnkle).toEqual(p(10, 2, 4.4));
    expect(row.attacker.point).toEqual(p(10, 2, 3.6));
    expect(row.axis).toEqual(feature.axis);
    for (const current of result.rows) {
      const tracked = trackContactFeature({ feature, tick: current.tick, geometryIdentity: 'geometry',
        defender: pairs[ticks.indexOf(current.tick)]!.defender, attacker: pairs[ticks.indexOf(current.tick)]!.attacker });
      expect(tracked.status).toBe('tracked');
      if (tracked.status === 'tracked') {
        expect(current.defender.point).toEqual(tracked.defender);
        expect(current.attacker.point).toEqual(tracked.attacker);
        expect(current.separationM).toBeCloseTo(tracked.separationM);
        expect(current.signedSeparationM).toBeCloseTo(tracked.signedSeparationM);
      }
    }
  });

  it('rejects identity, actor, tick, triangle, vertex order, barycentric, and point disagreement', () => {
    expect(() => buildContactVisualization({ ...input(), geometryIdentity: 'wrong' })).toThrow();
    expect(() => buildContactVisualization({ ...input(), identity: { ...identity, resourceDigest: '' } })).toThrow();
    const change = (patch: Partial<CandidateGeometrySample>) => [{ ...pairs[0], defender: { ...pairs[0].defender, ...patch } },
      pairs[1], pairs[2], pairs[3]] as typeof pairs;
    expect(() => buildContactVisualization({ ...input(), samples: change({ actorHandle: 'other' }) })).toThrow();
    expect(() => buildContactVisualization({ ...input(), samples: change({ tick: 365 }) })).toThrow();
    const changedMesh = (value: CandidateGeometrySample['meshes'][number]) => change({ meshes: [value] });
    expect(() => buildContactVisualization({ ...input(), samples: changedMesh({ ...mesh(0.6), triangles: [[1, 3, 2]] }) })).toThrow();
    expect(() => buildContactVisualization({ ...input(), samples: changedMesh({ ...mesh(0.6), vertices: [vertices(0.6)[0]!, vertices(0.6)[2]!, vertices(0.6)[1]!], triangles: [[1, 3, 2]] }) })).toThrow();
    expect(() => buildContactVisualization({ ...input(), feature: { ...feature, defender: { ...feature.defender,
      binding: { ...feature.defender.binding, barycentric: [0.5, 0.25, 0.25] } } } })).toThrow();
    expect(() => buildContactVisualization({ ...input(), feature: { ...feature, defender: { ...feature.defender,
      position: p(999) } } })).toThrow();
  });

  it('keeps the accepted binding when posed patches cross and another surface is nearer', () => {
    const moved = sample('def', 370, 1.7);
    const extra = { ...mesh(0.9), meshId: 'new-near-surface' };
    const changed = [pairs[0], pairs[1], { defender: { ...moved, meshes: [...moved.meshes, extra] },
      attacker: sample('att', 370, 1.2) }, pairs[3]] as typeof pairs;
    const row = buildContactVisualization({ ...input(), samples: changed }).rows[2]!;
    expect(row.defender.meshId).toBe('boot');
    expect(row.defender.point.z).toBeCloseTo(3.3);
    expect(row.signedSeparationM).toBeCloseTo(-0.5);
  });

  it('borrows frozen samples without mutation and emits detached serializable data', () => {
    const deepFreeze = (value: unknown): void => {
      if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
      for (const child of Object.values(value)) deepFreeze(child);
      Object.freeze(value);
    };
    const frozen = input();
    const before = JSON.stringify(frozen);
    deepFreeze(frozen);
    const result = buildContactVisualization(frozen);
    expect(JSON.stringify(frozen)).toBe(before);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(result.rows[0]!.defender.vertices[0]).not.toBe(pairs[0].defender.meshes[0]!.vertices[0]!.position);
  });
});
