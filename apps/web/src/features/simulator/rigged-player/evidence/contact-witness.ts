import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import { castSurfaceSegment, nearestSurfacePair,
  type CandidateTriangleSelection, type SurfacePair, type SurfaceWitness } from './surface-query';

type Point = Readonly<{ x: number; y: number; z: number }>;
type Box = Readonly<{ min: Point; max: Point }>;
type Leaf = Readonly<{ selection: CandidateTriangleSelection; box: Box; center: Point }>;
type Node = Readonly<{ box: Box; count: number; children?: readonly [Node, Node]; leaves?: readonly Leaf[] }>;
type Owner = Readonly<{ sample: CandidateGeometrySample; meshes: readonly Readonly<{
  mesh: CandidateMesh; selections: readonly CandidateTriangleSelection[] }>[]; vertices: readonly Point[] }>;
const KERNEL_TOLERANCE_M = 1e-9;
const HIT_TOLERANCE_M = 1e-6;
const OUTSIDE_MARGIN_M = 0.004;
const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a: Point, n: number): Point => ({ x: a.x * n, y: a.y * n, z: a.z * n });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const separation = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const valid = (p: Point) => p && [p.x, p.y, p.z].every(Number.isFinite);
function world(local: Point, sample: CandidateGeometrySample): Point {
  const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
  return { x: local.x * c + local.z * s + sample.root.position.x,
    y: local.y + sample.root.position.y, z: -local.x * s + local.z * c + sample.root.position.z };
}
function box(points: readonly Point[]): Box {
  return { min: { x: Math.min(...points.map((p) => p.x)), y: Math.min(...points.map((p) => p.y)),
    z: Math.min(...points.map((p) => p.z)) },
  max: { x: Math.max(...points.map((p) => p.x)), y: Math.max(...points.map((p) => p.y)),
    z: Math.max(...points.map((p) => p.z)) } };
}
function union(a: Box, b: Box): Box {
  return { min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z) },
    max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z) } };
}
function boxDistance(a: Box, b: Box): number {
  const gap = (axis: 'x' | 'y' | 'z') => Math.max(0, a.min[axis] - b.max[axis], b.min[axis] - a.max[axis]);
  return Math.hypot(gap('x'), gap('y'), gap('z'));
}
function prepare(sample: CandidateGeometrySample): Owner {
  if (!sample.actorHandle || !Number.isInteger(sample.tick) || !valid(sample.root?.position) ||
    !Number.isFinite(sample.root.yawRad) || !Array.isArray(sample.meshes)) throw new TypeError('Invalid contact sample');
  const ids = new Set<string>(); const vertices: Point[] = [];
  const ordered: CandidateMesh[] = [...sample.meshes];
  const meshes = ordered.sort((a, b) => cmp(a.meshId, b.meshId)).map((mesh) => {
    if (!mesh.meshId || ids.has(mesh.meshId) || !Array.isArray(mesh.vertices) || !Array.isArray(mesh.triangles))
      throw new TypeError('Invalid or duplicate contact mesh');
    ids.add(mesh.meshId);
    const byId = new Map<number, Point>();
    for (const vertex of mesh.vertices) {
      if (!Number.isInteger(vertex.vertexId) || vertex.vertexId < 0 || !valid(vertex.position) || byId.has(vertex.vertexId))
        throw new TypeError('Invalid contact vertex');
      const point = world(vertex.position, sample);
      if (!valid(point)) throw new TypeError('Nonfinite contact vertex');
      byId.set(vertex.vertexId, point); vertices.push(point);
    }
    const selections = mesh.triangles.map((triangle, triangleId) => {
      if (triangle.length !== 3 || triangle.some((id: number) => !Number.isInteger(id) || !byId.has(id)))
        throw new TypeError('Invalid contact triangle');
      return { sample, meshId: mesh.meshId, triangleId };
    });
    for (const region of Object.values(mesh.regions) as Array<{ triangleIds: readonly number[] } | undefined>)
      for (const id of region?.triangleIds ?? []) {
      if (!Number.isInteger(id) || id < 0 || id >= selections.length) throw new TypeError('Invalid contact region');
    }
    return { mesh, selections };
  });
  return { sample, meshes, vertices };
}
function eligible(owner: Owner, role: 'defender' | 'attacker'): Leaf[] {
  const result: Leaf[] = [];
  for (const { mesh, selections } of owner.meshes) {
    const boot = mesh.meshId.endsWith(':AuditionBoots');
    const body = mesh.meshId.endsWith(':SuperHero_Male');
    const ids = new Set<number>([
      ...(boot ? mesh.regions.leftBoot?.triangleIds ?? [] : []),
      ...(role === 'attacker' && body ? mesh.regions.leftShin?.triangleIds ?? [] : []),
    ]);
    if (!ids.size) continue;
    const byId = new Map(mesh.vertices.map((v) => [v.vertexId, world(v.position, owner.sample)]));
    for (const triangleId of [...ids].sort((a, b) => a - b)) {
      const points = mesh.triangles[triangleId]!.map((id) => byId.get(id)!);
      const bounds = box(points);
      result.push({ selection: selections[triangleId]!, box: bounds,
        center: mul(add(bounds.min, bounds.max), 0.5) });
    }
  }
  return result;
}
function tree(leaves: readonly Leaf[]): Node {
  const bounds = leaves.slice(1).reduce((current, leaf) => union(current, leaf.box), leaves[0]!.box);
  if (leaves.length <= 8) return { box: bounds, count: leaves.length, leaves };
  const extent = sub(bounds.max, bounds.min);
  const axis = extent.x >= extent.y && extent.x >= extent.z ? 'x' : extent.y >= extent.z ? 'y' : 'z';
  const sorted = [...leaves].sort((a, b) => a.center[axis] - b.center[axis] ||
    cmp(a.selection.meshId, b.selection.meshId) || a.selection.triangleId - b.selection.triangleId);
  const middle = Math.floor(sorted.length / 2);
  return { box: bounds, count: leaves.length, children: [tree(sorted.slice(0, middle)), tree(sorted.slice(middle))] };
}
function sameMeshFirstHitIsUnambiguous(owner: Owner, mesh: CandidateMesh,
  selections: readonly CandidateTriangleSelection[], first: { triangleId: number; distance: number; position: Point },
  start: Point, end: Point): boolean {
  const vertices = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, world(vertex.position, owner.sample)]));
  for (const selection of selections) {
    if (selection.triangleId === first.triangleId) continue;
    const indices = mesh.triangles[selection.triangleId]!;
    const bounds = box(indices.map((id) => vertices.get(id)!));
    if (['x', 'y', 'z'].some((axis) => first.position[axis as keyof Point] < bounds.min[axis as keyof Point] - HIT_TOLERANCE_M ||
      first.position[axis as keyof Point] > bounds.max[axis as keyof Point] + HIT_TOLERANCE_M)) continue;
    const hit = castSurfaceSegment({ start, end, surfaces: [selection] });
    if (!hit || Math.abs(hit.distance - first.distance) > HIT_TOLERANCE_M ||
      separation(hit.witness.position, first.position) > HIT_TOLERANCE_M) continue;
    // Distinct first-hit triangle identities are ambiguous even at a shared edge.
    return false;
  }
  return true;
}
function firstExterior(owner: Owner, proposed: SurfaceWitness, direction: Point, outsideSign: 1 | -1): boolean {
  if (!owner.vertices.length) return false;
  const projection = dot(proposed.position, direction);
  const extreme = owner.vertices.reduce((value, point) => outsideSign === 1
    ? Math.max(value, dot(point, direction)) : Math.min(value, dot(point, direction)),
  outsideSign === 1 ? -Infinity : Infinity);
  const start = add(proposed.position, mul(direction, extreme - projection + outsideSign * OUTSIDE_MARGIN_M));
  const end = sub(proposed.position, mul(direction, outsideSign * OUTSIDE_MARGIN_M));
  let first: { meshId: string; triangleId: number; distance: number; position: Point } | null = null;
  const hits: { meshId: string; triangleId: number; distance: number; position: Point }[] = [];
  for (const { mesh, selections } of owner.meshes) {
    const hit = castSurfaceSegment({ start, end, surfaces: selections });
    if (!hit) continue;
    const entry = { meshId: mesh.meshId, triangleId: hit.witness.triangleId,
      distance: hit.distance, position: hit.witness.position };
    hits.push(entry);
    if (!first || entry.distance < first.distance) first = entry;
  }
  if (!first || first.meshId !== proposed.meshId ||
    separation(first.position, proposed.position) > HIT_TOLERANCE_M) return false;
  if (hits.some((hit) => hit.meshId !== first!.meshId &&
    Math.abs(hit.distance - first!.distance) <= HIT_TOLERANCE_M)) return false;
  const entry = owner.meshes.find((item) => item.mesh.meshId === first!.meshId)!;
  const mesh = entry.mesh;
  const regionIds = mesh.meshId.endsWith(':AuditionBoots') ? mesh.regions.leftBoot?.triangleIds : mesh.regions.leftShin?.triangleIds;
  return !!regionIds?.includes(first.triangleId) &&
    sameMeshFirstHitIsUnambiguous(owner, mesh, entry.selections, first, start, end);
}

function interiorProbe(owner: Owner, witness: SurfaceWitness, fraction: number): SurfaceWitness {
  if (fraction === 0) return witness;
  const mesh = owner.meshes.find((entry) => entry.mesh.meshId === witness.meshId)?.mesh;
  const indices = mesh?.triangles[witness.triangleId];
  if (!mesh || !indices) throw new TypeError('Missing probe triangle');
  const vertices = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
  const barycentric = witness.barycentric.map((weight) => weight * (1 - fraction) + fraction / 3) as
    [number, number, number];
  const local = indices.reduce<Point>((position, id, index) =>
    add(position, mul(vertices.get(id)!, barycentric[index]!)), { x: 0, y: 0, z: 0 });
  return { ...witness, barycentric, position: world(local, owner.sample) };
}

/** Threshold search over exact nearest witnesses for eligible triangle pairs.
 * Null conservatively means no examined nearest or finite interior witness was certified exterior;
 * another point on a pair can remain unexamined.
 */
export function findExteriorContactWitness(defender: CandidateGeometrySample, attacker: CandidateGeometrySample,
  maxDistanceM = 0.02): SurfacePair | null {
  if (!Number.isFinite(maxDistanceM) || maxDistanceM < 0 || defender.tick !== attacker.tick ||
    defender.actorHandle === attacker.actorHandle) throw new TypeError('Invalid contact threshold or owners');
  const d = prepare(defender); const a = prepare(attacker);
  const left = eligible(d, 'defender'); const right = eligible(a, 'attacker');
  if (!left.length || !right.length) return null;
  const candidates: SurfacePair[] = [];
  const visit = (first: Node, second: Node): void => {
    if (boxDistance(first.box, second.box) > maxDistanceM + KERNEL_TOLERANCE_M) return;
    if (first.leaves && second.leaves) {
      for (const x of first.leaves) for (const y of second.leaves) {
        if (boxDistance(x.box, y.box) > maxDistanceM + KERNEL_TOLERANCE_M) continue;
        const pair = nearestSurfacePair([x.selection], [y.selection]);
        if (pair.distance <= maxDistanceM + KERNEL_TOLERANCE_M) candidates.push(pair);
      }
      return;
    }
    if (first.children && (!second.children || first.count >= second.count)) {
      visit(first.children[0], second); visit(first.children[1], second);
    } else if (second.children) {
      visit(first, second.children[0]); visit(first, second.children[1]);
    }
  };
  visit(tree(left), tree(right));
  candidates.sort((x, y) => x.distance - y.distance || cmp(x.a.meshId, y.a.meshId) ||
    x.a.triangleId - y.a.triangleId || cmp(x.b.meshId, y.b.meshId) || x.b.triangleId - y.b.triangleId);
  const probeFractions: readonly (readonly [number, number])[] = [[0, 0],
    [0.001, 0], [0, 0.001], [0.001, 0.001],
    [0.01, 0], [0, 0.01], [0.01, 0.01],
    [0.05, 0], [0, 0.05], [0.05, 0.05]];
  for (const pair of candidates) for (const [leftFraction, rightFraction] of probeFractions) {
    const leftWitness = interiorProbe(d, pair.a, leftFraction);
    const rightWitness = interiorProbe(a, pair.b, rightFraction);
    const delta = sub(rightWitness.position, leftWitness.position);
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    if (distance < 0.001 || distance > maxDistanceM || distance > 0.02) continue;
    const direction = mul(delta, 1 / distance);
    if (firstExterior(d, leftWitness, direction, 1) && firstExterior(a, rightWitness, direction, -1))
      return { distance, a: leftWitness, b: rightWitness };
  }
  return null;
}
