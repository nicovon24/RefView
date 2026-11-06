import { describe, expect, it, vi } from 'vitest';
import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import * as surface from './surface-query';
import { findExteriorContactWitness } from './contact-witness';

const p = (x: number, y = 0, z = 0) => ({ x, y, z });
function mesh(meshId: string, region: 'leftBoot' | 'leftShin', x: number, triangleCount = 1): CandidateMesh {
  const vertices = Array.from({ length: triangleCount }, (_, i) => [
    { vertexId: i * 3 + 10, position: p(x, i * 3, 0) },
    { vertexId: i * 3 + 11, position: p(x, i * 3 + 1, 0) },
    { vertexId: i * 3 + 12, position: p(x, i * 3, 1) },
  ]).flat();
  return { meshId, vertices, triangles: Array.from({ length: triangleCount }, (_, i) =>
    [i * 3 + 10, i * 3 + 11, i * 3 + 12] as const),
  regions: { [region]: { triangleIds: Array.from({ length: triangleCount }, (_, i) => i),
    broadPhaseBounds: { min: p(x), max: p(x, triangleCount * 3, 1) } } },
  broadPhaseBounds: { min: p(x), max: p(x, triangleCount * 3, 1) } };
}
function sample(actorHandle: string, meshes: CandidateMesh[], root = { position: p(0), yawRad: 0 }): CandidateGeometrySample {
  return { actorHandle, tick: 366, root, meshes, landmarks: {} as CandidateGeometrySample['landmarks'] };
}
const boots = 'model:AuditionBoots';
const body = 'model:SuperHero_Male';

describe('exterior contact witness', () => {
  it('accepts an exposed shin and an exact threshold boundary', () => {
    const d = sample('def', [mesh(boots, 'leftBoot', 0)]);
    const a = sample('att', [mesh(body, 'leftShin', 0.02)]);
    const result = findExteriorContactWitness(d, a);
    expect(result?.distance).toBeCloseTo(0.02, 9);
    expect(result?.a.meshId).toBe(boots);
    expect(result?.b.meshId).toBe(body);
    expect(findExteriorContactWitness(d, sample('att', [mesh(body, 'leftShin', 0.020001)]))).toBeNull();
  });

  it('rejects shin covered by a closer boot shell and accepts the shell itself', () => {
    const d = sample('def', [mesh(boots, 'leftBoot', 0)]);
    const a = sample('att', [mesh(body, 'leftShin', 0.015), mesh(boots, 'leftBoot', 0.01)]);
    const result = findExteriorContactWitness(d, a);
    expect(result?.b.meshId).toBe(boots);
    expect(result?.distance).toBeCloseTo(0.01, 9);
  });

  it('rejects layered coincident body and boot surfaces', () => {
    const d = sample('def', [mesh(boots, 'leftBoot', 0)]);
    const a = sample('att', [mesh(body, 'leftShin', 0.01), mesh(boots, 'leftBoot', 0.01)]);
    expect(findExteriorContactWitness(d, a)).toBeNull();
  });

  it('rejects coincident eligible and ineligible triangles inside one mesh', () => {
    const base = mesh(boots, 'leftBoot', 0);
    const layered: CandidateMesh = { ...base,
      vertices: [...base.vertices, ...base.vertices.map((vertex) => ({
        vertexId: vertex.vertexId + 3, position: { ...vertex.position } }))],
      triangles: [...base.triangles, [13, 14, 15]],
      regions: { ...base.regions, rightBoot: { triangleIds: [1], broadPhaseBounds: base.broadPhaseBounds } } };
    expect(findExteriorContactWitness(sample('def', [layered]),
      sample('att', [mesh(body, 'leftShin', 0.01)]))).toBeNull();
  });

  it('resolves a shared-edge nearest tie through a qualifying interior witness', () => {
    const base = mesh(boots, 'leftBoot', 0);
    const joined: CandidateMesh = { ...base,
      vertices: [...base.vertices, { vertexId: 13, position: p(0, 1, 1) }],
      triangles: [...base.triangles, [11, 13, 12]],
      regions: { leftBoot: { triangleIds: [0, 1], broadPhaseBounds: base.broadPhaseBounds } } };
    const attackerBase = mesh(body, 'leftShin', 0.01);
    const attacker: CandidateMesh = { ...attackerBase, vertices: [
      { vertexId: 10, position: p(0.01, 0.5, 0.5) },
      { vertexId: 11, position: p(0.01, 1, 0.5) },
      { vertexId: 12, position: p(0.01, 0.5, 1) },
    ] };
    const result = findExteriorContactWitness(sample('def', [joined]), sample('att', [attacker]));
    expect(result?.distance).toBeGreaterThanOrEqual(0.001);
    expect(result?.distance).toBeLessThanOrEqual(0.02);
    expect(result?.a.barycentric.every((weight) => weight > 0)).toBe(true);
  });

  it('resolves a covered nearest corner through an exposed interior point', () => {
    const blockerBase = mesh(body, 'leftShin', 0.002);
    const blocker: CandidateMesh = { ...blockerBase, vertices: [
      { vertexId: 10, position: p(0.002, 0, 0) },
      { vertexId: 11, position: p(0.002, 0.005, 0) },
      { vertexId: 12, position: p(0.002, 0, 0.005) },
    ] };
    const result = findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0), blocker]),
      sample('att', [mesh(body, 'leftShin', 0.01)]));
    expect(result?.a.barycentric[0]).toBeLessThan(1);
    expect(result?.distance).toBeGreaterThanOrEqual(0.001);
    expect(result?.distance).toBeLessThanOrEqual(0.02);
    expect(result?.distance).toBeCloseTo(Math.hypot(result!.a.position.x - result!.b.position.x,
      result!.a.position.y - result!.b.position.y, result!.a.position.z - result!.b.position.z), 12);
  });

  it('still rejects a blocker covering every sampled boot witness', () => {
    expect(findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0),
      mesh(body, 'leftShin', 0.002)]), sample('att', [mesh(body, 'leftShin', 0.01)]))).toBeNull();
  });

  it('resolves a shared-vertex nearest tie without accepting the tied vertex', () => {
    const base = mesh(boots, 'leftBoot', 0);
    const joined: CandidateMesh = { ...base,
      vertices: [...base.vertices, { vertexId: 13, position: p(0, -1, 0) },
        { vertexId: 14, position: p(0, 0, -1) }],
      triangles: [...base.triangles, [10, 13, 14]],
      regions: { leftBoot: { triangleIds: [0, 1], broadPhaseBounds: base.broadPhaseBounds } } };
    const result = findExteriorContactWitness(sample('def', [joined]),
      sample('att', [mesh(body, 'leftShin', 0.01)]));
    expect(result?.a.barycentric[0]).toBeLessThan(1);
    expect(result?.a.triangleId).toBe(0);
  });

  it('is invariant to sample order and world yaw/translation', () => {
    const root = { position: p(8, 2, 3), yawRad: Math.PI / 2 };
    const d = sample('def', [mesh(body, 'leftShin', -2), mesh(boots, 'leftBoot', 0)], root);
    const a = sample('att', [mesh(body, 'leftShin', 0.01), mesh(boots, 'leftBoot', 2)], root);
    const first = findExteriorContactWitness(d, a);
    const reordered = findExteriorContactWitness({ ...d, meshes: [...d.meshes].reverse() },
      { ...a, meshes: [...a.meshes].reverse() });
    expect(first).toEqual(reordered);
    expect(first?.distance).toBeCloseTo(0.01, 9);
    expect(first?.a.position).toEqual(p(8, 2, 3));
  });

  it('prunes distant triangle boxes before exact kernel calls', () => {
    const spy = vi.spyOn(surface, 'nearestSurfacePair');
    try {
      const result = findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0, 40)]),
        sample('att', [mesh(boots, 'leftBoot', 100, 40)]));
      expect(result).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); }
  });

  it('returns no witness for empty eligibility or touching and crossing points without a direction', () => {
    expect(findExteriorContactWitness(sample('def', [mesh(body, 'leftShin', 0)]),
      sample('att', [mesh(boots, 'leftBoot', 0.01)]))).toBeNull();
    expect(findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0)]),
      sample('att', [mesh(boots, 'leftBoot', 0)]))).toBeNull();
    expect(findExteriorContactWitness(sample('def', []), sample('att', [mesh(boots, 'leftBoot', 0.01)]))).toBeNull();
    const crossing = { ...mesh(boots, 'leftBoot', 0), vertices: [
      { vertexId: 10, position: p(-1, 0.25, 0.25) },
      { vertexId: 11, position: p(1, 0.25, 0.25) },
      { vertexId: 12, position: p(0, 0.75, 0.25) },
    ] };
    expect(findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0)]),
      sample('att', [crossing]))).toBeNull();
    const degenerate = { ...mesh(boots, 'leftBoot', 0.01), vertices: [
      { vertexId: 10, position: p(0.01) }, { vertexId: 11, position: p(0.01) },
      { vertexId: 12, position: p(0.01) },
    ] };
    expect(findExteriorContactWitness(sample('def', [mesh(boots, 'leftBoot', 0)]),
      sample('att', [degenerate]))).toBeNull();
  });
});
