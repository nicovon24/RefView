import * as THREE from 'three';
import type { PlayableScenarioV2 } from '../../../../../../../packages/content/src/public-projection-v2';
import { createRiggedPlayer } from '../model';
import { buildPublicLocomotionPlan } from '../pose/locomotion';
import { createRiggedPoseSampler } from '../pose/sampler';
import { PUBLIC_MOTION } from '../pose/frame';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';

type Point = Readonly<{ x: number; y: number; z: number }>;
type Bounds = Readonly<{ min: Point; max: Point }>;
const regions = ['head', 'torso', 'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm',
  'leftThigh', 'rightThigh', 'leftShin', 'rightShin', 'leftBoot', 'rightBoot'] as const;
export type CandidateRegion = (typeof regions)[number];
export type CandidateVertex = Readonly<{ vertexId: number; position: Point }>;
export type CandidateRegionSurface = Readonly<{ triangleIds: readonly number[]; broadPhaseBounds: Bounds }>;
export type CandidateMesh = Readonly<{ meshId: string; vertices: readonly CandidateVertex[];
  triangles: readonly (readonly [number, number, number])[];
  regions: Readonly<Partial<Record<CandidateRegion, CandidateRegionSurface>>>;
  broadPhaseBounds: Bounds }>;
export type BootSurfaceLandmark = Readonly<{ meshId: string; vertexId: number; position: Point }>;
export type CandidateGeometrySample = Readonly<{ actorHandle: string; tick: number;
  root: Readonly<{ position: Point; yawRad: number }>;
  meshes: readonly CandidateMesh[];
  landmarks: Readonly<{ headBone: Point; torsoBone: Point; leftAnkleBone: Point;
    rightAnkleBone: Point; groundRoot: Point; leftBootToeSurface: BootSurfaceLandmark;
    rightBootToeSurface: BootSurfaceLandmark }> }>;

type Topology = { mesh: THREE.Mesh; meshId: string; vertices: readonly number[];
  triangles: readonly (readonly [number, number, number])[];
  regionTriangles: Readonly<Partial<Record<CandidateRegion, readonly number[]>>> };

const kit: Readonly<Record<string, Readonly<{ color: string; number: number }>>> = {
  'actor-001': { color: '#e6c34f', number: 8 },
  'actor-002': { color: '#e6c34f', number: 9 },
  'actor-003': { color: '#e6c34f', number: 10 },
  'actor-004': { color: '#76b596', number: 1 },
  'actor-005': { color: '#294b8f', number: 2 },
  'actor-006': { color: '#294b8f', number: 4 },
  'actor-007': { color: '#294b8f', number: 5 },
};

function point(vector: THREE.Vector3): Point { return { x: vector.x, y: vector.y, z: vector.z }; }
function bounds(points: readonly Point[]): Bounds {
  if (!points.length) throw new Error('Empty posed region');
  return { min: { x: Math.min(...points.map((p) => p.x)), y: Math.min(...points.map((p) => p.y)),
    z: Math.min(...points.map((p) => p.z)) },
  max: { x: Math.max(...points.map((p) => p.x)), y: Math.max(...points.map((p) => p.y)),
    z: Math.max(...points.map((p) => p.z)) } };
}
function regionForBone(name: string): CandidateRegion {
  if (name === 'Head') return 'head';
  if (['root', 'pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01'].includes(name)) return 'torso';
  for (const side of ['l', 'r'] as const) {
    const prefix = side === 'l' ? 'left' : 'right';
    if (name === `clavicle_${side}` || name === `upperarm_${side}`) return `${prefix}UpperArm`;
    if (name === `lowerarm_${side}` || name === `hand_${side}` ||
      /^(index|middle|pinky|ring|thumb)_\d\d(?:_leaf)?_[lr]$/.test(name)) {
      if (name.endsWith(`_${side}`)) return `${prefix}Forearm`;
    }
    if (name === `thigh_${side}`) return `${prefix}Thigh`;
    if (name === `calf_${side}`) return `${prefix}Shin`;
    if ([`foot_${side}`, `ball_${side}`, `ball_leaf_${side}`].includes(name)) return `${prefix}Boot`;
  }
  throw new Error(`Unknown player skin joint: ${name}`);
}
function classifyVertex(mesh: THREE.Mesh, vertexId: number): CandidateRegion {
  if (/hair|eyes|eyebrows/i.test(mesh.name)) return 'head';
  if (!(mesh instanceof THREE.SkinnedMesh)) throw new Error(`Unknown non-skinned player mesh: ${mesh.name}`);
  const joints = mesh.geometry.getAttribute('skinIndex');
  const weights = mesh.geometry.getAttribute('skinWeight');
  if (!joints || !weights || joints.itemSize < 4 || weights.itemSize < 4) throw new Error('Missing player skin attributes');
  const read = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, slot: number) =>
    slot === 0 ? attribute.getX(vertexId) : slot === 1 ? attribute.getY(vertexId) :
      slot === 2 ? attribute.getZ(vertexId) : attribute.getW(vertexId);
  let totalWeight = 0;
  for (let slot = 0; slot < 4; slot += 1) {
    const weight = read(weights, slot);
    const jointIndex = read(joints, slot);
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(jointIndex) ||
      jointIndex < 0 || jointIndex >= mesh.skeleton.bones.length) throw new Error('Invalid player skin weight or joint');
    totalWeight += weight;
  }
  if (totalWeight <= 0) throw new Error('Unweighted player vertex');
  let strongest = 0;
  for (let slot = 1; slot < 4; slot += 1) if (read(weights, slot) > read(weights, strongest)) strongest = slot;
  const joint = mesh.skeleton.bones[read(joints, strongest)];
  if (!joint) throw new Error('Invalid player skin joint index');
  return regionForBone(joint.name);
}
function topology(root: THREE.Object3D): Topology[] {
  const result: Topology[] = [];
  const ids = new Set<string>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const meshId = `${result.length}:${object.name}`;
    if (ids.has(meshId)) throw new Error(`Duplicate player mesh ID: ${meshId}`);
    ids.add(meshId);
    const position = object.geometry.getAttribute('position');
    const index = object.geometry.getIndex();
    if (!position || !index || index.count === 0 || index.count % 3 !== 0) throw new Error(`Invalid indexed mesh ${meshId}`);
    const referenced = new Set<number>();
    const triangles: [number, number, number][] = [];
    const byRegion: Partial<Record<CandidateRegion, number[]>> = {};
    for (let indexOffset = 0; indexOffset < index.count; indexOffset += 3) {
      const vertices: [number, number, number] = [index.getX(indexOffset), index.getX(indexOffset + 1), index.getX(indexOffset + 2)];
      if (vertices.some((id) => !Number.isInteger(id) || id < 0 || id >= position.count)) throw new Error(`Invalid mesh vertex ${meshId}`);
      const triangleId = triangles.length;
      triangles.push(vertices);
      const selected = new Set(vertices.map((id) => { referenced.add(id); return classifyVertex(object, id); }));
      for (const region of selected) (byRegion[region] ??= []).push(triangleId);
    }
    if (Object.keys(byRegion).length === 0) throw new Error(`Unclassified mesh ${meshId}`);
    const regionTriangles = Object.fromEntries(Object.entries(byRegion).map(([region, ids]) =>
      [region, Object.freeze([...ids])])) as Partial<Record<CandidateRegion, readonly number[]>>;
    result.push(Object.freeze({ mesh: object, meshId,
      vertices: Object.freeze([...referenced].sort((a, b) => a - b)),
      triangles: Object.freeze(triangles.map((triangle) => Object.freeze(triangle))),
      regionTriangles: Object.freeze(regionTriangles) }));
  });
  if (!result.length) throw new Error('No player surface meshes');
  return result;
}
function posedVertex(mesh: THREE.Mesh, vertexId: number, inverseRoot: THREE.Matrix4): Point {
  const local = mesh.getVertexPosition(vertexId, new THREE.Vector3());
  return point(local.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverseRoot));
}
function posedMeshes(topologies: readonly Topology[], inverseRoot: THREE.Matrix4): CandidateMesh[] {
  return topologies.map((entry) => {
    const vertices = entry.vertices.map((vertexId) => ({ vertexId,
      position: posedVertex(entry.mesh, vertexId, inverseRoot) }));
    const vertexMap = new Map(vertices.map((vertex) => [vertex.vertexId, vertex.position]));
    const regionSurfaces: Partial<Record<CandidateRegion, CandidateRegionSurface>> = {};
    for (const region of regions) {
      const triangleIds = entry.regionTriangles[region];
      if (!triangleIds?.length) continue;
      const points = triangleIds.flatMap((triangleId) => entry.triangles[triangleId]!.map((id) => vertexMap.get(id)!));
      regionSurfaces[region] = { triangleIds: [...triangleIds], broadPhaseBounds: bounds(points) };
    }
    return { meshId: entry.meshId, vertices, triangles: entry.triangles.map((triangle) => [...triangle] as [number, number, number]),
      regions: regionSurfaces, broadPhaseBounds: bounds(vertices.map((vertex) => vertex.position)) };
  });
}
function bonePoint(bones: ReadonlyMap<string, THREE.Bone>, name: string, inverseRoot: THREE.Matrix4): Point {
  const bone = bones.get(name);
  if (!bone) throw new Error(`Missing player diagnostic bone: ${name}`);
  return point(bone.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverseRoot));
}
function selectToe(topologies: readonly Topology[], side: 'left' | 'right') {
  const region = `${side}Boot` as CandidateRegion;
  const boots = topologies.filter((entry) => entry.mesh.name === 'AuditionBoots');
  let selected: { meshId: string; vertexId: number; forward: number } | undefined;
  for (const entry of boots) {
    const used = new Set((entry.regionTriangles[region] ?? []).flatMap((triangleId) => entry.triangles[triangleId]!));
    const position = entry.mesh.geometry.getAttribute('position');
    for (const vertexId of [...used].sort((a, b) => a - b)) {
      const forward = position.getZ(vertexId);
      if (!selected || forward > selected.forward || (forward === selected.forward && vertexId < selected.vertexId)) {
        selected = { meshId: entry.meshId, vertexId, forward };
      }
    }
  }
  if (!selected) throw new Error(`Missing ${side} boot region`);
  return { meshId: selected.meshId, vertexId: selected.vertexId };
}
async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createCandidateGeometrySampler({ resources, playable, implementationLabel }: {
  resources: VerifiedPlayerResources;
  playable: Pick<PlayableScenarioV2, 'actors' | 'contentHash'>;
  implementationLabel: string;
}) {
  if (!implementationLabel || implementationLabel.length > 120 || !/^[A-Za-z0-9._-]+$/.test(implementationLabel)) {
    throw new TypeError('Invalid diagnostic implementation label');
  }
  const manifestIdentity = `${PLAYER_RESOURCE_VERSION}\n${PLAYER_RESOURCE_FILES.map((entry) =>
    `${PLAYER_RESOURCE_ROOT}${entry.path}\t${entry.bytes}\t${entry.sha256}`).sort().join('\n')}`;
  const expectedDigest = await digest(manifestIdentity);
  if (resources.resourceDigest !== expectedDigest) throw new Error('Player resource manifest digest mismatch');
  if (!/^sha256:[a-f0-9]{64}$/.test(playable.contentHash)) throw new TypeError('Invalid canonical content hash');
  const detachedActors = JSON.parse(JSON.stringify(playable.actors)) as PlayableScenarioV2['actors'];
  const locomotion = buildPublicLocomotionPlan(detachedActors, 60);
  const allowedClips = new Set<string>(Object.values(PUBLIC_MOTION));
  for (const frame of detachedActors) {
    for (const actor of frame.actors) {
      if (!Number.isFinite(actor.yawRad) || !Number.isInteger(actor.phaseQ) || actor.phaseQ < 0 ||
        !allowedClips.has(actor.clipHandle)) throw new TypeError(`Invalid public pose frame at tick ${frame.tick}`);
    }
  }
  const handles = detachedActors[0]!.actors.map((actor) => actor.actorHandle);
  if (handles.length !== 7 || handles.some((handle) => !kit[handle])) throw new TypeError('Unsupported diagnostic player roster');
  const actors = new Map<string, { player: ReturnType<typeof createRiggedPlayer>;
    pose: ReturnType<typeof createRiggedPoseSampler>; topologies: Topology[];
    toes: { left: { meshId: string; vertexId: number }; right: { meshId: string; vertexId: number } } }>();
  try {
    for (const handle of handles) {
      const selected = kit[handle]!;
      const player = createRiggedPlayer({ bodyScene: resources.bodyScene, hairScene: resources.hairScene,
        color: selected.color, number: null, silhouette: 'athletic', kitStyle: 'solid' });
      let pose: ReturnType<typeof createRiggedPoseSampler> | undefined;
      try {
        pose = createRiggedPoseSampler(player, resources.clips, locomotion[handle]);
        const topologies = topology(player.root);
        const toes = { left: selectToe(topologies, 'left'), right: selectToe(topologies, 'right') };
        actors.set(handle, { player, pose, topologies, toes });
      } catch (error) { pose?.dispose(); player.dispose(); throw error; }
    }
  } catch (error) {
    for (const entry of actors.values()) { entry.pose.dispose(); entry.player.dispose(); }
    throw error;
  }
  const identity = Object.freeze({ purpose: 'diagnostic-only' as const,
    geometryVersion: 'rigged-posed-triangles-v1', regionPolicyVersion: 'dominant-skin-joint-v1',
    resourceDigest: expectedDigest, canonicalContentHash: playable.contentHash,
    publicActorTimelineHash: `sha256:${await digest(JSON.stringify(detachedActors))}`,
    appearance: Object.freeze({ silhouette: 'athletic', kitStyle: 'solid', numbers: null,
      roster: Object.freeze(Object.fromEntries(handles.map((handle) =>
        [handle, Object.freeze({ ...kit[handle]! })]))) }),
    implementationLabel });
  let disposed = false;
  const sample = (actorHandle: string, tick: number): CandidateGeometrySample => {
    if (disposed) throw new Error('Candidate geometry sampler is disposed');
    const entry = actors.get(actorHandle);
    if (!entry) throw new RangeError(`Unknown diagnostic actor ${actorHandle}`);
    if (!Number.isInteger(tick) || tick < 0 || tick > 480) throw new RangeError('Invalid diagnostic tick');
    const frame = detachedActors[tick]!.actors.find((actor) => actor.actorHandle === actorHandle)!;
    entry.pose.applyFrame({ tick, actorHandle, rootPosition: frame.position,
      yawRad: frame.yawRad, clipHandle: frame.clipHandle, phaseQ: frame.phaseQ });
    entry.player.root.updateMatrixWorld(true);
    const inverseRoot = entry.player.root.matrixWorld.clone().invert();
    const meshes = posedMeshes(entry.topologies, inverseRoot);
    const toe = (which: 'left' | 'right'): BootSurfaceLandmark => {
      const selected = entry.toes[which];
      const mesh = entry.topologies.find((candidate) => candidate.meshId === selected.meshId)!.mesh;
      return { ...selected, position: posedVertex(mesh, selected.vertexId, inverseRoot) };
    };
    return { actorHandle, tick, root: { position: { ...frame.position }, yawRad: frame.yawRad }, meshes,
      landmarks: { headBone: bonePoint(entry.player.bones, 'Head', inverseRoot),
        torsoBone: bonePoint(entry.player.bones, 'spine_03', inverseRoot),
        leftAnkleBone: bonePoint(entry.player.bones, 'foot_l', inverseRoot),
        rightAnkleBone: bonePoint(entry.player.bones, 'foot_r', inverseRoot),
        groundRoot: { x: 0, y: 0, z: 0 }, leftBootToeSurface: toe('left'), rightBootToeSurface: toe('right') } };
  };
  return { identity, sample, dispose: () => {
    if (disposed) return;
    disposed = true;
    for (const entry of actors.values()) { entry.pose.dispose(); entry.player.dispose(); }
    actors.clear();
  } };
}
