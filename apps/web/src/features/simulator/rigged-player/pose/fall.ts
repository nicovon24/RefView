import * as THREE from 'three';

type FallKey = Readonly<{
  tick: number;
  drop: number;
  forward: number;
  roll: number;
  spine: number;
  leftArm: number;
  rightArm: number;
  leftElbow: number;
  rightElbow: number;
  leftThigh: number;
  rightThigh: number;
  leftKnee: number;
  rightKnee: number;
  leftFoot: number;
  rightFoot: number;
}>;

const keys: readonly FallKey[] = [
  { tick: 366, drop: 0, forward: 0, roll: 0, spine: 0, leftArm: 0, rightArm: 0, leftElbow: 0, rightElbow: 0,
    leftThigh: 0, rightThigh: 0, leftKnee: 0, rightKnee: 0, leftFoot: 0, rightFoot: 0 },
  { tick: 380, drop: 0.03, forward: 0.32, roll: -0.06, spine: 0.03,
    leftArm: -0.40, rightArm: 0.32, leftElbow: 0.04, rightElbow: 0.08,
    leftThigh: 0.08, rightThigh: 0, leftKnee: 0.12, rightKnee: 1.10, leftFoot: 0, rightFoot: -1.10 },
  { tick: 398, drop: 0.32, forward: 0.95, roll: -0.08, spine: 0.06,
    leftArm: -1.15, rightArm: 0.62, leftElbow: 0.30, rightElbow: 0.14,
    leftThigh: 0.08, rightThigh: 0.80, leftKnee: 0.15, rightKnee: 0.10, leftFoot: 0.04, rightFoot: 0.1 },
  { tick: 420, drop: 0.46, forward: 1.22, roll: -0.04, spine: 0.08,
    leftArm: -1.78, rightArm: 0.88, leftElbow: 0.44, rightElbow: 0.16,
    leftThigh: 0.30, rightThigh: 0.72, leftKnee: 0.14, rightKnee: 0.06, leftFoot: 0, rightFoot: 0.1 },
];

const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
function interval(tick: number) {
  const right = keys.findIndex((key) => key.tick >= tick);
  if (right <= 0) {
    const key = right < 0 ? keys[keys.length - 1]! : keys[0]!;
    return { start: key, end: key, weight: 0 };
  }
  const start = keys[right - 1]!;
  const end = keys[right]!;
  return { start, end, weight: smooth((tick - start.tick) / (end.tick - start.tick)) };
}

/** Absolute local fall offsets, always applied to the exact tick-366 rig pose. */
export function sampleFall(tick: number): FallKey {
  const { start, end, weight: t } = interval(tick);
  return {
    tick,
    drop: THREE.MathUtils.lerp(start.drop, end.drop, t),
    forward: THREE.MathUtils.lerp(start.forward, end.forward, t),
    roll: THREE.MathUtils.lerp(start.roll, end.roll, t),
    spine: THREE.MathUtils.lerp(start.spine, end.spine, t),
    leftArm: THREE.MathUtils.lerp(start.leftArm, end.leftArm, t),
    rightArm: THREE.MathUtils.lerp(start.rightArm, end.rightArm, t),
    leftElbow: THREE.MathUtils.lerp(start.leftElbow, end.leftElbow, t),
    rightElbow: THREE.MathUtils.lerp(start.rightElbow, end.rightElbow, t),
    leftThigh: THREE.MathUtils.lerp(start.leftThigh, end.leftThigh, t),
    rightThigh: THREE.MathUtils.lerp(start.rightThigh, end.rightThigh, t),
    leftKnee: THREE.MathUtils.lerp(start.leftKnee, end.leftKnee, t),
    rightKnee: THREE.MathUtils.lerp(start.rightKnee, end.rightKnee, t),
    leftFoot: THREE.MathUtils.lerp(start.leftFoot, end.leftFoot, t),
    rightFoot: THREE.MathUtils.lerp(start.rightFoot, end.rightFoot, t),
  };
}

export function applyAuthoredFall(bones: ReadonlyMap<string, THREE.Bone>, tick: number) {
  if (tick <= 366) return;
  const pose = sampleFall(tick);
  const { start, end, weight } = interval(tick);
  const rotate = (name: string, axis: THREE.Vector3, from: number, to: number) => {
    const bone = bones.get(name);
    if (bone) bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis, from)
      .slerp(new THREE.Quaternion().setFromAxisAngle(axis, to), weight));
  };
  const pelvis = bones.get('pelvis');
  if (pelvis) {
    pelvis.updateWorldMatrix(true, false);
    const parentWorld = pelvis.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
    pelvis.position.add(new THREE.Vector3(0, -pose.drop, 0).applyQuaternion(parentWorld.invert()));
  }
  if (pelvis) {
    const orientation = (key: FallKey) => new THREE.Quaternion().setFromAxisAngle(xAxis, key.forward)
      .multiply(new THREE.Quaternion().setFromAxisAngle(zAxis, key.roll));
    pelvis.quaternion.multiply(orientation(start).slerp(orientation(end), weight));
  }
  rotate('spine_01', xAxis, start.spine, end.spine);
  rotate('upperarm_l', xAxis, start.leftArm, end.leftArm);
  rotate('upperarm_r', xAxis, start.rightArm, end.rightArm);
  rotate('lowerarm_l', xAxis, start.leftElbow, end.leftElbow);
  rotate('lowerarm_r', xAxis, start.rightElbow, end.rightElbow);
  rotate('thigh_l', xAxis, start.leftThigh, end.leftThigh);
  rotate('thigh_r', xAxis, start.rightThigh, end.rightThigh);
  rotate('calf_l', xAxis, start.leftKnee, end.leftKnee);
  rotate('calf_r', xAxis, start.rightKnee, end.rightKnee);
  rotate('foot_l', xAxis, start.leftFoot, end.leftFoot);
  rotate('foot_r', xAxis, start.rightFoot, end.rightFoot);
}
