import { trackContactFeature, type ContactFeature } from './contact-feature';
import type { CandidateGeometrySample } from './geometry';

export type ContactVisualPoint = Readonly<{ x: number; y: number; z: number }>;
export type ContactVisualIdentity = Readonly<{
  canonicalContentHash: string;
  resourceDigest: string;
  publicActorTimelineHash: string;
  geometryIdentity: string;
  rendererInputFingerprint: string;
}>;
export type ContactVisualPatch = Readonly<{
  actorHandle: string;
  meshId: string;
  triangleId: number;
  vertexIds: readonly [number, number, number];
  barycentric: readonly [number, number, number];
  vertices: readonly [ContactVisualPoint, ContactVisualPoint, ContactVisualPoint];
  point: ContactVisualPoint;
  leftAnkle: ContactVisualPoint;
}>;
export type ContactVisualRow = Readonly<{
  tick: 364 | 366 | 370 | 371;
  defender: ContactVisualPatch;
  attacker: ContactVisualPatch;
  axis: ContactVisualPoint;
  separationM: number;
  signedSeparationM: number;
}>;
export type ContactVisualization = Readonly<{
  version: 'rigged-contact-visualization-v1';
  identity: ContactVisualIdentity;
  rows: readonly [ContactVisualRow, ContactVisualRow, ContactVisualRow, ContactVisualRow];
}>;
type Pair = Readonly<{ defender: CandidateGeometrySample; attacker: CandidateGeometrySample }>;
type Input = Readonly<{
  feature: ContactFeature;
  geometryIdentity: string;
  identity: Omit<ContactVisualIdentity, 'geometryIdentity'>;
  samples: readonly [Pair, Pair, Pair, Pair];
}>;

const ticks = [364, 366, 370, 371] as const;
const tolerance = 1e-8;
const finitePoint = (point: ContactVisualPoint) =>
  point && [point.x, point.y, point.z].every(Number.isFinite);
const near = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
const samePoint = (a: ContactVisualPoint, b: ContactVisualPoint) =>
  near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z);
const clonePoint = (point: ContactVisualPoint): ContactVisualPoint => ({ x: point.x, y: point.y, z: point.z });

function world(local: ContactVisualPoint, sample: CandidateGeometrySample): ContactVisualPoint {
  if (!finitePoint(local) || !finitePoint(sample.root.position) || !Number.isFinite(sample.root.yawRad)) {
    throw new TypeError('Nonfinite contact geometry');
  }
  const c = Math.cos(sample.root.yawRad);
  const s = Math.sin(sample.root.yawRad);
  return { x: local.x * c + local.z * s + sample.root.position.x,
    y: local.y + sample.root.position.y,
    z: -local.x * s + local.z * c + sample.root.position.z };
}

function patch(sample: CandidateGeometrySample, selected: ContactFeature['defender']): ContactVisualPatch {
  const { binding } = selected;
  if (sample.actorHandle !== binding.actorHandle) throw new TypeError('Contact actor mismatch');
  const matches = sample.meshes.filter((mesh) => mesh.meshId === binding.meshId);
  if (matches.length !== 1) throw new TypeError('Contact mesh mismatch');
  const mesh = matches[0]!;
  const topology = JSON.stringify({ meshId: mesh.meshId,
    vertexIds: mesh.vertices.map((vertex) => vertex.vertexId).sort((a, b) => a - b), triangles: mesh.triangles });
  if (topology !== selected.boundMeshTopology) throw new TypeError('Contact topology mismatch');
  const ids = mesh.triangles[binding.triangleId];
  if (!ids || ids.some((id, index) => id !== binding.vertexIds[index])) {
    throw new TypeError('Contact triangle or vertex order mismatch');
  }
  const weights = binding.barycentric;
  if (weights.length !== 3 || weights.some((weight) => !Number.isFinite(weight) || weight < -tolerance || weight > 1 + tolerance) ||
    !near(weights[0]! + weights[1]! + weights[2]!, 1)) {
    throw new TypeError('Contact barycentric mismatch');
  }
  const vertices = ids.map((id) => {
    const matches = mesh.vertices.filter((vertex) => vertex.vertexId === id);
    if (matches.length !== 1) throw new TypeError('Contact vertex mismatch');
    return world(matches[0]!.position, sample);
  }) as [ContactVisualPoint, ContactVisualPoint, ContactVisualPoint];
  const point = { x: vertices.reduce((sum, vertex, index) => sum + vertex.x * weights[index]!, 0),
    y: vertices.reduce((sum, vertex, index) => sum + vertex.y * weights[index]!, 0),
    z: vertices.reduce((sum, vertex, index) => sum + vertex.z * weights[index]!, 0) };
  const leftAnkle = world(sample.landmarks.leftAnkleBone, sample);
  return { actorHandle: binding.actorHandle, meshId: binding.meshId, triangleId: binding.triangleId,
    vertexIds: [...ids] as [number, number, number], barycentric: [...weights] as [number, number, number],
    vertices, point, leftAnkle };
}

export function buildContactVisualization(input: Input): ContactVisualization {
  if (!input.geometryIdentity || input.geometryIdentity !== input.feature.geometryIdentity ||
    Object.values(input.identity).some((value) => typeof value !== 'string' || !value)) {
    throw new TypeError('Contact visualization identity mismatch');
  }
  if (!finitePoint(input.feature.axis) || !near(Math.hypot(...Object.values(input.feature.axis)), 1)) {
    throw new TypeError('Invalid contact axis');
  }
  if (input.samples.length !== 4) throw new TypeError('Expected four contact sample pairs');
  const rows = ticks.map((tick, index): ContactVisualRow => {
    const pair = input.samples[index]!;
    if (!pair || pair.defender.tick !== tick || pair.attacker.tick !== tick) {
      throw new TypeError('Contact tick mismatch');
    }
    const tracked = trackContactFeature({ feature: input.feature, tick,
      geometryIdentity: input.geometryIdentity, defender: pair.defender, attacker: pair.attacker });
    if (tracked.status !== 'tracked') throw new TypeError(`Contact tracker rejected sample: ${tracked.reason}`);
    const defender = patch(pair.defender, input.feature.defender);
    const attacker = patch(pair.attacker, input.feature.attacker);
    if (!samePoint(defender.point, tracked.defender) || !samePoint(attacker.point, tracked.attacker)) {
      throw new TypeError('Contact point mismatch');
    }
    const separationM = Math.hypot(attacker.point.x - defender.point.x,
      attacker.point.y - defender.point.y, attacker.point.z - defender.point.z);
    const signedSeparationM = (attacker.point.x - defender.point.x) * input.feature.axis.x +
      (attacker.point.y - defender.point.y) * input.feature.axis.y +
      (attacker.point.z - defender.point.z) * input.feature.axis.z;
    if (!near(separationM, tracked.separationM) || !near(signedSeparationM, tracked.signedSeparationM)) {
      throw new TypeError('Contact separation mismatch');
    }
    if (tick === 366 && (!samePoint(defender.point, input.feature.defender.position) ||
      !samePoint(attacker.point, input.feature.attacker.position) ||
      !near(separationM, input.feature.separationM) || !near(signedSeparationM, input.feature.signedSeparationM))) {
      throw new TypeError('Accepted contact feature mismatch');
    }
    return { tick, defender, attacker, axis: clonePoint(input.feature.axis), separationM, signedSeparationM };
  }) as [ContactVisualRow, ContactVisualRow, ContactVisualRow, ContactVisualRow];
  return { version: 'rigged-contact-visualization-v1',
    identity: { ...input.identity, geometryIdentity: input.geometryIdentity }, rows };
}
