import * as THREE from 'three';
import { createRiggedPlayer } from './model';
import type { VerifiedPlayerResources } from './resources';
import type { RefereeMotionSample } from './pose/referee-locomotion';

export type RiggedRefereeFrame = Readonly<{
  tick: number;
  position: Readonly<{ x: number; y: number; z: number }>;
  lookYaw: number;
  cameraMode: 'firstPerson' | 'thirdPerson';
  elevatedReview: boolean;
  motion: RefereeMotionSample;
}>;

type Transform = Readonly<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }>;
function snapshot(object: THREE.Object3D): Transform {
  return { position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() };
}
function restore(object: THREE.Object3D, transform: Transform): void {
  object.position.copy(transform.position);
  object.quaternion.copy(transform.quaternion);
  object.scale.copy(transform.scale);
}

export function createRiggedReferee(resources: VerifiedPlayerResources) {
  const idleClip = resources.clips.find((clip) => clip.name === 'Idle_Loop');
  const walkClip = resources.clips.find((clip) => clip.name === 'Walk_Loop');
  const jogClip = resources.clips.find((clip) => clip.name === 'Jog_Fwd_Loop');
  if (!idleClip || !walkClip || !jogClip ||
    ![idleClip, walkClip, jogClip].every((clip) => clip.duration > 0)) {
    throw new Error('Verified referee Idle_Loop, Walk_Loop or Jog_Fwd_Loop clip missing');
  }
  const player = createRiggedPlayer({ bodyScene: resources.bodyScene, hairScene: resources.hairScene,
    color: '#0b0e10', number: null, silhouette: 'athletic', kitStyle: 'solid' });
  const body = player.root.getObjectByName('SuperHero_Male');
  if (!(body instanceof THREE.SkinnedMesh) || !body.userData.auditionGeometry || !body.userData.auditionMaterial) {
    player.dispose();
    throw new Error('Selected referee body missing');
  }
  const kitMaterial = body.material as THREE.MeshStandardMaterial;
  const compileKit = kitMaterial.onBeforeCompile;
  kitMaterial.onBeforeCompile = (shader, renderer) => {
    compileKit.call(kitMaterial, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3(0.035, 0.064, 0.087)', 'vec3(0.012, 0.014, 0.016)');
  };
  kitMaterial.customProgramCacheKey = () => 'referee-black-kit';
  player.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  const root = new THREE.Group();
  root.name = 'referee:rigged';
  const visual = player.root;
  visual.name = 'referee:visual';
  root.add(visual);
  const bind = new Map<THREE.Bone, Transform>();
  root.traverse((object) => { if (object instanceof THREE.Bone) bind.set(object, snapshot(object)); });
  const skeletonRoot = player.bones.get('root');
  const mixer = new THREE.AnimationMixer(visual);
  const idle = mixer.clipAction(idleClip);
  const walk = mixer.clipAction(walkClip);
  const jog = mixer.clipAction(jogClip);
  let disposed = false;
  return {
    kind: 'rigged-referee' as const,
    root,
    applyFrame(frame: RiggedRefereeFrame) {
      if (disposed) throw new Error('Rigged referee is disposed');
      if (!Number.isInteger(frame.tick) || frame.tick < 0 || frame.tick > 480 ||
        !frame.motion || frame.motion.tick !== frame.tick ||
        ![frame.position.x, frame.position.y, frame.position.z, frame.lookYaw,
          frame.motion.phaseCycles, frame.motion.idleWeight, frame.motion.walkWeight,
          frame.motion.jogWeight, frame.motion.bodyYawOffsetRad].every(Number.isFinite) ||
        frame.motion.phaseCycles < 0 ||
        [frame.motion.idleWeight, frame.motion.walkWeight, frame.motion.jogWeight].some((weight) => weight < 0 || weight > 1) ||
        Math.abs(frame.motion.idleWeight + frame.motion.walkWeight + frame.motion.jogWeight - 1) > 1e-6) {
        throw new RangeError('Invalid referee frame');
      }
      for (const [bone, transform] of bind) restore(bone, transform);
      mixer.stopAllAction();
      const phase = frame.motion.phaseCycles % 1;
      for (const [action, weight] of [[idle, frame.motion.idleWeight],
        [walk, frame.motion.walkWeight], [jog, frame.motion.jogWeight]] as const) {
        action.reset().play();
        action.time = action === idle ? (frame.tick / 60) % idleClip.duration : phase * action.getClip().duration;
        action.setEffectiveWeight(weight);
      }
      mixer.update(0);
      if (skeletonRoot) restore(skeletonRoot, bind.get(skeletonRoot)!);
      root.position.set(frame.position.x, frame.position.y, frame.position.z);
      root.rotation.set(0, frame.lookYaw, 0);
      root.scale.set(1, 1, 1);
      visual.position.set(0, 0, 0);
      visual.rotation.set(0, frame.motion.bodyYawOffsetRad, 0);
      visual.scale.set(1, 1, 1);
      root.visible = frame.cameraMode === 'thirdPerson' && !frame.elevatedReview;
      root.updateMatrixWorld(true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(visual);
      player.dispose();
    },
  };
}
