import type { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { reconstructViewpoints, type Viewpoint } from '@refview/simulation';
import { cameraPose } from '../../controls/controls';
import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import { castSurfaceSegment, nearestSurfacePair, type CandidateTriangleSelection,
  type SurfaceSegmentHit } from './surface-query';

type Point = { x: number; y: number; z: number };
type CompiledSource = ReturnType<typeof compileCanonicalScenarioSourceV2>;
export type CalibrationGeometrySampler = Pick<Awaited<ReturnType<typeof import('./geometry').createCandidateGeometrySampler>>,
  'identity' | 'sample'>;
export type ContactBinding = Readonly<{ actorHandle: string; meshId: string; triangleId: number;
  vertexIds: readonly [number, number, number]; barycentric: readonly [number, number, number] }>;
export type RiggedContactBindings = Readonly<{
  purpose: 'local-rigged-calibration-candidate'; seedTick: 366; sourceContentHash: string;
  resourceDigest: string; publicActorTimelineHash: string; geometryIdentityHash: string;
  rendererInputFingerprint: string; topologyHash: string;
  posedSurfaceHashes: Readonly<{ attacker: string; defender: string }>;
  attacker: ContactBinding; defender: ContactBinding; seedSeparationM: number;
  seedDistanceToAuthoredContactM: Readonly<{ attacker: number; defender: number }>;
}>;
export type CalibrationAnchorDiagnostic = Readonly<{ anchorId: string; position: Point;
  binding: ContactBinding | null;
  eye: Readonly<{ distanceM: number; horizontalAngleRad: number; verticalAngleRad: number;
    gates: Readonly<{ front: boolean; within30M: boolean; withinFov: boolean; central: boolean }>;
    rawEyeHit: SurfaceSegmentHit | null; candidateAvailable: boolean }>;
  camera: Readonly<{ distanceM: number; horizontalAngleRad: number; verticalAngleRad: number;
    gates: Readonly<{ front: boolean; within30M: boolean; withinFov: boolean; central: boolean; depth: boolean }>;
    rawCameraHit: SurfaceSegmentHit | null; nearClippedHit: SurfaceSegmentHit | null;
    nearClippedSkipped: boolean; candidateAvailable: boolean }> }>;
export type RiggedCalibrationReport = Readonly<{ purpose: 'local-rigged-calibration-candidate';
  identity: Readonly<{ sourceContentHash: string; resourceDigest: string; publicActorTimelineHash: string;
    geometryIdentityHash: string; rendererInputFingerprint: string; topologyHash: string }>;
  uncalibratedEvidenceIds: readonly string[];
  rows: readonly Readonly<{ tick: number; evidenceId: string; viewId: 'A' | 'B';
    cameraMode: 'firstPerson' | 'thirdPerson'; eye: Viewpoint & { viewMatrix: readonly number[] };
    camera: Viewpoint & { viewMatrix: readonly number[]; projectionMatrix: readonly number[] };
    anchors: readonly CalibrationAnchorDiagnostic[];
    eyeAvailable: boolean; cameraAvailable: boolean;
    classification: 'joint' | 'cameraOnly' | 'eyeOnly' | 'neither' }>[] }>;

const CONTACT_TICK = 366;
const NEAR_M = 1.1;
const FAR_M = 160;
const VERTICAL_FOV_RAD = 50 * Math.PI / 180;
const ASPECT_RATIO = 16 / 9;
const VIEW_POSITIONS = { A: { x: 6, y: 0, z: 32 }, B: { x: 12, y: 0, z: 26.5 } } as const;
const EVIDENCE = [{ id: 'EV-TRIP-CONTACT', from: 364, to: 371, anchors: ['contactFoot', 'challengerFoot'] },
  { id: 'EV-INSIDE-AREA', from: 360, to: 374, anchors: ['ground', 'line'] }] as const;
const UNCALIBRATED = ['EV-PASS-SNAPSHOT', 'EV-NO-BALL-TOUCH', 'EV-NON-DOGSO'] as const;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Point, t: number): Point => ({ x: a.x * t, y: a.y * t, z: a.z * t });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const finite = (value: Point) => [value.x, value.y, value.z].every(Number.isFinite);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function detach<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => compare(a, b)).map(([key, child]) => [key, normalized(child)]));
  return value;
}
async function hashText(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
function hash(value: unknown): Promise<string> { return hashText(JSON.stringify(normalized(value))); }
function world(local: Point, root: CandidateGeometrySample['root']): Point {
  const c = Math.cos(root.yawRad); const s = Math.sin(root.yawRad);
  return { x: local.x * c + local.z * s + root.position.x,
    y: local.y + root.position.y, z: -local.x * s + local.z * c + root.position.z };
}
function identity(sampler: CalibrationGeometrySampler) {
  const value = sampler.identity;
  if (value.purpose !== 'diagnostic-only' || value.geometryVersion !== 'rigged-posed-triangles-v1' ||
    value.regionPolicyVersion !== 'dominant-skin-joint-v1' || value.appearance.silhouette !== 'athletic' ||
    value.appearance.kitStyle !== 'solid' || value.appearance.numbers !== null) {
    throw new TypeError('Unsupported diagnostic geometry policy');
  }
  return value;
}
function validateSource(source: CompiledSource, sampler: CalibrationGeometrySampler, fingerprint: string) {
  if (!/^sha256:[a-f0-9]{64}$/.test(fingerprint)) throw new TypeError('Invalid renderer input fingerprint');
  const geometry = identity(sampler);
  if (geometry.canonicalContentHash !== source.contentHash || source.playable.contentHash !== source.contentHash ||
    source.privateContext.observationFixture.scenarioContentHash !== source.contentHash) throw new Error('Source and geometry hash mismatch');
  const fixture = source.privateContext.observationFixture;
  if (fixture.durationTicks !== 480 || fixture.visibilityModelVersion !== 1 || fixture.cameraRigVersion !== 1 ||
    fixture.eyeCalibrationVersion !== 1 || fixture.cameraColliders.length !== 0 ||
    source.canonicalSource.facts.contactTick !== CONTACT_TICK ||
    source.canonicalSource.facts.contactGround.x !== 13.8 ||
    source.canonicalSource.facts.contactGround.y !== 0 ||
    source.canonicalSource.facts.contactGround.z !== 36.8) throw new TypeError('Unsupported authored observation configuration');
  const expectedIds = [...EVIDENCE.map((entry) => entry.id), ...UNCALIBRATED].sort(compare);
  if (JSON.stringify(fixture.evidence.map((entry) => entry.evidenceId).sort(compare)) !== JSON.stringify(expectedIds)) {
    throw new TypeError('Unsupported authored evidence set');
  }
  for (const expected of EVIDENCE) {
    const actual = fixture.evidence.find((entry) => entry.evidenceId === expected.id);
    if (!actual || actual.fromTick !== expected.from || actual.toTick !== expected.to ||
      JSON.stringify([...actual.requiredAnchorIds].sort(compare)) !== JSON.stringify([...expected.anchors].sort(compare)) ||
      actual.samples.length !== expected.to - expected.from + 1 ||
      actual.samples.some((sample, index) => sample.tick !== expected.from + index ||
        sample.anchors.length !== expected.anchors.length)) throw new TypeError('Unsupported evidence window');
  }
  const attacker = source.canonicalToPublicActorHandles.get('attack-09');
  const defender = source.canonicalToPublicActorHandles.get('defence-04');
  if (!attacker || !defender || attacker === defender) throw new TypeError('Missing contact actor mapping');
  const anchors = source.privateContext.geometryBindings.anchors;
  const expectedBindings = [
    ['EV-TRIP-CONTACT', 'contactFoot', 'attack-09', 'contactFoot'],
    ['EV-TRIP-CONTACT', 'challengerFoot', 'defence-04', 'contactFoot'],
    ['EV-INSIDE-AREA', 'ground', 'attack-09', 'ground'],
  ] as const;
  for (const [evidenceId, anchorId, actorId, attachmentName] of expectedBindings) {
    const binding = anchors.find((entry) => entry.evidenceId === evidenceId && entry.anchorId === anchorId);
    if (binding?.target.kind !== 'actorAttachment' || binding.target.actorId !== actorId ||
      binding.target.attachmentName !== attachmentName) throw new TypeError('Unsupported actor attachment binding');
  }
  const line = anchors.find((entry) => entry.evidenceId === 'EV-INSIDE-AREA' && entry.anchorId === 'line');
  if (line?.target.kind !== 'fieldPoint' || line.target.feature !== 'nearPenaltyAreaLine' || line.target.xM !== 13.8) {
    throw new TypeError('Unsupported field point binding');
  }
  return { fixture, geometry, attacker, defender };
}
function validateTimelineHash(source: CompiledSource, sampler: CalibrationGeometrySampler): Promise<void> {
  return hashText(JSON.stringify(source.playable.actors)).then((value) => {
    // The geometry sampler hashes the raw JSON string rather than a parsed object.
    if (value !== sampler.identity.publicActorTimelineHash) throw new Error('Public actor timeline hash mismatch');
  });
}
function selected(sample: CandidateGeometrySample, regions: readonly string[]): CandidateTriangleSelection[] {
  const output: CandidateTriangleSelection[] = [];
  for (const mesh of [...sample.meshes].sort((a, b) => compare(a.meshId, b.meshId))) {
    const ids = new Set(regions.flatMap((region) => mesh.regions[region as keyof typeof mesh.regions]?.triangleIds ?? []));
    for (const triangleId of [...ids].sort((a, b) => a - b)) output.push({ sample, meshId: mesh.meshId, triangleId });
  }
  if (!output.length) throw new Error('Missing selected contact surface region');
  return output;
}
function binding(sample: CandidateGeometrySample, witness: { meshId: string; triangleId: number;
  barycentric: readonly number[] }): ContactBinding {
  const mesh = sample.meshes.find((item) => item.meshId === witness.meshId);
  const indices = mesh?.triangles[witness.triangleId];
  if (!indices || indices.length !== 3 || witness.barycentric.length !== 3 ||
    witness.barycentric.some((value) => !Number.isFinite(value) || value < -1e-8 || value > 1 + 1e-8) ||
    Math.abs(witness.barycentric.reduce((sum, value) => sum + value, 0) - 1) > 1e-8) {
    throw new TypeError('Invalid contact witness');
  }
  return { actorHandle: sample.actorHandle, meshId: witness.meshId, triangleId: witness.triangleId,
    vertexIds: [...indices], barycentric: [...witness.barycentric] as [number, number, number] };
}
function validateFixedBinding(value: ContactBinding): void {
  if (!value || typeof value.actorHandle !== 'string' || !value.actorHandle ||
    typeof value.meshId !== 'string' || !value.meshId ||
    !Number.isInteger(value.triangleId) || value.triangleId < 0 ||
    !Array.isArray(value.vertexIds) || value.vertexIds.length !== 3 ||
    value.vertexIds.some((id) => !Number.isInteger(id) || id < 0) ||
    !Array.isArray(value.barycentric) || value.barycentric.length !== 3 ||
    value.barycentric.some((weight) => !Number.isFinite(weight) || weight < -1e-8 || weight > 1 + 1e-8) ||
    Math.abs(value.barycentric.reduce((sum, weight) => sum + weight, 0) - 1) > 1e-8) {
    throw new TypeError('Invalid fixed contact binding');
  }
}
function evaluate(sample: CandidateGeometrySample, fixed: ContactBinding): Point {
  if (sample.actorHandle !== fixed.actorHandle || !finite(sample.root.position) || !Number.isFinite(sample.root.yawRad)) {
    throw new TypeError('Invalid bound actor pose');
  }
  const mesh = sample.meshes.find((item) => item.meshId === fixed.meshId);
  const indices = mesh?.triangles[fixed.triangleId];
  if (!indices || indices.length !== 3 || indices.some((id, index) => id !== fixed.vertexIds[index])) {
    throw new Error('Bound triangle topology changed');
  }
  const vertices = new Map(mesh!.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
  let local: Point = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < 3; i += 1) {
    const vertex = vertices.get(indices[i]!);
    if (!vertex || !finite(vertex)) throw new TypeError('Missing bound vertex');
    local = add(local, scale(vertex, fixed.barycentric[i]!));
  }
  const position = world(local, sample.root);
  if (!finite(position)) throw new TypeError('Nonfinite bound witness');
  return position;
}
function topology(sample: CandidateGeometrySample) {
  return { actorHandle: sample.actorHandle, meshes: [...sample.meshes].sort((a, b) => compare(a.meshId, b.meshId))
    .map((mesh) => ({ meshId: mesh.meshId, vertexIds: [...mesh.vertices].map((vertex) => vertex.vertexId).sort((a, b) => a - b),
      triangles: mesh.triangles.map((ids) => [...ids]) })) };
}
function surfaces(sample: CandidateGeometrySample) {
  return { actorHandle: sample.actorHandle, tick: sample.tick, root: sample.root,
    meshes: [...sample.meshes].sort((a, b) => compare(a.meshId, b.meshId)).map((mesh) => ({ meshId: mesh.meshId,
      vertices: [...mesh.vertices].sort((a, b) => a.vertexId - b.vertexId)
        .map((vertex) => [vertex.vertexId, vertex.position.x, vertex.position.y, vertex.position.z]) })) };
}
function checkSample(source: CompiledSource, sample: CandidateGeometrySample, handle: string, tick: number): void {
  const actor = source.playable.actors[tick]?.actors.find((entry) => entry.actorHandle === handle);
  if (!actor || sample.actorHandle !== handle || sample.tick !== tick ||
    !finite(sample.root.position) || !Number.isFinite(sample.root.yawRad) ||
    distance(sample.root.position, actor.position) > 1e-9 || Math.abs(sample.root.yawRad - actor.yawRad) > 1e-9) {
    throw new Error('Diagnostic sample disagrees with public actor frame');
  }
}
function seedInput(input: { geometrySampler: CalibrationGeometrySampler; compiledSource: CompiledSource;
  rendererInputFingerprint: string }) {
  const resolved = validateSource(input.compiledSource, input.geometrySampler, input.rendererInputFingerprint);
  return { ...resolved, ...input };
}
export async function seedRiggedContactBindings(input: { geometrySampler: CalibrationGeometrySampler;
  compiledSource: CompiledSource; rendererInputFingerprint: string }): Promise<{
    bindings: RiggedContactBindings; metrics: Readonly<{ seedPairProductCount: number; elapsedMs: number }> }> {
  const started = performance.now();
  const { geometrySampler, compiledSource, rendererInputFingerprint, geometry, attacker, defender } = seedInput(input);
  await validateTimelineHash(compiledSource, geometrySampler);
  const attackerSample = geometrySampler.sample(attacker, CONTACT_TICK);
  const defenderSample = geometrySampler.sample(defender, CONTACT_TICK);
  checkSample(compiledSource, attackerSample, attacker, CONTACT_TICK);
  checkSample(compiledSource, defenderSample, defender, CONTACT_TICK);
  const defenderTriangles = selected(defenderSample, ['leftBoot']);
  const attackerTriangles = selected(attackerSample, ['leftBoot', 'leftShin']);
  const nearest = nearestSurfacePair(defenderTriangles, attackerTriangles);
  const defenderBinding = binding(defenderSample, nearest.a);
  const attackerBinding = binding(attackerSample, nearest.b);
  const contact = compiledSource.canonicalSource.facts.contactGround;
  const bindings: RiggedContactBindings = {
    purpose: 'local-rigged-calibration-candidate', seedTick: CONTACT_TICK,
    sourceContentHash: compiledSource.contentHash, resourceDigest: geometry.resourceDigest,
    publicActorTimelineHash: geometry.publicActorTimelineHash,
    geometryIdentityHash: await hash(geometry), rendererInputFingerprint,
    topologyHash: await hash([topology(defenderSample), topology(attackerSample)]),
    posedSurfaceHashes: { defender: await hash(surfaces(defenderSample)), attacker: await hash(surfaces(attackerSample)) },
    defender: defenderBinding, attacker: attackerBinding, seedSeparationM: nearest.distance,
    seedDistanceToAuthoredContactM: { defender: distance(nearest.a.position, contact),
      attacker: distance(nearest.b.position, contact) },
  };
  return { bindings: freezeDeep(detach(bindings)), metrics: freezeDeep({
    seedPairProductCount: defenderTriangles.length * attackerTriangles.length,
    elapsedMs: performance.now() - started }) };
}

type PreparedMesh = { selections: CandidateTriangleSelection[]; bounds: { min: Point; max: Point } };
function preparedMeshes(sample: CandidateGeometrySample): PreparedMesh[] {
  return [...sample.meshes].sort((a, b) => compare(a.meshId, b.meshId)).map((mesh: CandidateMesh) => {
    const bounds = { min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity } };
    if (!mesh.vertices.length) throw new TypeError('Empty posed mesh');
    for (const vertex of mesh.vertices) {
      const position = world(vertex.position, sample.root);
      if (!finite(position)) throw new TypeError('Invalid posed mesh vertices');
      for (const axis of ['x', 'y', 'z'] as const) {
        bounds.min[axis] = Math.min(bounds.min[axis], position[axis]);
        bounds.max[axis] = Math.max(bounds.max[axis], position[axis]);
      }
    }
    return { bounds, selections: mesh.triangles.map((_, triangleId) => ({ sample, meshId: mesh.meshId, triangleId })) };
  });
}
function intersectsBounds(start: Point, end: Point, bounds: PreparedMesh['bounds']): boolean {
  let entry = 0; let exit = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const motion = end[axis] - start[axis];
    if (motion === 0) {
      if (start[axis] < bounds.min[axis] - 1e-10 || start[axis] > bounds.max[axis] + 1e-10) return false;
    } else {
      const a = (bounds.min[axis] - 1e-10 - start[axis]) / motion;
      const b = (bounds.max[axis] + 1e-10 - start[axis]) / motion;
      entry = Math.max(entry, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (entry > exit) return false;
    }
  }
  return true;
}
function matrix(view: Viewpoint): number[] {
  const { right: r, up: u, forward: f, position: p } = view;
  return [r.x, u.x, -f.x, 0, r.y, u.y, -f.y, 0, r.z, u.z, -f.z, 0,
    -dot(r, p), -dot(u, p), dot(f, p), 1];
}
function projection(): number[] {
  const f = 1 / Math.tan(VERTICAL_FOV_RAD / 2);
  return [f / ASPECT_RATIO, 0, 0, 0, 0, f, 0, 0, 0, 0,
    -(FAR_M + NEAR_M) / (FAR_M - NEAR_M), -1,
    0, 0, -2 * FAR_M * NEAR_M / (FAR_M - NEAR_M), 0];
}
function angles(anchor: Point, viewpoint: Viewpoint) {
  const ray = sub(anchor, viewpoint.position);
  const depth = dot(ray, viewpoint.forward);
  return { distanceM: distance(anchor, viewpoint.position), depth,
    horizontalAngleRad: Math.abs(Math.atan2(dot(ray, viewpoint.right), depth)),
    verticalAngleRad: Math.abs(Math.atan2(dot(ray, viewpoint.up), depth)) };
}
function gates(anchor: Point, viewpoint: Viewpoint, mode: 'eye' | 'camera') {
  const measured = angles(anchor, viewpoint);
  const horizontalFov = mode === 'eye' ? 55 * Math.PI / 180 :
    Math.atan(Math.tan(VERTICAL_FOV_RAD / 2) * ASPECT_RATIO);
  const verticalFov = mode === 'eye' ? Math.PI / 4 : VERTICAL_FOV_RAD / 2;
  return { ...measured, gates: { front: measured.depth > 0,
    within30M: measured.distanceM > 0 && measured.distanceM <= 30,
    withinFov: measured.horizontalAngleRad <= horizontalFov + 1e-12 &&
      measured.verticalAngleRad <= verticalFov + 1e-12,
    central: measured.horizontalAngleRad <= Math.PI / 6 + 1e-12 &&
      measured.verticalAngleRad <= 25 * Math.PI / 180 + 1e-12 } };
}
export async function runRiggedCalibrationPilot(input: { geometrySampler: CalibrationGeometrySampler;
  compiledSource: CompiledSource; rendererInputFingerprint: string; bindings: RiggedContactBindings }): Promise<{
    report: RiggedCalibrationReport; metrics: Readonly<{ triangleCount: number; rayCastCount: number;
      rayReuseCount: number; elapsedMs: number }> }> {
  const started = performance.now();
  const { geometrySampler, compiledSource, rendererInputFingerprint, geometry, attacker, defender, fixture } = seedInput(input);
  await validateTimelineHash(compiledSource, geometrySampler);
  const fixed = input.bindings;
  validateFixedBinding(fixed.attacker);
  validateFixedBinding(fixed.defender);
  if (fixed.purpose !== 'local-rigged-calibration-candidate' || fixed.seedTick !== CONTACT_TICK ||
    fixed.sourceContentHash !== compiledSource.contentHash || fixed.resourceDigest !== geometry.resourceDigest ||
    fixed.publicActorTimelineHash !== geometry.publicActorTimelineHash ||
    fixed.geometryIdentityHash !== await hash(geometry) || fixed.rendererInputFingerprint !== rendererInputFingerprint ||
    fixed.attacker.actorHandle !== attacker || fixed.defender.actorHandle !== defender) {
    throw new Error('Calibration binding identity mismatch');
  }
  {
    const peakAttacker = geometrySampler.sample(attacker, CONTACT_TICK);
    const peakDefender = geometrySampler.sample(defender, CONTACT_TICK);
    checkSample(compiledSource, peakAttacker, attacker, CONTACT_TICK);
    checkSample(compiledSource, peakDefender, defender, CONTACT_TICK);
    if (fixed.topologyHash !== await hash([topology(peakDefender), topology(peakAttacker)]) ||
      fixed.posedSurfaceHashes.defender !== await hash(surfaces(peakDefender)) ||
      fixed.posedSurfaceHashes.attacker !== await hash(surfaces(peakAttacker))) {
      throw new Error('Calibration peak pose or topology mismatch');
    }
    for (const [sample, bound] of [[peakDefender, fixed.defender], [peakAttacker, fixed.attacker]] as const) {
      binding(sample, bound);
      evaluate(sample, bound);
    }
  }
  const rows: RiggedCalibrationReport['rows'][number][] = [];
  let triangleCount = 0; let rayCastCount = 0; let rayReuseCount = 0;
  for (let tick = 360; tick <= 374; tick += 1) {
    const actors = compiledSource.playable.actors[tick]?.actors;
    if (!actors || actors.length !== 7 || new Set(actors.map((actor) => actor.actorHandle)).size !== 7) {
      throw new TypeError('Unsupported public actor roster');
    }
    const snapshots = new Map<string, CandidateGeometrySample>();
    for (const actor of actors) {
      const sample = geometrySampler.sample(actor.actorHandle, tick);
      checkSample(compiledSource, sample, actor.actorHandle, tick);
      snapshots.set(actor.actorHandle, sample);
    }
    const defenderSample = snapshots.get(defender)!;
    const attackerSample = snapshots.get(attacker)!;
    if (await hash([topology(defenderSample), topology(attackerSample)]) !== fixed.topologyHash) {
      throw new Error('Calibration bound topology changed');
    }
    const contactPositions = new Map([
      ['contactFoot', evaluate(attackerSample, fixed.attacker)],
      ['challengerFoot', evaluate(defenderSample, fixed.defender)],
    ]);
    const ground = world(attackerSample.landmarks.groundRoot, attackerSample.root);
    const prepared = [...snapshots.values()].flatMap((sample) => preparedMeshes(sample));
    triangleCount += prepared.reduce((sum, mesh) => sum + mesh.selections.length, 0);
    const rayCache = new Map<string, SurfaceSegmentHit | null>();
    const ray = (start: Point, end: Point): SurfaceSegmentHit | null => {
      const key = JSON.stringify([start.x, start.y, start.z, end.x, end.y, end.z]);
      if (rayCache.has(key)) { rayReuseCount += 1; return rayCache.get(key)!; }
      const selections = prepared.filter((mesh) => intersectsBounds(start, end, mesh.bounds))
        .flatMap((mesh) => mesh.selections);
      const hit = castSurfaceSegment({ start, end, surfaces: selections });
      rayCache.set(key, hit); rayCastCount += 1;
      return hit;
    };
    for (const evidence of EVIDENCE) {
      if (tick < evidence.from || tick > evidence.to) continue;
      const sourceEvidence = fixture.evidence.find((entry) => entry.evidenceId === evidence.id)!;
      const sourceSample = sourceEvidence.samples[tick - evidence.from]!;
      const anchors = evidence.anchors.map((anchorId) => {
        const authored = sourceSample.anchors.find((item) => item.anchorId === anchorId);
        if (!authored || !finite(authored.position)) throw new TypeError('Missing authored evidence anchor');
        const position = anchorId === 'contactFoot' || anchorId === 'challengerFoot'
          ? contactPositions.get(anchorId)!
          : anchorId === 'ground' ? ground : { ...authored.position };
        if (anchorId === 'ground' && distance(position, authored.position) > 1e-8) {
          throw new Error('Canonical ground root mismatch');
        }
        if (anchorId === 'line' && (position.x !== 13.8 || position.y !== 0 || position.z !== 36)) {
          throw new Error('Canonical field line point mismatch');
        }
        return { anchorId, position, binding: anchorId === 'contactFoot' ? fixed.attacker :
          anchorId === 'challengerFoot' ? fixed.defender : null };
      });
      for (const viewId of ['A', 'B'] as const) {
        const refereePosition = VIEW_POSITIONS[viewId];
        const deltaX = 13.8 - refereePosition.x; const deltaZ = 36.8 - refereePosition.z;
        const lookYaw = Math.atan2(deltaX, deltaZ);
        const lookPitch = Math.atan2(0.8 - 1.7, Math.hypot(deltaX, deltaZ));
        for (const cameraMode of ['firstPerson', 'thirdPerson'] as const) {
          const view = { tick, refereePosition: { ...refereePosition }, lookYaw, lookPitch,
            cameraMode, cameraDistanceM: 2, cameraLateralOffsetM: 0,
            verticalFovRad: VERTICAL_FOV_RAD, viewportAspectRatio: ASPECT_RATIO };
          const viewpoints = reconstructViewpoints(fixture, view);
          const rendered = cameraPose({ x: refereePosition.x, z: refereePosition.z,
            yaw: lookYaw, pitch: lookPitch }, { mode: cameraMode, distance: 2, lateral: 0 });
          const renderedPosition = { x: rendered.position[0], y: rendered.position[1], z: rendered.position[2] };
          const renderedTarget = { x: rendered.target[0], y: rendered.target[1], z: rendered.target[2] };
          const renderedDirection = sub(renderedTarget, renderedPosition);
          const renderedLength = Math.hypot(renderedDirection.x, renderedDirection.y, renderedDirection.z);
          if (distance(viewpoints.camera.position, renderedPosition) > 1e-9 ||
            distance(viewpoints.camera.forward, scale(renderedDirection, 1 / renderedLength)) > 1e-9) {
            throw new Error('Production camera pose drift');
          }
          const rowAnchors: CalibrationAnchorDiagnostic[] = anchors.map((anchor) => {
            const eye = gates(anchor.position, viewpoints.eye, 'eye');
            const camera = gates(anchor.position, viewpoints.camera, 'camera');
            const rawEyeHit = ray(viewpoints.eye.position, anchor.position);
            const rawCameraHit = ray(viewpoints.camera.position, anchor.position);
            const depthGate = camera.depth > NEAR_M && camera.depth < FAR_M;
            const nearClippedSkipped = camera.depth <= NEAR_M;
            const nearStart = nearClippedSkipped ? null : add(viewpoints.camera.position,
              scale(sub(anchor.position, viewpoints.camera.position), NEAR_M / camera.depth));
            const nearClippedHit = nearStart ? ray(nearStart, anchor.position) : null;
            const eyeAvailable = Object.values(eye.gates).every(Boolean) && rawEyeHit === null;
            const cameraAvailable = Object.values(camera.gates).every(Boolean) && depthGate &&
              !nearClippedSkipped && nearClippedHit === null;
            return { anchorId: anchor.anchorId, position: { ...anchor.position },
              binding: anchor.binding ? detach(anchor.binding) : null,
              eye: { distanceM: eye.distanceM, horizontalAngleRad: eye.horizontalAngleRad,
                verticalAngleRad: eye.verticalAngleRad, gates: eye.gates, rawEyeHit, candidateAvailable: eyeAvailable },
              camera: { distanceM: camera.distanceM, horizontalAngleRad: camera.horizontalAngleRad,
                verticalAngleRad: camera.verticalAngleRad, gates: { ...camera.gates, depth: depthGate },
                rawCameraHit, nearClippedHit, nearClippedSkipped, candidateAvailable: cameraAvailable } };
          });
          const eyeAvailable = rowAnchors.every((anchor) => anchor.eye.candidateAvailable);
          const cameraAvailable = rowAnchors.every((anchor) => anchor.camera.candidateAvailable);
          rows.push({ tick, evidenceId: evidence.id, viewId, cameraMode,
            eye: { ...detach(viewpoints.eye), viewMatrix: matrix(viewpoints.eye) },
            camera: { ...detach(viewpoints.camera), viewMatrix: matrix(viewpoints.camera),
              projectionMatrix: projection() },
            anchors: rowAnchors, eyeAvailable, cameraAvailable,
            classification: eyeAvailable ? cameraAvailable ? 'joint' : 'eyeOnly' :
              cameraAvailable ? 'cameraOnly' : 'neither' });
        }
      }
    }
  }
  if (rows.length !== 92) throw new Error('Incomplete calibration matrix');
  const report: RiggedCalibrationReport = { purpose: 'local-rigged-calibration-candidate',
    identity: { sourceContentHash: fixed.sourceContentHash, resourceDigest: fixed.resourceDigest,
      publicActorTimelineHash: fixed.publicActorTimelineHash, geometryIdentityHash: fixed.geometryIdentityHash,
      rendererInputFingerprint, topologyHash: fixed.topologyHash },
    uncalibratedEvidenceIds: [...UNCALIBRATED], rows };
  return { report: freezeDeep(detach(report)), metrics: freezeDeep({ triangleCount, rayCastCount,
    rayReuseCount, elapsedMs: performance.now() - started }) };
}
