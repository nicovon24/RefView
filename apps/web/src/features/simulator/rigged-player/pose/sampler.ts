import * as THREE from 'three';
import type { createRiggedPlayer } from '../model';
import { PUBLIC_MOTION, type PlayerVisualFrame } from './frame';
import type { LocomotionSample } from './locomotion';
import { solveTwoBoneLeg } from './two-bone-ik';
import { applyAuthoredFall } from './fall';

type RiggedPlayerInstance = ReturnType<typeof createRiggedPlayer>;
type Transform = { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 };
const axisX = new THREE.Vector3(1, 0, 0);
const contactWorld = new THREE.Vector3(13.8, 0.34, 36.8);
// Fixed actor-local ankle and boot-orientation references measured from the imported rig at the curve joins.
const defenderStart = new THREE.Vector3(0.09607431089948903, 0.16090550746732474, -0.3410662303769385);
const defenderContact = new THREE.Vector3(-0.75, 0.34, 0.9);
const defenderEnd = new THREE.Vector3(0.0889996651130609, 0.3414860013331724, 0.46210980805960844);
const defenderStartOrientation = new THREE.Quaternion(0.9586700283415625, -0.022047644142548405,
  -0.01480374238759661, 0.2832781801401118);
const defenderContactOrientation = new THREE.Quaternion(-0.11801876098615743, 0.1527110898213532,
  0.7126306205645517, 0.6744690192660213);
const defenderEndOrientation = new THREE.Quaternion(0.7048493610771605, -0.017459904079968037,
  0.016628426296209316, 0.7089471247118022);
// Calibrated against the frozen tick-366 Quaternius leg: local +Y follows each segment.
const defenderPlaneNormals = {
  thigh: new THREE.Vector3(-0.9991588786338783, 0, -0.04100637755801442),
  calf: new THREE.Vector3(-0.9833050993880055, 0, -0.18196440503846162),
} as const;
const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

export type ContactAxialDiagnostic = Readonly<{
  trialTarget: readonly [number, number, number];
  hermiteCoefficients: readonly number[];
  frameMode: 'historical-peak-omission' | 'old-fixed' | 'peak-compatible';
  peakCompatibleNormals?: Readonly<{ thigh: THREE.Vector3; calf: THREE.Vector3 }>;
}>;
const diagnosticKnots = [352, 356, 358, 360, 362, 364, 366] as const;
function diagnosticHermiteOffset(tick: number, coefficients: readonly number[]): THREE.Vector3 {
  if (coefficients.length !== 42 || !coefficients.every(Number.isFinite)) {
    throw new RangeError('Invalid diagnostic Hermite coefficients');
  }
  if (tick <= 352 || tick >= 366) return new THREE.Vector3();
  const index = diagnosticKnots.findIndex((knot, next) => next < 6 && tick >= knot && tick < diagnosticKnots[next + 1]!);
  const h = diagnosticKnots[index + 1]! - diagnosticKnots[index]!;
  const t = (tick - diagnosticKnots[index]!) / h;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1; const h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2; const h11 = t ** 3 - t ** 2;
  return new THREE.Vector3(...([0, 1, 2].map((axis) =>
    h00 * coefficients[index * 6 + axis]! + h10 * h * coefficients[index * 6 + 3 + axis]! +
    h01 * coefficients[(index + 1) * 6 + axis]! + h11 * h * coefficients[(index + 1) * 6 + 3 + axis]!) as
    [number, number, number]));
}

function snapshot(object: THREE.Object3D): Transform {
  return { position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() };
}
function restore(object: THREE.Object3D, transform: Transform) {
  object.position.copy(transform.position);
  object.quaternion.copy(transform.quaternion);
  object.scale.copy(transform.scale);
}
function addPitch(bone: THREE.Bone | undefined, radians: number) {
  if (bone) bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axisX, radians));
}
function translateWorld(bone: THREE.Bone, displacement: THREE.Vector3) {
  const parentRotation = bone.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  bone.position.add(displacement.applyQuaternion(parentRotation.invert()));
}
function worldPoint(bone: THREE.Bone | undefined) {
  return bone?.getWorldPosition(new THREE.Vector3()) ?? null;
}
function rotateToward(joint: THREE.Bone, endpoint: THREE.Bone, target: THREE.Vector3) {
  joint.updateWorldMatrix(true, true);
  const origin = joint.getWorldPosition(new THREE.Vector3());
  const current = endpoint.getWorldPosition(new THREE.Vector3()).sub(origin);
  const desired = target.clone().sub(origin);
  if (current.lengthSq() < 1e-8 || desired.lengthSq() < 1e-8) return;
  const deltaWorld = new THREE.Quaternion().setFromUnitVectors(current.normalize(), desired.normalize());
  const parentWorld = joint.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  const deltaLocal = parentWorld.clone().invert().multiply(deltaWorld).multiply(parentWorld);
  joint.quaternion.premultiply(deltaLocal).normalize();
}
function reachFoot(bones: ReadonlyMap<string, THREE.Bone>, target: THREE.Vector3, side: 'l' | 'r') {
  const thigh = bones.get(`thigh_${side}`);
  const calf = bones.get(`calf_${side}`);
  const foot = bones.get(`foot_${side}`);
  if (!thigh || !calf || !foot) return null;
  thigh.updateWorldMatrix(true, true);
  const hip = thigh.getWorldPosition(new THREE.Vector3());
  const knee = calf.getWorldPosition(new THREE.Vector3());
  const ankle = foot.getWorldPosition(new THREE.Vector3());
  const maxReach = hip.distanceTo(knee) + knee.distanceTo(ankle) - 0.003;
  const attainable = target.clone().sub(hip).clampLength(0, maxReach).add(hip);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    rotateToward(calf, foot, attainable);
    rotateToward(thigh, foot, attainable);
  }
  thigh.updateWorldMatrix(true, true);
  return foot.getWorldPosition(new THREE.Vector3()).distanceTo(target);
}

export type PoseDiagnostics = Readonly<{
  head: THREE.Vector3 | null;
  torso: THREE.Vector3 | null;
  leftFoot: THREE.Vector3 | null;
  rightFoot: THREE.Vector3 | null;
  contactResidualM: number | null;
  supportResidualM: number | null;
}>;

export function createRiggedPoseSampler(instance: RiggedPlayerInstance, clips: readonly THREE.AnimationClip[],
  actorPlan?: readonly LocomotionSample[], diagnostic?: ContactAxialDiagnostic) {
  if (diagnostic?.frameMode === 'peak-compatible' && !diagnostic.peakCompatibleNormals) {
    throw new RangeError('Peak-compatible mode requires measured local normals');
  }
  const { root, bones } = instance;
  const bind = new Map<THREE.Object3D, Transform>();
  root.traverse((object) => { if (object instanceof THREE.Bone) bind.set(object, snapshot(object)); });
  const rootBind = snapshot(root);
  const mixer = new THREE.AnimationMixer(root);
  const idleClip = clips.find((clip) => clip.name === 'Idle_Loop');
  const walkClip = clips.find((clip) => clip.name === 'Walk_Loop');
  const jogClip = clips.find((clip) => clip.name === 'Jog_Fwd_Loop');
  if (!idleClip || !jogClip || (actorPlan && !walkClip)) throw new Error('Missing verified Idle_Loop, Walk_Loop or Jog_Fwd_Loop clip');
  if (actorPlan && actorPlan.length !== 481) throw new RangeError('Incomplete actor locomotion plan');
  const idle = mixer.clipAction(idleClip);
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  const jog = mixer.clipAction(jogClip);
  let disposed = false;
  const applyFrame = (frame: PlayerVisualFrame): PoseDiagnostics => {
    if (disposed) throw new Error('Pose sampler is disposed');
    if (!Number.isInteger(frame.tick) || frame.tick < 0 || frame.tick > 480 ||
      !Number.isInteger(frame.phaseQ) || frame.phaseQ < 0 ||
      ![frame.rootPosition.x, frame.rootPosition.y, frame.rootPosition.z, frame.yawRad].every(Number.isFinite)) {
      throw new RangeError('Invalid player visual frame');
    }
    if (!(new Set<string>(Object.values(PUBLIC_MOTION))).has(frame.clipHandle)) {
      throw new RangeError('Unknown public motion handle');
    }
    for (const [object, transform] of bind) restore(object, transform);
    restore(root, rootBind);
    root.position.set(frame.rootPosition.x, frame.rootPosition.y, frame.rootPosition.z);
    root.rotation.set(0, frame.yawRad, 0);
    const action = frame.clipHandle === PUBLIC_MOTION.run && frame.phaseQ === 0 ? idle : jog;
    mixer.stopAllAction();
    action.reset().play();
    action.setEffectiveWeight(1);
    // The fall owns the pose after contact; the jog clip is sampled only at its immutable entry tick.
    const continuingFall = frame.clipHandle === PUBLIC_MOTION.fall && frame.actorHandle === 'actor-002' && frame.tick > 366;
    const runTick = continuingFall ? 366 : frame.tick;
    mixer.setTime((runTick / 60) % action.getClip().duration);
    const skeletonRoot = bones.get('root');
    if (skeletonRoot) restore(skeletonRoot, bind.get(skeletonRoot)!);
    const locomotion = actorPlan?.[runTick];
    if (locomotion && locomotion.legacyBaseWeight < 1 && walk) {
      const legacyPose = new Map<THREE.Object3D, Transform>();
      if (locomotion.legacyBaseWeight > 0) {
        for (const object of bind.keys()) legacyPose.set(object, snapshot(object));
      }
      mixer.stopAllAction();
      for (const [object, transform] of bind) restore(object, transform);
      const phase = locomotion.phaseCycles % 1;
      for (const [modernAction, weight] of [[idle, locomotion.idleWeight],
        [walk, locomotion.walkWeight], [jog, locomotion.jogWeight]] as const) {
        modernAction.reset().play();
        modernAction.time = modernAction === idle
          ? (runTick / 60) % modernAction.getClip().duration
          : phase * modernAction.getClip().duration;
        modernAction.setEffectiveWeight(weight);
      }
      mixer.update(0);
      if (skeletonRoot) restore(skeletonRoot, bind.get(skeletonRoot)!);
      if (locomotion.legacyBaseWeight > 0) {
        for (const [object, legacy] of legacyPose) {
          object.position.lerp(legacy.position, locomotion.legacyBaseWeight);
          object.quaternion.slerp(legacy.quaternion, locomotion.legacyBaseWeight);
          object.scale.lerp(legacy.scale, locomotion.legacyBaseWeight);
        }
      }
    }
    let contactResidualM: number | null = null;
    let supportResidualM: number | null = null;
    if (frame.clipHandle === PUBLIC_MOTION.challenge && frame.actorHandle === 'actor-006') {
      const weight = smooth(Math.min(frame.phaseQ, 20 - frame.phaseQ) / 10);
      addPitch(bones.get('spine_01'), -0.13 * weight);
      addPitch(bones.get('upperarm_l'), -0.55 * weight);
      addPitch(bones.get('upperarm_r'), 0.45 * weight);
      root.updateMatrixWorld(true);
      const support = bones.get('foot_r')?.getWorldPosition(new THREE.Vector3());
      const pelvis = bones.get('pelvis');
      if (pelvis) translateWorld(pelvis, new THREE.Vector3(-0.38 * weight, -0.3 * weight, 0.35 * weight));
      root.updateMatrixWorld(true);
      if (support) supportResidualM = reachFoot(bones, support, 'r');
    } else if (frame.clipHandle === PUBLIC_MOTION.run && frame.actorHandle === 'actor-002' && frame.tick >= 350) {
      root.updateMatrixWorld(true);
      const foot = bones.get('foot_l');
      if (foot) {
        const before = foot.getWorldPosition(new THREE.Vector3());
        contactResidualM = reachFoot(bones, before.lerp(contactWorld, smooth((frame.tick - 350) / 16)), 'l');
      }
    } else if (frame.clipHandle === PUBLIC_MOTION.fall && frame.actorHandle === 'actor-002') {
      root.updateMatrixWorld(true);
      const foot = bones.get('foot_l');
      if (foot) {
        const target = continuingFall ? root.localToWorld(new THREE.Vector3(0, 0.34, 0)) : contactWorld.clone();
        contactResidualM = reachFoot(bones, target, 'l');
      }
      applyAuthoredFall(bones, frame.tick);
    }
    if (frame.actorHandle === 'actor-006' && frame.tick >= 346 && frame.tick <= 386) {
      const thigh = bones.get('thigh_l'); const calf = bones.get('calf_l'); const foot = bones.get('foot_l');
      if (thigh && calf && foot) {
        const sourceThigh = thigh.quaternion.clone();
        const sourceCalf = calf.quaternion.clone();
        const sourceFootLocal = foot.quaternion.clone();
        root.updateMatrixWorld(true);
        const entering = frame.tick <= 366;
        // A smooth 5% progress lag through the fastest root movement limits knee travel; it vanishes at contact.
        const positionProgress = entering ? smooth((frame.tick - 346) / 20) -
          0.05 * smooth((frame.tick - 358) / 4) * (1 - smooth((frame.tick - 362) / 4)) :
          smooth((frame.tick - 366) / 20);
        const orientationProgress = entering ? smooth((frame.tick - 346) / 20) : smooth((frame.tick - 366) / 20);
        const peak = diagnostic ? new THREE.Vector3(...diagnostic.trialTarget) : defenderContact;
        const targetLocal = (entering ? defenderStart : peak).clone()
          .lerp(entering ? peak : defenderEnd, positionProgress);
        if (diagnostic && entering) targetLocal.add(diagnosticHermiteOffset(frame.tick, diagnostic.hermiteCoefficients));
        root.updateMatrixWorld(true);
        const target = root.localToWorld(targetLocal);
        const rootWorldRotation = root.getWorldQuaternion(new THREE.Quaternion());
        const orientation = rootWorldRotation.multiply((entering
          ? defenderStartOrientation.clone().slerp(defenderContactOrientation, orientationProgress)
          : defenderContactOrientation.clone().slerp(defenderEndOrientation, orientationProgress)));
        const poleWorld = root.localToWorld(new THREE.Vector3(-1, 0.3, 0.15));
        const localPlaneNormals = !diagnostic ? (frame.tick === 366 ? undefined : defenderPlaneNormals) :
          diagnostic.frameMode === 'old-fixed' ? defenderPlaneNormals :
            diagnostic.frameMode === 'peak-compatible' ? diagnostic.peakCompatibleNormals :
              frame.tick === 366 ? undefined : defenderPlaneNormals;
        contactResidualM = solveTwoBoneLeg({ thigh, calf, foot, target, poleWorld,
          footWorldQuaternion: orientation,
          localPlaneNormals });
        if (frame.tick <= 358 || frame.tick >= 376) {
          const sourceWeight = frame.tick <= 358 ? 1 - smooth((frame.tick - 346) / 12) : smooth((frame.tick - 376) / 10);
          if (sourceWeight === 1) {
            thigh.quaternion.copy(sourceThigh);
            calf.quaternion.copy(sourceCalf);
          } else {
            thigh.quaternion.slerp(sourceThigh, sourceWeight);
            calf.quaternion.slerp(sourceCalf, sourceWeight);
          }
          root.updateMatrixWorld(true);
          if (sourceWeight === 1) foot.quaternion.copy(sourceFootLocal);
          else {
            const footParentWorld = foot.parent!.getWorldQuaternion(new THREE.Quaternion());
            foot.quaternion.copy(footParentWorld.invert().multiply(orientation)).normalize();
          }
          root.updateMatrixWorld(true);
          contactResidualM = foot.getWorldPosition(new THREE.Vector3()).distanceTo(target);
        }
        if (frame.tick === 366) contactResidualM = foot.getWorldPosition(new THREE.Vector3()).distanceTo(contactWorld);
      }
    }
    root.updateMatrixWorld(true);
    return { head: worldPoint(bones.get('Head')), torso: worldPoint(bones.get('spine_03')),
      leftFoot: worldPoint(bones.get('foot_l')), rightFoot: worldPoint(bones.get('foot_r')),
      contactResidualM, supportResidualM };
  };
  return { applyFrame, dispose: () => {
    if (disposed) return;
    disposed = true;
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
  } };
}
