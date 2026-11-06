import type { CandidateGeometrySample } from './geometry';

type Point = { x: number; y: number; z: number };
type Barycentric = [number, number, number];
export type CandidateTriangleSelection = Readonly<{ sample: CandidateGeometrySample; meshId: string; triangleId: number }>;
export type SurfaceWitness = { actorHandle: string; tick: number; meshId: string; triangleId: number;
  barycentric: Barycentric; position: Point };
export type SurfacePair = { distance: number; a: SurfaceWitness; b: SurfaceWitness };
export type SurfaceSegmentHit = { distance: number; witness: SurfaceWitness };
export const SURFACE_ENDPOINT_EXCLUSION_M = 0.001;
// World-space plane tolerance in metres; distinct from the endpoint policy.
const PLANE_TOLERANCE_M = 1e-10;
const BARY_TOLERANCE = 1e-10;
// A cross product below this squared magnitude is treated as zero area.
const AREA_TOLERANCE_SQ = 1e-24;

type Triangle = { actorHandle: string; tick: number; meshId: string; triangleId: number;
  points: [Point, Point, Point]; signature: string };
type CandidateMesh = CandidateGeometrySample['meshes'][number];
type PreparedMesh = { mesh: CandidateMesh; verticesById: Map<number, Point> };
type QueryMeshCache = WeakMap<CandidateGeometrySample, Map<string, PreparedMesh>>;
type Closest = { point: Point; barycentric: Barycentric };
type Candidate = { a: Closest; b: Closest; distanceSq: number };

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Point, value: number): Point => ({ x: a.x * value, y: a.y * value, z: a.z * value });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Point, b: Point): Point => ({ x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const lengthSq = (a: Point) => dot(a, a);
const distanceSq = (a: Point, b: Point) => lengthSq(sub(a, b));
const mix = (a: Point, b: Point, t: number) => add(a, scale(sub(b, a), t));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function nextUpPositive(value: number): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  view.setBigUint64(0, view.getBigUint64(0) + 1n);
  return view.getFloat64(0);
}
const finitePoint = (value: Point) => value && [value.x, value.y, value.z].every(Number.isFinite);
const vertexBary = (index: number): Barycentric =>
  index === 0 ? [1, 0, 0] : index === 1 ? [0, 1, 0] : [0, 0, 1];
const weighted = (points: Triangle['points'], weights: Barycentric): Point =>
  add(add(scale(points[0], weights[0]), scale(points[1], weights[1])), scale(points[2], weights[2]));
const edgeIndices: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 0]];
function edgeBary(i: number, j: number, t: number): Barycentric {
  const result: Barycentric = [0, 0, 0]; result[i] = 1 - t; result[j] = t; return result;
}
function compareNumbers(a: number, b: number): number { return a < b ? -1 : a > b ? 1 : 0; }
function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function compareTriangle(a: Triangle, b: Triangle): number {
  return compareStrings(a.actorHandle, b.actorHandle) || compareStrings(a.meshId, b.meshId) ||
    compareNumbers(a.triangleId, b.triangleId);
}
function compareClosest(a: Closest, b: Closest): number {
  // After actor/mesh/triangle ties, order witnesses by world XYZ, then declared barycentric weights.
  for (const key of ['x', 'y', 'z'] as const) {
    const order = compareNumbers(a.point[key], b.point[key]); if (order) return order;
  }
  for (let i = 0; i < 3; i += 1) {
    const order = compareNumbers(a.barycentric[i]!, b.barycentric[i]!); if (order) return order;
  }
  return 0;
}
function compareCandidate(a: Candidate, b: Candidate): number {
  return compareNumbers(a.distanceSq, b.distanceSq) || compareClosest(a.a, b.a) || compareClosest(a.b, b.b);
}

function prepareMesh(sample: CandidateGeometrySample, meshId: string, cache: QueryMeshCache): PreparedMesh {
  let byMeshId = cache.get(sample);
  if (!byMeshId) { byMeshId = new Map(); cache.set(sample, byMeshId); }
  const cached = byMeshId.get(meshId);
  if (cached) return cached;
  if (!Array.isArray(sample.meshes)) throw new TypeError('Invalid sample meshes');
  const meshes = sample.meshes.filter((mesh: CandidateMesh) => mesh.meshId === meshId);
  if (meshes.length !== 1) throw new TypeError('Missing or duplicate mesh ID');
  const mesh = meshes[0]!;
  const verticesById = new Map<number, Point>();
  for (const vertex of mesh.vertices) {
    if (!Number.isInteger(vertex.vertexId) || vertex.vertexId < 0 || !finitePoint(vertex.position) ||
      verticesById.has(vertex.vertexId)) throw new TypeError('Invalid or duplicate vertex ID');
    verticesById.set(vertex.vertexId, vertex.position);
  }
  const prepared = { mesh, verticesById };
  byMeshId.set(meshId, prepared);
  return prepared;
}
function normalize(selections: readonly CandidateTriangleSelection[], allowEmpty: boolean, cache: QueryMeshCache): Triangle[] {
  if (!Array.isArray(selections) || (!allowEmpty && selections.length === 0)) throw new TypeError('Empty or invalid triangle selection');
  const triangles = new Map<string, Triangle>();
  let tick: number | undefined;
  for (const selection of selections) {
    const sample = selection?.sample;
    if (!sample || typeof sample.actorHandle !== 'string' || !sample.actorHandle ||
      !Number.isInteger(sample.tick) || !finitePoint(sample.root?.position) ||
      !Number.isFinite(sample.root.yawRad) || typeof selection.meshId !== 'string' || !selection.meshId ||
      !Number.isInteger(selection.triangleId) || selection.triangleId < 0) throw new TypeError('Invalid triangle selection');
    if (tick !== undefined && tick !== sample.tick) throw new TypeError('Incompatible diagnostic ticks');
    tick = sample.tick;
    const { mesh, verticesById: ids } = prepareMesh(sample, selection.meshId, cache);
    const indices = mesh.triangles[selection.triangleId];
    if (!indices || indices.length !== 3 || indices.some((id: number) => !Number.isInteger(id) || id < 0 || !ids.has(id))) {
      throw new TypeError('Invalid triangle indices');
    }
    const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
    const points = indices.map((id: number) => {
      const local = ids.get(id)!;
      return { x: local.x * c + local.z * s + sample.root.position.x,
        y: local.y + sample.root.position.y,
        z: -local.x * s + local.z * c + sample.root.position.z };
    }) as Triangle['points'];
    if (points.some((point) => !finitePoint(point))) throw new TypeError('Nonfinite world triangle');
    const key = JSON.stringify([sample.actorHandle, sample.tick, selection.meshId, selection.triangleId]);
    const local = indices.map((id: number) => ids.get(id)!);
    const signature = JSON.stringify([sample.root.position.x, sample.root.position.y, sample.root.position.z,
      sample.root.yawRad, ...indices, ...local.flatMap((position: Point) =>
        [position.x, position.y, position.z])]);
    const previous = triangles.get(key);
    if (previous) {
      if (previous.signature !== signature) throw new TypeError('Conflicting triangle definition');
      continue;
    }
    triangles.set(key, { actorHandle: sample.actorHandle, tick: sample.tick,
      meshId: selection.meshId, triangleId: selection.triangleId, points, signature });
  }
  return [...triangles.values()].sort(compareTriangle);
}
function ensureCompatible(a: readonly Triangle[], b: readonly Triangle[]): void {
  if (a[0]!.tick !== b[0]!.tick) throw new TypeError('Incompatible diagnostic ticks');
  const all = new Map<string, string>();
  for (const triangle of [...a, ...b]) {
    const key = JSON.stringify([triangle.actorHandle, triangle.tick, triangle.meshId, triangle.triangleId]);
    const prior = all.get(key);
    if (prior && prior !== triangle.signature) throw new TypeError('Conflicting triangle definition');
    all.set(key, triangle.signature);
  }
}
function witness(triangle: Triangle, closest: Closest): SurfaceWitness {
  return { actorHandle: triangle.actorHandle, tick: triangle.tick, meshId: triangle.meshId,
    triangleId: triangle.triangleId, barycentric: [...closest.barycentric], position: { ...closest.point } };
}

function triangleNormal(points: Triangle['points']): Point {
  return cross(sub(points[1], points[0]), sub(points[2], points[0]));
}
function barycentric(point: Point, points: Triangle['points'], normal: Point): Barycentric {
  const axis = Math.abs(normal.x) >= Math.abs(normal.y) && Math.abs(normal.x) >= Math.abs(normal.z)
    ? 'x' : Math.abs(normal.y) >= Math.abs(normal.z) ? 'y' : 'z';
  const keys: readonly (readonly ['x' | 'y' | 'z', 'x' | 'y' | 'z'])[] =
    axis === 'x' ? [['y', 'z']] : axis === 'y' ? [['z', 'x']] : [['x', 'y']];
  const [u, v] = keys[0]!;
  const a = points[0]; const b = points[1]; const c = points[2];
  const det = (b[u] - a[u]) * (c[v] - a[v]) - (b[v] - a[v]) * (c[u] - a[u]);
  const bWeight = ((point[u] - a[u]) * (c[v] - a[v]) - (point[v] - a[v]) * (c[u] - a[u])) / det;
  const cWeight = ((b[u] - a[u]) * (point[v] - a[v]) - (b[v] - a[v]) * (point[u] - a[u])) / det;
  return [1 - bWeight - cWeight, bWeight, cWeight];
}
function inside(weights: Barycentric): boolean { return weights.every((weight) => weight >= -BARY_TOLERANCE); }

function closestOnSegment(point: Point, a: Point, b: Point): { point: Point; t: number } {
  const vector = sub(b, a);
  const denom = lengthSq(vector);
  const t = denom === 0 ? 0 : clamp(dot(sub(point, a), vector) / denom, 0, 1);
  return { point: mix(a, b, t), t };
}
function pointTriangle(point: Point, triangle: Triangle): Closest {
  const points = triangle.points;
  const normal = triangleNormal(points);
  if (lengthSq(normal) <= AREA_TOLERANCE_SQ) {
    let best: Closest | undefined;
    for (const [i, j] of edgeIndices) {
      const closest = closestOnSegment(point, points[i]!, points[j]!);
      const candidate = { point: closest.point, barycentric: edgeBary(i, j, closest.t) };
      if (!best || distanceSq(point, candidate.point) < distanceSq(point, best.point) ||
        (distanceSq(point, candidate.point) === distanceSq(point, best.point) && compareClosest(candidate, best) < 0)) best = candidate;
    }
    return best!;
  }
  // Ericson's Voronoi-region construction keeps witnesses on the actual face.
  const [a, b, c] = points;
  const ab = sub(b, a); const ac = sub(c, a); const ap = sub(point, a);
  const d1 = dot(ab, ap); const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { point: { ...a }, barycentric: [1, 0, 0] };
  const bp = sub(point, b); const d3 = dot(ab, bp); const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return { point: { ...b }, barycentric: [0, 1, 0] };
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const t = d1 / (d1 - d3); return { point: mix(a, b, t), barycentric: [1 - t, t, 0] };
  }
  const cp = sub(point, c); const d5 = dot(ab, cp); const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return { point: { ...c }, barycentric: [0, 0, 1] };
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const t = d2 / (d2 - d6); return { point: mix(a, c, t), barycentric: [1 - t, 0, t] };
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const t = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    return { point: mix(b, c, t), barycentric: [0, 1 - t, t] };
  }
  const denom = 1 / (va + vb + vc);
  const v = vb * denom; const w = vc * denom;
  const weights: Barycentric = [1 - v - w, v, w];
  return { point: weighted(points, weights), barycentric: weights };
}
function closestSegments(a0: Point, a1: Point, b0: Point, b1: Point): { ta: number; tb: number } {
  const u = sub(a1, a0); const v = sub(b1, b0); const w = sub(a0, b0);
  const aa = dot(u, u); const bb = dot(v, v); const ab = dot(u, v);
  const aw = dot(u, w); const bw = dot(v, w);
  if (aa === 0 && bb === 0) return { ta: 0, tb: 0 };
  if (aa === 0) return { ta: 0, tb: clamp(bw / bb, 0, 1) };
  if (bb === 0) return { ta: clamp(-aw / aa, 0, 1), tb: 0 };
  const denominator = aa * bb - ab * ab;
  let ta = denominator > 0 ? clamp((ab * bw - bb * aw) / denominator, 0, 1) : 0;
  let tb = (ab * ta + bw) / bb;
  if (tb < 0) { tb = 0; ta = clamp(-aw / aa, 0, 1); }
  else if (tb > 1) { tb = 1; ta = clamp((ab - aw) / aa, 0, 1); }
  return { ta, tb };
}

type Intersection = { t: number; closest: Closest };
function segmentTriangle(start: Point, end: Point, triangle: Triangle,
  interior?: Readonly<{ minT: number; maxT: number }>): Intersection | null {
  const points = triangle.points;
  const normal = triangleNormal(points);
  const normalLengthSq = lengthSq(normal);
  if (normalLengthSq <= AREA_TOLERANCE_SQ) return null;
  const direction = sub(end, start);
  const denom = dot(normal, direction);
  const planeStart = dot(normal, sub(start, points[0]));
  const planeEnd = dot(normal, sub(end, points[0]));
  const planeTolerance = PLANE_TOLERANCE_M * Math.sqrt(normalLengthSq);
  if (Math.abs(denom) <= planeTolerance) {
    if (Math.abs(planeStart) > planeTolerance || Math.abs(planeEnd) > planeTolerance) return null;
    const startWeights = barycentric(start, points, normal);
    const endWeights = barycentric(end, points, normal);
    let low = 0; let high = 1;
    for (let i = 0; i < 3; i += 1) {
      const initial = startWeights[i]!;
      const delta = endWeights[i]! - initial;
      if (delta === 0) { if (initial < -BARY_TOLERANCE) return null; continue; }
      const boundary = -initial / delta;
      if (delta > 0) low = Math.max(low, boundary);
      else high = Math.min(high, boundary);
    }
    if (low > high + BARY_TOLERANCE || high < 0 || low > 1) return null;
    const minimum = interior?.minT ?? 0; const maximum = interior?.maxT ?? 1;
    let t = Math.max(low, minimum);
    // The exclusion interval is open; use the next floating-point parameter inside it.
    if (interior && t <= minimum) t = nextUpPositive(minimum);
    if (t > high || t >= maximum) return null;
    const weights = barycentric(mix(start, end, t), points, normal);
    return { t, closest: { point: weighted(points, weights), barycentric: weights } };
  }
  const t = -planeStart / denom;
  if (t < 0 || t > 1) return null;
  const weights = barycentric(mix(start, end, t), points, normal);
  if (!inside(weights)) return null;
  return { t, closest: { point: weighted(points, weights), barycentric: weights } };
}
function trianglePair(a: Triangle, b: Triangle): Candidate {
  let best: Candidate | undefined;
  const consider = (first: Closest, second: Closest) => {
    const candidate = { a: first, b: second, distanceSq: distanceSq(first.point, second.point) };
    if (!Number.isFinite(candidate.distanceSq)) throw new TypeError('Surface distance overflow');
    if (!best || compareCandidate(candidate, best) < 0) best = candidate;
  };
  for (let i = 0; i < 3; i += 1) {
    consider({ point: { ...a.points[i]! }, barycentric: vertexBary(i) }, pointTriangle(a.points[i]!, b));
    consider(pointTriangle(b.points[i]!, a), { point: { ...b.points[i]! }, barycentric: vertexBary(i) });
  }
  for (const [ai, aj] of edgeIndices) {
    const start = a.points[ai]!; const end = a.points[aj]!;
    const crossing = segmentTriangle(start, end, b);
    if (crossing) {
      const first = { point: mix(start, end, crossing.t), barycentric: edgeBary(ai, aj, crossing.t) };
      consider(first, crossing.closest);
    }
    for (const [bi, bj] of edgeIndices) {
      const closest = closestSegments(start, end, b.points[bi]!, b.points[bj]!);
      consider({ point: mix(start, end, closest.ta), barycentric: edgeBary(ai, aj, closest.ta) },
        { point: mix(b.points[bi]!, b.points[bj]!, closest.tb), barycentric: edgeBary(bi, bj, closest.tb) });
    }
  }
  for (const [bi, bj] of edgeIndices) {
    const start = b.points[bi]!; const end = b.points[bj]!;
    const crossing = segmentTriangle(start, end, a);
    if (crossing) {
      const second = { point: mix(start, end, crossing.t), barycentric: edgeBary(bi, bj, crossing.t) };
      consider(crossing.closest, second);
    }
  }
  return best!;
}

export function nearestSurfacePair(a: readonly CandidateTriangleSelection[], b: readonly CandidateTriangleSelection[]): SurfacePair {
  const cache: QueryMeshCache = new WeakMap();
  const first = normalize(a, false, cache); const second = normalize(b, false, cache);
  ensureCompatible(first, second);
  let best: { pair: Candidate; a: Triangle; b: Triangle } | undefined;
  for (const left of first) for (const right of second) {
    const pair = trianglePair(left, right);
    if (!best || compareNumbers(pair.distanceSq, best.pair.distanceSq) < 0 ||
      (pair.distanceSq === best.pair.distanceSq &&
        (compareTriangle(left, best.a) < 0 || (compareTriangle(left, best.a) === 0 && compareTriangle(right, best.b) < 0)))) {
      best = { pair, a: left, b: right };
    }
  }
  return { distance: Math.sqrt(best!.pair.distanceSq), a: witness(best!.a, best!.pair.a),
    b: witness(best!.b, best!.pair.b) };
}

export function castSurfaceSegment({ start, end, surfaces }: {
  start: Readonly<Point>; end: Readonly<Point>; surfaces: readonly CandidateTriangleSelection[];
}): SurfaceSegmentHit | null {
  if (!finitePoint(start) || !finitePoint(end)) throw new TypeError('Nonfinite surface segment endpoint');
  const triangles = normalize(surfaces, true, new WeakMap());
  const length = Math.sqrt(distanceSq(start, end));
  if (!Number.isFinite(length)) throw new TypeError('Surface segment length overflow');
  if (length <= 2 * SURFACE_ENDPOINT_EXCLUSION_M || triangles.length === 0) return null;
  const minT = SURFACE_ENDPOINT_EXCLUSION_M / length;
  const maxT = 1 - minT;
  let best: { hit: Intersection; triangle: Triangle; distance: number } | undefined;
  for (const triangle of triangles) {
    const hit = segmentTriangle(start, end, triangle, { minT, maxT });
    if (!hit || hit.t <= minT || hit.t >= maxT) continue;
    const distance = Math.sqrt(distanceSq(start, hit.closest.point));
    if (!best || distance < best.distance || (distance === best.distance && compareTriangle(triangle, best.triangle) < 0)) {
      best = { hit, triangle, distance };
    }
  }
  return best ? { distance: best.distance, witness: witness(best.triangle, best.hit.closest) } : null;
}
