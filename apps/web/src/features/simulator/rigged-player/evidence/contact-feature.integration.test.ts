import { createHash, webcrypto } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { it, expect } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import { compileLocalRiggedSource, verifyRiggedCalibrationResources,
  withStableRendererInput } from '../../../../lib/authoring/rigged-calibration-report';
import { createCandidateGeometrySampler } from './geometry';
import { trackContactFeature, type ContactFeature } from './contact-feature';
import { buildContactVisualization } from './contact-visualization';

const sha256 = (value: string | Uint8Array) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

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

function outputFile(root: string, name: 'report.json' | 'visualization.json' | 'visualization-attestation.json'): string {
  const base = realpathSync(root);
  const directory = resolve(base, 'artifacts', 'rigged-contact-feature');
  const within = relative(base, directory);
  if (within === '..' || within.startsWith(`..${sep}`)) throw new Error('Report escaped repository');
  let cursor = base;
  for (const part of within.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try { const stat = lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Unsafe report directory');
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  const output = join(directory, name);
  try { const stat = lstatSync(output);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) throw new Error('Unsafe report file');
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  return output;
}

function historicalHashes(root: string) {
  return Object.fromEntries(['bindings.json', 'report.json', 'metrics.json'].map((name) =>
    [name, sha256(readFileSync(join(root, 'artifacts', 'rigged-calibration', name)))]));
}

type FrozenReport = Readonly<{
  purpose: string; status: string;
  source: { canonicalContentHash: string; playableContentHash: string;
    defenderHandle: string; attackerHandle: string };
  resources: { version: string; manifestDigest: string; verifiedFiles: string[][] };
  timeline: { contactTick: number; axisTick: number; trackedTicks: number[];
    publicActorTimelineHash: string };
  geometry: { identity: string; samplerIdentity: unknown };
  rendererInputFingerprintBefore: string; rendererInputFingerprintAfter: string;
  selected: ContactFeature;
  tracked: ReturnType<typeof trackContactFeature>[];
}>;

it.skipIf(process.env.REFVIEW_RIGGED_CONTACT_FEATURE_INTEGRATION !== '1')(
  'writes the frozen contact visualization without changing historical evidence', async () => {
    const root = resolve(process.cwd(), '../..');
    const output = outputFile(root, 'report.json');
    const visualizationOutput = outputFile(root, 'visualization.json');
    const attestationOutput = outputFile(root, 'visualization-attestation.json');
    const reportBytesBefore = readFileSync(output);
    const reportHashBefore = sha256(reportBytesBefore);
    const report = JSON.parse(reportBytesBefore.toString('utf8')) as FrozenReport;
    if (report.purpose !== 'local-rigged-contact-feature-diagnostic' || report.status !== 'accepted' ||
      report.selected?.status !== 'accepted') throw new Error('No accepted frozen contact report');
    expect(report.timeline.contactTick).toBe(366);
    expect(report.timeline.axisTick).toBe(350);
    expect(report.timeline.trackedTicks).toEqual([364, 365, 366, 367, 368, 369, 370, 371]);
    expect(report.rendererInputFingerprintBefore).toBe(report.rendererInputFingerprintAfter);
    const historicalBefore = historicalHashes(root);
    const resourceHashesBefore = [...verifyRiggedCalibrationResources(root)].map(([name, bytes]) => [name, sha256(bytes)]);
    const source = compileLocalRiggedSource(root, createIncident001SourceV2());
    const visualization = await withStableRendererInput(root, async (rendererInputFingerprint) => {
      const resources = await loadGeometryOnly(root);
      let sampler: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
      try {
        sampler = await createCandidateGeometrySampler({ resources, playable: source.playable,
          implementationLabel: 'quaternius-contact-feature-v1' });
        const defenderHandle = source.canonicalToPublicActorHandles.get('defence-04')!;
        const attackerHandle = source.canonicalToPublicActorHandles.get('attack-09')!;
        const geometryIdentity = sha256(JSON.stringify(sampler.identity));
        expect(report.source).toEqual({ canonicalContentHash: source.contentHash,
          playableContentHash: source.playable.contentHash, defenderHandle, attackerHandle });
        expect(report.resources).toEqual({ version: PLAYER_RESOURCE_VERSION,
          manifestDigest: `sha256:${resources.resourceDigest}`, verifiedFiles: resourceHashesBefore });
        expect(report.timeline.publicActorTimelineHash).toBe(sampler.identity.publicActorTimelineHash);
        expect(report.geometry).toEqual({ identity: geometryIdentity, samplerIdentity: sampler.identity });
        expect(report.selected.geometryIdentity).toBe(geometryIdentity);
        expect(report.selected.defender.binding.actorHandle).toBe(defenderHandle);
        expect(report.selected.attacker.binding.actorHandle).toBe(attackerHandle);
        const samples = Array.from({ length: 8 }, (_, index) => {
          const tick = 364 + index;
          return { defender: sampler!.sample(defenderHandle, tick), attacker: sampler!.sample(attackerHandle, tick) };
        });
        const tracked = samples.map(({ defender, attacker }, index) =>
          trackContactFeature({ feature: report.selected, tick: 364 + index, geometryIdentity, defender, attacker }));
        expect(tracked).toEqual(report.tracked);
        return buildContactVisualization({ feature: report.selected, geometryIdentity,
          identity: { canonicalContentHash: source.contentHash,
            resourceDigest: sampler.identity.resourceDigest,
            publicActorTimelineHash: sampler.identity.publicActorTimelineHash,
            rendererInputFingerprint },
          samples: [samples[0]!, samples[2]!, samples[6]!, samples[7]!] });
      } finally { sampler?.dispose(); resources.dispose(); }
    });
    expect(visualization.identity).toEqual({ canonicalContentHash: report.source.canonicalContentHash,
      resourceDigest: report.resources.manifestDigest.slice('sha256:'.length),
      publicActorTimelineHash: report.timeline.publicActorTimelineHash,
      geometryIdentity: report.geometry.identity,
      rendererInputFingerprint: visualization.identity.rendererInputFingerprint });
    expect(report.rendererInputFingerprintBefore).toBe(report.rendererInputFingerprintAfter);
    expect(visualization.rows.map((row) => row.tick)).toEqual([364, 366, 370, 371]);
    expect(visualization.rows.map((row) => [row.defender.actorHandle, row.attacker.actorHandle]))
      .toEqual(Array.from({ length: 4 }, () => [report.source.defenderHandle, report.source.attackerHandle]));
    const sourceAfter = compileLocalRiggedSource(root, createIncident001SourceV2());
    expect(sourceAfter.contentHash).toBe(source.contentHash);
    expect(sourceAfter.playable.contentHash).toBe(source.playable.contentHash);
    expect([...verifyRiggedCalibrationResources(root)].map(([name, bytes]) => [name, sha256(bytes)]))
      .toEqual(resourceHashesBefore);
    expect(historicalHashes(root)).toEqual(historicalBefore);
    expect(sha256(readFileSync(output))).toBe(reportHashBefore);
    outputFile(root, 'report.json');
    outputFile(root, 'visualization.json');
    outputFile(root, 'visualization-attestation.json');
    const visualizationBytes = `${JSON.stringify(visualization)}\n`;
    const attestation = {
      purpose: 'local-rigged-contact-visualization-reconstruction',
      reportSha256: reportHashBefore,
      visualizationSha256: sha256(visualizationBytes),
      historicalReportRendererInputFingerprint: report.rendererInputFingerprintAfter,
      currentStableRendererInputFingerprint: visualization.identity.rendererInputFingerprint,
      sidecarIdentity: visualization.identity,
      frozenBindings: { defender: report.selected.defender.binding, attacker: report.selected.attacker.binding },
      trackedRowsSha256: sha256(JSON.stringify(report.tracked)),
      selectionRecomputed: false,
      visualReviewStatus: 'pending',
      limits: ['Diagnostic reconstruction only; no new contact selection or training attachment.',
        'Current renderer fingerprint identifies local inputs, not a reviewed running build.',
        'Marked geometry does not establish visual readability or certified penetration depth.'],
    };
    mkdirSync(resolve(root, 'artifacts', 'rigged-contact-feature'), { recursive: true });
    writeFileSync(visualizationOutput, visualizationBytes);
    writeFileSync(attestationOutput, `${JSON.stringify(attestation, null, 2)}\n`);
    expect(JSON.parse(readFileSync(visualizationOutput, 'utf8'))).toEqual(visualization);
    expect(JSON.parse(readFileSync(attestationOutput, 'utf8'))).toEqual(attestation);
    expect(sha256(readFileSync(visualizationOutput))).toBe(attestation.visualizationSha256);
    expect(sha256(readFileSync(output))).toBe(reportHashBefore);
    expect(historicalHashes(root)).toEqual(historicalBefore);
  }, 360000);
