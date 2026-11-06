import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { solveTwoBoneLeg } from './two-bone-ik';

function chain() {
  const root = new THREE.Group();
  const thigh = new THREE.Bone(); thigh.position.set(0, 1, 0);
  const calf = new THREE.Bone(); calf.position.set(0, -0.45, 0.1);
  const foot = new THREE.Bone(); foot.position.set(0, -0.45, 0);
  root.add(thigh); thigh.add(calf); calf.add(foot);
  root.updateMatrixWorld(true);
  return { root, thigh, calf, foot };
}
function upwardChain() {
  const root = new THREE.Group();
  const thigh = new THREE.Bone();
  const calf = new THREE.Bone(); calf.position.y = 0.45;
  const foot = new THREE.Bone(); foot.position.y = 0.45;
  root.add(thigh); thigh.add(calf); calf.add(foot);
  root.updateMatrixWorld(true);
  return { root, thigh, calf, foot };
}

describe('absolute fixed-length leg solve', () => {
  it('reaches a target while preserving segment lengths and explicit foot orientation', () => {
    const rig = chain();
    const point = (bone: THREE.Bone) => bone.getWorldPosition(new THREE.Vector3());
    const upper = point(rig.thigh).distanceTo(point(rig.calf));
    const lower = point(rig.calf).distanceTo(point(rig.foot));
    const target = new THREE.Vector3(-0.25, 0.3, 0.1);
    const orientation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.4);
    const residual = solveTwoBoneLeg({ ...rig, target, poleWorld: new THREE.Vector3(-1, 0, 0),
      footWorldQuaternion: orientation });
    rig.root.updateMatrixWorld(true);
    expect(residual).toBeLessThan(1e-5);
    expect(point(rig.thigh).distanceTo(point(rig.calf))).toBeCloseTo(upper, 6);
    expect(point(rig.calf).distanceTo(point(rig.foot))).toBeCloseTo(lower, 6);
    expect(point(rig.foot).distanceTo(target)).toBeLessThan(1e-5);
    expect(rig.foot.getWorldQuaternion(new THREE.Quaternion()).angleTo(orientation)).toBeLessThan(1e-5);
    expect(point(rig.calf).x).toBeLessThan(0);
  });

  it('clamps unreachable targets and repeats a deterministic degenerate-pole fallback', () => {
    const first = chain(); const second = chain();
    const target = new THREE.Vector3(5, 1, 0);
    const solve = (rig: ReturnType<typeof chain>) => solveTwoBoneLeg({ ...rig, target,
      poleWorld: new THREE.Vector3(8, 1, 0) });
    expect(solve(first)).toBeGreaterThan(4);
    expect(solve(second)).toBeCloseTo(solve(first), 8);
    first.root.updateMatrixWorld(true); second.root.updateMatrixWorld(true);
    expect(first.calf.position.toArray()).toEqual(second.calf.position.toArray());
    expect(first.thigh.quaternion.angleTo(second.thigh.quaternion)).toBeLessThan(1e-6);
    expect(first.calf.quaternion.angleTo(second.calf.quaternion)).toBeLessThan(1e-6);
    expect(first.foot.getWorldPosition(new THREE.Vector3()).distanceTo(second.foot.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-6);
  });

  it('maps complete local segment and plane frames independent of starting bone roll', () => {
    const first = upwardChain(); const second = upwardChain();
    second.thigh.quaternion.setFromEuler(new THREE.Euler(0.3, -0.5, 0.2));
    second.calf.quaternion.setFromEuler(new THREE.Euler(-0.4, 0.2, 0.1));
    second.root.updateMatrixWorld(true);
    const target = new THREE.Vector3(0.25, 0.56, 0.12);
    const normals = { thigh: new THREE.Vector3(1, 0, 0), calf: new THREE.Vector3(1, 0, 0) };
    for (const rig of [first, second]) {
      expect(solveTwoBoneLeg({ ...rig, target, poleWorld: new THREE.Vector3(1, 0, 0),
        localPlaneNormals: normals })).toBeLessThan(1e-5);
      rig.root.updateMatrixWorld(true);
      const hip = rig.thigh.getWorldPosition(new THREE.Vector3());
      const knee = rig.calf.getWorldPosition(new THREE.Vector3());
      const ankle = rig.foot.getWorldPosition(new THREE.Vector3());
      const upper = knee.clone().sub(hip).normalize();
      const lower = ankle.clone().sub(knee).normalize();
      const plane = upper.clone().cross(lower).normalize();
      for (const [bone, axis] of [[rig.thigh, upper], [rig.calf, lower]] as const) {
        const orientation = bone.getWorldQuaternion(new THREE.Quaternion());
        expect(new THREE.Vector3(0, 1, 0).applyQuaternion(orientation).dot(axis)).toBeGreaterThan(0.99999);
        expect(new THREE.Vector3(1, 0, 0).applyQuaternion(orientation).dot(plane)).toBeGreaterThan(0.99999);
      }
    }
    expect(first.thigh.getWorldQuaternion(new THREE.Quaternion())
      .angleTo(second.thigh.getWorldQuaternion(new THREE.Quaternion()))).toBeLessThan(1e-5);
    expect(first.calf.getWorldQuaternion(new THREE.Quaternion())
      .angleTo(second.calf.getWorldQuaternion(new THREE.Quaternion()))).toBeLessThan(1e-5);
  });

  it('eases an overlong reach before full extension', () => {
    const rig = upwardChain();
    const target = new THREE.Vector3(0, 1.1, 0);
    const residual = solveTwoBoneLeg({ ...rig, target, poleWorld: new THREE.Vector3(1, 0, 0),
      localPlaneNormals: { thigh: new THREE.Vector3(1, 0, 0), calf: new THREE.Vector3(1, 0, 0) } });
    const reached = rig.foot.getWorldPosition(new THREE.Vector3()).length();
    expect(reached).toBeGreaterThan(0.81);
    expect(reached).toBeLessThan(0.885);
    expect(residual).toBeCloseTo(1.1 - reached, 6);
  });
});
