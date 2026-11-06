import { createHash, webcrypto } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { compileLocalRiggedSource, verifyRiggedCalibrationResources } from '../../../../lib/authoring/rigged-calibration-report';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import { createCandidateGeometrySampler } from './geometry';
import { diagnoseContactClearance } from './contact-clearance';

const p = (x: number, y = 0, z = 0) => ({ x, y, z });
const bounds = { min: p(-10, -10, -10), max: p(10, 10, 10) };
function mesh(meshId: string, x: number, region: 'leftBoot' | 'leftShin', ids: [number, number, number]): CandidateMesh {
  return { meshId, vertices: [
    { vertexId: ids[0], position: p(x, -0.1, -0.1) },
    { vertexId: ids[1], position: p(x, 0.1, -0.1) },
    { vertexId: ids[2], position: p(x, 0, 0.1) },
  ], triangles: [ids], regions: { [region]: { triangleIds: [0], broadPhaseBounds: bounds } }, broadPhaseBounds: bounds };
}
function sample(actorHandle: string, tick: number, ankleX: number, meshes: CandidateMesh[]): CandidateGeometrySample {
  return { actorHandle, tick, root: { position: p(0), yawRad: 0 }, meshes,
    landmarks: { headBone: p(0, 1), torsoBone: p(0, 0.5), leftAnkleBone: p(ankleX),
      rightAnkleBone: p(0), groundRoot: p(0),
      leftBootToeSurface: { meshId: meshes[0]?.meshId ?? 'none', vertexId: 10, position: p(0) },
      rightBootToeSurface: { meshId: meshes[0]?.meshId ?? 'none', vertexId: 10, position: p(0) } } };
}
function input(defenderX = 0.99, attackerX = 1) {
  return { defender350: sample('def', 350, 0, []), attacker350: sample('att', 350, 2, []),
    defender366: sample('def', 366, 0, [mesh('0:AuditionBoots', defenderX, 'leftBoot', [10, 20, 30]),
      mesh('1:Body', 9, 'leftBoot', [40, 50, 60])]),
    attacker366: sample('att', 366, 2, [mesh('0:Body', attackerX, 'leftShin', [70, 80, 90]),
      mesh('1:AuditionBoots', 3, 'leftBoot', [100, 110, 120])]) };
}

describe('exterior contact clearance', () => {
  it('certifies a narrow separating plane over declared exterior regions and reports limiting triangles', () => {
    const result = diagnoseContactClearance(input());
    expect(result.status).toBe('separated-by-declared-plane');
    expect(result.plane.normal).toEqual(p(1));
    expect(result.plane.defenderMaximum.projectionM).toBeCloseTo(0.99);
    expect(result.plane.attackerMinimum.projectionM).toBeCloseTo(1);
    expect(result.plane.signedClearanceM).toBeCloseTo(0.01);
    expect(result.plane.defenderMaximum).toMatchObject({ meshId: '0:AuditionBoots', triangleId: 0 });
    expect(result.plane.attackerMinimum).toMatchObject({ meshId: '0:Body', triangleId: 0 });
    expect(result.closest.distance).toBeCloseTo(0.01);
    expect(result.selectedTriangleCounts).toEqual({ defender: 1, attacker: 2 });
  });

  it('reports when the declared plane cannot certify separation despite disjoint surfaces', () => {
    const result = diagnoseContactClearance(input(1.005, 1));
    expect(result.status).toBe('not-separated-by-declared-plane');
    expect(result.plane.signedClearanceM).toBeCloseTo(-0.005);
    expect(result.closest.distance).toBeCloseTo(0.005);
  });
});

function strippedGltf(documentBytes: Buffer, binaryBytes: Buffer): string {
  const document = JSON.parse(documentBytes.toString('utf8')) as Record<string, unknown>;
  document.buffers = [{ byteLength: binaryBytes.length,
    uri: `data:application/octet-stream;base64,${binaryBytes.toString('base64')}` }];
  delete document.images; delete document.textures; delete document.materials;
  for (const mesh of document.meshes as Array<{ primitives: Array<{ material?: number }> }>) {
    for (const primitive of mesh.primitives) delete primitive.material;
  }
  return JSON.stringify(document);
}
async function loadGeometryOnly(root: string): Promise<VerifiedPlayerResources> {
  const verified = verifyRiggedCalibrationResources(root);
  const priorProgress = globalThis.ProgressEvent;
  const priorCrypto = globalThis.crypto;
  if (!priorProgress) globalThis.ProgressEvent = class {} as unknown as typeof ProgressEvent;
  if (!priorCrypto) globalThis.crypto = webcrypto as Crypto;
  const decoded: GLTF[] = [];
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const skeletons = new Set<THREE.Skeleton>();
    for (const gltf of decoded) gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    geometries.forEach((item) => item.dispose()); materials.forEach((item) => item.dispose());
    skeletons.forEach((item) => item.dispose());
  };
  try {
    const loader = new GLTFLoader();
    decoded.push(await loader.parseAsync(strippedGltf(verified.get('Superhero_Male_FullBody.gltf')!,
      verified.get('Superhero_Male_FullBody.bin')!), ''));
    decoded.push(await loader.parseAsync(strippedGltf(verified.get('hair/Hair_SimpleParted.gltf')!,
      verified.get('hair/Hair_SimpleParted.bin')!), ''));
    const animation = verified.get('UAL1_Standard.glb')!;
    decoded.push(await loader.parseAsync(animation.buffer.slice(animation.byteOffset,
      animation.byteOffset + animation.byteLength) as ArrayBuffer, ''));
    const manifest = `${PLAYER_RESOURCE_VERSION}\n${PLAYER_RESOURCE_FILES.map((entry) =>
      `${PLAYER_RESOURCE_ROOT}${entry.path}\t${entry.bytes}\t${entry.sha256}`).sort().join('\n')}`;
    let disposed = false;
    return { bodyScene: decoded[0]!.scene, hairScene: decoded[1]!.scene,
      clips: Object.freeze([...decoded[2]!.animations]), resourceDigest: createHash('sha256').update(manifest).digest('hex'),
      dispose() { if (disposed) return; disposed = true; dispose(); } };
  } catch (error) { dispose(); throw error; } finally {
    if (!priorProgress) delete (globalThis as { ProgressEvent?: typeof ProgressEvent }).ProgressEvent;
    if (!priorCrypto) delete (globalThis as { crypto?: Crypto }).crypto;
  }
}

it.skipIf(process.env.REFVIEW_RIGGED_CONTACT_CLEARANCE_INTEGRATION !== '1')(
  'records the missing plane certificate and zero nearest gap on the verified current rig at tick 366', async () => {
    const root = resolve(process.cwd(), '../..');
    const compiled = compileLocalRiggedSource(root, createIncident001SourceV2());
    const resources = await loadGeometryOnly(root);
    let sampler: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
    try {
      sampler = await createCandidateGeometrySampler({ resources, playable: compiled.playable,
        implementationLabel: 'quaternius-contact-clearance-v1' });
      const defender = compiled.canonicalToPublicActorHandles.get('defence-04')!;
      const attacker = compiled.canonicalToPublicActorHandles.get('attack-09')!;
      const result = diagnoseContactClearance({ defender350: sampler.sample(defender, 350),
        attacker350: sampler.sample(attacker, 350), defender366: sampler.sample(defender, 366),
        attacker366: sampler.sample(attacker, 366) });
      expect(result.status).toBe('not-separated-by-declared-plane');
      expect(result.plane.signedClearanceM).toBeLessThan(0);
      expect(result.closest.distance).toBe(0);
    } finally { sampler?.dispose(); resources.dispose(); }
  }, 360000);
