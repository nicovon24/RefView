import * as THREE from 'three';

type Leg = Readonly<{
  thigh: THREE.Bone;
  calf: THREE.Bone;
  foot: THREE.Bone;
  target: THREE.Vector3;
  poleWorld: THREE.Vector3;
  footWorldQuaternion?: THREE.Quaternion;
  localPlaneNormals?: Readonly<{ thigh: THREE.Vector3; calf: THREE.Vector3 }>;
}>;

const epsilon = 0.0001;

function worldFrame(axis: THREE.Vector3, normal: THREE.Vector3) {
  const y = axis.clone().normalize();
  const x = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  const z = x.clone().cross(y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function orientFrame(joint: THREE.Bone, localNormal: THREE.Vector3, worldAxis: THREE.Vector3,
  worldNormal: THREE.Vector3) {
  const local = worldFrame(new THREE.Vector3(0, 1, 0), localNormal);
  const world = worldFrame(worldAxis, worldNormal);
  const desiredWorld = world.multiply(local.invert());
  const parentWorld = joint.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  joint.quaternion.copy(parentWorld.invert().multiply(desiredWorld)).normalize();
  joint.updateWorldMatrix(true, true);
}

function rotateEndpoint(joint: THREE.Bone, endpoint: THREE.Bone, target: THREE.Vector3) {
  joint.updateWorldMatrix(true, true);
  const origin = joint.getWorldPosition(new THREE.Vector3());
  const current = endpoint.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
  const desired = target.clone().sub(origin).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(current, desired);
  const parent = joint.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent)).normalize();
}

/** Joint-only analytic solve in world space. The imported animation supplies both segment lengths. */
export function solveTwoBoneLeg({ thigh, calf, foot, target, poleWorld, footWorldQuaternion,
  localPlaneNormals }: Leg): number {
  thigh.updateWorldMatrix(true, true);
  const hip = thigh.getWorldPosition(new THREE.Vector3());
  const knee = calf.getWorldPosition(new THREE.Vector3());
  const ankle = foot.getWorldPosition(new THREE.Vector3());
  const upper = hip.distanceTo(knee);
  const lower = knee.distanceTo(ankle);
  if (upper < epsilon || lower < epsilon) throw new RangeError('Degenerate animated leg segment');
  const offset = target.clone().sub(hip);
  const distance = offset.length();
  const direction = distance > epsilon ? offset.divideScalar(distance) : new THREE.Vector3(0, -1, 0);
  const minReach = Math.abs(upper - lower) + epsilon;
  const maxReach = upper + lower - epsilon;
  // Keep flexion before near-extension instead of abruptly reaching the hard segment sum.
  const softStart = upper + lower - 0.09;
  const softCap = upper + lower - 0.015;
  const softSpan = softCap - softStart;
  const softened = softStart > minReach && softCap < maxReach && distance > softStart
    ? softStart + softSpan * (1 - Math.exp(-(distance - softStart) / softSpan)) : distance;
  const reach = THREE.MathUtils.clamp(softened, minReach, maxReach);
  const attainable = hip.clone().addScaledVector(direction, reach);
  let pole = poleWorld.clone().sub(hip).addScaledVector(direction, -poleWorld.clone().sub(hip).dot(direction));
  if (pole.lengthSq() < epsilon * epsilon) {
    const fallback = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    pole = fallback.addScaledVector(direction, -fallback.dot(direction));
  }
  pole.normalize();
  const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const desiredKnee = hip.clone().addScaledVector(direction, along).addScaledVector(pole, height);
  if (localPlaneNormals) {
    const upperAxis = desiredKnee.clone().sub(hip).normalize();
    const lowerAxis = attainable.clone().sub(desiredKnee).normalize();
    const worldNormal = upperAxis.clone().cross(lowerAxis).normalize();
    orientFrame(thigh, localPlaneNormals.thigh, upperAxis, worldNormal);
    orientFrame(calf, localPlaneNormals.calf, lowerAxis, worldNormal);
  } else {
    rotateEndpoint(thigh, calf, desiredKnee);
    rotateEndpoint(calf, foot, attainable);
  }
  thigh.updateWorldMatrix(true, true);
  if (footWorldQuaternion) {
    const parentWorld = foot.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
    foot.quaternion.copy(parentWorld.invert().multiply(footWorldQuaternion)).normalize();
    foot.updateWorldMatrix(true, true);
  }
  return foot.getWorldPosition(new THREE.Vector3()).distanceTo(target);
}
