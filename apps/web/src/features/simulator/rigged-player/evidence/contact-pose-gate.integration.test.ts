import { createHash, webcrypto } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { compileLocalRiggedSource, verifyRiggedCalibrationResources } from '../../../../lib/authoring/rigged-calibration-report';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import { certifyContactSeparation } from './contact-separation';
import { findExteriorContactWitness } from './contact-witness';
import { createCandidateGeometrySampler, type CandidateGeometrySample } from './geometry';

type Point = Readonly<{ x: number; y: number; z: number }>;
const digest = (value: string | Uint8Array) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

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

function world(point: Point, sample: CandidateGeometrySample): Point {
  const c = Math.cos(sample.root.yawRad); const s = Math.sin(sample.root.yawRad);
  return { x: point.x * c + point.z * s + sample.root.position.x,
    y: point.y + sample.root.position.y,
    z: -point.x * s + point.z * c + sample.root.position.z };
}

async function requireActualResourcePose(mode: 'peak' | 'window') {
  const root = resolve(process.cwd(), '../..');
  const source = compileLocalRiggedSource(root, createIncident001SourceV2());
  const resources = await loadGeometryOnly(root);
  let sampler: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
  try {
    sampler = await createCandidateGeometrySampler({ resources, playable: source.playable,
      implementationLabel: 'quaternius-contact-pose-gate-v1' });
    const defenderHandle = source.canonicalToPublicActorHandles.get('defence-04')!;
    const attackerHandle = source.canonicalToPublicActorHandles.get('attack-09')!;
    const d350 = sampler.sample(defenderHandle, 350);
    const a350 = sampler.sample(attackerHandle, 350);
    const from = world(d350.landmarks.leftAnkleBone, d350);
    const to = world(a350.landmarks.leftAnkleBone, a350);
    const historicalAxis = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
    const identity = { source: { canonicalContentHash: source.contentHash,
      playableContentHash: source.playable.contentHash },
    resources: { version: PLAYER_RESOURCE_VERSION, manifestDigest: `sha256:${resources.resourceDigest}` },
    timeline: { contactTick: 366, axisTick: 350, publicActorTimelineHash: sampler.identity.publicActorTimelineHash,
      defenderHandle, attackerHandle }, geometrySampler: sampler.identity };
    const ticks = mode === 'peak' ? [366] : Array.from({ length: 41 }, (_, index) => 346 + index);
    let worstVerifiedGapM = Infinity;
    let membershipIdentity: string | undefined;
    let peak: { defender: CandidateGeometrySample; attacker: CandidateGeometrySample } | undefined;
    for (const tick of ticks) {
      const defender = sampler.sample(defenderHandle, tick);
      const attacker = sampler.sample(attackerHandle, tick);
      const certificate = certifyContactSeparation({ defender, attacker, historicalAxis });
      const currentMembershipIdentity = digest(JSON.stringify(certificate.pairs.map((pair) => pair.membership)));
      if (membershipIdentity === undefined) membershipIdentity = currentMembershipIdentity;
      expect(currentMembershipIdentity, JSON.stringify({ mode, tick, identity, membershipIdentity,
        currentMembershipIdentity, reason: 'Part membership/topology changed' })).toBe(membershipIdentity);
      expect(certificate.status, JSON.stringify({ mode, tick, identity, membershipIdentity,
        minimumSignedCandidateGapM: certificate.minimumSignedCandidateGapM,
        worstVerifiedGapM: Number.isFinite(worstVerifiedGapM) ? worstVerifiedGapM : null,
        firstFailingPair: certificate.firstFailingPair && {
          defenderPart: certificate.firstFailingPair.defenderPart,
          attackerPart: certificate.firstFailingPair.attackerPart,
          gapM: certificate.firstFailingPair.bestPlane.gapM,
          plane: certificate.firstFailingPair.bestPlane,
          membershipMeshes: {
            defender: certificate.firstFailingPair.membership.defender.map((mesh) =>
              ({ meshId: mesh.meshId, triangleCount: mesh.triangles.length })),
            attacker: certificate.firstFailingPair.membership.attacker.map((mesh) =>
              ({ meshId: mesh.meshId, triangleCount: mesh.triangles.length })),
          } },
      })).toBe('certified');
      worstVerifiedGapM = Math.min(worstVerifiedGapM, certificate.minimumSignedCandidateGapM);
      if (tick === 366) peak = { defender, attacker };
    }
    if (mode === 'window' && !peak) throw new Error('Peak tick missing from certification window');
    const contact = findExteriorContactWitness(peak!.defender, peak!.attacker, 0.020);
    const contactDistanceUpperBoundM = contact?.distance ?? null;
    expect(contactDistanceUpperBoundM, JSON.stringify({ mode, tick: 366, identity, membershipIdentity,
      worstVerifiedGapM, contactDistanceUpperBoundM, contactWitness: contact,
      reason: 'Exterior witness search returned no qualifying witness within 20 mm' }))
      .not.toBeNull();
    expect(contactDistanceUpperBoundM!).toBeLessThanOrEqual(0.020);
    expect(worstVerifiedGapM).toBeGreaterThanOrEqual(0.001);
  } finally { sampler?.dispose(); resources.dispose(); }
}

it.skipIf(process.env.REFVIEW_RIGGED_CONTACT_POSE_PEAK !== '1')(
  'certifies all four actual-resource part pairs and an exterior contact witness at tick 366',
  () => requireActualResourcePose('peak'), 1200000);

it.skipIf(process.env.REFVIEW_RIGGED_CONTACT_POSE_WINDOW !== '1')(
  'certifies every actual-resource tick 346–386 and an exterior contact witness at tick 366',
  () => requireActualResourcePose('window'), 1200000);
