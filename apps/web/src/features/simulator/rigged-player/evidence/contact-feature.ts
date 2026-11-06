import type { CandidateGeometrySample } from './geometry';
import { castSurfaceSegment, SURFACE_ENDPOINT_EXCLUSION_M, type SurfaceSegmentHit } from './surface-query';

type Point = Readonly<{ x: number; y: number; z: number }>;
type Side = 'defender' | 'attacker';
type Binding = Readonly<{ actorHandle: string; meshId: string; triangleId: number;
  vertexIds: readonly [number, number, number]; barycentric: readonly [number, number, number] }>;
type Entry = Readonly<{ meshId: string; triangleId: number; distanceM: number; region: 'leftBoot' | 'leftShin' }>;
type Patch = Readonly<{ binding: Binding; firstEntry: Entry; position: Point; boundMeshTopology: string }>;
export type ContactFeature = Readonly<{ status: 'accepted'; geometryIdentity: string; axis: Point;
  defender: Patch; attacker: Patch; separationM: number; signedSeparationM: number }>;
export type ContactFeatureFailure = Readonly<{ status: 'failed'; reason: string;
  firstEntry?: Readonly<{ meshId: string; triangleId: number; distanceM: number }> }>;
type SampleInput = Readonly<{ defender350: CandidateGeometrySample; attacker350: CandidateGeometrySample;
  defender366: CandidateGeometrySample; attacker366: CandidateGeometrySample;
  defenderHandle: string; attackerHandle: string; geometryIdentity: string }>;

const PROBE_MARGIN_M = 0.01;
const FIRST_HIT_TIE_M = 1e-8;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Point, n: number): Point => ({ x: a.x * n, y: a.y * n, z: a.z * n });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const finite = (p: Point) => p && [p.x, p.y, p.z].every(Number.isFinite);
function world(local: Point, sample: CandidateGeometrySample): Point {
  const { position, yawRad } = sample.root;
  if (!finite(local) || !finite(position) || !Number.isFinite(yawRad)) throw new TypeError('Nonfinite posed surface');
  const c = Math.cos(yawRad); const s = Math.sin(yawRad);
  return { x: local.x * c + local.z * s + position.x, y: local.y + position.y,
    z: -local.x * s + local.z * c + position.z };
}
function meshTopology(sample: CandidateGeometrySample, meshId: string): string {
  const matches = sample.meshes.filter((mesh) => mesh.meshId === meshId);
  if (matches.length !== 1) throw new TypeError('Missing or duplicate bound mesh');
  const mesh = matches[0]!;
  return JSON.stringify({ meshId, vertexIds: mesh.vertices.map((v) => v.vertexId).sort((a, b) => a - b),
    triangles: mesh.triangles });
}
function region(sample: CandidateGeometrySample, hit: SurfaceSegmentHit): 'leftBoot' | 'leftShin' | null {
  const mesh = sample.meshes.find((item) => item.meshId === hit.witness.meshId);
  if (mesh?.regions.leftBoot?.triangleIds.includes(hit.witness.triangleId)) return 'leftBoot';
  if (mesh?.regions.leftShin?.triangleIds.includes(hit.witness.triangleId)) return 'leftShin';
  return null;
}
function selectSide(sample: CandidateGeometrySample, axis: Point, side: Side): Patch | ContactFeatureFailure {
  // Geometry landmarks and vertices are both actor-local; probes operate in world space.
  const ankle = world(sample.landmarks.leftAnkleBone, sample);
  const surfaces = sample.meshes.flatMap((mesh) => mesh.triangles.map((_, triangleId) =>
    ({ sample, meshId: mesh.meshId, triangleId })));
  const projections = sample.meshes.flatMap((mesh) => mesh.vertices.map((v) => {
    const value = dot(sub(world(v.position, sample), ankle), axis);
    if (!Number.isFinite(value)) throw new TypeError('Nonfinite surface projection');
    return value;
  }));
  if (!projections.length || !surfaces.length) return { status: 'failed', reason: `${side}-missing` };
  const extent = side === 'defender' ? Math.max(...projections) : Math.min(...projections);
  const offset = side === 'defender' ? Math.max(extent, 0) + PROBE_MARGIN_M : Math.min(extent, 0) - PROBE_MARGIN_M;
  const start = add(ankle, scale(axis, offset));
  if (PROBE_MARGIN_M <= SURFACE_ENDPOINT_EXCLUSION_M) throw new Error('Probe margin violates endpoint policy');
  // Query the complete owner first. Individual hits then reveal equal-distance ambiguity.
  const hit = castSurfaceSegment({ start, end: ankle, surfaces });
  if (!hit) return { status: 'failed', reason: `${side}-missing` };
  const vertexMaps = new Map(sample.meshes.map((mesh) => [mesh.meshId,
    new Map(mesh.vertices.map((vertex) => [vertex.vertexId, world(vertex.position, sample)]))]));
  const possibleTies = surfaces.filter((surface) => {
    const mesh = sample.meshes.find((item) => item.meshId === surface.meshId)!;
    const ids = mesh.triangles[surface.triangleId]!;
    const vertices = vertexMaps.get(surface.meshId)!;
    const points = ids.map((id) => vertices.get(id)!);
    return (['x', 'y', 'z'] as const).every((key) =>
      hit.witness.position[key] >= Math.min(...points.map((point) => point[key])) - FIRST_HIT_TIE_M &&
      hit.witness.position[key] <= Math.max(...points.map((point) => point[key])) + FIRST_HIT_TIE_M);
  });
  const ties = possibleTies.map((surface) => castSurfaceSegment({ start, end: ankle, surfaces: [surface] }))
    .filter((candidate): candidate is SurfaceSegmentHit => candidate !== null &&
      Math.abs(candidate.distance - hit.distance) <= FIRST_HIT_TIE_M);
  const distinct = new Set(ties.map((candidate) => `${candidate.witness.meshId}:${candidate.witness.triangleId}`));
  const firstEntry = { meshId: hit.witness.meshId, triangleId: hit.witness.triangleId, distanceM: hit.distance };
  if (distinct.size > 1) return { status: 'failed', reason: `${side}-ambiguous`, firstEntry };
  const anatomicalRegion = region(sample, hit);
  if (!anatomicalRegion) return { status: 'failed',
    reason: side === 'defender' ? 'defender-blocked' : 'attacker-wrong-region', firstEntry };
  const isBootMesh = hit.witness.meshId.split(':').at(-1) === 'AuditionBoots';
  if (side === 'defender' && (!isBootMesh || anatomicalRegion !== 'leftBoot')) {
    return { status: 'failed', reason: `${side}-blocked`, firstEntry };
  }
  const mesh = sample.meshes.find((item) => item.meshId === hit.witness.meshId)!;
  const ids = mesh.triangles[hit.witness.triangleId]!;
  return { binding: { actorHandle: sample.actorHandle, meshId: mesh.meshId,
    triangleId: hit.witness.triangleId, vertexIds: [...ids] as [number, number, number],
    barycentric: [...hit.witness.barycentric] }, firstEntry: { ...firstEntry, region: anatomicalRegion },
  position: { ...hit.witness.position }, boundMeshTopology: meshTopology(sample, mesh.meshId) };
}
function isFailure(value: Patch | ContactFeatureFailure): value is ContactFeatureFailure { return 'status' in value; }
export function selectContactFeature(input: SampleInput): ContactFeature | ContactFeatureFailure {
  if (!input.geometryIdentity || !input.defenderHandle || !input.attackerHandle ||
    input.defenderHandle === input.attackerHandle) throw new TypeError('Invalid contact identity');
  for (const [sample, handle, tick] of [[input.defender350, input.defenderHandle, 350],
    [input.attacker350, input.attackerHandle, 350], [input.defender366, input.defenderHandle, 366],
    [input.attacker366, input.attackerHandle, 366]] as const) {
    if (sample.actorHandle !== handle || sample.tick !== tick) throw new TypeError('Contact sample actor or tick mismatch');
  }
  const localFrom = input.defender350.landmarks.leftAnkleBone;
  const localTo = input.attacker350.landmarks.leftAnkleBone;
  if (!finite(localFrom) || !finite(localTo) ||
    !finite(input.defender350.root.position) || !finite(input.attacker350.root.position) ||
    !Number.isFinite(input.defender350.root.yawRad) || !Number.isFinite(input.attacker350.root.yawRad)) {
    return { status: 'failed', reason: 'nonfinite-axis' };
  }
  const from = world(localFrom, input.defender350);
  const to = world(localTo, input.attacker350);
  const delta = sub(to, from); const length = Math.hypot(delta.x, delta.y, delta.z);
  if (!Number.isFinite(length)) return { status: 'failed', reason: 'nonfinite-axis' };
  if (length <= 1e-9) return { status: 'failed', reason: 'degenerate-axis' };
  const axis = scale(delta, 1 / length);
  const defender = selectSide(input.defender366, axis, 'defender');
  if (isFailure(defender)) return defender;
  const attacker = selectSide(input.attacker366, axis, 'attacker');
  if (isFailure(attacker)) return attacker;
  return { status: 'accepted', geometryIdentity: input.geometryIdentity, axis, defender, attacker,
    separationM: distance(defender.position, attacker.position),
    signedSeparationM: dot(sub(attacker.position, defender.position), axis) };
}
type TrackInput = Readonly<{ feature: ContactFeature; tick: number; geometryIdentity: string;
  defender: CandidateGeometrySample; attacker: CandidateGeometrySample }>;
function evaluate(sample: CandidateGeometrySample, patch: Patch): Point | null {
  const mesh = sample.meshes.find((item) => item.meshId === patch.binding.meshId);
  if (!mesh || meshTopology(sample, mesh.meshId) !== patch.boundMeshTopology) return null;
  const ids = mesh.triangles[patch.binding.triangleId];
  if (!ids || ids.some((id, index) => id !== patch.binding.vertexIds[index])) return null;
  const byId = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
  let point: Point = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < 3; i += 1) {
    const vertex = byId.get(ids[i]!);
    if (!vertex || !finite(vertex)) return null;
    point = add(point, scale(vertex, patch.binding.barycentric[i]!));
  }
  return world(point, sample);
}
export function trackContactFeature(input: TrackInput):
  | Readonly<{ status: 'tracked'; tick: number; defender: Point; attacker: Point;
      separationM: number; signedSeparationM: number }>
  | ContactFeatureFailure {
  if (!Number.isInteger(input.tick) || input.tick < 364 || input.tick > 371 ||
    input.defender.tick !== input.tick || input.attacker.tick !== input.tick) {
    return { status: 'failed', reason: 'tick-mismatch' };
  }
  if (input.geometryIdentity !== input.feature.geometryIdentity ||
    input.defender.actorHandle !== input.feature.defender.binding.actorHandle ||
    input.attacker.actorHandle !== input.feature.attacker.binding.actorHandle) {
    return { status: 'failed', reason: 'identity-mismatch' };
  }
  const defender = evaluate(input.defender, input.feature.defender);
  const attacker = evaluate(input.attacker, input.feature.attacker);
  if (!defender || !attacker) return { status: 'failed', reason: 'topology-mismatch' };
  return { status: 'tracked', tick: input.tick, defender, attacker,
    separationM: distance(defender, attacker), signedSeparationM: dot(sub(attacker, defender), input.feature.axis) };
}
