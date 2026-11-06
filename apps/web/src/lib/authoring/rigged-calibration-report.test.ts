import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, linkSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PLAYER_RESOURCE_FILES } from '../../features/simulator/rigged-player/resources/manifest';
import { createIncident001SourceV2 } from '../../../../../packages/content/src/authored-incident-v2';
import { compileLocalRiggedSource, validateRiggedCalibrationOutputDirectory,
  verifyRiggedCalibrationResources, withStableRendererInput,
  runLocalRiggedCalibrationReport } from './rigged-calibration-report';

const repoRoot = resolve(import.meta.dirname, '../../../../..');
const temporary: string[] = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function temporaryRoot() { const root = mkdtempSync(join(tmpdir(), 'refview-rigged-report-')); temporary.push(root); return root; }

describe('local rigged calibration report boundaries', () => {
  it('confines output to the repository calibration artifact tree and rejects symlink escape', () => {
    const root = temporaryRoot();
    expect(validateRiggedCalibrationOutputDirectory(root, join(root, 'artifacts', 'rigged-calibration')))
      .toBe(join(root, 'artifacts', 'rigged-calibration'));
    expect(() => validateRiggedCalibrationOutputDirectory(root, join(root, 'artifacts', 'other'))).toThrow();
    expect(() => validateRiggedCalibrationOutputDirectory(root, join(root, 'artifacts', 'rigged-calibration', '..', 'other'))).toThrow();
    const outside = temporaryRoot();
    mkdirSync(join(root, 'artifacts', 'rigged-calibration'), { recursive: true });
    symlinkSync(outside, join(root, 'artifacts', 'rigged-calibration', 'escape'), 'junction');
    expect(() => validateRiggedCalibrationOutputDirectory(root,
      join(root, 'artifacts', 'rigged-calibration', 'escape'))).toThrow(/symlink/);
    const outsideFile = join(outside, 'external.json');
    writeFileSync(outsideFile, 'untouched');
    symlinkSync(outside, join(root, 'artifacts', 'rigged-calibration', 'report.json'), 'junction');
    expect(() => validateRiggedCalibrationOutputDirectory(root,
      join(root, 'artifacts', 'rigged-calibration'))).toThrow(/symlink/);
    const hardlinkRoot = temporaryRoot();
    mkdirSync(join(hardlinkRoot, 'artifacts', 'rigged-calibration'), { recursive: true });
    linkSync(outsideFile, join(hardlinkRoot, 'artifacts', 'rigged-calibration', 'metrics.json'));
    expect(() => validateRiggedCalibrationOutputDirectory(hardlinkRoot,
      join(hardlinkRoot, 'artifacts', 'rigged-calibration'))).toThrow(/link/);
    expect(readFileSync(outsideFile, 'utf8')).toBe('untouched');
  });

  it('verifies every declared byte count and hash before parsing any resource', () => {
    const root = temporaryRoot();
    for (const entry of PLAYER_RESOURCE_FILES) {
      const destination = join(root, 'apps', 'web', 'public', 'assets', 'player-audition', entry.path);
      mkdirSync(resolve(destination, '..'), { recursive: true });
      copyFileSync(join(repoRoot, 'apps', 'web', 'public', 'assets', 'player-audition', entry.path), destination);
    }
    const verified = verifyRiggedCalibrationResources(root);
    expect(verified.size).toBe(14);
    for (const entry of PLAYER_RESOURCE_FILES) {
      const bytes = verified.get(entry.path)!;
      expect(bytes.length).toBe(entry.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
    }
    const corrupted = join(root, 'apps', 'web', 'public', 'assets', 'player-audition', PLAYER_RESOURCE_FILES[0]!.path);
    const bytes = readFileSync(corrupted); bytes[0] ^= 1; writeFileSync(corrupted, bytes);
    expect(() => verifyRiggedCalibrationResources(root)).toThrow(/integrity/);
    expect(existsSync(join(root, 'artifacts', 'rigged-calibration', 'report.json'))).toBe(false);
  });

  it('rejects renderer input drift before a result can be accepted', async () => {
    let reads = 0;
    const fingerprint = () => ({ fingerprint: ++reads === 1 ? 'sha256:before' : 'sha256:after' });
    await expect(withStableRendererInput('unused', async () => ({ purpose: 'candidate' }), fingerprint))
      .rejects.toThrow(/changed/);
    expect(reads).toBe(2);
  });

  it('compiles the actual authored source without mutating caller data', () => {
    const source = createIncident001SourceV2();
    const before = JSON.stringify(source);
    const compiled = compileLocalRiggedSource(repoRoot, source);
    expect(JSON.stringify(source)).toBe(before);
    expect(compiled.playable.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it.runIf(process.env.REFVIEW_RIGGED_CALIBRATION_INTEGRATION === '1')(
    'runs the verified actual-resource pilot and emits only local candidate artifacts', async () => {
      const source = createIncident001SourceV2();
      const sourceBefore = JSON.stringify(source);
      const resourceHashes = () => PLAYER_RESOURCE_FILES.map((entry) => createHash('sha256')
        .update(readFileSync(join(repoRoot, 'apps', 'web', 'public', 'assets', 'player-audition', entry.path)))
        .digest('hex'));
      const before = resourceHashes();
      expect(before).toEqual(PLAYER_RESOURCE_FILES.map((entry) => entry.sha256));
      const outputDirectory = join(repoRoot, 'artifacts', 'rigged-calibration');
      const result = await runLocalRiggedCalibrationReport({ repoRoot, outputDirectory });
      expect(result.paths).toEqual({ bindings: join(outputDirectory, 'bindings.json'),
        report: join(outputDirectory, 'report.json'), metrics: join(outputDirectory, 'metrics.json') });
      const bindings = JSON.parse(readFileSync(result.paths.bindings, 'utf8')) as Record<string, unknown>;
      const report = JSON.parse(readFileSync(result.paths.report, 'utf8')) as {
        purpose: string; identity: Record<string, string>; rows: Array<{ tick: number; evidenceId: string;
          viewId: string; cameraMode: string; classification: string;
          anchors: Array<{ anchorId: string; eye: Record<string, unknown>; camera: Record<string, unknown> }> }> };
      const metrics = JSON.parse(readFileSync(result.paths.metrics, 'utf8')) as {
        seed: { seedPairProductCount: number; elapsedMs: number };
        pilot: { triangleCount: number; rayCastCount: number; rayReuseCount: number; elapsedMs: number };
        geometryLoading: string; materialCullingSimulated: boolean; rendererInputFingerprint: string };
      expect(bindings.purpose).toBe('local-rigged-calibration-candidate');
      expect(report.purpose).toBe('local-rigged-calibration-candidate');
      expect(report.rows).toHaveLength(92);
      expect(new Set(report.rows.map((row) => row.tick)).size).toBe(15);
      expect(report.identity.sourceContentHash).toBe(bindings.sourceContentHash);
      expect(report.identity.resourceDigest).toBe(bindings.resourceDigest);
      expect(report.identity.publicActorTimelineHash).toBe(bindings.publicActorTimelineHash);
      expect(report.identity.rendererInputFingerprint).toBe(result.rendererInputFingerprint);
      expect(metrics.rendererInputFingerprint).toBe(result.rendererInputFingerprint);
      expect(metrics.geometryLoading).toBe('verified-geometry-only');
      expect(metrics.materialCullingSimulated).toBe(false);
      expect(metrics.seed.seedPairProductCount).toBeGreaterThan(0);
      expect(metrics.pilot.triangleCount).toBeGreaterThan(0);
      expect(metrics.pilot.rayCastCount).toBeGreaterThan(0);
      expect(metrics.pilot.rayReuseCount).toBeGreaterThanOrEqual(0);
      expect(metrics.seed.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(metrics.pilot.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(bindings).not.toHaveProperty('elapsedMs');
      expect(report).not.toHaveProperty('elapsedMs');
      expect(report).not.toHaveProperty('score');
      expect(resourceHashes()).toEqual(before);
      expect(JSON.stringify(source)).toBe(sourceBefore);
      expect(compileLocalRiggedSource(repoRoot, source).contentHash).toBe(report.identity.sourceContentHash);
      const classCounts = Object.fromEntries(['joint', 'cameraOnly', 'eyeOnly', 'neither'].map((name) =>
        [name, report.rows.filter((row) => row.classification === name).length]));
      const firstBlocker = report.rows.flatMap((row) => row.anchors.filter((anchor) =>
        !(anchor.eye.candidateAvailable && anchor.camera.candidateAvailable)).map((anchor) => ({
        tick: row.tick, evidenceId: row.evidenceId, viewId: row.viewId, cameraMode: row.cameraMode,
        anchorId: anchor.anchorId, eyeGates: anchor.eye.gates, cameraGates: anchor.camera.gates,
        eyeHit: anchor.eye.rawEyeHit !== null, cameraHit: anchor.camera.nearClippedHit !== null,
      })))[0];
      console.log('actual rigged calibration', { paths: result.paths,
        seedSeparationM: bindings.seedSeparationM,
        seedDistanceToAuthoredContactM: bindings.seedDistanceToAuthoredContactM,
        classCounts, firstBlocker, metrics });
    }, 600000);
});
