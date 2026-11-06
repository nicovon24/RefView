import { createHash } from 'node:crypto';
import { webcrypto } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import type { CandidateGeometrySample, CandidateMesh } from './geometry';
import type { CalibrationGeometrySampler } from './calibration';
import { createCandidateGeometrySampler } from './geometry';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION } from '../resources/manifest';
import type { VerifiedPlayerResources } from '../resources';
import { compileLocalRiggedSource, verifyRiggedCalibrationResources,
  withStableRendererInput } from '../../../../lib/authoring/rigged-calibration-report';
import { compareRiggedContactLayers } from './contact-layer-comparison';

type Compiled = ReturnType<typeof compileCanonicalScenarioSourceV2>;
type Point = { x: number; y: number; z: number };
const p = (x: number, y: number, z: number): Point => ({ x, y, z });
const hash = (value: string | Uint8Array) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const fingerprint = `sha256:${'a'.repeat(64)}`;
const historicalBaselineHashes = { 'bindings.json': hash('old bindings'),
  'report.json': hash('old report'), 'metrics.json': hash('old metrics') };
let compiled: Compiled;
let attacker: string;
let defender: string;
let sampler: CalibrationGeometrySampler & { dispose: ReturnType<typeof vi.fn> };

function bounds(vertices: readonly { position: Point }[]) {
  return { min: p(Math.min(...vertices.map((entry) => entry.position.x)),
    Math.min(...vertices.map((entry) => entry.position.y)), Math.min(...vertices.map((entry) => entry.position.z))),
  max: p(Math.max(...vertices.map((entry) => entry.position.x)),
    Math.max(...vertices.map((entry) => entry.position.y)), Math.max(...vertices.map((entry) => entry.position.z))) };
}
function makeMesh(meshId: string, values: readonly (readonly [number, Point])[], triangles: readonly (readonly [number, number, number])[],
  regions: CandidateMesh['regions'], origin: Point): CandidateMesh {
  const vertices = values.map(([vertexId, position]) => ({ vertexId,
    position: p(position.x - origin.x, position.y - origin.y, position.z - origin.z) }));
  return { meshId, vertices, triangles, regions, broadPhaseBounds: bounds(vertices) };
}
function geometry(handle: string, tick: number, options: { duplicateShell?: boolean; reverse?: boolean } = {}): CandidateGeometrySample {
  const frame = compiled.playable.actors[tick]!.actors.find((actor) => actor.actorHandle === handle)!;
  const origin = frame.position;
  const body = [
    [10, p(13.8, 0.34, 36.8)], [20, p(13.9, 0.34, 36.8)], [30, p(13.8, 0.44, 36.8)],
    [40, p(tick === 366 ? 30 : 13.83, 0.37, 36.8)],
    [50, p(tick === 366 ? 30.1 : 13.93, 0.37, 36.8)],
    [60, p(tick === 366 ? 30 : 13.83, 0.47, 36.8)],
    [70, p(10, 0.2, 35)], [80, p(12, 0.2, 35)], [90, p(10, 1.5, 35)],
  ] as const;
  const shell = [[30, p(13.8, 0.44, 36.813)], [10, p(13.8, 0.34, 36.813)],
    [20, p(13.9, 0.34, 36.813)]] as const;
  const emptyBounds = { min: p(-100, -100, -100), max: p(100, 100, 100) };
  let meshes: CandidateMesh[];
  if (handle === defender) {
    meshes = [makeMesh('2:SuperHero_Male', body, [[10, 20, 30], [40, 50, 60], [70, 80, 90]],
      { leftBoot: { triangleIds: [0, 1], broadPhaseBounds: emptyBounds },
        torso: { triangleIds: [2], broadPhaseBounds: emptyBounds } }, origin),
    makeMesh('6:AuditionBoots', shell, options.duplicateShell ? [[30, 10, 20], [30, 10, 20]] : [[30, 10, 20]],
      { leftBoot: { triangleIds: options.duplicateShell ? [0, 1] : [0], broadPhaseBounds: emptyBounds } }, origin)];
  } else if (handle === attacker) {
    meshes = [makeMesh('6:AuditionBoots', [[110, p(13.83, 0.37, 36.8)], [120, p(13.83, 0.37, 36.8)],
      [130, p(13.83, 0.37, 36.8)]], [[110, 120, 130]],
    { leftBoot: { triangleIds: [0], broadPhaseBounds: emptyBounds },
      leftShin: { triangleIds: [0], broadPhaseBounds: emptyBounds } }, origin)];
  } else {
    meshes = [makeMesh('0:Other', [[210, p(-30, 5, -30)], [220, p(-29, 5, -30)], [230, p(-30, 6, -30)]],
      [[210, 220, 230]], { torso: { triangleIds: [0], broadPhaseBounds: emptyBounds } }, origin)];
  }
  if (options.reverse) meshes = meshes.reverse().map((mesh) => ({ ...mesh, vertices: [...mesh.vertices].reverse() }));
  return { actorHandle: handle, tick, root: { position: { ...origin }, yawRad: frame.yawRad }, meshes,
    landmarks: { headBone: p(0, 1.7, 0), torsoBone: p(0, 1, 0), leftAnkleBone: p(0, 0, 0),
      rightAnkleBone: p(0, 0, 0), groundRoot: p(0, 0, 0),
      leftBootToeSurface: { meshId: meshes[0]!.meshId, vertexId: meshes[0]!.vertices[0]!.vertexId, position: p(0, 0, 0) },
      rightBootToeSurface: { meshId: meshes[0]!.meshId, vertexId: meshes[0]!.vertices[0]!.vertexId, position: p(0, 0, 0) } } };
}
beforeAll(() => {
  const files: Record<string, string> = { 'player-rig': 'asset-001.mjs', 'run-clip': 'asset-002.mjs',
    'trip-clip': 'asset-003.mjs', 'challenge-clip': 'asset-004.mjs' };
  compiled = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
    resolveAssetBytes: (id, path) => {
      const name = files[id];
      return name && path === `/assets/${name}` ?
        readFileSync(new URL(`../../../../../../../packages/content/assets/${name}`, import.meta.url)) : undefined;
    }, ...createIncident001GeometryResolverV2(),
  });
  attacker = compiled.canonicalToPublicActorHandles.get('attack-09')!;
  defender = compiled.canonicalToPublicActorHandles.get('defence-04')!;
  sampler = { identity: { purpose: 'diagnostic-only', geometryVersion: 'rigged-posed-triangles-v1',
    regionPolicyVersion: 'dominant-skin-joint-v1', resourceDigest: hash('resources'),
    canonicalContentHash: compiled.contentHash, publicActorTimelineHash: hash(JSON.stringify(compiled.playable.actors)),
    appearance: { silhouette: 'athletic', kitStyle: 'solid', numbers: null, roster: {} },
    implementationLabel: 'layer-test' }, sample: (handle: string, tick: number) => geometry(handle, tick),
  dispose: vi.fn() } as unknown as typeof sampler;
});

describe('camera-independent contact layer comparison', () => {
  it('maps a buried body witness to a raised permuted shell and compares complete reports', async () => {
    const result = await compareRiggedContactLayers({ geometrySampler: sampler, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, historicalBaselineHashes });
    const { comparison } = result;
    expect(comparison.purpose).toBe('local-rigged-contact-layer-comparison');
    expect(comparison.baseline.bindings.defender.meshId).toBe('2:SuperHero_Male');
    expect(comparison.alternative.bindings.defender.meshId).toBe('6:AuditionBoots');
    expect(comparison.correspondence.body.vertexIds).toEqual([10, 20, 30]);
    expect(comparison.correspondence.shell.vertexIds).toEqual([30, 10, 20]);
    expect(comparison.correspondence.shell.barycentric).toEqual([
      comparison.correspondence.body.barycentric[2], comparison.correspondence.body.barycentric[0],
      comparison.correspondence.body.barycentric[1]]);
    expect(comparison.correspondence.posedSeparationM).toBeCloseTo(0.013, 8);
    expect(comparison.selectionCounts.defender.excludedBodyTriangles).toBe(1);
    expect(comparison.selectionCounts.defender.unmatchedSkinTriangles).toBe(1);
    expect(comparison.baseline.report.rows).toHaveLength(92);
    expect(comparison.alternative.report.rows).toHaveLength(92);
    expect(comparison.rowDifferences).toHaveLength(92);
    expect(comparison.baseline.report.rows.filter((row) => row.evidenceId === 'EV-INSIDE-AREA'))
      .toEqual(comparison.alternative.report.rows.filter((row) => row.evidenceId === 'EV-INSIDE-AREA'));
    expect(comparison.rowDifferences.filter((row) => row.evidenceId === 'EV-TRIP-CONTACT')).toHaveLength(32);
    expect(comparison.baseline.bindings.topologyHash).toBe(comparison.alternative.bindings.topologyHash);
    const contact = comparison.rowDifferences.find((row) => row.tick === 366 && row.evidenceId === 'EV-TRIP-CONTACT' &&
      row.viewId === 'A' && row.cameraMode === 'firstPerson')!;
    expect(contact.baseline.firstBlockers.contactFoot.eye?.actorHandle).toBe(defender);
    expect(contact.alternative.firstBlockers.contactFoot.eye?.actorHandle).toBe(defender);
    expect(comparison.alternative.report.rows.find((row) => row.tick === 367 && row.evidenceId === 'EV-TRIP-CONTACT')!
      .anchors.find((anchor) => anchor.anchorId === 'challengerFoot')?.binding?.triangleId).toBe(0);
    expect(comparison.historicalBaselineHashes).toEqual(historicalBaselineHashes);
    expect(result.metrics.alternativePairProductCount).toBe(2);
    expect(() => { (comparison.correspondence.shell.barycentric as unknown as number[])[0] = 99; }).toThrow();
    expect(sampler.dispose).not.toHaveBeenCalled();
  });

  it('rejects duplicate shell correspondence and preserves deterministic reversed input order', async () => {
    const ambiguous = { ...sampler, sample: (handle: string, tick: number) =>
      geometry(handle, tick, { duplicateShell: true }) } as CalibrationGeometrySampler;
    await expect(compareRiggedContactLayers({ geometrySampler: ambiguous, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, historicalBaselineHashes })).rejects.toThrow(/ambiguous|duplicate/i);
    const reverse = { ...sampler, sample: (handle: string, tick: number) =>
      geometry(handle, tick, { reverse: true }) } as CalibrationGeometrySampler;
    const direct = (await compareRiggedContactLayers({ geometrySampler: sampler, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, historicalBaselineHashes })).comparison;
    const reordered = (await compareRiggedContactLayers({ geometrySampler: reverse, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, historicalBaselineHashes })).comparison;
    expect(reordered).toEqual(direct);
  });
});

function historyHashes(root: string) {
  const output: Record<string, string> = {};
  for (const name of ['bindings.json', 'report.json', 'metrics.json']) {
    output[name] = hash(readFileSync(join(root, 'artifacts', 'rigged-calibration', name)));
  }
  return output;
}
function verifyComparisonOutput(root: string) {
  const resolvedRoot = realpathSync(root);
  const output = resolve(resolvedRoot, 'artifacts', 'rigged-calibration-layers');
  const within = relative(resolvedRoot, output);
  if (within.startsWith(`..${sep}`) || within === '..') throw new Error('Comparison output escaped repository');
  let cursor = resolvedRoot;
  for (const part of within.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try { const stat = lstatSync(cursor); if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Unsafe comparison output directory'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  for (const name of ['comparison.json', 'metrics.json']) {
    try { const stat = lstatSync(join(output, name));
      if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) throw new Error('Unsafe comparison output file');
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return output;
}
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

it.skipIf(process.env.REFVIEW_RIGGED_LAYER_INTEGRATION !== '1')(
  'compares the verified local 14-file model and preserves historical artifacts', async () => {
    const root = resolve(process.cwd(), '../..');
    const old = historyHashes(root);
    const oldSource = compileLocalRiggedSource(root, createIncident001SourceV2());
    const verifiedBefore = [...verifyRiggedCalibrationResources(root)].map(([name, bytes]) => [name,
      createHash('sha256').update(bytes).digest('hex')]);
    const result = await withStableRendererInput(root, async (rendererInputFingerprint) => {
      const resources = await loadGeometryOnly(root);
      let owned: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
      try {
        owned = await createCandidateGeometrySampler({ resources, playable: oldSource.playable,
          implementationLabel: 'quaternius-rigged-calibration-candidate-v1' });
        return await compareRiggedContactLayers({ geometrySampler: owned, compiledSource: oldSource,
          rendererInputFingerprint, historicalBaselineHashes: old });
      } finally { owned?.dispose(); resources.dispose(); }
    });
    const currentSource = compileLocalRiggedSource(root, createIncident001SourceV2());
    expect(currentSource.contentHash).toBe(oldSource.contentHash);
    expect(currentSource.playable.contentHash).toBe(oldSource.playable.contentHash);
    const verifiedAfter = [...verifyRiggedCalibrationResources(root)].map(([name, bytes]) => [name,
      createHash('sha256').update(bytes).digest('hex')]);
    expect(verifiedAfter).toEqual(verifiedBefore);
    expect(historyHashes(root)).toEqual(old);
    expect(result.comparison.baseline.report.rows).toHaveLength(92);
    expect(result.comparison.alternative.report.rows).toHaveLength(92);
    const output = verifyComparisonOutput(root);
    mkdirSync(output, { recursive: true });
    verifyComparisonOutput(root);
    writeFileSync(join(output, 'comparison.json'), `${JSON.stringify(result.comparison, null, 2)}\n`);
    writeFileSync(join(output, 'metrics.json'), `${JSON.stringify(result.metrics, null, 2)}\n`);
    expect(historyHashes(root)).toEqual(old);
  }, 360000);
