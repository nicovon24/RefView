import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { createRiggedPlayer } from '../model';
import { buildPublicLocomotionPlan } from '../pose/locomotion';
import { createRiggedPoseSampler } from '../pose/sampler';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import { createCandidateGeometrySampler, type CandidateGeometrySample } from './geometry';

const assetRoot = new URL('../../../../../public/assets/player-audition/', import.meta.url);
let resources: VerifiedPlayerResources;
let playable: ReturnType<typeof compileCanonicalScenarioSourceV2>['playable'];

function parse(source: string | ArrayBuffer) {
  return new Promise<GLTF>((resolve, reject) => new GLTFLoader().parse(source, '', resolve, reject));
}
async function strippedGltf(path: string, bufferPath: string) {
  const document = JSON.parse(readFileSync(new URL(path, assetRoot), 'utf8')) as Record<string, unknown>;
  const buffer = readFileSync(new URL(bufferPath, assetRoot));
  document.buffers = [{ byteLength: buffer.length, uri: `data:application/octet-stream;base64,${buffer.toString('base64')}` }];
  delete document.images; delete document.textures; delete document.materials;
  for (const mesh of document.meshes as Array<{ primitives: Array<{ material?: number }> }>) {
    for (const primitive of mesh.primitives) delete primitive.material;
  }
  return parse(JSON.stringify(document));
}
function digest(value: string | Uint8Array) { return createHash('sha256').update(value).digest('hex'); }
function frameAt(handle: string, tick: number) {
  return playable.actors[tick]!.actors.find((actor) => actor.actorHandle === handle)!;
}
function surfaceSignature(sample: CandidateGeometrySample) {
  return digest(JSON.stringify({ tick: sample.tick, actorHandle: sample.actorHandle,
    root: sample.root, landmarks: sample.landmarks,
    meshes: sample.meshes.map((mesh) => ({ id: mesh.meshId, vertices: mesh.vertices.map((vertex) =>
      [vertex.vertexId, ...Object.values(vertex.position).map((value) => Number(value.toFixed(6)))]) })) }));
}

beforeAll(async () => {
  vi.stubGlobal('ProgressEvent', class ProgressEvent {});
  vi.stubGlobal('crypto', webcrypto);
  const body = await strippedGltf('Superhero_Male_FullBody.gltf', 'Superhero_Male_FullBody.bin');
  const hair = await strippedGltf('hair/Hair_SimpleParted.gltf', 'hair/Hair_SimpleParted.bin');
  const glb = readFileSync(new URL('UAL1_Standard.glb', assetRoot));
  const animation = await parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength));
  const manifestIdentity = `${PLAYER_RESOURCE_VERSION}\n${PLAYER_RESOURCE_FILES.map((entry) =>
    `${PLAYER_RESOURCE_ROOT}${entry.path}\t${entry.bytes}\t${entry.sha256}`).sort().join('\n')}`;
  resources = { bodyScene: body.scene, hairScene: hair.scene, clips: animation.animations,
    resourceDigest: digest(manifestIdentity), dispose: vi.fn() };
  const files: Record<string, string> = { 'player-rig': 'asset-001.mjs', 'run-clip': 'asset-002.mjs',
    'trip-clip': 'asset-003.mjs', 'challenge-clip': 'asset-004.mjs' };
  playable = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
    resolveAssetBytes: (id, path) => {
      const name = files[id];
      return name && path === `/assets/${name}` ?
        readFileSync(new URL(`../../../../../../../packages/content/assets/${name}`, import.meta.url)) : undefined;
    }, ...createIncident001GeometryResolverV2(),
  }).playable;
}, 20000);

describe('rigged candidate diagnostic geometry', () => {
  it('matches all exact local resource hashes and rejects a mismatched digest', async () => {
    for (const entry of PLAYER_RESOURCE_FILES) {
      const bytes = readFileSync(new URL(entry.path, assetRoot));
      expect(bytes.length).toBe(entry.bytes);
      expect(digest(bytes)).toBe(entry.sha256);
    }
    await expect(createCandidateGeometrySampler({ resources: { ...resources, resourceDigest: 'tampered' },
      playable, implementationLabel: 'test-revision' })).rejects.toThrow(/digest mismatch/);
    const invalid = { ...playable, actors: playable.actors.map((frame) => frame.tick === 366 ?
      { ...frame, actors: frame.actors.map((actor) => actor.actorHandle === 'actor-006' ?
        { ...actor, clipHandle: 'asset-999' as typeof actor.clipHandle } : actor) } : frame) };
    await expect(createCandidateGeometrySampler({ resources, playable: invalid,
      implementationLabel: 'test-revision' })).rejects.toThrow(/pose frame/);
    const noBoot = new THREE.Group();
    const hairOnly = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    hairOnly.name = 'Hair_SimpleParted';
    noBoot.add(hairOnly);
    await expect(createCandidateGeometrySampler({ resources: { ...resources, bodyScene: noBoot },
      playable, implementationLabel: 'test-revision' })).rejects.toThrow(/boot region/);
    const unknown = new THREE.Group();
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'UnknownProp';
    unknown.add(prop);
    await expect(createCandidateGeometrySampler({ resources: { ...resources, bodyScene: unknown },
      playable, implementationLabel: 'test-revision' })).rejects.toThrow(/Unknown non-skinned player mesh/);
    const invalidWeights = cloneSkeleton(resources.bodyScene) as THREE.Group;
    const invalidBody = invalidWeights.getObjectByName('SuperHero_Male') as THREE.SkinnedMesh;
    invalidBody.geometry = invalidBody.geometry.clone();
    const weights = invalidBody.geometry.getAttribute('skinWeight');
    weights.setX(0, Number.NaN);
    await expect(createCandidateGeometrySampler({ resources: { ...resources, bodyScene: invalidWeights },
      playable, implementationLabel: 'test-revision' })).rejects.toThrow(/skin weight/);
  });

  it('returns complete referenced surfaces and stable toe landmarks without mutating earlier samples', async () => {
    const sampler = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'test-revision' });
    const sourceBody = resources.bodyScene.getObjectByName('SuperHero_Male') as THREE.SkinnedMesh;
    const sourcePositions = Array.from(sourceBody.geometry.getAttribute('position').array);
    const sourceWeights = Array.from(sourceBody.geometry.getAttribute('skinWeight').array);
    const first = sampler.sample('actor-006', 366);
    expect(sampler.identity).toMatchObject({ purpose: 'diagnostic-only',
      resourceDigest: resources.resourceDigest, canonicalContentHash: playable.contentHash,
      publicActorTimelineHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) });
    expect(first.root.position).toEqual(frameAt('actor-006', 366).position);
    expect(first.meshes.some((mesh) => mesh.meshId.includes('AuditionShirt'))).toBe(true);
    expect(first.meshes.some((mesh) => mesh.meshId.includes('Hair_SimpleParted'))).toBe(true);
    for (const mesh of first.meshes) {
      const referenced = new Set(mesh.triangles.flat());
      expect(mesh.vertices.map((vertex) => vertex.vertexId)).toEqual([...referenced].sort((a, b) => a - b));
      const covered = new Set(Object.values(mesh.regions).flatMap((region) => region!.triangleIds));
      expect(covered.size).toBe(mesh.triangles.length);
      for (let index = 0; index < mesh.triangles.length; index += 1) expect(covered.has(index)).toBe(true);
    }
    expect(new Set(first.meshes.flatMap((mesh) => Object.keys(mesh.regions)))).toEqual(new Set([
      'head', 'torso', 'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm',
      'leftThigh', 'rightThigh', 'leftShin', 'rightShin', 'leftBoot', 'rightBoot',
    ]));
    expect(first.landmarks.leftBootToeSurface.meshId).toContain('AuditionBoots');
    expect(first.landmarks.rightBootToeSurface.meshId).toContain('AuditionBoots');
    expect(first.landmarks.leftBootToeSurface.vertexId).not.toBe(first.landmarks.rightBootToeSurface.vertexId);
    expect(first.landmarks.leftAnkleBone).not.toEqual(first.landmarks.leftBootToeSurface.position);
    const signature = surfaceSignature(first);
    sampler.sample('actor-002', 371);
    sampler.sample('actor-006', 355);
    expect(surfaceSignature(first)).toBe(signature);
    expect(surfaceSignature(sampler.sample('actor-006', 366))).toBe(signature);
    (first.meshes[0]!.vertices[0]!.position as { x: number }).x = 999;
    expect(surfaceSignature(sampler.sample('actor-006', 366))).toBe(signature);
    expect(() => sampler.sample('actor-999', 366)).toThrow();
    expect(() => sampler.sample('actor-006', -1)).toThrow();
    sampler.dispose(); sampler.dispose();
    expect(Array.from(sourceBody.geometry.getAttribute('position').array)).toEqual(sourcePositions);
    expect(Array.from(sourceBody.geometry.getAttribute('skinWeight').array)).toEqual(sourceWeights);
    expect(() => sampler.sample('actor-006', 366)).toThrow(/disposed/);
    expect(resources.dispose).not.toHaveBeenCalled();
  }, 20000);

  it('detaches frozen appearance roster values from future sampler construction', async () => {
    const first = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'first' });
    const appearance = first.identity.appearance.roster as Record<string, { color: string; number: number }>;
    const selected = appearance['actor-002']!;
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Reflect.set(selected, 'color', '#000000')).toBe(false);
    const second = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'second' });
    expect(second.identity.appearance.roster['actor-002']).toEqual({ color: '#e6c34f', number: 9 });
    expect(first.identity.appearance.roster['actor-002']).toEqual({ color: '#e6c34f', number: 9 });
    first.dispose(); second.dispose();
  }, 20000);

  it('agrees with independent linear-blend skinning at a deformed limb vertex', async () => {
    const rotatedPlayable = { ...playable, actors: playable.actors.map((frame) => ({ ...frame,
      actors: frame.actors.map((actor) => actor.actorHandle === 'actor-006' ? { ...actor, yawRad: 0.37 } : actor) })) };
    const candidate = await createCandidateGeometrySampler({ resources, playable: rotatedPlayable, implementationLabel: 'test-revision' });
    const sample = candidate.sample('actor-006', 366);
    const plan = buildPublicLocomotionPlan(rotatedPlayable.actors, 60);
    const instance = createRiggedPlayer({ bodyScene: resources.bodyScene, hairScene: resources.hairScene,
      color: '#294b8f', number: null, silhouette: 'athletic', kitStyle: 'solid' });
    const pose = createRiggedPoseSampler(instance, resources.clips, plan['actor-006']);
    const source = rotatedPlayable.actors[366]!.actors.find((actor) => actor.actorHandle === 'actor-006')!;
    expect(source.yawRad).toBe(0.37);
    pose.applyFrame({ tick: 366, actorHandle: source.actorHandle, rootPosition: source.position,
      yawRad: source.yawRad, clipHandle: source.clipHandle, phaseQ: source.phaseQ });
    instance.root.updateMatrixWorld(true);
    const body = instance.root.getObjectByName('SuperHero_Male') as THREE.SkinnedMesh;
    const output = sample.meshes.find((mesh) => mesh.meshId.endsWith(':SuperHero_Male'))!;
    const skinWeight = body.geometry.getAttribute('skinWeight');
    const skinIndex = body.geometry.getAttribute('skinIndex');
    const shinRegion = output.regions.leftShin!;
    const chosen = [...new Set(shinRegion.triangleIds.flatMap((id) => output.triangles[id]!))]
      .find((id) => skinWeight.getY(id) > 0.01)!;
    expect(chosen).toBeDefined();
    const attribute = body.geometry.getAttribute('position');
    const bind = new THREE.Vector3(attribute.getX(chosen), attribute.getY(chosen), attribute.getZ(chosen))
      .applyMatrix4(body.bindMatrix);
    const blended = new THREE.Vector3();
    for (let slot = 0; slot < 4; slot += 1) {
      const weight = slot === 0 ? skinWeight.getX(chosen) : slot === 1 ? skinWeight.getY(chosen) :
        slot === 2 ? skinWeight.getZ(chosen) : skinWeight.getW(chosen);
      if (weight <= 0) continue;
      const index = slot === 0 ? skinIndex.getX(chosen) : slot === 1 ? skinIndex.getY(chosen) :
        slot === 2 ? skinIndex.getZ(chosen) : skinIndex.getW(chosen);
      const matrix = body.skeleton.bones[index]!.matrixWorld.clone().multiply(body.skeleton.boneInverses[index]!);
      blended.addScaledVector(bind.clone().applyMatrix4(matrix), weight);
    }
    const actorLocal = blended.applyMatrix4(body.bindMatrixInverse).applyMatrix4(body.matrixWorld)
      .applyMatrix4(instance.root.matrixWorld.clone().invert());
    const expected = output.vertices.find((vertex) => vertex.vertexId === chosen)!.position;
    expect(actorLocal.distanceTo(new THREE.Vector3(expected.x, expected.y, expected.z))).toBeLessThan(1e-5);
    pose.dispose(); instance.dispose(); candidate.dispose();
  }, 20000);

  it('keeps a leg-gap ray empty even when it passes the combined broad-phase bounds', () => {
    const left = [new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(-0.8, 0, 0), new THREE.Vector3(-1, 1, 0)];
    const right = [new THREE.Vector3(0.8, 0, 0), new THREE.Vector3(1.2, 0, 0), new THREE.Vector3(1, 1, 0)];
    const combined = new THREE.Box3().setFromPoints([...left, ...right]);
    const ray = new THREE.Ray(new THREE.Vector3(0, 0.5, -1), new THREE.Vector3(0, 0, 1));
    expect(ray.intersectBox(combined, new THREE.Vector3())).not.toBeNull();
    expect(ray.intersectTriangle(...left as [THREE.Vector3, THREE.Vector3, THREE.Vector3], false, new THREE.Vector3())).toBeNull();
    expect(ray.intersectTriangle(...right as [THREE.Vector3, THREE.Vector3, THREE.Vector3], false, new THREE.Vector3())).toBeNull();
  });

  it('samples all seven actors at the 54 source-derived evidence ticks without dense history', async () => {
    const source = createIncident001SourceV2();
    const ticks = new Set<number>();
    for (const evidence of source.observation.evidence) {
      for (let tick = evidence.fromTick; tick <= evidence.toTick; tick += 1) ticks.add(tick);
    }
    expect(ticks.size).toBe(54);
    const sampler = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'test-revision' });
    const signatures: string[] = [];
    for (const tick of [...ticks].sort((a, b) => a - b)) {
      for (const actor of playable.actors[tick]!.actors) {
        const sample = sampler.sample(actor.actorHandle, tick);
        expect(sample.root.position).toEqual(actor.position);
        expect(sample.meshes.length).toBeGreaterThan(3);
        signatures.push(`${actor.actorHandle}:${tick}:${sample.meshes.reduce((total, mesh) => total + mesh.triangles.length, 0)}:${
          sample.landmarks.leftBootToeSurface.position.y.toFixed(4)}`);
      }
    }
    expect(signatures).toHaveLength(378);
    expect(new Set(signatures).size).toBe(378);
    sampler.dispose();
  }, 60000);

  it('records posed head and boot surface continuity through tick 386', async () => {
    const sampler = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'test-revision' });
    const landmark = (sample: CandidateGeometrySample) => [sample.landmarks.headBone,
      sample.landmarks.leftBootToeSurface.position, sample.landmarks.rightBootToeSurface.position];
    for (const handle of ['actor-002', 'actor-006']) {
      let prior: CandidateGeometrySample | undefined;
      let maximum = { tick: 0, landmark: 0, distance: 0 };
      let finalStepM = 0;
      for (let tick = 355; tick <= 386; tick += 1) {
        const current = sampler.sample(handle, tick);
        if (prior) {
          for (const [index, before] of landmark(prior).entries()) {
            const after = landmark(current)[index]!;
            const distance = Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
            if (distance > maximum.distance) maximum = { tick, landmark: index, distance };
            if (tick === 386) finalStepM = Math.max(finalStepM, distance);
          }
        }
        prior = current;
      }
      console.log('candidate continuity', handle, { ...maximum, finalStepM });
      expect(maximum.distance).toBeLessThan(0.7);
      expect(finalStepM).toBeLessThan(0.2);
      expect(surfaceSignature(sampler.sample(handle, 386))).toBe(surfaceSignature(prior!));
    }
    sampler.dispose();
  }, 20000);

  it('keeps the defender fixed boot-toe surface step within 0.20 m through challenge entry and recovery', async () => {
    const sampler = await createCandidateGeometrySampler({ resources, playable, implementationLabel: 'defender-continuity' });
    let previous = sampler.sample('actor-006', 344).landmarks.leftBootToeSurface.position;
    let maximum = { tick: 0, distance: 0 };
    for (let tick = 345; tick <= 388; tick += 1) {
      const current = sampler.sample('actor-006', tick).landmarks.leftBootToeSurface.position;
      const distance = Math.hypot(current.x - previous.x, current.y - previous.y, current.z - previous.z);
      if (distance > maximum.distance) maximum = { tick, distance };
      previous = current;
    }
    console.log('defender fixed boot-toe maximum step', maximum);
    expect(maximum.distance).toBeLessThanOrEqual(0.20);
    const bootVertices = (handle: string) => {
      const sample = sampler.sample(handle, 366);
      const yaw = sample.root.yawRad;
      const cos = Math.cos(yaw); const sin = Math.sin(yaw);
      return sample.meshes.flatMap((mesh) => {
        const region = mesh.regions.leftBoot;
        if (!region) return [];
        const ids = new Set(region.triangleIds.flatMap((index) => mesh.triangles[index]!));
        return mesh.vertices.filter((vertex) => ids.has(vertex.vertexId)).map(({ position }) => new THREE.Vector3(
          sample.root.position.x + cos * position.x + sin * position.z,
          sample.root.position.y + position.y,
          sample.root.position.z - sin * position.x + cos * position.z));
      });
    };
    const attackingBoot = bootVertices('actor-002');
    const defendingBoot = bootVertices('actor-006');
    expect(attackingBoot.length).toBeGreaterThan(0);
    expect(defendingBoot.length).toBeGreaterThan(0);
    let closestVertexGap = Infinity;
    for (const a of attackingBoot) for (const b of defendingBoot) {
      closestVertexGap = Math.min(closestVertexGap, a.distanceTo(b));
    }
    console.log('tick-366 nearest left-boot surface vertices', closestVertexGap);
    expect(closestVertexGap).toBeLessThan(0.2);
    // The full posed surface changes with the leaner torso; the boot checks above must still pass.
    expect(surfaceSignature(sampler.sample('actor-006', 366)))
      .toBe('de6b5b3f02a5d2302388b2f5be06156a5bae792842aa7a43d0f318a7d06c5b9b');
    sampler.dispose();
  }, 20000);
});
