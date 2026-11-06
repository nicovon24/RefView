import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';
import type { CandidateGeometrySample } from './geometry';
import { runRiggedCalibrationPilot, seedRiggedContactBindings, type CalibrationGeometrySampler } from './calibration';
import { castSurfaceSegment } from './surface-query';

type Compiled = ReturnType<typeof compileCanonicalScenarioSourceV2>;
type Point = { x: number; y: number; z: number };
const point = (x: number, y: number, z: number): Point => ({ x, y, z });
const hash = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const fingerprint = `sha256:${'a'.repeat(64)}`;
let compiled: Compiled;
let sampler: CalibrationGeometrySampler;
let attacker: string;
let defender: string;
let sampled: ReturnType<typeof vi.fn>;

function geometry(actorHandle: string, tick: number,
  options: { contact?: Point; selfScreen?: boolean } = {}): CandidateGeometrySample {
  const frame = compiled.playable.actors[tick]!.actors.find((actor) => actor.actorHandle === actorHandle)!;
  const origin = frame.position;
  const contact = options.contact ?? point(13.8, 0.34, 36.8);
  const target = actorHandle === attacker || actorHandle === defender ? contact : point(-30, 5, -30);
  const offset = actorHandle === attacker ? 0.04 : 0;
  const secondOffset = tick === 366 ? actorHandle === attacker ? 5 : 3 : 0.001;
  const absolute = [point(target.x, target.y, target.z + offset),
    point(target.x + 0.1, target.y, target.z + offset), point(target.x, target.y + 0.1, target.z + offset),
    point(target.x + 1, target.y, target.z + secondOffset),
    point(target.x + 1.1, target.y, target.z + secondOffset),
    point(target.x + 1, target.y + 0.1, target.z + secondOffset)];
  const vertices = absolute.map((position, vertexId) => ({ vertexId: vertexId * 10 + 10,
    position: point(position.x - origin.x, position.y - origin.y, position.z - origin.z) }));
  const triangles: [number, number, number][] = [[10, 20, 30], [40, 50, 60]];
  const bounds = { min: point(Math.min(...vertices.map((entry) => entry.position.x)),
    Math.min(...vertices.map((entry) => entry.position.y)), Math.min(...vertices.map((entry) => entry.position.z))),
  max: point(Math.max(...vertices.map((entry) => entry.position.x)),
    Math.max(...vertices.map((entry) => entry.position.y)), Math.max(...vertices.map((entry) => entry.position.z))) };
  const meshes: CandidateGeometrySample['meshes'][number][] = [{ meshId: 'body', vertices, triangles,
      regions: { leftBoot: { triangleIds: [0, 1], broadPhaseBounds: bounds },
        leftShin: { triangleIds: [0, 1], broadPhaseBounds: bounds } }, broadPhaseBounds: bounds }];
  if (options.selfScreen && actorHandle === attacker) {
    const positions = [point(10, 0.2, 35), point(12, 0.2, 35), point(10, 1.5, 35), point(12, 1.5, 35)];
    meshes.push({ meshId: 'selfScreen', vertices: positions.map((position, index) => ({ vertexId: index + 100,
      position: point(position.x - origin.x, position.y - origin.y, position.z - origin.z) })),
    triangles: [[100, 101, 102], [101, 103, 102]],
    regions: { torso: { triangleIds: [0, 1], broadPhaseBounds: bounds } }, broadPhaseBounds: bounds });
  }
  return { actorHandle, tick, root: { position: { ...origin }, yawRad: frame.yawRad }, meshes,
    landmarks: { headBone: point(0, 1.7, 0), torsoBone: point(0, 1, 0),
      leftAnkleBone: point(0, 0.1, 0), rightAnkleBone: point(0, 0.1, 0), groundRoot: point(0, 0, 0),
      leftBootToeSurface: { meshId: 'body', vertexId: 10, position: vertices[0]!.position },
      rightBootToeSurface: { meshId: 'body', vertexId: 10, position: vertices[0]!.position } } };
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
  sampled = vi.fn(geometry);
  sampler = { identity: { purpose: 'diagnostic-only', geometryVersion: 'rigged-posed-triangles-v1',
    regionPolicyVersion: 'dominant-skin-joint-v1', resourceDigest: hash('resources'),
    canonicalContentHash: compiled.contentHash,
    publicActorTimelineHash: hash(JSON.stringify(compiled.playable.actors)),
    appearance: { silhouette: 'athletic', kitStyle: 'solid', numbers: null, roster: {} },
    implementationLabel: 'fixture' }, sample: sampled } as unknown as CalibrationGeometrySampler;
});

describe('local rigged calibration pilot', () => {
  it('freezes actual peak-surface witnesses and produces 92 ordered rows from 15 snapshots', async () => {
    sampled.mockClear();
    const seeded = await seedRiggedContactBindings({ geometrySampler: sampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint });
    expect(seeded.bindings.purpose).toBe('local-rigged-calibration-candidate');
    expect(seeded.bindings.seedTick).toBe(366);
    expect(seeded.bindings.defender.actorHandle).toBe(defender);
    expect(seeded.bindings.attacker.actorHandle).toBe(attacker);
    expect(seeded.bindings.defender.vertexIds).toEqual([10, 20, 30]);
    expect(seeded.metrics.seedPairProductCount).toBe(4);
    expect(seeded.bindings.seedDistanceToAuthoredContactM.defender).toBeCloseTo(0.34, 8);
    expect(seeded.bindings.seedDistanceToAuthoredContactM.attacker).toBeCloseTo(Math.hypot(0.34, 0.04), 8);
    const result = await runRiggedCalibrationPilot({ geometrySampler: sampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint, bindings: seeded.bindings });
    expect(result.report.rows).toHaveLength(92);
    expect(result.report.rows[0]).toMatchObject({ tick: 360, evidenceId: 'EV-INSIDE-AREA',
      viewId: 'A', cameraMode: 'firstPerson' });
    expect(result.report.rows.at(-1)).toMatchObject({ tick: 374, evidenceId: 'EV-INSIDE-AREA',
      viewId: 'B', cameraMode: 'thirdPerson' });
    expect(new Set(sampled.mock.calls.map((call) => call[1]))).toEqual(new Set(Array.from({ length: 15 }, (_, i) => 360 + i)));
    for (let tick = 360; tick <= 374; tick += 1) {
      expect(new Set(sampled.mock.calls.filter((call) => call[1] === tick).map((call) => call[0])).size).toBe(7);
    }
    expect(result.report.rows.every((row) => row.anchors.length === 2)).toBe(true);
    expect(result.report.rows.every((row) => row.anchors.every((anchor) =>
      'rawEyeHit' in anchor.eye && 'rawCameraHit' in anchor.camera && 'nearClippedHit' in anchor.camera))).toBe(true);
    expect(() => { (result.report.rows[0]!.anchors[0]!.position as Point).x = 99; }).toThrow();
    expect(() => { (seeded.bindings.defender.barycentric as unknown as number[])[0] = 0; }).toThrow();
    expect(result.metrics.rayCastCount).toBeGreaterThan(0);
    const row = result.report.rows[0]!;
    const expectedEye = point(6, 1.7, 32);
    expect(row.eye.position).toEqual(expectedEye);
    expect(row.camera.position).toEqual(expectedEye);
    expect(row.eye.viewMatrix).toHaveLength(16);
    expect(row.camera.projectionMatrix).toHaveLength(16);
    const yawA = Math.atan2(13.8 - 6, 36.8 - 32);
    const third = result.report.rows.find((entry) => entry.tick === 360 && entry.evidenceId === 'EV-INSIDE-AREA' &&
      entry.viewId === 'A' && entry.cameraMode === 'thirdPerson')!;
    expect(third.camera.position.x).toBeCloseTo(6 - 2 * Math.sin(yawA), 9);
    expect(third.camera.position.y).toBeCloseTo(2.1, 9);
    expect(third.camera.position.z).toBeCloseTo(32 - 2 * Math.cos(yawA), 9);
    const full = compiled.playable.actors[row.tick]!.actors.flatMap((actor) => {
      const posed = geometry(actor.actorHandle, row.tick);
      return posed.meshes.flatMap((mesh) => mesh.triangles.map((_, triangleId) =>
        ({ sample: posed, meshId: mesh.meshId, triangleId })));
    });
    for (const anchor of row.anchors) {
      expect(anchor.eye.rawEyeHit).toEqual(castSurfaceSegment({ start: row.eye.position,
        end: anchor.position, surfaces: full }));
    }
  });

  it('rejects changed geometry behind unchanged labels and never reselects at later ticks', async () => {
    const seeded = await seedRiggedContactBindings({ geometrySampler: sampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint });
    const changed = { ...sampler, sample: (handle: string, tick: number) => {
      const value = geometry(handle, tick);
      if (tick !== 366 || handle !== defender) return value;
      return { ...value, meshes: value.meshes.map((mesh) => ({ ...mesh,
        vertices: mesh.vertices.map((vertex) => vertex.vertexId === 10 ?
          { ...vertex, position: { ...vertex.position, x: vertex.position.x + 0.01 } } : vertex) })) };
    } } as CalibrationGeometrySampler;
    await expect(runRiggedCalibrationPilot({ geometrySampler: changed, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, bindings: seeded.bindings })).rejects.toThrow(/pose|surface|identity/i);
    const valid = await runRiggedCalibrationPilot({ geometrySampler: sampler, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, bindings: seeded.bindings });
    const later = valid.report.rows.find((row) => row.tick === 367 && row.evidenceId === 'EV-TRIP-CONTACT')!;
    expect(later.anchors.find((anchor) => anchor.anchorId === 'challengerFoot')?.binding?.triangleId).toBe(0);
    const topologyChanged = { ...sampler, sample: (handle: string, tick: number) => {
      const value = geometry(handle, tick);
      if (tick !== 366 || handle !== defender) return value;
      return { ...value, meshes: value.meshes.map((mesh) => ({ ...mesh,
        triangles: [[20, 10, 30], ...mesh.triangles.slice(1)] })) };
    } } as CalibrationGeometrySampler;
    await expect(runRiggedCalibrationPilot({ geometrySampler: topologyChanged, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, bindings: seeded.bindings })).rejects.toThrow(/topology/);
    await expect(runRiggedCalibrationPilot({ geometrySampler: sampler, compiledSource: compiled,
      rendererInputFingerprint: `sha256:${'b'.repeat(64)}`, bindings: seeded.bindings })).rejects.toThrow(/identity/);
  });

  it('rejects malformed deserialized binding IDs and barycentrics before evaluating them', async () => {
    const valid = (await seedRiggedContactBindings({ geometrySampler: sampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    const malformed = [
      { ...structuredClone(valid), defender: { ...valid.defender, triangleId: '0' } },
      { ...structuredClone(valid), defender: { ...valid.defender, vertexIds: [10, '20', 30] } },
      { ...structuredClone(valid), defender: { ...valid.defender, barycentric: [0.5, 0.5] } },
    ];
    for (const bindings of malformed) {
      await expect(runRiggedCalibrationPilot({ geometrySampler: sampler, compiledSource: compiled,
        rendererInputFingerprint: fingerprint, bindings: bindings as unknown as typeof valid })).rejects.toThrow(/binding|triangle|vertex|topology|witness/i);
    }
  });

  it('keeps self surfaces in rays and skips near-clipped rays to targets before the near plane', async () => {
    const screenSampler = { ...sampler, sample: (handle: string, tick: number) =>
      geometry(handle, tick, { selfScreen: true }) } as CalibrationGeometrySampler;
    const screenBindings = (await seedRiggedContactBindings({ geometrySampler: screenSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    const screenReport = (await runRiggedCalibrationPilot({ geometrySampler: screenSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint, bindings: screenBindings })).report;
    const screened = screenReport.rows.find((row) => row.tick === 366 && row.evidenceId === 'EV-TRIP-CONTACT' &&
      row.viewId === 'A' && row.cameraMode === 'firstPerson')!;
    expect(screened.anchors.find((anchor) => anchor.anchorId === 'contactFoot')?.eye.rawEyeHit?.witness.actorHandle)
      .toBe(attacker);
    const screenedAnchor = screened.anchors.find((anchor) => anchor.anchorId === 'contactFoot')!;
    const fullScreen = compiled.playable.actors[366]!.actors.flatMap((actor) => {
      const posed = geometry(actor.actorHandle, 366, { selfScreen: true });
      return posed.meshes.flatMap((mesh) => mesh.triangles.map((_, triangleId) =>
        ({ sample: posed, meshId: mesh.meshId, triangleId })));
    });
    expect(screenedAnchor.eye.rawEyeHit).toEqual(castSurfaceSegment({ start: screened.eye.position,
      end: screenedAnchor.position, surfaces: fullScreen }));
    const yaw = Math.atan2(13.8 - 6, 36.8 - 32);
    const pitch = Math.atan2(0.8 - 1.7, Math.hypot(13.8 - 6, 36.8 - 32));
    const nearTarget = point(6 + Math.sin(yaw) * Math.cos(pitch) * 0.5,
      1.7 + Math.sin(pitch) * 0.5, 32 + Math.cos(yaw) * Math.cos(pitch) * 0.5);
    const nearSampler = { ...sampler, sample: (handle: string, tick: number) =>
      geometry(handle, tick, { contact: nearTarget }) } as CalibrationGeometrySampler;
    const nearBindings = (await seedRiggedContactBindings({ geometrySampler: nearSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    const nearReport = (await runRiggedCalibrationPilot({ geometrySampler: nearSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint, bindings: nearBindings })).report;
    const near = nearReport.rows.find((row) => row.tick === 366 && row.evidenceId === 'EV-TRIP-CONTACT' &&
      row.viewId === 'A' && row.cameraMode === 'firstPerson')!.anchors[0]!.camera;
    expect(near.gates.depth).toBe(false);
    expect(near.nearClippedSkipped).toBe(true);
    expect(near.nearClippedHit).toBeNull();
    expect(near.candidateAvailable).toBe(false);
  });

  it('normalizes reversed vertex input order and does not call sampler disposal', async () => {
    const reversed = { ...sampler, sample: (handle: string, tick: number) => {
      const value = geometry(handle, tick);
      return { ...value, meshes: value.meshes.map((mesh) => ({ ...mesh,
        vertices: [...mesh.vertices].reverse() })) };
    }, dispose: vi.fn() } as unknown as CalibrationGeometrySampler & { dispose: ReturnType<typeof vi.fn> };
    const directBindings = (await seedRiggedContactBindings({ geometrySampler: sampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    const reversedBindings = (await seedRiggedContactBindings({ geometrySampler: reversed,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    expect(reversedBindings).toEqual(directBindings);
    const direct = (await runRiggedCalibrationPilot({ geometrySampler: sampler, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, bindings: directBindings })).report;
    const reverse = (await runRiggedCalibrationPilot({ geometrySampler: reversed, compiledSource: compiled,
      rendererInputFingerprint: fingerprint, bindings: reversedBindings })).report;
    expect(reverse).toEqual(direct);
    expect(reversed.dispose).not.toHaveBeenCalled();
  });

  it('keeps an unobstructed raw ray separate from a failed field-of-view gate', async () => {
    const sideSampler = { ...sampler, sample: (handle: string, tick: number) =>
      geometry(handle, tick, { contact: point(6, 0.34, 50) }) } as CalibrationGeometrySampler;
    const bindings = (await seedRiggedContactBindings({ geometrySampler: sideSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint })).bindings;
    const report = (await runRiggedCalibrationPilot({ geometrySampler: sideSampler,
      compiledSource: compiled, rendererInputFingerprint: fingerprint, bindings })).report;
    const anchor = report.rows.find((row) => row.tick === 366 && row.evidenceId === 'EV-TRIP-CONTACT' &&
      row.viewId === 'A' && row.cameraMode === 'firstPerson')!.anchors.find((item) => item.anchorId === 'challengerFoot')!;
    expect(anchor.eye.rawEyeHit).toBeNull();
    expect(anchor.eye.gates.front).toBe(true);
    expect(anchor.eye.gates.withinFov).toBe(false);
    expect(anchor.eye.candidateAvailable).toBe(false);
  });
});
