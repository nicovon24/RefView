import { Vector3 } from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import type { CandidateGeometrySample, CandidateRegion } from './geometry';
import { nearestSurfacePair, type CandidateTriangleSelection, type SurfacePair } from './surface-query';

type Point = Readonly<{ x: number; y: number; z: number }>;
type Part = 'leftBoot' | 'leftShin';
type Limit = Readonly<{ actorHandle: string; meshId: string; triangleId: number;
  vertexId: number; position: Point; projectionM: number }>;
type PreparedPart = Readonly<{ selections: readonly CandidateTriangleSelection[]; vertices: readonly Limit[];
  topology: readonly Readonly<{ meshId: string; triangleIds: readonly number[]; vertexIds: readonly number[];
    triangles: readonly Readonly<{ triangleId: number; vertexIds: readonly [number, number, number] }>[] }>[];
  hull: ConvexHull }>;
export type SeparationPlane = Readonly<{ normal: Point; offsetM: number; gapM: number;
  defenderMaximum: Limit; attackerMinimum: Limit; source: 'hull-face' | 'hull-edge-cross' | 'historical-axis' }>;
export type PartPairSeparation = Readonly<{ defenderPart: Part; attackerPart: Part;
  status: 'separated' | 'surface-meeting' | 'uncertified';
  surface: SurfacePair; bestPlane: SeparationPlane;
  membership: Readonly<{ defender: PreparedPart['topology']; attacker: PreparedPart['topology'] }> }>;
export type ContactSeparation = Readonly<{ tick: number; defenderHandle: string; attackerHandle: string;
  pairs: readonly PartPairSeparation[]; exteriorContact: SurfacePair;
  minimumSignedCandidateGapM: number; worstVerifiedGapM: number | null;
  firstFailingPair: PartPairSeparation | null }>;
export type CertificateOnlyPair = Readonly<{ defenderPart: Part; attackerPart: Part;
  status: 'certified' | 'uncertified'; bestPlane: SeparationPlane;
  membership: Readonly<{ defender: PreparedPart['topology']; attacker: PreparedPart['topology'] }> }>;
export type ContactSeparationCertificate = Readonly<{ tick: number; defenderHandle: string; attackerHandle: string;
  status: 'certified' | 'uncertified'; pairs: readonly CertificateOnlyPair[];
  minimumSignedCandidateGapM: number; firstFailingPair: CertificateOnlyPair | null }>;

const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: Point, b: Point): Point => ({ x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const finite = (p: Point) => p && [p.x, p.y, p.z].every(Number.isFinite);
const key = (v: Limit) => `${v.actorHandle}\u0000${v.meshId}\u0000${v.triangleId.toString().padStart(9, '0')}\u0000${v.vertexId.toString().padStart(9, '0')}`;
function world(point: Point, sample: CandidateGeometrySample): Point {
  const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
  return { x: point.x * c + point.z * s + sample.root.position.x,
    y: point.y + sample.root.position.y,
    z: -point.x * s + point.z * c + sample.root.position.z };
}
function prepare(sample: CandidateGeometrySample, part: Part): PreparedPart {
  if (!sample.actorHandle || !Number.isInteger(sample.tick) || !finite(sample.root?.position) ||
    !Number.isFinite(sample.root.yawRad) || !Array.isArray(sample.meshes)) throw new TypeError('Invalid part sample');
  const selections: CandidateTriangleSelection[] = [];
  const vertices: Limit[] = [];
  const topology: Array<{ meshId: string; triangleIds: number[]; vertexIds: number[];
    triangles: Array<{ triangleId: number; vertexIds: readonly [number, number, number] }> }> = [];
  const meshIds = new Set<string>();
  const ordered: CandidateGeometrySample['meshes'][number][] = [...sample.meshes];
  for (const mesh of ordered.sort((a, b) => a.meshId.localeCompare(b.meshId))) {
    if (!mesh.meshId || meshIds.has(mesh.meshId)) throw new TypeError('Missing or duplicate mesh ID');
    meshIds.add(mesh.meshId);
    const region = mesh.regions[part as CandidateRegion];
    if (!region?.triangleIds.length) continue;
    const byId = new Map(mesh.vertices.map((v) => [v.vertexId, v.position]));
    if (byId.size !== mesh.vertices.length || mesh.vertices.some((v) => !Number.isInteger(v.vertexId) ||
      v.vertexId < 0 || !finite(v.position))) throw new TypeError('Invalid part vertices');
    const triangleIds = [...region.triangleIds].sort((a, b) => a - b);
    if (new Set(triangleIds).size !== triangleIds.length) throw new TypeError('Duplicate region triangle');
    const used = new Set<number>();
    const firstTriangle = new Map<number, number>();
    const triangles: Array<{ triangleId: number; vertexIds: readonly [number, number, number] }> = [];
    for (const triangleId of triangleIds) {
      const triangle = mesh.triangles[triangleId];
      if (!Number.isInteger(triangleId) || !triangle || triangle.length !== 3 ||
        triangle.some((id) => !Number.isInteger(id) || !byId.has(id))) throw new TypeError('Invalid part triangle');
      selections.push({ sample, meshId: mesh.meshId, triangleId });
      triangles.push({ triangleId, vertexIds: [triangle[0], triangle[1], triangle[2]] });
      for (const id of triangle) { used.add(id); if (!firstTriangle.has(id)) firstTriangle.set(id, triangleId); }
    }
    const vertexIds = [...used].sort((a, b) => a - b);
    topology.push({ meshId: mesh.meshId, triangleIds, vertexIds, triangles });
    for (const vertexId of vertexIds) vertices.push({ actorHandle: sample.actorHandle, meshId: mesh.meshId,
      triangleId: firstTriangle.get(vertexId)!, vertexId, position: world(byId.get(vertexId)!, sample), projectionM: 0 });
  }
  if (!selections.length || vertices.length < 4) throw new TypeError(`Missing complete ${part} geometry`);
  const hull = new ConvexHull().setFromPoints(vertices.map((v) => new Vector3(v.position.x, v.position.y, v.position.z)));
  if (!hull.faces.length) throw new TypeError('Degenerate part hull');
  return { selections, vertices, topology, hull };
}
function axes(hull: ConvexHull): { faces: Point[]; edges: Point[] } {
  const faces: Point[] = []; const edges: Point[] = [];
  const seen = new Set<string>();
  for (const face of hull.faces) {
    faces.push({ x: face.normal.x, y: face.normal.y, z: face.normal.z });
    let edge = face.edge;
    do {
      const a = edge.head().point; const b = edge.tail().point;
      const v = sub(a, b);
      const len = Math.hypot(v.x, v.y, v.z);
      if (len > 1e-12) {
        const unit = { x: v.x / len, y: v.y / len, z: v.z / len };
        const canonical = unit.x < -1e-12 || (Math.abs(unit.x) <= 1e-12 &&
          (unit.y < -1e-12 || (Math.abs(unit.y) <= 1e-12 && unit.z < 0)))
          ? { x: -unit.x, y: -unit.y, z: -unit.z } : unit;
        const id = [canonical.x, canonical.y, canonical.z].join(':');
        if (!seen.has(id)) { seen.add(id); edges.push(canonical); }
      }
      edge = edge.next;
    } while (edge !== face.edge);
  }
  return { faces, edges };
}
function plane(defender: PreparedPart, attacker: PreparedPart, axis: Point,
  source: SeparationPlane['source']): SeparationPlane | null {
  const len = Math.hypot(axis.x, axis.y, axis.z);
  if (!Number.isFinite(len) || len <= 1e-10) return null;
  const normal = { x: axis.x / len, y: axis.y / len, z: axis.z / len };
  const limits = (part: PreparedPart) => {
    let min: Limit | undefined; let max: Limit | undefined;
    for (const vertex of part.vertices) {
      const candidate = { ...vertex, projectionM: dot(vertex.position, normal) };
      if (!min || candidate.projectionM < min.projectionM ||
        (candidate.projectionM === min.projectionM && key(candidate) < key(min))) min = candidate;
      if (!max || candidate.projectionM > max.projectionM ||
        (candidate.projectionM === max.projectionM && key(candidate) < key(max))) max = candidate;
    }
    return { min: min!, max: max! };
  };
  const d = limits(defender); const a = limits(attacker);
  const forward = a.min.projectionM - d.max.projectionM;
  const reverse = d.min.projectionM - a.max.projectionM;
  if (reverse > forward) return { normal: { x: -normal.x, y: -normal.y, z: -normal.z },
    offsetM: -(a.max.projectionM + d.min.projectionM) / 2, gapM: reverse,
    defenderMaximum: { ...d.min, projectionM: -d.min.projectionM },
    attackerMinimum: { ...a.max, projectionM: -a.max.projectionM }, source };
  return { normal, offsetM: (d.max.projectionM + a.min.projectionM) / 2,
    gapM: forward, defenderMaximum: d.max, attackerMinimum: a.min, source };
}
function bestSeparatingPlane(defender: PreparedPart, attacker: PreparedPart,
  historicalAxis: Point): SeparationPlane {
  const da = axes(defender.hull); const aa = axes(attacker.hull);
  let best: SeparationPlane | null = null;
  const consider = (axis: Point, source: SeparationPlane['source']) => {
    const candidate = plane(defender, attacker, axis, source);
    if (candidate && (!best || candidate.gapM > best.gapM)) best = candidate;
  };
  for (const axis of [...da.faces, ...aa.faces]) consider(axis, 'hull-face');
  for (const d of da.edges) for (const a of aa.edges) consider(cross(d, a), 'hull-edge-cross');
  consider(historicalAxis, 'historical-axis');
  if (!best) throw new TypeError('No candidate separation axes');
  return best;
}
function diagnosePair(defender: PreparedPart, attacker: PreparedPart, defenderPart: Part,
  attackerPart: Part, historicalAxis: Point): PartPairSeparation {
  const bestPlane = bestSeparatingPlane(defender, attacker, historicalAxis);
  const surface = nearestSurfacePair(defender.selections, attacker.selections);
  return { defenderPart, attackerPart,
    status: bestPlane.gapM > 1e-9 ? 'separated' : surface.distance <= 1e-9 ? 'surface-meeting' : 'uncertified',
    surface, bestPlane, membership: { defender: defender.topology, attacker: attacker.topology } };
}

function preparedInput(input: Readonly<{ defender: CandidateGeometrySample; attacker: CandidateGeometrySample;
  historicalAxis: Point }>) {
  const { defender, attacker, historicalAxis } = input;
  if (defender.tick !== attacker.tick || defender.actorHandle === attacker.actorHandle ||
    !finite(historicalAxis) || Math.hypot(historicalAxis.x, historicalAxis.y, historicalAxis.z) <= 1e-10) {
    throw new TypeError('Incompatible contact samples or axis');
  }
  return { d: { leftBoot: prepare(defender, 'leftBoot'), leftShin: prepare(defender, 'leftShin') },
    a: { leftBoot: prepare(attacker, 'leftBoot'), leftShin: prepare(attacker, 'leftShin') } };
}
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value)) deepFreeze(child, seen);
    Object.freeze(value);
  }
  return value;
}

/** A sufficient 1 mm whole-part certificate. It performs no triangle-surface distance query. */
export function certifyContactSeparation(input: Readonly<{ defender: CandidateGeometrySample;
  attacker: CandidateGeometrySample; historicalAxis: Point }>): ContactSeparationCertificate {
  const { defender, attacker, historicalAxis } = input;
  const { d, a } = preparedInput(input);
  const pairs: CertificateOnlyPair[] = (['leftBoot', 'leftShin'] as const).flatMap((defenderPart) =>
    (['leftBoot', 'leftShin'] as const).map((attackerPart): CertificateOnlyPair => {
      const preparedDefender = d[defenderPart]; const preparedAttacker = a[attackerPart];
      const bestPlane = bestSeparatingPlane(preparedDefender, preparedAttacker, historicalAxis);
      return { defenderPart, attackerPart, status: bestPlane.gapM >= 0.001 ? 'certified' : 'uncertified',
        bestPlane, membership: { defender: preparedDefender.topology, attacker: preparedAttacker.topology } };
    }));
  const firstFailingPair = pairs.find((pair) => pair.status === 'uncertified') ?? null;
  return deepFreeze({ tick: defender.tick, defenderHandle: defender.actorHandle, attackerHandle: attacker.actorHandle,
    status: firstFailingPair ? 'uncertified' as const : 'certified' as const, pairs,
    minimumSignedCandidateGapM: Math.min(...pairs.map((pair) => pair.bestPlane.gapM)), firstFailingPair });
}

/** Convex-hull SAT is sufficient for nonintersection; an absent plane is inconclusive. */
export function diagnoseContactSeparation(input: Readonly<{ defender: CandidateGeometrySample;
  attacker: CandidateGeometrySample; historicalAxis: Point }>): ContactSeparation {
  const { defender, attacker, historicalAxis } = input;
  const { d, a } = preparedInput(input);
  const pairs = (['leftBoot', 'leftShin'] as const).flatMap((defenderPart) =>
    (['leftBoot', 'leftShin'] as const).map((attackerPart) =>
      diagnosePair(d[defenderPart], a[attackerPart], defenderPart, attackerPart, historicalAxis)));
  const defenderExterior = d.leftBoot.selections.filter((s) => s.meshId.endsWith(':AuditionBoots'));
  const attackerExterior = [...a.leftBoot.selections.filter((s) => s.meshId.endsWith(':AuditionBoots')),
    ...a.leftShin.selections];
  if (!defenderExterior.length || !attackerExterior.length) throw new TypeError('Missing exterior contact surfaces');
  const exteriorContact = nearestSurfacePair(defenderExterior, attackerExterior);
  return { tick: defender.tick, defenderHandle: defender.actorHandle, attackerHandle: attacker.actorHandle,
    pairs, exteriorContact, minimumSignedCandidateGapM: Math.min(...pairs.map((p) => p.bestPlane.gapM)),
    worstVerifiedGapM: pairs.every((p) => p.status === 'separated')
      ? Math.min(...pairs.map((p) => p.bestPlane.gapM)) : null,
    firstFailingPair: pairs.find((p) => p.status !== 'separated' || p.bestPlane.gapM < 0.001) ?? null };
}
