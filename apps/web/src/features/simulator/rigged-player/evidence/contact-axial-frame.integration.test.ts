import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createRiggedPlayer } from '../model';
import { createRiggedPoseSampler, type ContactAxialDiagnostic } from '../pose/sampler';
import { ARCHIVED_ENTRY_COEFFICIENTS } from './contact-axial-frame';
import { buildPublicLocomotionPlan } from '../pose/locomotion';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';

const rootPath = resolve(process.cwd(), '../..');
const assetRoot = resolve(rootPath, 'apps/web/public/assets/player-audition');
const sha = (bytes: Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const vec = (v: THREE.Vector3) => v.toArray();
const quat = (q: THREE.Quaternion) => q.toArray();
const trialTarget = [-0.55, 0.34, 1.044] as const;
let body: THREE.Group;
let clips: THREE.AnimationClip[];

async function parse(input: string | ArrayBuffer): Promise<GLTF> {
  return new GLTFLoader().parseAsync(input, '');
}
beforeAll(async () => {
  vi.stubGlobal('ProgressEvent', class ProgressEvent {});
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
  const doc = JSON.parse(readFileSync(resolve(assetRoot, 'Superhero_Male_FullBody.gltf'), 'utf8')) as Record<string, unknown>;
  const bin = readFileSync(resolve(assetRoot, 'Superhero_Male_FullBody.bin'));
  doc.buffers = [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${bin.toString('base64')}` }];
  delete doc.images; delete doc.textures; delete doc.materials;
  for (const mesh of doc.meshes as Array<{ primitives: Array<{ material?: number }> }>) {
    for (const primitive of mesh.primitives) delete primitive.material;
  }
  body = (await parse(JSON.stringify(doc))).scene;
  const animation = readFileSync(resolve(assetRoot, 'UAL1_Standard.glb'));
  clips = (await parse(animation.buffer.slice(animation.byteOffset, animation.byteOffset + animation.byteLength))).animations;
});

it('replays rejected actual-rig entry and compares axial frames without adopting a pose', () => {
  const files: Record<string, string> = { 'player-rig': 'asset-001.mjs', 'run-clip': 'asset-002.mjs',
    'trip-clip': 'asset-003.mjs', 'challenge-clip': 'asset-004.mjs' };
  const playable = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
    resolveAssetBytes: (id, path) => files[id] && path === `/assets/${files[id]}` ?
      readFileSync(resolve(rootPath, 'packages/content/assets', files[id])) : undefined,
    ...createIncident001GeometryResolverV2(),
  }).playable;
  const plan = buildPublicLocomotionPlan(playable.actors, 60)['actor-006']!;
  const create = (config?: ContactAxialDiagnostic) => {
    const instance = createRiggedPlayer({ bodyScene: body, hairScene: new THREE.Group(), color: '#1d5ab2', number: 7,
      silhouette: 'athletic', kitStyle: 'solid' });
    return { instance, sampler: createRiggedPoseSampler(instance, clips, plan, config) };
  };
  const sample = (visual: ReturnType<typeof create>, tick: number) => {
    const actor = playable.actors[tick]!.actors.find((item) => item.actorHandle === 'actor-006')!;
    visual.sampler.applyFrame({ tick, actorHandle: actor.actorHandle, rootPosition: actor.position, yawRad: actor.yawRad,
      clipHandle: actor.clipHandle, phaseQ: actor.phaseQ });
    const { bones, root } = visual.instance;
    root.updateMatrixWorld(true);
    const thigh = bones.get('thigh_l')!; const calf = bones.get('calf_l')!; const foot = bones.get('foot_l')!;
    const hip = thigh.getWorldPosition(new THREE.Vector3());
    const knee = calf.getWorldPosition(new THREE.Vector3());
    const ankle = foot.getWorldPosition(new THREE.Vector3());
    const thighAxis = knee.clone().sub(hip).normalize();
    const calfAxis = ankle.clone().sub(knee).normalize();
    const normal = thighAxis.clone().cross(calfAxis).normalize();
    const target = root.localToWorld(new THREE.Vector3(-1, 0.3, 0.15));
    const approach = ankle.clone().sub(hip).normalize();
    const projectedPole = target.sub(hip).addScaledVector(approach, -target.dot(approach)).normalize();
    const thighWorld = thigh.getWorldQuaternion(new THREE.Quaternion());
    const calfWorld = calf.getWorldQuaternion(new THREE.Quaternion());
    const bootWorld = foot.getWorldQuaternion(new THREE.Quaternion());
    const oldThighNormal = new THREE.Vector3(-0.9991588786338783, 0, -0.04100637755801442)
      .applyQuaternion(thighWorld);
    const oldCalfNormal = new THREE.Vector3(-0.9833050993880055, 0, -0.18196440503846162)
      .applyQuaternion(calfWorld);
    const signedOffset = (axis: THREE.Vector3, oldNormal: THREE.Vector3) =>
      Math.atan2(axis.dot(oldNormal.clone().cross(normal)), oldNormal.dot(normal));
    return { tick, hip: vec(hip), knee: vec(knee), ankle: vec(ankle), thighAxis: vec(thighAxis), calfAxis: vec(calfAxis),
      bendPlaneNormal: vec(normal), projectedPole: vec(projectedPole), thighWorld: quat(thighWorld),
      calfWorld: quat(calfWorld), bootWorld: quat(bootWorld),
      signedOldFrameOffsetRad: { thigh: signedOffset(thighAxis, oldThighNormal),
        calf: signedOffset(calfAxis, oldCalfNormal) },
      thighYAlignment: thighAxis.dot(new THREE.Vector3(0, 1, 0).applyQuaternion(thighWorld)),
      calfYAlignment: calfAxis.dot(new THREE.Vector3(0, 1, 0).applyQuaternion(calfWorld)) };
  };
  const config = (mode: ContactAxialDiagnostic['frameMode'], normals?: ContactAxialDiagnostic['peakCompatibleNormals']):
    ContactAxialDiagnostic => ({ trialTarget, hermiteCoefficients: ARCHIVED_ENTRY_COEFFICIENTS,
      frameMode: mode, peakCompatibleNormals: normals });
  const historical = create(config('historical-peak-omission'));
  const oldFixed = create(config('old-fixed'));
  const baseline = create();
  const peak = sample(historical, 366);
  const normal = new THREE.Vector3(...peak.bendPlaneNormal);
  const normals = { thigh: normal.clone().applyQuaternion(new THREE.Quaternion(...peak.thighWorld).invert()),
    calf: normal.clone().applyQuaternion(new THREE.Quaternion(...peak.calfWorld).invert()) };
  const compatible = create(config('peak-compatible', normals));
  const modes = { historical: historical, oldFixed, peakCompatible: compatible };
  const rows = Object.fromEntries(Object.entries(modes).map(([name, visual]) =>
    [name, Array.from({ length: 5 }, (_, index) => sample(visual, 364 + index))]));
  const peakRebuilt = rows.peakCompatible![2]!;
  const distance = (a: number[], b: number[]) => new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));
  expect(peak.thighYAlignment).toBeGreaterThan(0.99999);
  expect(peak.calfYAlignment).toBeGreaterThan(0.99999);
  expect(distance(peak.knee, peakRebuilt.knee)).toBeLessThan(1e-5);
  expect(distance(peak.ankle, peakRebuilt.ankle)).toBeLessThan(1e-5);
  expect(new THREE.Quaternion(...peak.thighWorld).angleTo(new THREE.Quaternion(...peakRebuilt.thighWorld))).toBeLessThan(1e-3);
  expect(new THREE.Quaternion(...peak.calfWorld).angleTo(new THREE.Quaternion(...peakRebuilt.calfWorld))).toBeLessThan(1e-3);
  const frameOnlyDifferences = Object.fromEntries(Object.entries(rows).map(([mode, selected]) => [mode,
    selected.map((row, index) => ({ tick: row.tick,
      hipM: distance(row.hip, rows.historical![index]!.hip),
      kneeM: distance(row.knee, rows.historical![index]!.knee),
      ankleM: distance(row.ankle, rows.historical![index]!.ankle),
      bootWorldRad: new THREE.Quaternion(...row.bootWorld).angleTo(
        new THREE.Quaternion(...rows.historical![index]!.bootWorld)) }))]));
  for (const differences of Object.values(frameOnlyDifferences)) for (const row of differences) {
    expect(row.hipM).toBeLessThan(1e-5);
    expect(row.kneeM).toBeLessThan(1e-5);
    expect(row.ankleM).toBeLessThan(1e-5);
  }
  const allHistorical = Array.from({ length: 45 }, (_, index) => sample(historical, 344 + index));
  const kneeStep = distance(allHistorical[361 - 344]!.knee, allHistorical[360 - 344]!.knee);
  const a = allHistorical[366 - 344]!; const b = allHistorical[367 - 344]!;
  const calfRotation = new THREE.Quaternion(...a.calfWorld).angleTo(new THREE.Quaternion(...b.calfWorld));
  const swing = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...a.calfAxis), new THREE.Vector3(...b.calfAxis));
  const axialTwist = swing.multiply(new THREE.Quaternion(...a.calfWorld)).angleTo(new THREE.Quaternion(...b.calfWorld));
  expect(kneeStep).toBeCloseTo(0.10031926178113107, 7);
  expect(calfRotation).toBeCloseTo(0.8425559002767611, 7);
  expect(axialTwist).toBeCloseTo(0.8423683078977333, 7);
  const defaultPeak = sample(baseline, 366);
  expect(distance(defaultPeak.ankle, peak.ankle)).toBeGreaterThan(0.1);
  const report = { status: 'REJECTED_DIAGNOSTIC', measurements: { tick361KneeStepM: kneeStep,
    tick367CalfWorldRad: calfRotation, tick367AxialTwistRad: axialTwist },
    source: { bodyGltf: sha(readFileSync(resolve(assetRoot, 'Superhero_Male_FullBody.gltf'))),
      bodyBin: sha(readFileSync(resolve(assetRoot, 'Superhero_Male_FullBody.bin'))),
      animationGlb: sha(readFileSync(resolve(assetRoot, 'UAL1_Standard.glb'))),
      timeline: sha(readFileSync(resolve(rootPath, 'packages/content/assets/asset-004.mjs'))) },
    trialTarget, hermiteCoefficients: ARCHIVED_ENTRY_COEFFICIENTS,
    peakLocalNormals: { thigh: vec(normals.thigh), calf: vec(normals.calf) }, rows, frameOnlyDifferences,
    frameOnlyConclusion: 'Joint positions match within 1e-5 m; extracted boot-world quaternions are compared in frameOnlyDifferences and are not claimed invariant.',
    limits: { kneeStepM: 0.1, calfWorldRad: 0.35, axialTwistRad: 0.2 },
    limitations: ['No rendered boot-toe or four-part clearance measurement.',
      'No candidate adoption, bridge, training attachment, or full visual review.'] };
  if (process.env.REFVIEW_WRITE_AXIAL_REPORT === '1') {
    const directory = resolve(rootPath, 'artifacts/rigged-contact-axial-frame');
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  for (const visual of [historical, oldFixed, baseline, compatible]) {
    visual.sampler.dispose(); visual.instance.dispose();
  }
}, 20000);
