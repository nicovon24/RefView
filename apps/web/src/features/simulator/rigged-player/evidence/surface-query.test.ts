import { describe, expect, it } from 'vitest';
import type { CandidateGeometrySample } from './geometry';
import { castSurfaceSegment, nearestSurfacePair, type CandidateTriangleSelection } from './surface-query';

type Point = { x: number; y: number; z: number };
const p = (x: number, y: number, z: number): Point => ({ x, y, z });
const zero = p(0, 0, 0);
function sample(handle: string, vertices: readonly [number, Point][], triangles: readonly (readonly [number, number, number])[],
  root = { position: zero, yawRad: 0 }, tick = 366): CandidateGeometrySample {
  const broadPhaseBounds = { min: p(Math.min(...vertices.map(([, value]) => value.x)),
    Math.min(...vertices.map(([, value]) => value.y)), Math.min(...vertices.map(([, value]) => value.z))),
  max: p(Math.max(...vertices.map(([, value]) => value.x)),
    Math.max(...vertices.map(([, value]) => value.y)), Math.max(...vertices.map(([, value]) => value.z))) };
  return { actorHandle: handle, tick, root,
    meshes: [{ meshId: 'body', vertices: vertices.map(([vertexId, position]) => ({ vertexId, position })),
      triangles, regions: {}, broadPhaseBounds }],
    landmarks: { headBone: zero, torsoBone: zero, leftAnkleBone: zero, rightAnkleBone: zero,
      groundRoot: zero, leftBootToeSurface: { meshId: 'body', vertexId: vertices[0]![0], position: zero },
      rightBootToeSurface: { meshId: 'body', vertexId: vertices[0]![0], position: zero } } };
}
function tri(handle: string, points: readonly [Point, Point, Point], root?: { position: Point; yawRad: number }): CandidateTriangleSelection {
  return { sample: sample(handle, [[10, points[0]], [30, points[1]], [50, points[2]]], [[10, 30, 50]], root),
    meshId: 'body', triangleId: 0 };
}
const horizontal = (handle: string, y: number) => tri(handle, [p(0, y, 0), p(2, y, 0), p(0, y, 2)]);
const reconstruct = (selection: CandidateTriangleSelection, barycentric: readonly number[]) => {
  const mesh = selection.sample.meshes[0]!;
  const ids = mesh.triangles[selection.triangleId]!;
  const vertices = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
  const local = ids.map((id) => vertices.get(id)!);
  const q = p(local.reduce((sum, vertex, index) => sum + vertex.x * barycentric[index]!, 0),
    local.reduce((sum, vertex, index) => sum + vertex.y * barycentric[index]!, 0),
    local.reduce((sum, vertex, index) => sum + vertex.z * barycentric[index]!, 0));
  const c = Math.cos(selection.sample.root.yawRad); const s = Math.sin(selection.sample.root.yawRad);
  return p(q.x * c + q.z * s + selection.sample.root.position.x, q.y + selection.sample.root.position.y,
    -q.x * s + q.z * c + selection.sample.root.position.z);
};

describe('diagnostic triangle surface queries', () => {
  it('finds detached real witnesses with sparse IDs, root yaw/translation and distance equality', () => {
    const a = horizontal('actor-a', 0);
    const b = tri('actor-b', [p(0, 0, 0), p(2, 0, 0), p(0, 0, 2)],
      { position: p(2, 1, 0), yawRad: Math.PI / 2 });
    const result = nearestSurfacePair([a], [b]);
    expect(result.distance).toBeCloseTo(1, 8);
    expect(result.a.actorHandle).toBe('actor-a');
    expect(result.b.actorHandle).toBe('actor-b');
    for (const [selection, witness] of [[a, result.a], [b, result.b]] as const) {
      expect(witness.barycentric.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
      expect(witness.barycentric.every((value) => value >= -1e-8)).toBe(true);
      const rebuilt = reconstruct(selection, witness.barycentric);
      expect(witness.position.x).toBeCloseTo(rebuilt.x, 8);
      expect(witness.position.y).toBeCloseTo(rebuilt.y, 8);
      expect(witness.position.z).toBeCloseTo(rebuilt.z, 8);
    }
    expect(Math.hypot(result.a.position.x - result.b.position.x,
      result.a.position.y - result.b.position.y, result.a.position.z - result.b.position.z))
      .toBeCloseTo(result.distance, 8);
    result.a.position.x = 900;
    expect(a.sample.meshes[0]!.vertices[0]!.position.x).toBe(0);
  });

  it('finds interior, edge and crossing minima rather than relying on vertices or bounds', () => {
    const face = horizontal('face', 0);
    const point = tri('point', [p(0.5, 1, 0.5), p(0.5, 1, 0.5), p(0.5, 1, 0.5)]);
    const interior = nearestSurfacePair([face], [point]);
    expect(interior.distance).toBeCloseTo(1, 8);
    expect(interior.a.position).toEqual(p(0.5, 0, 0.5));
    const edgePoint = tri('edge-point', [p(1, 1, -0.5), p(1, 1, -0.5), p(1, 1, -0.5)]);
    const edge = nearestSurfacePair([face], [edgePoint]);
    expect(edge.distance).toBeCloseTo(Math.hypot(1, 0.5), 8);
    expect(edge.a.position).toEqual(p(1, 0, 0));
    const crossing = tri('crossing', [p(0.5, -1, 0.5), p(0.5, 1, 0.5), p(1, 0, 1)]);
    expect(nearestSurfacePair([face], [crossing]).distance).toBeCloseTo(0, 8);
    const coplanar = tri('coplanar', [p(0.25, 0, 0.25), p(0.5, 0, 0.25), p(0.25, 0, 0.5)]);
    expect(nearestSurfacePair([face], [coplanar]).distance).toBe(0);
  });

  it('keeps gaps open despite overlapping combined bounds and blocks on a real limb from either side', () => {
    const gaps = sample('gap', [[10, p(-2, 0, 0)], [20, p(-1, 0, 0)], [30, p(-1, 1, 0)],
      [40, p(1, 0, 0)], [50, p(2, 0, 0)], [60, p(1, 1, 0)]], [[10, 20, 30], [40, 50, 60]]);
    const surfaces = [0, 1].map((triangleId) => ({ sample: gaps, meshId: 'body', triangleId }));
    expect(castSurfaceSegment({ start: p(0, 0.3, -1), end: p(0, 0.3, 1), surfaces })).toBeNull();
    const limb = tri('limb', [p(-0.5, 0, 0), p(0.5, 0, 0), p(0, 1, 0)]);
    for (const [start, end] of [[p(0, 0.3, -1), p(0, 0.3, 1)],
      [p(0, 0.3, 1), p(0, 0.3, -1)]] as const) {
      const hit = castSurfaceSegment({ start, end, surfaces: [...surfaces, limb] });
      expect(hit?.witness.actorHandle).toBe('limb');
      expect(hit?.distance).toBeCloseTo(1, 8);
      expect(hit?.witness.position.x).toBeCloseTo(0, 8);
      expect(hit?.witness.position.y).toBeCloseTo(0.3, 8);
      expect(hit?.witness.position.z).toBeCloseTo(0, 8);
    }
  });

  it('enforces 1 mm endpoint exclusion, earliest coplanar overlap, tangency and zero-area non-occlusion', () => {
    const plane = tri('plane', [p(0, -1, -1), p(0, 1, -1), p(0, 0, 1)]);
    expect(castSurfaceSegment({ start: p(-0.001, 0, 0), end: p(0.999, 0, 0), surfaces: [plane] })).toBeNull();
    expect(castSurfaceSegment({ start: p(-0.0009, 0, 0), end: p(0.9991, 0, 0), surfaces: [plane] })).toBeNull();
    expect(castSurfaceSegment({ start: p(-0.002, 0, 0), end: p(0.998, 0, 0), surfaces: [plane] })?.distance)
      .toBeCloseTo(0.002, 8);
    expect(castSurfaceSegment({ start: p(-0.001, 0, 0), end: p(0.001, 0, 0), surfaces: [plane] })).toBeNull();
    const coplanar = tri('coplanar', [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)]);
    const hit = castSurfaceSegment({ start: p(-1, 0.5, 0), end: p(2, 0.5, 0), surfaces: [coplanar] });
    expect(hit?.distance).toBeCloseTo(1, 8);
    expect(hit?.witness.position.x).toBeCloseTo(0, 8);
    expect(hit?.witness.position.y).toBeCloseTo(0.5, 8);
    expect(hit?.witness.position.z).toBeCloseTo(0, 8);
    const tangent = castSurfaceSegment({ start: p(-1, 0, 0), end: p(1, 0, 0), surfaces: [coplanar] });
    expect(tangent?.distance).toBeCloseTo(1, 8);
    const insideOverlap = castSurfaceSegment({ start: p(0.2, 0.2, 0), end: p(0.8, 0.2, 0), surfaces: [coplanar] });
    expect(insideOverlap?.distance).toBeGreaterThan(0.001);
    expect(insideOverlap?.distance).toBeCloseTo(0.001, 8);
    const insideAtXPointOne = castSurfaceSegment({ start: p(0.1, 0.2, 0), end: p(0.6, 0.2, 0), surfaces: [coplanar] });
    expect(insideAtXPointOne?.distance).toBeGreaterThan(0.001);
    expect(insideAtXPointOne?.distance).toBeCloseTo(0.001, 8);
    expect(insideAtXPointOne?.witness.barycentric.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 10);
    const shortEnd = p(0.1020000005, 0.2, 0);
    const shortInside = castSurfaceSegment({ start: p(0.1, 0.2, 0), end: shortEnd, surfaces: [coplanar] });
    expect(shortInside).not.toBeNull();
    expect(shortInside!.distance).toBeGreaterThan(0.001);
    expect(shortInside!.distance).toBeLessThan(shortEnd.x - 0.1 - 0.001);
    const degenerate = tri('line', [p(0, -1, 0), p(0, 1, 0), p(0, 1, 0)]);
    expect(castSurfaceSegment({ start: p(-1, 0, 0), end: p(1, 0, 0), surfaces: [degenerate] })).toBeNull();
  });

  it('deduplicates stable reordered selections and rejects conflicting or malformed input', () => {
    const a = horizontal('a', 0); const b = horizontal('b', 1);
    const duplicate = { ...a, sample: sample('a', [[10, p(0, 0, 0)], [30, p(2, 0, 0)],
      [50, p(0, 0, 2)]], [[10, 30, 50]]) };
    expect(nearestSurfacePair([a, duplicate], [b])).toEqual(nearestSurfacePair([duplicate, a], [b]));
    const reorderedRoot = { ...a, sample: { ...a.sample,
      root: { yawRad: 0, position: { z: 0, x: 0, y: 0 } } } };
    expect(nearestSurfacePair([a, reorderedRoot], [b])).toEqual(nearestSurfacePair([a], [b]));
    expect(castSurfaceSegment({ start: p(0.1, 2, 0.1), end: p(0.1, -1, 0.1), surfaces: [b, b] }))
      .toEqual(castSurfaceSegment({ start: p(0.1, 2, 0.1), end: p(0.1, -1, 0.1), surfaces: [b] }));
    const c = horizontal('c', 1);
    expect(nearestSurfacePair([a], [c, b]).b.actorHandle).toBe('b');
    expect(nearestSurfacePair([a], [b, c])).toEqual(nearestSurfacePair([a], [c, b]));
    expect(castSurfaceSegment({ start: p(0.1, 2, 0.1), end: p(0.1, -1, 0.1), surfaces: [c, b] })?.witness.actorHandle)
      .toBe('b');
    expect(() => nearestSurfacePair([], [b])).toThrow();
    expect(() => nearestSurfacePair([a], [{ ...b, sample: { ...b.sample, tick: 365 } }])).toThrow();
    expect(() => nearestSurfacePair([a, { ...a, sample: { ...a.sample, root: { position: p(1, 0, 0), yawRad: 0 } } }], [b])).toThrow();
    expect(() => nearestSurfacePair([{ ...a, triangleId: 9 }], [b])).toThrow();
    expect(() => nearestSurfacePair([{ ...a, sample: { ...a.sample,
      meshes: [{ ...a.sample.meshes[0]!, triangles: [[10, 30, 999]] }] } }], [b])).toThrow();
    expect(() => nearestSurfacePair([{ ...a, sample: { ...a.sample,
      meshes: [{ ...a.sample.meshes[0]!, vertices: [{ vertexId: 10, position: p(NaN, 0, 0) },
        ...a.sample.meshes[0]!.vertices.slice(1)] }] } }], [b])).toThrow();
    expect(() => castSurfaceSegment({ start: p(Infinity, 0, 0), end: zero, surfaces: [] })).toThrow();
    expect(castSurfaceSegment({ start: zero, end: p(1, 0, 0), surfaces: [] })).toBeNull();
    const moved = tri('moved', [p(0, 0, 0), p(1, 0, 0), p(0, 1, 0)],
      { position: p(2, 0, 0), yawRad: Math.PI / 2 });
    expect(castSurfaceSegment({ start: p(1, 0.25, -0.25), end: p(3, 0.25, -0.25), surfaces: [moved] })?.distance)
      .toBeCloseTo(1, 8);
  });

  it('prepares each sample mesh once per query, even with multiple selected triangles', () => {
    const source = sample('cached', [[10, p(0, 0, 0)], [20, p(1, 0, 0)], [30, p(0, 1, 0)],
      [40, p(0, 0, 1)]], [[10, 20, 30], [10, 20, 40]]);
    const mesh = source.meshes[0]!;
    const vertices = mesh.vertices;
    let reads = 0;
    Object.defineProperty(mesh, 'vertices', { get: () => { reads += 1; return vertices; } });
    const surfaces = [0, 1, 0].map((triangleId) => ({ sample: source, meshId: 'body', triangleId }));
    castSurfaceSegment({ start: p(0.2, 0.2, -1), end: p(0.2, 0.2, 2), surfaces });
    expect(reads).toBe(1);
  });
});
