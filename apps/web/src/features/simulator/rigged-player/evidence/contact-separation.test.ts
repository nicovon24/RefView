import { describe, expect, it, vi } from 'vitest';
import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import { certifyContactSeparation, diagnoseContactSeparation } from './contact-separation';

const exactCalls = vi.hoisted(() => ({ count: 0, forbid: false }));
vi.mock('./surface-query', async (importOriginal) => {
  const original = await importOriginal<typeof import('./surface-query')>();
  return { ...original, nearestSurfacePair: (...args: Parameters<typeof original.nearestSurfacePair>) => {
    exactCalls.count += 1;
    if (exactCalls.forbid) throw new Error('Exact triangle-distance call forbidden in certificate-only query');
    return original.nearestSurfacePair(...args);
  } };
});

const p = (x: number, y = 0, z = 0) => ({ x, y, z });
const boxTriangles: [number, number, number][] = [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
  [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]];
function box(meshId: string, region: 'leftBoot' | 'leftShin', center: ReturnType<typeof p>, radius = 0.4): CandidateMesh {
  const offsets = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const points = offsets.map(([x, y, z]) => p(center.x + x! * radius, center.y + y! * radius, center.z + z! * radius));
  const bounds = { min: p(center.x - radius, center.y - radius, center.z - radius),
    max: p(center.x + radius, center.y + radius, center.z + radius) };
  return { meshId, vertices: points.map((position, vertexId) => ({ vertexId, position })),
    triangles: boxTriangles, regions: { [region]: { triangleIds: boxTriangles.map((_, i) => i), broadPhaseBounds: bounds } },
    broadPhaseBounds: bounds };
}
function sample(actorHandle: string, meshes: CandidateMesh[], rootPosition = p(0), yawRad = 0): CandidateGeometrySample {
  return { actorHandle, tick: 366, root: { position: rootPosition, yawRad }, meshes,
    landmarks: { headBone: p(0), torsoBone: p(0), leftAnkleBone: p(0), rightAnkleBone: p(0),
      groundRoot: p(0), leftBootToeSurface: { meshId: meshes[0]!.meshId, vertexId: 0, position: p(0) },
      rightBootToeSurface: { meshId: meshes[0]!.meshId, vertexId: 0, position: p(0) } } };
}
function fixture(attackerBootY = 5, defenderBootRadius = 0.4, attackerBootRadius = 0.4) {
  return { defender: sample('def', [box('0:AuditionBoots', 'leftBoot', p(0), defenderBootRadius),
    box('1:Body', 'leftBoot', p(0), defenderBootRadius), box('2:Body', 'leftShin', p(0, 2))]),
  attacker: sample('att', [box('0:AuditionBoots', 'leftBoot', p(0, attackerBootY), attackerBootRadius),
    box('1:Body', 'leftShin', p(0, 7))]), historicalAxis: p(1) };
}

describe('whole-part contact separation', () => {
  it('reports certified and failing four-pair gates with no exact surface queries', () => {
    exactCalls.count = 0; exactCalls.forbid = true;
    try {
      const good = certifyContactSeparation(fixture());
      expect(good.status).toBe('certified');
      expect(good.pairs).toHaveLength(4);
      expect(good.pairs.every((pair) => pair.status === 'certified')).toBe(true);
      expect(good.minimumSignedCandidateGapM).toBe(Math.min(...good.pairs.map((pair) => pair.bestPlane.gapM)));
      expect(good.firstFailingPair).toBeNull();
      expect(Object.isFrozen(good)).toBe(true);
      expect(Object.isFrozen(good.pairs[0]!.membership.defender[0]!.triangles)).toBe(true);
      const bad = certifyContactSeparation(fixture(0));
      expect(bad.status).toBe('uncertified');
      expect(bad.minimumSignedCandidateGapM).toBeLessThan(0);
      expect(bad.firstFailingPair).toBe(bad.pairs[0]);
      expect('surface' in bad.pairs[0]!).toBe(false);
      expect(exactCalls.count).toBe(0);
    } finally { exactCalls.forbid = false; }
  });

  it('applies the 1 mm gate at its boundary and preserves deterministic topology identity', () => {
    const f = fixture(0.801);
    const first = certifyContactSeparation(f);
    expect(first.pairs[0]!.bestPlane.gapM).toBeCloseTo(0.001, 12);
    expect(first.pairs[0]!.status).toBe('certified');
    expect(certifyContactSeparation(f)).toEqual(first);
    const below = certifyContactSeparation(fixture(0.8009));
    expect(below.pairs[0]!.status).toBe('uncertified');
    expect(below.firstFailingPair).toBe(below.pairs[0]);
  });
  it('certifies four disjoint pairs on hull axes when the historical axis fails, including every carrying mesh', () => {
    const result = diagnoseContactSeparation(fixture());
    expect(result.pairs.map((pair) => pair.status)).toEqual(Array(4).fill('separated'));
    expect(result.worstVerifiedGapM).toBeGreaterThan(1);
    expect(result.minimumSignedCandidateGapM).toBe(result.worstVerifiedGapM);
    expect(result.firstFailingPair).toBeNull();
    expect(result.pairs[0]!.membership.defender.map((m) => m.meshId)).toEqual(['0:AuditionBoots', '1:Body']);
    expect(result.pairs[0]!.bestPlane.defenderMaximum).toMatchObject({ actorHandle: 'def', vertexId: expect.any(Number),
      triangleId: expect.any(Number) });
    expect(result.pairs[0]!.surface.distance).toBeGreaterThan(0);
  });

  it('distinguishes crossing and tangent surfaces from positive-gap certificates', () => {
    const crossing = diagnoseContactSeparation(fixture(0));
    expect(crossing.pairs[0]!.status).toBe('surface-meeting');
    expect(crossing.pairs[0]!.surface.distance).toBe(0);
    expect(crossing.worstVerifiedGapM).toBeNull();
    expect(crossing.minimumSignedCandidateGapM).toBe(Math.min(...crossing.pairs.map((pair) => pair.bestPlane.gapM)));
    expect(crossing.minimumSignedCandidateGapM).toBeLessThan(0);
    expect(crossing.firstFailingPair).toBe(crossing.pairs[0]);
    const tangent = diagnoseContactSeparation(fixture(0.8));
    expect(tangent.pairs[0]!.status).toBe('surface-meeting');
    expect(tangent.pairs[0]!.bestPlane.gapM).toBeCloseTo(0);
  });

  it('reports containment as uncertified despite positive triangle-surface distance', () => {
    const contained = diagnoseContactSeparation(fixture(0, 2, 0.2));
    expect(contained.pairs[0]!.status).toBe('uncertified');
    expect(contained.pairs[0]!.surface.distance).toBeGreaterThan(0);
    expect(contained.pairs[0]!.bestPlane.gapM).toBeLessThan(0);
    expect(contained.minimumSignedCandidateGapM).toBe(Math.min(...contained.pairs.map((pair) => pair.bestPlane.gapM)));
    expect(contained.worstVerifiedGapM).toBeNull();
  });

  it('records triangle connectivity as topology identity even when membership IDs stay unchanged', () => {
    const f = fixture();
    const original = f.defender.meshes[0]!;
    const triangles = original.triangles.map((triangle, triangleId) =>
      triangleId === 0 ? [0, 1, 3] as [number, number, number] : triangle);
    const changed = { ...original, triangles };
    const altered = { ...f, defender: sample('def', [changed, ...f.defender.meshes.slice(1)]) };
    const before = diagnoseContactSeparation(f).pairs[0]!.membership.defender[0]!;
    const after = diagnoseContactSeparation(altered).pairs[0]!.membership.defender[0]!;
    expect(after.meshId).toBe(before.meshId);
    expect(after.triangleIds).toEqual(before.triangleIds);
    expect(after.vertexIds).toEqual(before.vertexIds);
    expect(after.triangles).not.toEqual(before.triangles);
    expect(after.triangles[0]).toEqual({ triangleId: 0, vertexIds: [0, 1, 3] });
  });

  it('keeps parts separate rather than evaluating a combined boot/shin hull', () => {
    const f = fixture(1);
    const result = diagnoseContactSeparation({ ...f,
      attacker: sample('att', [f.attacker.meshes[0]!, box('1:Body', 'leftShin', p(0, 5))]) });
    expect(result.pairs[0]!.status).toBe('separated');
    expect(result.pairs[2]!.status).toBe('separated');
  });

  it('verifies transformed original vertices and produces stable limiting witnesses', () => {
    const f = fixture();
    const rotated = { ...f, attacker: sample('att', f.attacker.meshes as CandidateMesh[], p(0, 0, 0), Math.PI / 2) };
    const first = diagnoseContactSeparation(rotated);
    expect(diagnoseContactSeparation(rotated)).toEqual(first);
    expect(first.pairs[0]!.bestPlane.gapM).toBeGreaterThan(0);
    const tampered = fixture();
    const original = tampered.attacker.meshes[0]!;
    const changed = { ...original, vertices: original.vertices.map((v) =>
      v.vertexId === 6 ? { ...v, position: p(0, 0, 0) } : v) };
    const altered = { ...tampered, attacker: sample('att', [changed, tampered.attacker.meshes[1]!]) };
    expect(diagnoseContactSeparation(altered).pairs[0]!.bestPlane.gapM).toBeLessThan(first.pairs[0]!.bestPlane.gapM);
  });

  it('rejects incompatible identity and duplicate topology IDs', () => {
    const f = fixture();
    expect(() => diagnoseContactSeparation({ ...f, attacker: sample('def', f.attacker.meshes as CandidateMesh[]) })).toThrow();
    expect(() => diagnoseContactSeparation({ ...f, attacker: { ...f.attacker, tick: 365 } })).toThrow();
    const duplicate = fixture();
    expect(() => diagnoseContactSeparation({ ...duplicate,
      defender: sample('def', [duplicate.defender.meshes[0]!, duplicate.defender.meshes[0]!,
        duplicate.defender.meshes[2]!]) })).toThrow(/duplicate mesh/i);
  });
});
