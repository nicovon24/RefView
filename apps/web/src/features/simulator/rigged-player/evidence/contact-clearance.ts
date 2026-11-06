import type { CandidateGeometrySample } from './geometry';
import { nearestSurfacePair, type CandidateTriangleSelection, type SurfacePair } from './surface-query';

type Point = Readonly<{ x: number; y: number; z: number }>;
type Limit = Readonly<{ actorHandle: string; meshId: string; triangleId: number; vertexId: number;
  position: Point; projectionM: number }>;
export type ContactClearance = Readonly<{
  status: 'separated-by-declared-plane' | 'not-separated-by-declared-plane';
  plane: Readonly<{ normal: Point; offsetM: number; defenderMaximum: Limit;
    attackerMinimum: Limit; signedClearanceM: number }>;
  closest: SurfacePair;
  selectedTriangleCounts: Readonly<{ defender: number; attacker: number }>;
}>;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const finite = (point: Point) => point && [point.x, point.y, point.z].every(Number.isFinite);
function world(point: Point, sample: CandidateGeometrySample): Point {
  if (!finite(point) || !finite(sample.root?.position) || !Number.isFinite(sample.root.yawRad)) {
    throw new TypeError('Nonfinite contact surface transform');
  }
  const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
  return { x: point.x * c + point.z * s + sample.root.position.x,
    y: point.y + sample.root.position.y,
    z: -point.x * s + point.z * c + sample.root.position.z };
}
function select(sample: CandidateGeometrySample, side: 'defender' | 'attacker'): CandidateTriangleSelection[] {
  const result: CandidateTriangleSelection[] = [];
  for (const mesh of sample.meshes) {
    // The garment boot shell is the exterior boot. The body mesh's buried boot skin is excluded.
    const ids = side === 'defender' ?
      (mesh.meshId.endsWith(':AuditionBoots') ? mesh.regions.leftBoot?.triangleIds : undefined) :
      (mesh.meshId.endsWith(':AuditionBoots') ? mesh.regions.leftBoot?.triangleIds : mesh.regions.leftShin?.triangleIds);
    for (const triangleId of ids ?? []) result.push({ sample, meshId: mesh.meshId, triangleId });
  }
  if (!result.length) throw new TypeError(`Missing ${side} exterior contact surfaces`);
  return result;
}
function extremum(selections: readonly CandidateTriangleSelection[], normal: Point, maximum: boolean): Limit {
  let selected: Limit | undefined;
  for (const { sample, meshId, triangleId } of selections) {
    const mesh = sample.meshes.find((entry) => entry.meshId === meshId);
    if (!mesh) throw new TypeError('Missing contact mesh');
    const triangle = mesh.triangles[triangleId];
    if (!triangle) throw new TypeError('Missing contact triangle');
    const vertices = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
    for (const vertexId of triangle) {
      const local = vertices.get(vertexId);
      if (!local) throw new TypeError('Missing contact vertex');
      const position = world(local, sample);
      const projectionM = dot(position, normal);
      if (!Number.isFinite(projectionM)) throw new TypeError('Nonfinite contact projection');
      const candidate = { actorHandle: sample.actorHandle, meshId, triangleId, vertexId, position, projectionM };
      if (!selected || (maximum ? projectionM > selected.projectionM : projectionM < selected.projectionM) ||
        (projectionM === selected.projectionM &&
          `${meshId}:${triangleId}:${vertexId}` < `${selected.meshId}:${selected.triangleId}:${selected.vertexId}`)) {
        selected = candidate;
      }
    }
  }
  return selected!;
}

/** A sufficient separation certificate on declared exterior triangles, independent of camera and nearest-pair distance. */
export function diagnoseContactClearance(input: Readonly<{
  defender350: CandidateGeometrySample; attacker350: CandidateGeometrySample;
  defender366: CandidateGeometrySample; attacker366: CandidateGeometrySample;
}>): ContactClearance {
  const { defender350, attacker350, defender366, attacker366 } = input;
  if (defender350.tick !== 350 || attacker350.tick !== 350 || defender366.tick !== 366 || attacker366.tick !== 366 ||
    defender350.actorHandle !== defender366.actorHandle || attacker350.actorHandle !== attacker366.actorHandle ||
    defender350.actorHandle === attacker350.actorHandle) throw new TypeError('Incompatible contact samples');
  const from = world(defender350.landmarks.leftAnkleBone, defender350);
  const to = world(attacker350.landmarks.leftAnkleBone, attacker350);
  const direction = sub(to, from);
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (!Number.isFinite(length) || length <= 1e-9) throw new TypeError('Degenerate contact approach axis');
  const normal = { x: direction.x / length, y: direction.y / length, z: direction.z / length };
  const defender = select(defender366, 'defender');
  const attacker = select(attacker366, 'attacker');
  const defenderMaximum = extremum(defender, normal, true);
  const attackerMinimum = extremum(attacker, normal, false);
  const signedClearanceM = attackerMinimum.projectionM - defenderMaximum.projectionM;
  const closest = nearestSurfacePair(defender, attacker);
  return { status: signedClearanceM >= 0 ? 'separated-by-declared-plane' : 'not-separated-by-declared-plane',
    plane: { normal, offsetM: (defenderMaximum.projectionM + attackerMinimum.projectionM) / 2,
      defenderMaximum, attackerMinimum, signedClearanceM }, closest,
    selectedTriangleCounts: { defender: defender.length, attacker: attacker.length } };
}
