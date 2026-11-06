import { createHash, webcrypto } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync, type Stats } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../packages/content/src/authored-incident-v2';
import { createCandidateGeometrySampler } from '../../features/simulator/rigged-player/evidence/geometry';
import { PLAYER_RESOURCE_FILES, PLAYER_RESOURCE_ROOT, PLAYER_RESOURCE_VERSION,
  type PlayerResourcePath } from '../../features/simulator/rigged-player/resources/manifest';
import type { VerifiedPlayerResources } from '../../features/simulator/rigged-player/resources';
import { createRendererFingerprintV1 } from './renderer-fingerprint-v1';

const CANDIDATE_VERSION = 'quaternius-rigged-calibration-candidate-v1';
const PURPOSE = 'local-rigged-calibration-candidate';
const PNPM_VERSION = '10.33.2';
const fileRoot = join('apps', 'web', 'public', 'assets', 'player-audition');

type CompiledSource = ReturnType<typeof compileCanonicalScenarioSourceV2>;
type PilotModule = typeof import('../../features/simulator/rigged-player/evidence/calibration');
type LocalRunInput = Readonly<{ repoRoot: string; outputDirectory: string }>;

function hash(bytes: Uint8Array | string) { return createHash('sha256').update(bytes).digest('hex'); }
function lstatIfPresent(path: string): Stats | undefined {
  try { return lstatSync(path); } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Rejects traversal and existing symlinks before the adapter creates any output. */
export function validateRiggedCalibrationOutputDirectory(repoRoot: string, outputDirectory: string): string {
  if (!isAbsolute(repoRoot) || !isAbsolute(outputDirectory)) throw new TypeError('Absolute paths are required');
  const root = realpathSync(repoRoot);
  const base = resolve(root, 'artifacts', 'rigged-calibration');
  const output = resolve(outputDirectory);
  const within = relative(base, output);
  if (within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) {
    throw new RangeError('Output must stay in artifacts/rigged-calibration');
  }
  const fromRoot = relative(root, output);
  let cursor = root;
  for (const part of fromRoot.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatIfPresent(cursor);
    if (stat?.isSymbolicLink()) {
      throw new RangeError(`Calibration output path contains a symlink: ${cursor}`);
    }
    if (stat && !stat.isDirectory()) throw new RangeError(`Calibration output path is not a directory: ${cursor}`);
  }
  for (const name of ['bindings.json', 'report.json', 'metrics.json']) {
    const destination = join(output, name);
    const stat = lstatIfPresent(destination);
    if (stat?.isSymbolicLink()) throw new RangeError(`Calibration output file is a symlink: ${destination}`);
    if (stat && (!stat.isFile() || stat.nlink !== 1)) {
      throw new RangeError(`Calibration output file has an unsafe link or type: ${destination}`);
    }
  }
  return output;
}

/** Reads and verifies the full declared 14-file closure before any GLTF parser sees bytes. */
export function verifyRiggedCalibrationResources(repoRoot: string): ReadonlyMap<PlayerResourcePath, Buffer> {
  if (!isAbsolute(repoRoot)) throw new TypeError('Absolute repository root required');
  if (PLAYER_RESOURCE_FILES.length !== 14) throw new Error('Unexpected player resource closure');
  const root = realpathSync(repoRoot);
  const verified = new Map<PlayerResourcePath, Buffer>();
  for (const entry of PLAYER_RESOURCE_FILES) {
    const bytes = readFileSync(join(root, fileRoot, entry.path));
    if (bytes.byteLength !== entry.bytes || hash(bytes) !== entry.sha256) {
      throw new Error(`Player resource integrity mismatch: ${entry.path}`);
    }
    verified.set(entry.path, bytes);
  }
  return verified;
}

/** The injected provider is only a narrow test seam; the production runner always uses the fixed fingerprint. */
export async function withStableRendererInput<T>(repoRoot: string, compute: (fingerprint: string) => Promise<T>,
  provider: (root: string) => Readonly<{ fingerprint: string }> =
    (root) => createRendererFingerprintV1(root, PNPM_VERSION)): Promise<T> {
  const before = provider(repoRoot).fingerprint;
  const result = await compute(before);
  const after = provider(repoRoot).fingerprint;
  if (before !== after) throw new Error('Renderer input changed during rigged calibration');
  return result;
}

/** Compile only the repository's authored incident and exact canonical/served asset bytes. */
export function compileLocalRiggedSource(repoRoot: string,
  source: ReturnType<typeof createIncident001SourceV2>): CompiledSource {
  if (!isAbsolute(repoRoot)) throw new TypeError('Absolute repository root required');
  const root = realpathSync(repoRoot);
  const original = JSON.stringify(source);
  const declared = new Map(source.rendering.assets.map((asset) => [asset.assetId, asset.neutralClientPath]));
  const compiled = compileCanonicalScenarioSourceV2(source, {
    ...createIncident001GeometryResolverV2(),
    resolveAssetBytes: (assetId, neutralClientPath) => {
      if (declared.get(assetId) !== neutralClientPath || !/^\/assets\/asset-[0-9]{3,}\.mjs$/.test(neutralClientPath)) {
        return undefined;
      }
      const name = neutralClientPath.slice('/assets/'.length);
      const canonical = readFileSync(join(root, 'packages', 'content', 'assets', name));
      const served = readFileSync(join(root, 'apps', 'web', 'public', 'assets', name));
      if (!canonical.equals(served)) throw new Error(`Served canonical asset mismatch: ${name}`);
      return canonical;
    },
  });
  if (JSON.stringify(source) !== original) throw new Error('Authored source mutated during compilation');
  return compiled;
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

function disposeGltfs(gltfs: readonly GLTF[]) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const skeletons = new Set<THREE.Skeleton>();
  for (const gltf of gltfs) for (const scene of gltf.scenes) scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
}

async function loadVerifiedGeometryOnlyResources(verified: ReadonlyMap<PlayerResourcePath, Buffer>): Promise<VerifiedPlayerResources> {
  const priorProgressEvent = globalThis.ProgressEvent;
  const priorCrypto = globalThis.crypto;
  if (!priorProgressEvent) globalThis.ProgressEvent = class {} as unknown as typeof ProgressEvent;
  if (!priorCrypto) globalThis.crypto = webcrypto as Crypto;
  const decoded: GLTF[] = [];
  try {
    const loader = new GLTFLoader();
    decoded.push(await loader.parseAsync(strippedGltf(verified.get('Superhero_Male_FullBody.gltf')!,
      verified.get('Superhero_Male_FullBody.bin')!), ''));
    decoded.push(await loader.parseAsync(strippedGltf(verified.get('hair/Hair_SimpleParted.gltf')!,
      verified.get('hair/Hair_SimpleParted.bin')!), ''));
    const animation = verified.get('UAL1_Standard.glb')!;
    decoded.push(await loader.parseAsync(animation.buffer.slice(animation.byteOffset,
      animation.byteOffset + animation.byteLength) as ArrayBuffer, ''));
    if (!(decoded[0]!.scene instanceof THREE.Group) || !(decoded[1]!.scene instanceof THREE.Group) ||
      decoded[2]!.animations.length === 0) throw new Error('Incomplete verified geometry-only player resources');
    const manifestIdentity = `${PLAYER_RESOURCE_VERSION}\n${PLAYER_RESOURCE_FILES.map((entry) =>
      `${PLAYER_RESOURCE_ROOT}${entry.path}\t${entry.bytes}\t${entry.sha256}`).sort().join('\n')}`;
    let disposed = false;
    return { bodyScene: decoded[0]!.scene, hairScene: decoded[1]!.scene,
      clips: Object.freeze([...decoded[2]!.animations]), resourceDigest: hash(manifestIdentity),
      dispose() { if (disposed) return; disposed = true; disposeGltfs(decoded); } };
  } catch (error) { disposeGltfs(decoded); throw error; } finally {
    if (!priorProgressEvent) delete (globalThis as { ProgressEvent?: typeof ProgressEvent }).ProgressEvent;
    if (!priorCrypto) delete (globalThis as { crypto?: Crypto }).crypto;
  }
}

function assertLocalPurpose(value: unknown): void {
  if (!value || typeof value !== 'object' || !('purpose' in value) || value.purpose !== PURPOSE) {
    throw new Error('Unexpected calibration output purpose');
  }
}

/** Local-only diagnostic run. All accepted files are written after the second renderer fingerprint. */
export async function runLocalRiggedCalibrationReport({ repoRoot, outputDirectory }: LocalRunInput) {
  const output = validateRiggedCalibrationOutputDirectory(repoRoot, outputDirectory);
  const result = await withStableRendererInput(repoRoot, async (rendererInputFingerprint) => {
    const verified = verifyRiggedCalibrationResources(repoRoot);
    const resources = await loadVerifiedGeometryOnlyResources(verified);
    let sampler: Awaited<ReturnType<typeof createCandidateGeometrySampler>> | undefined;
    try {
      const compiledSource = compileLocalRiggedSource(repoRoot, createIncident001SourceV2());
      sampler = await createCandidateGeometrySampler({ resources, playable: compiledSource.playable,
        implementationLabel: CANDIDATE_VERSION });
      const pilot: PilotModule = await import('../../features/simulator/rigged-player/evidence/calibration');
      const shared = { geometrySampler: sampler, compiledSource, rendererInputFingerprint };
      const seeded = await pilot.seedRiggedContactBindings(shared);
      const executed = await pilot.runRiggedCalibrationPilot({ ...shared, bindings: seeded.bindings });
      assertLocalPurpose(seeded.bindings);
      assertLocalPurpose(executed.report);
      return { bindings: seeded.bindings, report: executed.report,
        metrics: { seed: seeded.metrics, pilot: executed.metrics,
          geometryLoading: 'verified-geometry-only', materialCullingSimulated: false,
          rendererInputFingerprint } };
    } finally { sampler?.dispose(); resources.dispose(); }
  });
  validateRiggedCalibrationOutputDirectory(repoRoot, output);
  mkdirSync(output, { recursive: true });
  const paths = { bindings: join(output, 'bindings.json'), report: join(output, 'report.json'),
    metrics: join(output, 'metrics.json') };
  writeFileSync(paths.bindings, `${JSON.stringify(result.bindings, null, 2)}\n`);
  writeFileSync(paths.report, `${JSON.stringify(result.report, null, 2)}\n`);
  writeFileSync(paths.metrics, `${JSON.stringify(result.metrics, null, 2)}\n`);
  return { paths, rendererInputFingerprint: result.metrics.rendererInputFingerprint };
}
