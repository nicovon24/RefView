import { createHash, webcrypto } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { compileLocalRiggedSource, verifyRiggedCalibrationResources } from '../../../../lib/authoring/rigged-calibration-report';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import { createCandidateGeometrySampler } from './geometry';
import { diagnoseContactSeparation } from './contact-separation';

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
    return { bodyScene: decoded[0]!.scene, hairScene: decoded[1]!.scene,
      clips: Object.freeze([...decoded[2]!.animations]), resourceDigest: createHash('sha256').update(manifest).digest('hex'),
      dispose };
  } catch (error) { dispose(); throw error; } finally {
    if (!priorProgress) delete (globalThis as { ProgressEvent?: typeof ProgressEvent }).ProgressEvent;
    if (!priorCrypto) delete (globalThis as { crypto?: Crypto }).crypto;
  }
}

it.skipIf(process.env.REFVIEW_RIGGED_CONTACT_SEPARATION_INTEGRATION !== '1')(
  'requires the old actual-resource tick-366 pose to pass the new whole-part acceptance gate', async () => {
    const root = resolve(process.cwd(), '../..');
    const compiled = compileLocalRiggedSource(root, createIncident001SourceV2());
    const resources = await loadGeometryOnly(root);
    let sampler: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
    try {
      sampler = await createCandidateGeometrySampler({ resources, playable: compiled.playable,
        implementationLabel: 'quaternius-contact-separation-v1' });
      const defender = compiled.canonicalToPublicActorHandles.get('defence-04')!;
      const attacker = compiled.canonicalToPublicActorHandles.get('attack-09')!;
      const d350 = sampler.sample(defender, 350); const a350 = sampler.sample(attacker, 350);
      const world = (point: { x: number; y: number; z: number },
        sample: typeof d350) => {
        const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
        return { x: point.x * c + point.z * s + sample.root.position.x,
          y: point.y + sample.root.position.y,
          z: -point.x * s + point.z * c + sample.root.position.z };
      };
      const from = world(d350.landmarks.leftAnkleBone, d350);
      const to = world(a350.landmarks.leftAnkleBone, a350);
      const result = diagnoseContactSeparation({ defender: sampler.sample(defender, 366),
        attacker: sampler.sample(attacker, 366),
        historicalAxis: { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z } });
      // Deliberately RED before the dependent pose edit. The measured diagnostic remains in test output.
      expect(result.firstFailingPair === null, JSON.stringify({ pairs: result.pairs.map((pair) => ({ parts: [pair.defenderPart, pair.attackerPart],
        status: pair.status, gapM: pair.bestPlane.gapM, surfaceM: pair.surface.distance,
        source: pair.bestPlane.source, defenderLimit: pair.bestPlane.defenderMaximum,
        attackerLimit: pair.bestPlane.attackerMinimum })), exteriorM: result.exteriorContact.distance }))
        .toBe(true);
      expect(result.exteriorContact.distance).toBeGreaterThanOrEqual(0.001);
      expect(result.exteriorContact.distance).toBeLessThanOrEqual(0.020);
    } finally { sampler?.dispose(); resources.dispose(); }
  }, 360000);
