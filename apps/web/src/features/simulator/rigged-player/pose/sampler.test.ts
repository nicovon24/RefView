import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { createRiggedPlayer } from '../model';
import { createRiggedPoseSampler } from './sampler';
import type { PlayerVisualFrame } from './frame';
import { buildPublicLocomotionPlan, type LocomotionSample } from './locomotion';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../../packages/content/src/authored-incident-v2';

let sourceScene: THREE.Group;
let clips: THREE.AnimationClip[];

function parse(source: string | ArrayBuffer) {
  return new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().parse(source, '', resolve, reject);
  });
}
beforeAll(async () => {
  vi.stubGlobal('ProgressEvent', class ProgressEvent {});
  const bodyUrl = new URL('../../../../../public/assets/player-audition/Superhero_Male_FullBody.gltf', import.meta.url);
  const body = JSON.parse(readFileSync(bodyUrl, 'utf8')) as Record<string, unknown>;
  const bytes = readFileSync(new URL('../../../../../public/assets/player-audition/Superhero_Male_FullBody.bin', import.meta.url));
  body.buffers = [{ byteLength: bytes.length, uri: `data:application/octet-stream;base64,${bytes.toString('base64')}` }];
  delete body.images;
  delete body.textures;
  delete body.materials;
  for (const mesh of body.meshes as Array<{ primitives: Array<{ material?: number }> }>) {
    for (const primitive of mesh.primitives) delete primitive.material;
  }
  sourceScene = (await parse(JSON.stringify(body))).scene;
  const glb = readFileSync(new URL('../../../../../public/assets/player-audition/UAL1_Standard.glb', import.meta.url));
  clips = (await parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength))).animations;
});

beforeEach(() => { vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }); });

function actor(plan?: readonly LocomotionSample[]) {
  const instance = createRiggedPlayer({ bodyScene: sourceScene, hairScene: new THREE.Group(), color: '#1d5ab2', number: 7,
    silhouette: 'athletic', kitStyle: 'solid' });
  return { instance, sampler: createRiggedPoseSampler(instance, clips, plan) };
}
function frame(tick: number, clipHandle = 'asset-003', actorHandle = 'actor-002'): PlayerVisualFrame {
  return { tick, actorHandle, rootPosition: actorHandle === 'actor-006' ? { x: 14.55, y: 0, z: 35.9 } : { x: 13.8, y: 0, z: 36.8 }, yawRad: actorHandle === 'actor-006' ? 0 : 0.4,
    clipHandle, phaseQ: clipHandle === 'asset-003' ? tick : clipHandle === 'asset-004' ? tick - 366 : tick - 356 };
}
function signature(instance: ReturnType<typeof createRiggedPlayer>) {
  return [...instance.bones].map(([name, bone]) => [name, ...bone.position.toArray(), ...bone.quaternion.toArray()].map((value) =>
    typeof value === 'number' ? Number(value.toFixed(7)) : value));
}

describe('absolute rigged pose on bundled assets', () => {
  it('settles to one local pose after the authored landing', () => {
    const visual = actor();
    const localPose = (tick: number) => {
      visual.sampler.applyFrame(frame(tick, 'asset-004'));
      return signature(visual.instance);
    };
    expect(localPose(420)).toEqual(localPose(450));
    expect(localPose(450)).toEqual(localPose(480));
    visual.sampler.dispose(); visual.instance.dispose();
  });
  it('lands with posed body and boot geometry near the grass', () => {
    const visual = actor();
    const meshes: THREE.SkinnedMesh[] = [];
    visual.instance.root.traverse((item) => { if (item instanceof THREE.SkinnedMesh) meshes.push(item); });
    const mesh = meshes.reduce((largest, item) => item.geometry.getAttribute('position').count >
      largest.geometry.getAttribute('position').count ? item : largest);
    expect(mesh).toBeDefined();
    const minimums = new Map<number, number>();
    const bodyMinimums = new Map<number, number>();
    for (let tick = 366; tick <= 480; tick += 1) {
      visual.sampler.applyFrame(frame(tick, 'asset-004'));
      visual.instance.root.updateMatrixWorld(true);
      let minimum = Infinity;
      let bodyMinimum = Infinity;
      for (const surface of meshes) {
        const positions = surface.geometry.getAttribute('position');
        const indices = surface.geometry.getIndex();
        for (let slot = 0; slot < (indices?.count ?? positions.count); slot += 1) {
          const index = indices?.getX(slot) ?? slot;
          const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
          const restHeight = vertex.y;
          surface.applyBoneTransform(index, vertex);
          surface.localToWorld(vertex);
          minimum = Math.min(minimum, vertex.y);
          if (surface === mesh && restHeight > 0.8) bodyMinimum = Math.min(bodyMinimum, vertex.y);
        }
      }
      minimums.set(tick, minimum);
      bodyMinimums.set(tick, bodyMinimum);
    }
    expect(Math.min(...minimums.values())).toBeGreaterThanOrEqual(-0.04);
    expect(bodyMinimums.get(420)!).toBeLessThan(0.18);
    expect(minimums.get(480)).toBeCloseTo(minimums.get(420)!, 6);
    visual.sampler.dispose(); visual.instance.dispose();
  });
  it('samples the fall independently of playback direction with fixed limbs and bounded frame travel', () => {
    const direct = actor(); const traversed = actor();
    const limbLengths = (instance: ReturnType<typeof createRiggedPlayer>) => {
      instance.root.updateMatrixWorld(true);
      const point = (name: string) => instance.bones.get(name)!.getWorldPosition(new THREE.Vector3());
      return ['l', 'r'].flatMap((side) => [point(`thigh_${side}`).distanceTo(point(`calf_${side}`)),
        point(`calf_${side}`).distanceTo(point(`foot_${side}`)),
        point(`upperarm_${side}`).distanceTo(point(`lowerarm_${side}`))]);
    };
    direct.sampler.applyFrame(frame(366, 'asset-004'));
    const fixedLengths = limbLengths(direct.instance);
    let previousHead: THREE.Vector3 | null = null;
    let previousPelvis: THREE.Quaternion | null = null;
    let largestHeadStep = 0;
    let largestPelvisStep = 0;
    for (let tick = 366; tick <= 480; tick += 1) {
      const diagnostic = direct.sampler.applyFrame(frame(tick, 'asset-004'));
      const pelvis = direct.instance.bones.get('pelvis')!.quaternion.clone();
      if (previousHead) largestHeadStep = Math.max(largestHeadStep, previousHead.distanceTo(diagnostic.head!));
      if (previousPelvis) largestPelvisStep = Math.max(largestPelvisStep, previousPelvis.angleTo(pelvis));
      previousHead = diagnostic.head!.clone(); previousPelvis = pelvis;
      expect(limbLengths(direct.instance)).toEqual(fixedLengths.map((value) => expect.closeTo(value, 5)));
      for (const [, bone] of direct.instance.bones) {
        expect([...bone.position.toArray(), ...bone.quaternion.toArray()].every(Number.isFinite)).toBe(true);
      }
    }
    expect(largestHeadStep).toBeLessThan(0.12);
    expect(largestPelvisStep).toBeLessThan(0.12);
    for (const tick of [367, 378, 398, 420, 450, 480]) {
      direct.sampler.applyFrame(frame(tick, 'asset-004'));
      const expected = signature(direct.instance);
      traversed.sampler.applyFrame(frame(480, 'asset-004'));
      traversed.sampler.applyFrame(frame(366, 'asset-004'));
      traversed.sampler.applyFrame(frame(tick, 'asset-004'));
      expect(signature(traversed.instance)).toEqual(expected);
      traversed.sampler.applyFrame(frame(tick, 'asset-004'));
      expect(signature(traversed.instance)).toEqual(expected);
    }
    direct.sampler.dispose(); traversed.sampler.dispose(); direct.instance.dispose(); traversed.instance.dispose();
  });
  it('uses the canonical contact entry despite direct late seeking with changing public roots', () => {
    const direct = actor(); const traversed = actor();
    const canonicalFrame = (tick: number): PlayerVisualFrame => {
      const progress = tick <= 390 ? (tick - 366) / 24 : (tick - 390) / 90;
      const start = tick <= 390 ? [13.8, 36.8] : [14.03, 37.14];
      const end = tick <= 390 ? [14.03, 37.14] : [14.05, 37.16];
      return { tick, actorHandle: 'actor-002',
        rootPosition: { x: THREE.MathUtils.lerp(start[0]!, end[0]!, progress), y: 0,
          z: THREE.MathUtils.lerp(start[1]!, end[1]!, progress) },
        yawRad: 0, clipHandle: 'asset-004', phaseQ: tick - 366 };
    };
    for (const tick of [367, 378, 398, 420, 450, 480]) {
      direct.sampler.applyFrame(canonicalFrame(tick));
      const expected = signature(direct.instance);
      traversed.sampler.applyFrame(canonicalFrame(366));
      for (let step = 367; step <= 480; step += 1) traversed.sampler.applyFrame(canonicalFrame(step));
      traversed.sampler.applyFrame(canonicalFrame(tick));
      expect(signature(traversed.instance)).toEqual(expected);
      expect(traversed.instance.root.position.toArray()).toEqual([
        canonicalFrame(tick).rootPosition.x, 0, canonicalFrame(tick).rootPosition.z]);
    }
    direct.sampler.dispose(); traversed.sampler.dispose(); direct.instance.dispose(); traversed.instance.dispose();
  });
  it('measures both skinned boots on the compiled public contact timeline', () => {
    const files: Record<string, string> = { 'player-rig': 'asset-001.mjs', 'run-clip': 'asset-002.mjs',
      'trip-clip': 'asset-003.mjs', 'challenge-clip': 'asset-004.mjs' };
    const playable = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
      resolveAssetBytes: (id, path) => {
        const name = files[id];
        if (!name || path !== `/assets/${name}`) return undefined;
        return readFileSync(new URL(`../../../../../../../packages/content/assets/${name}`, import.meta.url));
      },
      ...createIncident001GeometryResolverV2(),
    }).playable;
    expect(playable.assetManifest.map((item) => [item.assetHandle, item.neutralClientPath])).toEqual([
      ['asset-001', '/assets/asset-004.mjs'], ['asset-002', '/assets/asset-001.mjs'],
      ['asset-003', '/assets/asset-002.mjs'], ['asset-004', '/assets/asset-003.mjs'],
    ]);
    const plan = buildPublicLocomotionPlan(playable.actors, 60);
    // The steady authored run intentionally changes the early accumulated phase. The later
    // references protect the contact transition after the authored phase-origin correction.
    const baselinePhaseModulo: Record<number, readonly number[]> = {
      104: [0.368666565052, 0.912911914054, 0.904238782968, 0.214833087431,
        0.808757602759, 0.612480689505, 0.963280434479],
      353: [0.308152893942, 0.397505461894, 0.424583762952, 0.122604037626,
        0.872903436124, 0.589447753594, 0.372079619017],
      366: [0.363996523999, 0.724630777257, 0.633100525237, 0.166411385222,
        0.902203024508, 0.792268007464, 0.567483358898],
      386: [0.458494325125, 0.001429121025, 0.985949641846, 0.240541559365,
        0.933732499422, 0.084855627945, 0.583870708963],
    };
    for (const [tickText, phases] of Object.entries(baselinePhaseModulo)) {
      const tick = Number(tickText);
      for (const [index, expected] of phases.entries()) {
        const handle = `actor-${String(index + 1).padStart(3, '0')}`;
        expect(plan[handle]![tick]!.phaseCycles % 1).toBeCloseTo(expected, 10);
      }
    }
    const attacker = actor(plan['actor-002']); const defender = actor(plan['actor-006']);
    const sourceLeg = actor(plan['actor-006']);
    const allActors = new Map(Array.from({ length: 7 }, (_, index) => {
      const handle = `actor-${String(index + 1).padStart(3, '0')}`;
      return [handle, actor(plan[handle])] as const;
    }));
    const measures: Record<number, { gap: number; attackerHeadY: number; attackerFootY: number; defenderFootY: number }> = {};
    const transitionAngles: number[] = [];
    let previousDefenderLeg: THREE.Quaternion | null = null;
    let previousDefenderKnee: THREE.Quaternion | null = null;
    let maximumKneeStep = { tick: 0, radians: 0 };
    let previousKneePoint: THREE.Vector3 | null = null;
    let maximumKneePositionStep = { tick: 0, distance: 0 };
    let previousBootOrientation: THREE.Quaternion | null = null;
    let maximumBootOrientationStep = { tick: 0, radians: 0 };
    let previousCalfWorld: THREE.Quaternion | null = null;
    let previousCalfAxis: THREE.Vector3 | null = null;
    let previousFlexion: number | null = null;
    const recoveryMeasures = { calfWorld: { tick: 0, value: 0 }, axialTwist: { tick: 0, value: 0 },
      flexion: { tick: 0, value: 0 } };
    const defenderSignatures = new Map<number, ReturnType<typeof signature>>();
    for (let tick = 344; tick <= 388; tick += 1) {
      const publicActors = playable.actors[tick]!.actors;
      const a = publicActors.find((item) => item.actorHandle === 'actor-002')!;
      const d = publicActors.find((item) => item.actorHandle === 'actor-006')!;
      const attack = attacker.sampler.applyFrame({ tick, actorHandle: a.actorHandle, rootPosition: a.position, yawRad: a.yawRad,
        clipHandle: a.clipHandle, phaseQ: a.phaseQ });
      const defend = defender.sampler.applyFrame({ tick, actorHandle: d.actorHandle, rootPosition: d.position, yawRad: d.yawRad,
        clipHandle: d.clipHandle, phaseQ: d.phaseQ });
      if (tick === 346 || tick === 386) {
        sourceLeg.sampler.applyFrame({ tick, actorHandle: 'actor-008', rootPosition: d.position, yawRad: d.yawRad,
          clipHandle: d.clipHandle, phaseQ: d.phaseQ });
        for (const name of ['thigh_l', 'calf_l', 'foot_l']) {
          const actual = defender.instance.bones.get(name)!.quaternion.toArray();
          const expected = sourceLeg.instance.bones.get(name)!.quaternion.toArray();
          for (let component = 0; component < 4; component += 1) {
            expect(actual[component]).toBeCloseTo(expected[component]!, 12);
          }
        }
      }
      if ([350, 355, 357, 380, 385].includes(tick)) {
        const entering = tick < 366;
        const progress = entering ? (tick - 346) / 20 : (tick - 366) / 20;
        const smoothProgress = progress * progress * (3 - 2 * progress);
        const start = new THREE.Quaternion(0.9586700283415625, -0.022047644142548405,
          -0.01480374238759661, 0.2832781801401118);
        const contact = new THREE.Quaternion(-0.11801876098615743, 0.1527110898213532,
          0.7126306205645517, 0.6744690192660213);
        const end = new THREE.Quaternion(0.7048493610771605, -0.017459904079968037,
          0.016628426296209316, 0.7089471247118022);
        const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.yawRad)
          .multiply((entering ? start : contact).slerp(entering ? contact : end, smoothProgress));
        const actual = defender.instance.bones.get('foot_l')!.getWorldQuaternion(new THREE.Quaternion());
        expect(actual.normalize().angleTo(expected.normalize())).toBeLessThan(1e-6);
      }
      if ([355, 356, 360, 366].includes(tick)) {
        const hash = (instance: ReturnType<typeof createRiggedPlayer>) => createHash('sha256')
          .update(JSON.stringify(signature(instance))).digest('hex').slice(0, 16);
        const attackerExpected: Record<number, string> = { 355: '2343f3816879683a', 356: 'a5c56618f97f65db',
          360: '67a52d6d0c3605cd', 366: 'a6c9003260db2a41' };
        expect(hash(attacker.instance)).toBe(attackerExpected[tick]);
      }
      const leg = defender.instance.bones.get('thigh_l')!.quaternion.clone();
      if (previousDefenderLeg && [356, 376].includes(tick)) transitionAngles.push(previousDefenderLeg.angleTo(leg));
      previousDefenderLeg = leg;
      const knee = defender.instance.bones.get('calf_l')!.quaternion.clone();
      if (previousDefenderKnee) {
        const radians = previousDefenderKnee.angleTo(knee);
        if (radians > maximumKneeStep.radians) maximumKneeStep = { tick, radians };
      }
      previousDefenderKnee = knee;
      defender.instance.root.updateMatrixWorld(true);
      const kneePoint = defender.instance.bones.get('calf_l')!.getWorldPosition(new THREE.Vector3());
      if (previousKneePoint) {
        const distance = previousKneePoint.distanceTo(kneePoint);
        if (distance > maximumKneePositionStep.distance) maximumKneePositionStep = { tick, distance };
      }
      previousKneePoint = kneePoint;
      const bootOrientation = defender.instance.bones.get('foot_l')!.getWorldQuaternion(new THREE.Quaternion());
      if (previousBootOrientation) {
        const radians = previousBootOrientation.angleTo(bootOrientation);
        if (radians > maximumBootOrientationStep.radians) maximumBootOrientationStep = { tick, radians };
      }
      previousBootOrientation = bootOrientation;
      const hip = defender.instance.bones.get('thigh_l')!.getWorldPosition(new THREE.Vector3());
      const ankle = defender.instance.bones.get('foot_l')!.getWorldPosition(new THREE.Vector3());
      const upperAxis = kneePoint.clone().sub(hip).normalize();
      const calfAxis = ankle.clone().sub(kneePoint).normalize();
      const flexion = Math.acos(THREE.MathUtils.clamp(upperAxis.clone().negate().dot(calfAxis), -1, 1));
      const calfWorld = defender.instance.bones.get('calf_l')!.getWorldQuaternion(new THREE.Quaternion());
      if (previousCalfWorld && previousCalfAxis && previousFlexion !== null) {
        const swing = new THREE.Quaternion().setFromUnitVectors(previousCalfAxis, calfAxis);
        const values = { calfWorld: previousCalfWorld.angleTo(calfWorld),
          axialTwist: swing.multiply(previousCalfWorld).angleTo(calfWorld),
          flexion: Math.abs(flexion - previousFlexion) };
        for (const key of ['calfWorld', 'axialTwist', 'flexion'] as const) {
          if (values[key] > recoveryMeasures[key].value) recoveryMeasures[key] = { tick, value: values[key] };
        }
      }
      previousCalfWorld = calfWorld; previousCalfAxis = calfAxis; previousFlexion = flexion;
      defenderSignatures.set(tick, signature(defender.instance));
      expect(attacker.instance.root.position.toArray()).toEqual([a.position.x, a.position.y, a.position.z]);
      expect(defender.instance.root.position.toArray()).toEqual([d.position.x, d.position.y, d.position.z]);
      expect(attacker.instance.root.rotation.y).toBeCloseTo(a.yawRad);
      expect(defender.instance.root.rotation.y).toBeCloseTo(d.yawRad);
      if ([366, 371, 386].includes(tick)) {
        measures[tick] = { gap: attack.leftFoot!.distanceTo(defend.leftFoot!), attackerHeadY: attack.head!.y,
          attackerFootY: attack.leftFoot!.y, defenderFootY: defend.leftFoot!.y };
      }
      if (tick === 366) {
        expect(defend.contactResidualM!).toBeLessThanOrEqual(0.03);
        expect(createHash('sha256').update(JSON.stringify(signature(defender.instance))).digest('hex'))
          .toBe('2aa792abccba54c8c57690f804e35d8f0a531d6b24fb55942b96c87f171e3bc9');
        const plane = upperAxis.clone().cross(calfAxis).normalize();
        const thighWorld = defender.instance.bones.get('thigh_l')!.getWorldQuaternion(new THREE.Quaternion());
        const thighNormal = new THREE.Vector3(-0.9991588786338783, 0, -0.04100637755801442)
          .applyQuaternion(thighWorld);
        const calfNormal = new THREE.Vector3(-0.9833050993880055, 0, -0.18196440503846162)
          .applyQuaternion(calfWorld);
        expect(upperAxis.dot(new THREE.Vector3(0, 1, 0).applyQuaternion(thighWorld))).toBeGreaterThan(0.99999);
        expect(calfAxis.dot(new THREE.Vector3(0, 1, 0).applyQuaternion(calfWorld))).toBeGreaterThan(0.99999);
        expect(plane.dot(thighNormal)).toBeGreaterThan(0.99999);
        expect(plane.dot(calfNormal)).toBeGreaterThan(0.99999);
      }
      if (tick === 376) { expect(d.clipHandle).toBe('asset-001'); expect(d.phaseQ).toBe(20); }
    }
    expect(measures[386]!.attackerFootY).toBeGreaterThanOrEqual(0);
    expect(transitionAngles).toHaveLength(2);
    expect(Math.max(...transitionAngles)).toBeLessThan(0.3);
    expect(measures[366]!.gap).toBeLessThan(0.1);
    expect(maximumKneePositionStep.distance).toBeLessThanOrEqual(0.10);
    expect(maximumBootOrientationStep.radians).toBeLessThanOrEqual(0.25);
    expect(recoveryMeasures.calfWorld.value).toBeLessThanOrEqual(0.35);
    expect(recoveryMeasures.axialTwist.value).toBeLessThanOrEqual(0.20);
    expect(recoveryMeasures.flexion.value).toBeLessThanOrEqual(0.25);
    for (let tick = 388; tick >= 344; tick -= 1) {
      const d = playable.actors[tick]!.actors.find((item) => item.actorHandle === 'actor-006')!;
      const visual = { tick, actorHandle: d.actorHandle, rootPosition: d.position, yawRad: d.yawRad,
        clipHandle: d.clipHandle, phaseQ: d.phaseQ };
      defender.sampler.applyFrame(visual);
      expect(signature(defender.instance)).toEqual(defenderSignatures.get(tick));
      defender.sampler.applyFrame(visual);
      expect(signature(defender.instance)).toEqual(defenderSignatures.get(tick));
    }
    const legacyAttacker = actor();
    for (let tick = 0; tick <= 480; tick += 1) {
      const publicActors = playable.actors[tick]!.actors;
      expect(publicActors.map((item) => item.actorHandle).sort()).toEqual([...allActors.keys()].sort());
      for (const item of publicActors) {
        const visual = allActors.get(item.actorHandle)!;
        const diagnostic = visual.sampler.applyFrame({ tick, actorHandle: item.actorHandle,
          rootPosition: item.position, yawRad: item.yawRad, clipHandle: item.clipHandle, phaseQ: item.phaseQ });
        expect(visual.instance.root.position.toArray()).toEqual([item.position.x, item.position.y, item.position.z]);
        expect(visual.instance.root.rotation.y).toBeCloseTo(item.yawRad);
        expect(diagnostic.head!.y).toBeGreaterThan(-0.01);
      }
      if (tick >= 350) {
        const item = publicActors.find((current) => current.actorHandle === 'actor-002')!;
        legacyAttacker.sampler.applyFrame({ tick, actorHandle: item.actorHandle,
          rootPosition: item.position, yawRad: item.yawRad, clipHandle: item.clipHandle, phaseQ: item.phaseQ });
        expect(signature(allActors.get('actor-002')!.instance)).toEqual(signature(legacyAttacker.instance));
      }
    }
    legacyAttacker.sampler.dispose(); legacyAttacker.instance.dispose();
    const keeper = allActors.get('actor-004')!;
    const keeperFrame = playable.actors[120]!.actors.find((item) => item.actorHandle === 'actor-004')!;
    keeper.sampler.applyFrame({ tick: 120, actorHandle: keeperFrame.actorHandle,
      rootPosition: keeperFrame.position, yawRad: keeperFrame.yawRad,
      clipHandle: keeperFrame.clipHandle, phaseQ: keeperFrame.phaseQ });
    const directKeeperPose = signature(keeper.instance);
    keeper.sampler.applyFrame({ tick: 480, actorHandle: keeperFrame.actorHandle,
      rootPosition: keeperFrame.position, yawRad: keeperFrame.yawRad,
      clipHandle: keeperFrame.clipHandle, phaseQ: keeperFrame.phaseQ });
    keeper.sampler.applyFrame({ tick: 120, actorHandle: keeperFrame.actorHandle,
      rootPosition: keeperFrame.position, yawRad: keeperFrame.yawRad,
      clipHandle: keeperFrame.clipHandle, phaseQ: keeperFrame.phaseQ });
    expect(signature(keeper.instance)).toEqual(directKeeperPose);
    expect(plan['actor-004']![120]!.jogWeight).toBe(0);
    const legacyKeeper = actor();
    legacyKeeper.sampler.applyFrame({ tick: 120, actorHandle: keeperFrame.actorHandle,
      rootPosition: keeperFrame.position, yawRad: keeperFrame.yawRad,
      clipHandle: keeperFrame.clipHandle, phaseQ: keeperFrame.phaseQ });
    expect(signature(keeper.instance)).not.toEqual(signature(legacyKeeper.instance));
    legacyKeeper.sampler.dispose(); legacyKeeper.instance.dispose();
    for (const visual of allActors.values()) { visual.sampler.dispose(); visual.instance.dispose(); }
    sourceLeg.sampler.dispose(); sourceLeg.instance.dispose();
    attacker.sampler.dispose(); defender.sampler.dispose(); attacker.instance.dispose(); defender.instance.dispose();
  }, 20000);
  it('matches direct, sequential, reverse, and repeated samples at the contact window', () => {
    const direct = actor();
    const sequential = actor();
    for (const tick of [355, 360, 365, 366, 371, 375, 386]) {
      const motion = tick >= 366 ? 'asset-004' : 'asset-003';
      const f = frame(tick, motion);
      direct.sampler.applyFrame(f);
      const expected = signature(direct.instance);
      sequential.sampler.applyFrame(frame(100));
      sequential.sampler.applyFrame(frame(480));
      sequential.sampler.applyFrame(f);
      expect(signature(sequential.instance)).toEqual(expected);
      sequential.sampler.applyFrame(f);
      expect(signature(sequential.instance)).toEqual(expected);
      expect(sequential.instance.root.position.toArray()).toEqual([13.8, 0, 36.8]);
      expect(sequential.instance.root.rotation.y).toBeCloseTo(0.4);
      expect(sequential.instance.root.scale.toArray()).toEqual([1, 1, 1]);
    }
    direct.sampler.dispose(); sequential.sampler.dispose(); direct.instance.dispose(); sequential.instance.dispose();
  });

  it('breathes at rest from absolute tick and repeats the same idle pose after reverse seeks', () => {
    const stationary = Array.from({ length: 481 }, (_, tick) => ({ tick, actors: [{ actorHandle: 'actor-004',
      position: { x: 0, y: 0, z: 0 } }] }));
    const plan = buildPublicLocomotionPlan(stationary, 60)['actor-004']!;
    const visual = actor(plan);
    const idleFrame = (tick: number): PlayerVisualFrame => ({ tick, actorHandle: 'actor-004',
      rootPosition: { x: 0, y: 0, z: 0 }, yawRad: 0, clipHandle: 'asset-003', phaseQ: tick });
    visual.sampler.applyFrame(idleFrame(0));
    const first = signature(visual.instance);
    visual.sampler.applyFrame(idleFrame(37));
    const later = signature(visual.instance);
    expect(later).not.toEqual(first);
    visual.sampler.applyFrame(idleFrame(300));
    visual.sampler.applyFrame(idleFrame(37));
    expect(signature(visual.instance)).toEqual(later);
    visual.sampler.applyFrame(idleFrame(0));
    expect(signature(visual.instance)).toEqual(first);
    visual.sampler.dispose(); visual.instance.dispose();
  });

  it('keeps two independent poses and fixed skeleton segment lengths across challenge and fall', () => {
    const attacker = actor(); const defender = actor();
    const lengths = (instance: ReturnType<typeof createRiggedPlayer>) => {
      instance.root.updateMatrixWorld(true);
      const p = (name: string) => instance.bones.get(name)!.getWorldPosition(new THREE.Vector3());
      return [p('thigh_l').distanceTo(p('calf_l')), p('calf_l').distanceTo(p('foot_l')),
        p('thigh_r').distanceTo(p('calf_r')), p('calf_r').distanceTo(p('foot_r'))];
    };
    attacker.sampler.applyFrame(frame(355));
    const bindLengths = lengths(attacker.instance);
    const attackerBefore = signature(attacker.instance);
    for (let tick = 355; tick <= 386; tick += 1) {
      const clipHandle = tick >= 356 ? 'asset-001' : 'asset-003';
      const result = defender.sampler.applyFrame(frame(tick, clipHandle, 'actor-006'));
      expect(lengths(defender.instance)).toEqual(expect.arrayContaining(bindLengths.map((value) => expect.closeTo(value, 5))));
      if (tick === 366) {
        expect(result.contactResidualM).not.toBeNull();
        expect(result.contactResidualM!).toBeLessThanOrEqual(0.03);
        expect(result.supportResidualM).not.toBeNull();
        expect(result.supportResidualM!).toBeLessThan(0.1);
      }
    }
    const traversedContact = defender.sampler.applyFrame(frame(366, 'asset-001', 'actor-006'));
    const traversedPose = signature(defender.instance);
    const directDefender = actor();
    const directContact = directDefender.sampler.applyFrame(frame(366, 'asset-001', 'actor-006'));
    expect(signature(directDefender.instance)).toEqual(traversedPose);
    expect(directContact.contactResidualM).toBeCloseTo(traversedContact.contactResidualM!, 6);
    directDefender.sampler.dispose(); directDefender.instance.dispose();
    expect(signature(attacker.instance)).toEqual(attackerBefore);
    const headBefore = attacker.instance.bones.get('Head')!.getWorldPosition(new THREE.Vector3()).y;
    const fallen = attacker.sampler.applyFrame(frame(386, 'asset-004'));
    expect(fallen.head!.y).toBeLessThan(headBefore);
    expect(fallen.head!.y).toBeGreaterThan(0);
    expect(signature(attacker.instance)).not.toEqual(attackerBefore);
    attacker.sampler.dispose(); defender.sampler.dispose(); attacker.instance.dispose(); defender.instance.dispose();
  });
});
